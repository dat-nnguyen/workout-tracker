import { app } from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in [${env.NODE_ENV.toUpperCase()}] mode`);
  console.log(`Check server health at http://localhost:${PORT}/health`)
});

/**
 * Gracefully shuts down the server on termination signals.
 * @param {string} signal - Received termination signal.
 */
const handleShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log('🔒 HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s timeout if connections hang
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
