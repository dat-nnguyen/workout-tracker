import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma, pool } from '../src/config/db.js';
import { quitRedis } from '../src/config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.test explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

afterAll(async () => {
  // Gracefully close Prisma connection after all tests in a suite complete
  await prisma.$disconnect();
  if (pool) {
    try {
      await pool.end();
    } catch (_) {}
  }
  await quitRedis();
});
