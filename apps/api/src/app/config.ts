export interface RuntimeConfig {
  jwtSecret: string;
  portalUrl: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCallbackUrl: string;
  completionThreshold: number;
  secureCookies: boolean;
}

export function loadRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const jwtSecret = environment['JWT_SECRET'];
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  const completionThreshold = Number(environment['COMPLETION_THRESHOLD'] ?? 90);
  if (
    !Number.isInteger(completionThreshold) ||
    completionThreshold < 1 ||
    completionThreshold > 100
  ) {
    throw new Error('COMPLETION_THRESHOLD must be an integer between 1 and 100.');
  }

  return {
    jwtSecret,
    portalUrl: environment['PORTAL_URL'] ?? 'http://localhost:4200',
    googleClientId: environment['GOOGLE_CLIENT_ID'] || undefined,
    googleClientSecret: environment['GOOGLE_CLIENT_SECRET'] || undefined,
    googleCallbackUrl:
      environment['GOOGLE_CALLBACK_URL'] ?? 'http://localhost:3000/auth/google/callback',
    completionThreshold,
    secureCookies: environment['APP_ENV'] !== 'local' && environment['NODE_ENV'] !== 'test',
  };
}
