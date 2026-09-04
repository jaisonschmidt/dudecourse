import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import oauthPlugin from '@fastify/oauth2';
import { PrismaClient } from '@prisma/client';
import { database as defaultDatabase } from '@dudecourse/database';
import { loadRuntimeConfig, RuntimeConfig } from './config';
import { registerAuthRoutes } from './routes/auth';
import { registerCourseRoutes } from './routes/courses';
import { registerJourneyRoutes } from './routes/journey';

export interface CreateAppOptions {
  config?: RuntimeConfig;
  database?: PrismaClient;
  logger?: boolean;
}

export function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? loadRuntimeConfig();
  const database = options.database ?? defaultDatabase;
  const ownsDatabase = !options.database;
  const app = Fastify({ logger: options.logger ?? true });
  const googleEnabled = Boolean(config.googleClientId && config.googleClientSecret);

  app.register(cors, { origin: config.portalUrl, credentials: true });
  app.register(cookie);
  app.register(jwt, {
    secret: config.jwtSecret,
    cookie: { cookieName: 'dc_session', signed: false },
  });

  app.decorate(
    'authenticate',
    async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await request.jwtVerify();
      } catch {
        await reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      }
    }
  );

  app.addHook('preValidation', async (request, reply) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'] ?? '';
      if (!contentType.toLowerCase().startsWith('application/json')) {
        return reply.code(415).send({
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Mutating requests must use application/json.',
        });
      }
    }
    return undefined;
  });

  if (googleEnabled) {
    app.register(oauthPlugin, {
      name: 'googleOAuth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: config.googleClientId as string,
          secret: config.googleClientSecret as string,
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/auth/google',
      callbackUri: config.googleCallbackUrl,
      pkce: 'S256',
    });
  }

  app.get('/healthz', async () => ({ ok: true }));
  registerAuthRoutes(app, database, config, googleEnabled);
  registerCourseRoutes(app, database, config);
  registerJourneyRoutes(app, database);

  if (ownsDatabase) {
    app.addHook('onClose', async () => database.$disconnect());
  }

  return app;
}
