import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env.js';

const isDevelopment = (env.NODE_ENV || process.env.NODE_ENV) === 'development';
const isTest = (env.NODE_ENV || process.env.NODE_ENV) === 'test';

/**
 * Pino structured JSON logger instance.
 * Outputs human-friendly colorized logs in development, and standard JSON in production.
 */
export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
});

/**
 * Express HTTP logging middleware using pino-http.
 * Captures request details, response status, duration, and the unique correlation request ID.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id || req.requestId || req.headers['x-request-id'],
  customProps: (req) => ({
    requestId: req.id || req.requestId,
    userId: req.user?.id || req.user?.userId || null,
  }),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) => {
    return `${req.method} ${req.originalUrl || req.url} completed with ${res.statusCode} in ${responseTime}ms`;
  },
  customErrorMessage: (req, res, error) => {
    return `${req.method} ${req.originalUrl || req.url} failed with error: ${error.message}`;
  },
  autoLogging: {
    ignore: (req) => isTest || req.url === '/health',
  },
});

export default logger;
