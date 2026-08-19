import { z } from 'zod';

/**
 * Validation schema for user registration requests (`POST /api/auth/register`).
 *
 * @type {import('zod').ZodObject<{
 *   email: import('zod').ZodString,
 *   password: import('zod').ZodString,
 *   name: import('zod').ZodOptional<import('zod').ZodString>
 * }>}
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .optional(),
});

/**
 * Validation schema for user login requests (`POST /api/auth/login`).
 *
 * @type {import('zod').ZodObject<{
 *   email: import('zod').ZodString,
 *   password: import('zod').ZodString
 * }>}
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export default {
  registerSchema,
  loginSchema,
};