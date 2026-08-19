import { BadRequestError } from './error.middleware.js';

/**
 * Higher-order middleware function for generic request validation.
 * Validates incoming request data (req.body, req.query, or req.params) against a schema (e.g. Zod).
 *
 * @param {import('zod').ZodTypeAny | { safeParse: Function, safeParseAsync?: Function }} schema - The validation schema.
 * @param {'body' | 'query' | 'params'} [source='body'] - The request property to validate.
 * @returns {import('express').RequestHandler} Express middleware function.
 *
 * @example
 * import { z } from 'zod';
 * import { validate } from './middlewares/validate.middleware.js';
 *
 * const registerSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(6),
 * });
 *
 * router.post('/register', validate(registerSchema, 'body'), registerController);
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }

      // Support Zod schemas (safeParse / safeParseAsync)
      if (typeof schema.safeParseAsync === 'function' || typeof schema.safeParse === 'function') {
        const result = typeof schema.safeParseAsync === 'function'
          ? await schema.safeParseAsync(req[source])
          : schema.safeParse(req[source]);

        if (!result.success) {
          const issues = result.error.issues || result.error.errors || [];
          const formattedErrors = issues.map((err) => ({
            field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join('.') : source,
            message: err.message,
          }));

          return next(new BadRequestError('Validation failed', formattedErrors));
        }

        // Replace request data with parsed, validated, and sanitized output
        req[source] = result.data;
        return next();
      }

      // Support standard function validator if provided
      if (typeof schema === 'function') {
        const result = await schema(req[source]);
        if (result?.error) {
          return next(new BadRequestError('Validation failed', result.error));
        }
        if (result?.data !== undefined) {
          req[source] = result.data;
        }
        return next();
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default validate;