import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from './error.middleware.js';

/**
 * Strict authentication middleware.
 * Requires a valid Bearer JWT token in the Authorization header.
 * Attaches the decoded user payload to `req.user`.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticateStrict = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token is required.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, attaches `req.user`.
 * If no token is provided or the token is invalid, sets `req.user = null` and continues.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticationOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }

  return next();
};

export default {
  authenticateStrict,
  authenticationOptional,
};
