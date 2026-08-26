import { createClient } from 'redis';
import { env } from './env.js';

/**
 * Redis client instance.
 * @type {import('redis').RedisClientType | null}
 */
let redisClient = null;

/**
 * Redis connection state flag.
 * @type {boolean}
 */
let isRedisConnected = false;

/**
 * Initializes and connects the Redis client if REDIS_URL is configured.
 * Gracefully handles connection failures so the application falls back to direct database queries.
 *
 * @returns {Promise<import('redis').RedisClientType | null>} The connected Redis client or null.
 */
export async function initRedis() {
  const redisUrl = process.env.REDIS_URL || env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not configured. Running without cache.');
    return null;
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('⚡ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    console.error('❌ Redis error:', err.message);
  });

  try {
    await redisClient.connect();
  } catch (error) {
    isRedisConnected = false;
    console.warn('⚠️ Could not connect to Redis. Fallback to direct DB queries.');
  }

  return redisClient;
}

/**
 * Retrieves and JSON-parses a cached value by its key.
 *
 * @param {string} key - Cache key.
 * @returns {Promise<any | null>} Parsed cached data or null on miss/error.
 */
export async function getCache(key) {
  if (!isRedisConnected || !redisClient || !key) return null;

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis GET error for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Sets a value in the Redis cache with a time-to-live (TTL).
 *
 * @param {string} key - Cache key.
 * @param {any} value - Serializable data to cache.
 * @param {number} [ttl=3600] - Expiration time in seconds (default: 3600s / 1 hour).
 * @returns {Promise<void>}
 */
export async function setCache(key, value, ttl = 3600) {
  if (!isRedisConnected || !redisClient || !key) return;

  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.error(`Redis SET error for key "${key}":`, err.message);
  }
}

/**
 * Deletes a single key from Redis.
 *
 * @param {string} key - Cache key to delete.
 * @returns {Promise<void>}
 */
export async function delCache(key) {
  if (!isRedisConnected || !redisClient || !key) return;

  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis DEL error for key "${key}":`, err.message);
  }
}

/**
 * Deletes all keys matching a glob pattern (e.g. `exercises:*`).
 *
 * @param {string} pattern - Glob pattern to match keys against.
 * @returns {Promise<void>}
 */
export async function delPatternCache(pattern) {
  if (!isRedisConnected || !redisClient || !pattern) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error(`Redis delPattern error for pattern "${pattern}":`, err.message);
  }
}

/**
 * Flushes all data from the connected Redis database.
 *
 * @returns {Promise<void>}
 */
export async function flushAll() {
  if (!isRedisConnected || !redisClient) return;

  try {
    await redisClient.flushAll();
  } catch (err) {
    console.error('Redis flushAll error:', err.message);
  }
}

/**
 * Invalidates a specific key or a glob pattern from the cache.
 *
 * @param {string} keyPatternOrKey - Exact key or pattern ending with `*`.
 * @returns {Promise<void>}
 */
export async function invalidateCache(keyPatternOrKey) {
  if (!isRedisConnected || !redisClient || !keyPatternOrKey) return;

  try {
    if (keyPatternOrKey.includes('*')) {
      await delPatternCache(keyPatternOrKey);
    } else {
      await redisClient.del(keyPatternOrKey);
    }
  } catch (err) {
    console.warn(`Redis invalidateCache error for "${keyPatternOrKey}":`, err.message);
  }
}

/**
 * Gracefully disconnects the Redis client.
 *
 * @returns {Promise<void>}
 */
export async function quitRedis() {
  if (!redisClient) return;

  try {
    if (isRedisConnected) {
      await redisClient.quit();
    }
  } catch (err) {
    console.error('Redis quit error:', err.message);
  } finally {
    redisClient = null;
    isRedisConnected = false;
  }
}

export default {
  initRedis,
  getCache,
  setCache,
  delCache,
  delPatternCache,
  flushAll,
  quitRedis,
  invalidateCache,
};
 