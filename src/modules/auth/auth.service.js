import { prisma } from '../../config/db.js';
import { ConflictError, UnauthorizedError } from '../../middlewares/error.middleware.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';

/**
 * Registers a new user.
 *
 * @param {Object} userData
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} [userData.name]
 * @returns {Promise<Object>} Created user without password
 */
export async function registerUser({ email, password, name }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ConflictError('Email is already registered.');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return newUser;
}

/**
 * Authenticates a user and issues a signed JWT access token.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordMatch = await comparePassword(password, user.password);

  if (!isPasswordMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({ id: user.id, email: user.email });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

export default {
  registerUser,
  loginUser,
};
