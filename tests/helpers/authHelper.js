import { registerUser } from '../../src/modules/auth/auth.service.js';
import { signToken } from '../../src/utils/jwt.js';

/**
 * Creates a test user in the database and returns the user object and a valid Bearer token.
 *
 * @param {Object} [overrides={}] - Optional custom user attributes
 * @returns {Promise<{ user: Object, token: string, rawPassword: string }>}
 */
export async function createTestUserAndToken(overrides = {}) {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const email = overrides.email || `test_${randomSuffix}@example.com`;
  const password = overrides.password || 'TestPassword123!';
  const name = overrides.name || `Test User ${randomSuffix}`;

  const user = await registerUser({ email, password, name });
  const token = signToken({ id: user.id, email: user.email });

  return {
    user,
    token,
    rawPassword: password,
  };
}

export default {
  createTestUserAndToken,
};
