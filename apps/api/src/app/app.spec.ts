import { createApp } from './app';

describe('GET /healthz', () => {
  it('returns ok', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });
});
