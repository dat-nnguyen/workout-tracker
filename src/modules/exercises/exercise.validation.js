import { z } from 'zod';

/**
 * Validation schema for query parameters on `GET /api/v1/exercises`.
 * Allows optional filtering by category and search keyword for exercise name.
 *
 * @type {import('zod').ZodObject<{
 *   category: import('zod').ZodOptional<import('zod').ZodString>,
 *   name: import('zod').ZodOptional<import('zod').ZodString>
 * }>}
 */
export const getExerciseQuerySchema = z.object({
  category: z.string().trim().optional(),
  name: z.string().trim().optional(),
});

/**
 * Validation schema for creating a custom exercise on `POST /api/v1/exercises`.
 *
 * @type {import('zod').ZodObject<{
 *   name: import('zod').ZodString,
 *   category: import('zod').ZodString,
 *   favorite: import('zod').ZodDefault<import('zod').ZodOptional<import('zod').ZodBoolean>>
 * }>}
 */
export const createExerciseSchema = z.object({
  name: z
    .string({ required_error: 'Exercise name is required' })
    .trim()
    .min(1, 'Exercise name cannot be empty'),
  category: z
    .string({ required_error: 'Exercise category is required' })
    .trim()
    .min(1, 'Exercise category cannot be empty'),
  favorite: z.boolean().optional().default(false),
});

export default {
  getExerciseQuerySchema,
  createExerciseSchema,
};


