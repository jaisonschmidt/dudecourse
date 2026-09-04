import { AuthProvider, Prisma, PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply } from 'fastify';
import {
  ApiErrorDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from '@dudecourse/shared/domain';
import { RuntimeConfig } from '../config';
import { hashPassword, verifyPassword } from '../lib/password';

const SESSION_COOKIE = 'dc_session';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUserDto(user: { id: string; email: string; displayName: string }): UserDto {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

async function setSession(
  app: FastifyInstance,
  reply: FastifyReply,
  config: RuntimeConfig,
  userId: string
): Promise<void> {
  const token = app.jwt.sign({ sub: userId }, { expiresIn: '7d' });
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    maxAge: 60 * 60 * 24 * 7,
  });
}

function validationError(fieldErrors: Record<string, string>): ApiErrorDto {
  return { code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.', fieldErrors };
}

export function registerAuthRoutes(
  app: FastifyInstance,
  database: PrismaClient,
  config: RuntimeConfig,
  googleEnabled: boolean
): void {
  app.post<{ Body: RegisterRequestDto }>('/auth/register', async (request, reply) => {
    const displayName =
      typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';
    const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const fieldErrors: Record<string, string> = {};

    if (displayName.length < 2 || displayName.length > 80) {
      fieldErrors['displayName'] = 'Use between 2 and 80 characters.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors['email'] = 'Enter a valid email address.';
    }
    if (password.length < 8 || password.length > 128) {
      fieldErrors['password'] = 'Use between 8 and 128 characters.';
    }
    if (Object.keys(fieldErrors).length) {
      return reply.code(400).send(validationError(fieldErrors));
    }

    try {
      const passwordHash = await hashPassword(password);
      const user = await database.user.create({
        data: {
          displayName,
          email,
          authAccounts: {
            create: {
              provider: AuthProvider.CREDENTIALS,
              providerAccountId: email,
              passwordHash,
            },
          },
        },
      });
      await setSession(app, reply, config, user.id);
      return reply.code(201).send(toUserDto(user));
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(409).send({
          code: 'EMAIL_IN_USE',
          message: 'An account already uses this email address.',
        } satisfies ApiErrorDto);
      }
      throw error;
    }
  });

  app.post<{ Body: LoginRequestDto }>('/auth/login', async (request, reply) => {
    const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const account = await database.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.CREDENTIALS,
          providerAccountId: email,
        },
      },
      include: { user: true },
    });

    if (!account?.passwordHash || !(await verifyPassword(password, account.passwordHash))) {
      return reply.code(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      } satisfies ApiErrorDto);
    }

    await setSession(app, reply, config, account.user.id);
    return toUserDto(account.user);
  });

  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.code(204).send();
  });

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = await database.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Sign in to continue.' });
    }
    return toUserDto(user);
  });

  if (!googleEnabled) {
    app.get('/auth/google', async (_request, reply) =>
      reply.code(503).send({
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message: 'Google sign-in is not configured for this local environment.',
      } satisfies ApiErrorDto)
    );
  } else {
    app.get('/auth/google/callback', async (request, reply) => {
      try {
        const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request,
          reply
        );
        const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { authorization: `Bearer ${token.access_token}` },
        });
        if (!response.ok) {
          throw new Error('Google user information request failed.');
        }
        const profile = (await response.json()) as {
          sub?: string;
          email?: string;
          email_verified?: boolean;
          name?: string;
        };
        if (!profile.sub || !profile.email || !profile.email_verified) {
          throw new Error('Google did not return a verified email address.');
        }

        const email = normalizeEmail(profile.email);
        const user = await database.$transaction(async (transaction) => {
          const existingAccount = await transaction.authAccount.findUnique({
            where: {
              provider_providerAccountId: {
                provider: AuthProvider.GOOGLE,
                providerAccountId: profile.sub as string,
              },
            },
            include: { user: true },
          });
          if (existingAccount) return existingAccount.user;

          const existingUser = await transaction.user.findUnique({ where: { email } });
          if (existingUser) {
            await transaction.authAccount.create({
              data: {
                userId: existingUser.id,
                provider: AuthProvider.GOOGLE,
                providerAccountId: profile.sub as string,
              },
            });
            return existingUser;
          }

          return transaction.user.create({
            data: {
              email,
              displayName: profile.name?.trim() || email.split('@')[0],
              authAccounts: {
                create: {
                  provider: AuthProvider.GOOGLE,
                  providerAccountId: profile.sub as string,
                },
              },
            },
          });
        });

        await setSession(app, reply, config, user.id);
        return reply.redirect(`${config.portalUrl}/auth/callback`);
      } catch (error: unknown) {
        request.log.error(error);
        return reply.redirect(`${config.portalUrl}/auth/callback?error=oauth_failed`);
      }
    });
  }
}
