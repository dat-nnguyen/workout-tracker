import { env } from '../config/env.js';

/**
 * Base Application Error class for operational errors.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   * @param {any} [details=null] - Optional additional error details (e.g. validation errors)
   */
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = null) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = null) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details = null) {
    super(message, 409, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details = null) {
    super(message, 500, details);
  }
}

/**
 * Maps known Prisma errors to operational AppErrors.
 * @param {any} err - The error thrown by Prisma
 * @returns {AppError | null} - Translated AppError or null if not a recognized Prisma error
 */
const handlePrismaError = (err) => {
  // Unique constraint violation (e.g. duplicate email)
  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target)
      ? err.meta.target.join(', ')
      : err.meta?.target || 'field';
    return new ConflictError(`A record with this ${fields} already exists.`);
  }

  // Record not found for update/delete
  if (err.code === 'P2025') {
    return new NotFoundError(err.meta?.cause || 'Record not found.');
  }

  // Foreign key constraint failure
  if (err.code === 'P2003') {
    const field = err.meta?.field_name || 'foreign key';
    return new BadRequestError(`Invalid reference: foreign key constraint failed on ${field}.`);
  }

  // Value too long for column
  if (err.code === 'P2000') {
    return new BadRequestError('The provided value is too long for this field.');
  }

  // Prisma schema validation error
  if (err.name === 'PrismaClientValidationError') {
    return new BadRequestError('Invalid database query parameters or missing required fields.');
  }

  return null;
};

/**
 * Maps JWT authentication errors to UnauthorizedError.
 * @param {any} err - The error object
 * @returns {AppError | null}
 */
const handleJwtError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token. Please log in again.');
  }
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Your session has expired. Please log in again.');
  }
  return null;
};

/**
 * Global Express centralized error handling middleware.
 * @param {any} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Translate known library errors (Prisma, JWT) to operational AppErrors
  const prismaError = handlePrismaError(error);
  if (prismaError) {
    error = prismaError;
  }

  const jwtError = handleJwtError(error);
  if (jwtError) {
    error = jwtError;
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  // 1. Operational, trusted error: send formatted response to client
  if (error.isOperational) {
    return res.status(statusCode).json({
      status,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // 2. Programming / unknown non-operational error: log raw error with stack trace for developers
  console.error(`💥 [Unhandled Error] ${req.method} ${req.originalUrl}:`, error);

  // In development, send detailed error info for debugging
  if (env.NODE_ENV === 'development') {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      stack: error.stack,
      error,
    });
  }

  // In production, send generic message to avoid leaking sensitive stack traces
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

export default errorHandler;