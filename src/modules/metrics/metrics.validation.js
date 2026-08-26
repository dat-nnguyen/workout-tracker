import { z } from 'zod';

/**
 * Allowed intervals for time-series aggregation in analytics.
 */
export const AnalyticsIntervalEnum = z.enum(['day', 'week', 'month']);

/**
 * Validation schema for general analytics query parameters (`GET /api/v1/metrics`).
 * Validates ISO date boundaries, optional exercise/category filters, and grouping intervals.
 *
 * @type {import('zod').ZodEffects<import('zod').ZodObject<{
 *   startDate: import('zod').ZodOptional<import('zod').ZodString>,
 *   endDate: import('zod').ZodOptional<import('zod').ZodString>,
 *   exerciseId: import('zod').ZodOptional<import('zod').ZodString>,
 *   category: import('zod').ZodOptional<import('zod').ZodString>,
 *   interval: import('zod').ZodOptional<import('zod').ZodDefault<typeof AnalyticsIntervalEnum>>
 * }>>}
 */
export const analyticsQuerySchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: 'startDate must be a valid ISO 8601 datetime (e.g. 2026-08-01T00:00:00Z)' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'endDate must be a valid ISO 8601 datetime (e.g. 2026-08-25T00:00:00Z)' })
      .optional(),
    exerciseId: z
      .string()
      .uuid({ message: 'exerciseId must be a valid UUID' })
      .optional(),
    category: z
      .string()
      .trim()
      .min(1, 'Category cannot be empty')
      .optional(),
    interval: AnalyticsIntervalEnum.default('day').optional(),
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
 * Validation schema for single exercise progression / 1RM metrics (`GET /api/v1/metrics/exercises/:exerciseId`).
 */
export const exerciseMetricsParamSchema = z.object({
  exerciseId: z
    .string({ required_error: 'Exercise ID is required' })
    .uuid({ message: 'Exercise ID must be a valid UUID' }),
});

export default {
  AnalyticsIntervalEnum,
  analyticsQuerySchema,
  exerciseMetricsParamSchema,
};
