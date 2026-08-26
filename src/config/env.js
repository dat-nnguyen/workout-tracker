import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true });
} else {
  dotenv.config();
}


/**
 * List of critical environment variables required for the application to start.
 * @type {readonly string[]}
 */
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

// Validate that all required environment variables are set
for (const envName of requiredEnvVars) {
  if (!process.env[envName]) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }
}

/**
 * @typedef {Object} EnvConfig
 * @property {number} PORT - The port number on which the HTTP server will listen.
 * @property {string} NODE_ENV - Application runtime environment ('development' | 'production' | 'test').
 * @property {string} JWT_SECRET - Secret key used for signing and verifying JSON Web Tokens.
 * @property {string} JWT_EXPIRES_IN - Expiration duration for JWT tokens (e.g. '1h', '7d').
 * @property {string} DATABASE_URL - Connection string for the PostgreSQL database (pooled connection).
 * @property {string | undefined} [DIRECT_URL] - Direct connection string for Prisma migrations (bypassing connection pooling).
 */

/**
 * Application environment configuration object.
 * @type {EnvConfig}
 */
export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'production',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
};


export default env;