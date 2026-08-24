import { prisma } from '../../config/db.js';

/**
 * Fetches workout sessions for a user with optional date range filtering and sorting.
 *
 * @param {Object} params - Filter and pagination parameters.
 * @param {string} params.userId - Authenticated user's unique identifier.
 * @param {string} [params.startDate] - ISO start date string (inclusive).
 * @param {string} [params.endDate] - ISO end date string (inclusive).
 * @param {number} [params.page=1] - Pagination page number.
 * @param {number} [params.limit=10] - Number of records per page.
 * @returns {Promise<Array<import('@prisma/client').Workout>>} List of workout sessions.
 */
export async function getWorkouts({ userId, startDate, endDate, page = 1, limit = 10 }) {
  const where = {
    userId,
  };

  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) {
      where.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.startedAt.lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  return await prisma.workout.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      startedAt: 'desc',
    },
    include: {
      exercise: {
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          sets: {
            orderBy: {
              setNumber: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
}

/**
 * Retrieves a single workout by its ID, ensuring it belongs to the authenticated user.
 * Includes all nested exercises and sets.
 *
 * @param {Object} params
 * @param {string} params.workoutId - Unique identifier of the workout.
 * @param {string} params.userId - Authenticated user's ID for tenant isolation.
 * @returns {Promise<import('@prisma/client').Workout | null>} The workout session with full details or null.
 */
export async function getWorkoutById({ workoutId, userId }) {
  return await prisma.workout.findFirst({
    where: {
      id: workoutId,
      userId,
    },
    include: {
      exercise: {
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          sets: {
            orderBy: {
              setNumber: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
}

/**
 * Creates a new workout session with optional nested exercises and sets in a single transaction.
 *
 * @param {Object} payload - Workout creation payload.
 * @param {string} payload.userId - Authenticated user's ID.
 * @param {string} payload.name - Name of the workout session.
 * @param {string} [payload.startedAt] - ISO timestamp when the workout started.
 * @param {string} [payload.completedAt] - ISO timestamp when the workout completed.
 * @param {Array<{ exerciseId: string, order?: number, sets?: Array<{ setNumber?: number, reps: number, weight?: number, rpe?: number }> }>} [payload.exercises] - Nested exercises.
 * @returns {Promise<import('@prisma/client').Workout>} The created workout session.
 */
export async function createWorkout({ userId, name, startedAt, completedAt, exercises = [] }) {
  return await prisma.workout.create({
    data: {
      userId,
      name,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: completedAt ? new Date(completedAt) : null,
      ...(exercises.length > 0 && {
        exercise: {
          create: exercises.map((item, idx) => ({
            exerciseId: item.exerciseId,
            order: item.order || idx + 1,
            ...(item.sets?.length > 0 && {
              sets: {
                create: item.sets.map((set, sIdx) => ({
                  setNumber: set.setNumber || sIdx + 1,
                  reps: set.reps,
                  weight: set.weight ?? null,
                  rpe: set.rpe ?? null,
                })),
              },
            }),
          })),
        },
      }),
    },
    include: {
      exercise: {
        include: {
          exercise: true,
          sets: {
            orderBy: {
              setNumber: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
}

/**
 * Updates basic details of an existing workout session owned by the user.
 *
 * @param {Object} params
 * @param {string} params.workoutId - Unique identifier of the workout to update.
 * @param {string} params.userId - Authenticated user's ID.
 * @param {string} [params.name] - New workout name.
 * @param {string} [params.startedAt] - New started timestamp.
 * @param {string} [params.completedAt] - New completed timestamp.
 * @returns {Promise<import('@prisma/client').Workout>} The updated workout session.
 */
export async function updateWorkout({ workoutId, userId, name, startedAt, completedAt }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (startedAt !== undefined) data.startedAt = startedAt ? new Date(startedAt) : null;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;

  // Use update with composite where if available or findFirst check
  return await prisma.workout.update({
    where: {
      id: workoutId,
      userId,
    },
    data,
  });
}

/**
 * Deletes a workout session belonging to the user.
 * Cascades deletion to WorkoutExercise and WorkoutSet records.
 *
 * @param {Object} params
 * @param {string} params.workoutId - Unique identifier of the workout to delete.
 * @param {string} params.userId - Authenticated user's ID.
 * @returns {Promise<import('@prisma/client').Workout>} The deleted workout record.
 */
export async function deleteWorkout({ workoutId, userId }) {
  return await prisma.workout.delete({
    where: {
      id: workoutId,
      userId,
    },
  });
}

export default {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};