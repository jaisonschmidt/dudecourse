import { database } from './database';

describe('database', () => {
  it('exports a Prisma client', () => {
    expect(database).toBeDefined();
  });
});
