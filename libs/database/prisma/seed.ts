import { database } from '../src';

const allowedEnvironments = new Set(['local', 'hml']);
const appEnvironment = process.env['APP_ENV'];

if (!appEnvironment || !allowedEnvironments.has(appEnvironment)) {
  throw new Error('Database seeding is allowed only when APP_ENV is local or hml.');
}

async function seed(): Promise<void> {
  return Promise.resolve();
}

seed()
  .then(() => database.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await database.$disconnect();
    process.exit(1);
  });
