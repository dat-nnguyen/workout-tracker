import { hashPassword, comparePassword } from '../../src/utils/password.js';

describe('Password Utility (Unit)', () => {
  const plainPassword = 'SuperSecretPassword123!';

  test('should hash a password successfully and return a bcrypt hash string', async () => {
    const hash = await hashPassword(plainPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toEqual(plainPassword);
    expect(hash.startsWith('$2')).toBe(true);
  });

  test('should return true when comparing correct plaintext password with hash', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await comparePassword(plainPassword, hash);

    expect(isValid).toBe(true);
  });

  test('should return false when comparing incorrect password with hash', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await comparePassword('WrongPassword123!', hash);

    expect(isValid).toBe(false);
  });

  test('should return false when password or hash is empty/null', async () => {
    expect(await comparePassword('', 'hash')).toBe(false);
    expect(await comparePassword('password', '')).toBe(false);
    expect(await comparePassword(null, null)).toBe(false);
  });
});
