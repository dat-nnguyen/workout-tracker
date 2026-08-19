import bcrypt from 'bcryptjs';

/**
 * Default cost factor (salt rounds) for hashing passwords.
 * 10 rounds provides a solid balance between security and performance.
 * @type {number}
 */
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param {string} password - The plaintext password to hash.
 * @param {number} [saltRounds=SALT_ROUNDS] - The salt rounds (cost factor) to apply.
 * @returns {Promise<string>} A promise that resolves to the hashed password string.
 *
 * @example
 * const hash = await hashPassword('SecureP@ssw0rd!');
 */
export async function hashPassword(password, saltRounds = SALT_ROUNDS) {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param {string} password - The plaintext password to verify.
 * @param {string} hash - The hashed password stored in the database.
 * @returns {Promise<boolean>} A promise that resolves to `true` if passwords match, `false` otherwise.
 *
 * @example
 * const isValid = await comparePassword(inputPassword, user.password);
 * if (!isValid) {
 *   throw new UnauthorizedError('Invalid credentials');
 * }
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export default {
  hashPassword,
  comparePassword,
};