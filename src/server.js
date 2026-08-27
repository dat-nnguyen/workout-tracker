import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in [${env.NODE_ENV.toUpperCase()}] mode`);
  logger.info(`Swagger UI available at http://localhost:${PORT}/api/docs`);
});

/**
 * Gracefully shuts down the server on termination signals.
 * @param {string} signal - Received termination signal.
 */
const handleShutdown = (signal) => {
  logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    logger.info('🔒 HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s timeout if connections hang
  setTimeout(() => {
    logger.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;

