import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { quitRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in [${env.NODE_ENV.toUpperCase()}] mode`);
  logger.info(`Swagger UI available at http://localhost:${PORT}/api/docs`);
});

/**
 * Flag to prevent concurrent or repeated shutdown execution.
 * @type {boolean}
 */
let isShuttingDown = false;

/**
 * Gracefully shuts down the server, drains in-flight requests, and cleans up database/cache connections.
 *
 * @param {string} signal - Termination signal received (e.g., 'SIGTERM', 'SIGINT', 'UNCAUGHT_EXCEPTION').
 * @returns {Promise<void>}
 */
export async function gracefulShutdown(signal) {
  // Prevent duplicate execution if multiple signals are received
  if (isShuttingDown) {
    logger.warn(`⚠️ Shutdown already in progress. Ignoring additional signal: ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown sequence...`);

  // Forcefully exit after timeout if in-flight requests or connection drains hang
  const forceExitTimeout = setTimeout(() => {
    logger.error('⚠️ Graceful shutdown timed out (10s limit). Forcing immediate process exit.');
    process.exit(1);
  }, 10000);

  // Prevent timeout timer from keeping event loop open if everything closes cleanly
  forceExitTimeout.unref();

  try {
    // 1. Stop HTTP server from accepting new connections and drain active in-flight requests
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info('🔒 [1/3] HTTP server closed. In-flight requests drained.');

    // 2. Disconnect Prisma database connection pool
    await prisma.$disconnect();
    logger.info('📦 [2/3] Prisma PostgreSQL connection pool closed.');

    // 3. Disconnect Redis cache and rate limiter connections
    await quitRedis();
    logger.info('⚡ [3/3] Redis connection closed gracefully.');

    logger.info('✅ Graceful shutdown completed cleanly. Exiting process.');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '❌ Error encountered during graceful shutdown sequence.');
    process.exit(1);
  }
}

// -------------------------------------------------------------
// Termination Signal Listeners
// -------------------------------------------------------------

// Kubernetes / Docker container stop signal
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Ctrl+C terminal interrupt signal
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught Exception handler
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, '💥 Uncaught Exception thrown in Node.js runtime');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Unhandled Promise Rejection handler
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '💥 Unhandled Promise Rejection detected');
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default server;
