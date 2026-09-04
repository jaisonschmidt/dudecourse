import { createApp } from './app';

const config = {
  jwtSecret: 'test-secret-with-at-least-thirty-two-characters',
  portalUrl: 'http://localhost:4200',
  googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
  completionThreshold: 90,
  secureCookies: false,
};

describe('GET /healthz', () => {
  it('returns ok', async () => {
    const app = createApp({ config, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });
});
