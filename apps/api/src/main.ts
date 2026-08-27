import { createApp } from './app/app';

async function bootstrap(): Promise<void> {
  const host = process.env['HOST'] ?? '0.0.0.0';
  const port = Number(process.env['PORT'] ?? 3000);

  const app = createApp();

  await app.listen({ host, port });
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});