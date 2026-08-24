import { z } from 'zod';

/**
 * Validation schema for individual workout sets.
 * Validates set number, reps, optional weight (non-negative, supporting bodyweight = 0), and optional RPE (1-10 scale).
 *
 * @type {import('zod').ZodObject<{
 *   setNumber: import('zod').ZodNumber,
 *   reps: import('zod').ZodNumber,
 *   weight: import('zod').ZodOptional<import('zod').ZodNumber>,
 *   rpe: import('zod').ZodOptional<import('zod').ZodNumber>
 * }>}
 */
export const workoutSetSchema = z.object({
  setNumber: z
    .number({ required_error: 'Set number is required' })
    .int('Set number must be an integer')
    .min(1, 'Set number must be at least 1'),
  reps: z
    .number({ required_error: 'Reps count is required' })
    .int('Reps must be an integer')
    .min(1, 'Reps must be at least 1'),
  weight: z
    .number()
    .nonnegative('Weight cannot be negative (use 0 for bodyweight exercises)')
    .optional(),
  rpe: z
    .number()
    .min(1, 'RPE must be between 1 and 10')
    .max(10, 'RPE must be between 1 and 10')
    .optional(),
});

/**
 * Validation schema for an exercise entry within a workout session.
 * Contains the target exercise ID, exercise sequence order, and an array of performed sets.
 *
 * @type {import('zod').ZodObject<{
 *   exerciseId: import('zod').ZodString,
 *   order: import('zod').ZodOptional<import('zod').ZodNumber>,
 *   sets: import('zod').ZodArray<typeof workoutSetSchema>
 * }>}
 */
export const createWorkoutExerciseSchema = z.object({
  exerciseId: z
    .string({ required_error: 'Exercise ID is required' })
    .trim()
    .min(1, 'Exercise ID cannot be empty'),
  order: z
    .number()
    .int('Order must be an integer')
    .min(1, 'Order must be at least 1')
    .optional(),
  sets: z
    .array(workoutSetSchema)
    .min(1, 'At least one set is required per exercise'),
});

/**
 * Validation schema for creating or logging a workout session (`POST /api/v1/workouts`).
 * Validates the workout name, optional timestamps (startedAt, completedAt), and nested exercises.
 *
 * @type {import('zod').ZodObject<{
 *   name: import('zod').ZodString,
 *   startedAt: import('zod').ZodOptional<import('zod').ZodString>,
 *   completedAt: import('zod').ZodOptional<import('zod').ZodString>,
 *   exercises: import('zod').ZodOptional<import('zod').ZodArray<typeof createWorkoutExerciseSchema>>
 * }>}
 */
export const createWorkoutSessionSchema = z.object({
  name: z
    .string({ required_error: 'Workout name is required' })
    .trim()
    .min(1, 'Workout name cannot be empty'),
  startedAt: z
    .string()
    .datetime({ message: 'startedAt must be a valid ISO 8601 datetime' })
    .optional(),
  completedAt: z
    .string()
    .datetime({ message: 'completedAt must be a valid ISO 8601 datetime' })
    .optional(),
  exercises: z
    .array(createWorkoutExerciseSchema)
    .min(1, 'At least one exercise is required in this workout')
    .optional(),
});

/**
 * Validation schema for query parameters when fetching workout sessions (`GET /api/v1/workouts`).
 * Supports optional date range filtering and pagination.
 */
export const getWorkoutSchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
      .optional(),
    page: z.coerce
      .number()
      .int()
      .min(1, 'Page must be at least 1')
      .default(1)
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .default(10)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

/**
 * Validation schema for workout ID path parameter (e.g. `GET /api/v1/workouts/:workoutId`).
 */
export const workoutIdParamSchema = z.object({
  workoutId: z
    .string({ required_error: 'Workout ID is required' })
    .trim()
    .min(1, 'Workout ID cannot be empty'),
});

export default {
  workoutSetSchema,
  createWorkoutExerciseSchema,
  createWorkoutSessionSchema,
  getWorkoutSchema,
  workoutIdParamSchema,
};