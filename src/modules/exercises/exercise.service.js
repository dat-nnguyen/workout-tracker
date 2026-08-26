import { prisma } from '../../config/db.js';
import { getCache, setCache } from '../../config/redis.js';

/**
 * Cache TTL for global standard exercises (1 hour / 3600 seconds).
 * @type {number}
 */
const GLOBAL_EXERCISES_CACHE_TTL = 3600;

/**
 * Generates a structured, predictable Redis cache key for standard exercises.
 *
 * @param {string} [category] - Filter category.
 * @param {string} [name] - Filter name substring.
 * @returns {string} Redis cache key.
 */
function getGlobalCatalogCacheKey(category, name) {
  const catKey = category ? category.toLowerCase().trim() : 'all';
  const nameKey = name ? name.toLowerCase().trim() : 'all';
  return `exercises:global:cat:${catKey}:name:${nameKey}`;
}

/**
 * Fetches standard global exercises (`userId: null`) using the Cache-Aside pattern.
 * Checks Redis first; on cache miss, queries PostgreSQL, populates the cache with TTL, and returns the data.
 *
 * @param {Object} [params={}] - Filter parameters.
 * @param {string} [params.category] - Optional category filter.
 * @param {string} [params.name] - Optional search query filter.
 * @returns {Promise<Array<import('@prisma/client').Exercise>>} List of standard global exercises.
 */
export async function getStandardExercises({ category, name } = {}) {
  const cacheKey = getGlobalCatalogCacheKey(category, name);

  // 1. Cache-Aside: Check Redis cache
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 2. Cache Miss: Query PostgreSQL database
  const where = {
    userId: null,
    ...(category && {
      category: { equals: category, mode: 'insensitive' },
    }),
    ...(name && {
      name: { contains: name, mode: 'insensitive' },
    }),
  };

  const standardExercises = await prisma.exercise.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // 3. Cache Population: Save to Redis with TTL
  await setCache(cacheKey, standardExercises, GLOBAL_EXERCISES_CACHE_TTL);

  return standardExercises;
}

/**
 * Fetches the complete exercise catalog visible to the specified user.
 * Retrieves cached standard exercises combined with custom user-created exercises.
 *
 * @param {Object} params - Query parameters.
 * @param {string} [params.userId] - Authenticated user's unique identifier.
 * @param {string} [params.category] - Optional category to filter exercises by.
 * @param {string} [params.name] - Optional search term to filter exercise names.
 * @returns {Promise<Array<import('@prisma/client').Exercise>>} Combined list of matching exercise records.
 */
export async function getExercise({ userId, category, name } = {}) {
  // 1. Fetch standard exercises (served from Redis if cached)
  const standardExercises = await getStandardExercises({ category, name });

  // 2. Fetch user's custom exercises directly from DB (if user is authenticated)
  let customExercises = [];

  if (userId) {
    customExercises = await prisma.exercise.findMany({
      where: {
        userId,
        ...(category && {
          category: { equals: category, mode: 'insensitive' },
        }),
        ...(name && {
          name: { contains: name, mode: 'insensitive' },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  // 3. Merge and sort alphabetically by exercise name
  return [...standardExercises, ...customExercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Alias for backwards compatibility
export const getExcercise = getExercise;

/**
 * Creates a new custom exercise record associated with the authenticated user.
 *
 * @param {Object} data - Exercise creation payload.
 * @param {string} data.userId - ID of the user creating the custom exercise.
 * @param {string} data.name - Name of the exercise.
 * @param {string} data.category - Category/muscle group of the exercise.
 * @param {boolean} [data.favorite=false] - Whether the exercise is marked as favorite.
 * @returns {Promise<import('@prisma/client').Exercise>} The created exercise record.
 */
export async function createExercise({ userId, name, category, favorite = false }) {
  return await prisma.exercise.create({
    data: {
      userId,
      name,
      category,
      favorite,
    },
  });
}

export default {
  getStandardExercises,
  getExercise,
  getExcercise,
  createExercise,
};



