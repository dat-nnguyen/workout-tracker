import { randomUUID } from 'crypto';

/**
 * Middleware that inspects or generates a unique correlation ID (UUID v4) for each incoming HTTP request.
 * Attaches the ID to `req.id`, `req.requestId`, and mirrors it to the response header `X-Request-Id`.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
export function requestIdMiddleware(req, res, next) {
  // Check for incoming distributed tracing headers or generate a new UUID
  const requestId =
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    randomUUID();

  // Attach to request context
  req.id = requestId;
  req.requestId = requestId;

  // Mirror correlation ID to response headers for client-side tracing
  res.setHeader('X-Request-Id', requestId);

  next();
}

export default requestIdMiddleware;
