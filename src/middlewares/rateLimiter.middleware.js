import { initRedis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Extracts a unique client identifier for rate limiting.
 * Defaults to authenticated userId (if available), otherwise falls back to IP address.
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {string} Client identifier.
 */
export function defaultKeyGenerator(req) {
  return req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
}

/**
 * Higher-order middleware factory for sliding-window rate limiting using Redis Sorted Sets (ZSET).
 *
 * @param {Object} [options={}] - Rate limiter configuration options.
 * @param {number} [options.windowMs=60000] - Sliding window duration in milliseconds (default: 60s).
 * @param {number} [options.max=100] - Maximum requests allowed per window (default: 100).
 * @param {string} [options.keyPrefix='global'] - Prefix for Redis keys to namespace different endpoints.
 * @param {Function} [options.keyGenerator=defaultKeyGenerator] - Function extracting client identifier.
 * @param {string} [options.message='Too many requests, please try again later.'] - Custom error message on rate limit exceed.
 * @returns {import('express').RequestHandler} Express rate limiter middleware.
 */
export function rateLimiter({
  windowMs = 60 * 1000,
  max = 100,
  keyPrefix = 'global',
  keyGenerator = defaultKeyGenerator,
  message = 'Too many requests, please try again later.',
} = {}) {
  return async (req, res, next) => {
    try {
      const client = await initRedis();

      // Graceful fallback: If Redis is unavailable or unconfigured, allow the request to proceed
      if (!client || !client.isOpen) {
        return next();
      }

      const identifier = keyGenerator(req);
      const redisKey = `ratelimit:${keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Execute atomic pipeline transaction with Redis Sorted Set (ZSET)
      const multi = client.multi();
      multi.zRemRangeByScore(redisKey, 0, windowStart);
      multi.zCard(redisKey);
      multi.zAdd(redisKey, { score: now, value: `${now}:${Math.random().toString(36).substring(2, 9)}` });
      multi.expire(redisKey, windowSeconds);

      const results = await multi.exec();
      const currentCount = results && typeof results[1] === 'number' ? results[1] : 0;

      // Rate limit exceeded: return 429 Too Many Requests
      if (currentCount >= max) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

        return res.status(429).json({
          status: 'fail',
          message,
          retryAfter,
        });
      }

      // Within limit: set standard rate limiting response headers
      const remaining = Math.max(0, max - currentCount - 1);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      return next();
    } catch (error) {
      // Graceful degradation: Log notice and allow request through if limiter fails
      return next();
    }
  };
}

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute-force protection).
 * Limit: 5 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * General API Rate Limiter.
 * Limit: 100 requests per minute per User/IP.
 */
export const generalApiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: 'api',
  message: 'Too many API requests. Please slow down.',
});

export default {
  rateLimiter,
  authRateLimiter,
  generalApiRateLimiter,
  defaultKeyGenerator,
};
