import { prisma } from '../../config/db.js';

/**
 * Fetches the exercise catalog visible to the specified user.
 * Retrieves all global exercises (`userId: null`) OR custom exercises owned by `userId`,
 * with optional case-insensitive filtering by category and name.
 *
 * @param {Object} params - Query parameters.
 * @param {string} params.userId - Authenticated user's unique identifier.
 * @param {string} [params.category] - Optional category to filter exercises by.
 * @param {string} [params.name] - Optional search term to filter exercise names.
 * @returns {Promise<Array<import('@prisma/client').Exercise>>} List of matching exercise records.
 */
export async function getExercise({ userId, category, name }) {
  const where = {
    OR: [
      { userId: null },
      { userId: userId },
    ],
  };

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  if (name) {
    where.name = {
      contains: name,
      mode: 'insensitive',
    };
  }

  return await prisma.exercise.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
  });
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
  getExercise,
  getExcercise,
  createExercise,
};


