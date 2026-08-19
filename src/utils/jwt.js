import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

/**
 * Signs a payload to generate a signed JSON Web Token (JWT).
 *
 * @param {string | object | Buffer} payload - The payload to encode into the token (e.g. { userId, email }).
 * @param {import('jsonwebtoken').SignOptions} [options={}] - Additional jsonwebtoken sign options (overrides default expiresIn).
 * @returns {string} The signed JWT string.
 *
 * @example
 * const token = signToken({ userId: user.id, email: user.email });
 */
export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
};

/**
 * Verifies and decodes a JSON Web Token (JWT).
 *
 * @template T
 * @param {string} token - The raw JWT string to verify.
 * @returns {T & import('jsonwebtoken').JwtPayload} The decoded token payload.
 * @throws {UnauthorizedError} If the token is missing, expired, or invalid.
 *
 * @example
 * const decoded = verifyToken(token);
 * console.log(decoded.userId);
 */
export const verifyToken = (token) => {
  if (!token) {
    throw new UnauthorizedError('Authentication token is required.');
  }

  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired. Please log in again.');
    }
    throw new UnauthorizedError('Invalid token. Please log in again.');
  }
};

export default {
  signToken,
  verifyToken,
};
