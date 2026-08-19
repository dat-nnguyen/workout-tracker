import { registerUser, loginUser } from './auth.service.js';

/**
 * Handles user registration (POST /api/auth/register).
 *
 * @param {import('express').Request} req - Express request object containing `{ email, password, name? }` in `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response with created user data.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const newUser = await registerUser({ email, password, name });

    return res.status(201).json({
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login and authentication (POST /api/auth/login).
 *
 * @param {import('express').Request} req - Express request object containing `{ email, password }` in `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response with authenticated user info and JWT token.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    return res.status(200).json({
      message: 'User logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
};