import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('hashes with a unique salt and verifies the password', async () => {
    const first = await hashPassword('correct horse battery staple');
    const second = await hashPassword('correct horse battery staple');

    expect(first).not.toEqual(second);
    await expect(verifyPassword('correct horse battery staple', first)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', first)).resolves.toBe(false);
  });
});
