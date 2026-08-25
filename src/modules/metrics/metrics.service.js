import { prisma } from '../../config/db.js';

/**
 * Helper to compute an estimated One Rep Max (1RM) using the Epley formula.
 * 1RM = weight * (1 + reps / 30)
 *
 * @param {number} weight - Weight lifted in kg/lbs.
 * @param {number} reps - Repetitions performed.
 * @returns {number} Estimated 1RM rounded to 1 decimal place.
 */
export function calculateEstimated1RM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Number((weight * (1 + reps / 30)).toFixed(1));
}

/**
 * Formats a Date object into a grouping key based on the specified interval.
 *
 * @param {Date} date - Date to format.
 * @param {'day' | 'week' | 'month'} interval - Time bucket interval.
 * @returns {string} Formatted time bucket key.
 */
function getIntervalKey(date, interval = 'day') {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  if (interval === 'month') {
    return `${year}-${month}`;
  }

  if (interval === 'week') {
    // Start of the week (Monday)
    const dayOfWeek = d.getUTCDay() || 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - dayOfWeek + 1);
    const mYear = monday.getUTCFullYear();
    const mMonth = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const mDay = String(monday.getUTCDate()).padStart(2, '0');
    return `${mYear}-${mMonth}-${mDay}`;
  }

  // default: 'day'
  return `${year}-${month}-${day}`;
}

/**
 * Calculates volume progression time-series metrics for workouts completed by the user.
 * Volume per set = reps * weight. Aggregated by time interval (day, week, month).
 *
 * @param {Object} params - Query filters.
 * @param {string} params.userId - Authenticated user's ID.
 * @param {string} [params.startDate] - ISO start date boundary.
 * @param {string} [params.endDate] - ISO end date boundary.
 * @param {string} [params.exerciseId] - Optional filter for a specific exercise.
 * @param {string} [params.category] - Optional filter for an exercise category.
 * @param {'day' | 'week' | 'month'} [params.interval='day'] - Grouping time interval.
 * @returns {Promise<Array<{ date: string, totalVolume: number, totalSets: number, totalReps: number, workoutsCount: number, maxWeight: number, maxEstimated1RM: number }>>}
 */
export async function getVolumeMetrics({
  userId,
  startDate,
  endDate,
  exerciseId,
  category,
  interval = 'day',
}) {
  const where = {
    userId,
    completedAt: {
      not: null,
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
    ...(exerciseId || category
      ? {
          exercise: {
            some: {
              ...(exerciseId && { exerciseId }),
              ...(category && {
                exercise: {
                  category: {
                    equals: category,
                    mode: 'insensitive',
                  },
                },
              }),
            },
          },
        }
      : {}),
  };

  // Fetch completed workouts matching user and date criteria
  const workouts = await prisma.workout.findMany({
    where,
    orderBy: {
      completedAt: 'asc',
    },
    include: {
      exercise: {
        where: {
          ...(exerciseId && { exerciseId }),
          ...(category && {
            exercise: {
              category: {
                equals: category,
                mode: 'insensitive',
              },
            },
          }),
        },
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
      },
    },
  });

  // Group and aggregate metrics by interval bucket
  const timeSeriesMap = new Map();

  for (const workout of workouts) {
    if (!workout.completedAt) continue;

    const dateKey = getIntervalKey(workout.completedAt, interval);

    if (!timeSeriesMap.has(dateKey)) {
      timeSeriesMap.set(dateKey, {
        date: dateKey,
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        workoutsCount: 0,
        maxWeight: 0,
        maxEstimated1RM: 0,
      });
    }

    const bucket = timeSeriesMap.get(dateKey);
    bucket.workoutsCount += 1;

    for (const workoutExercise of workout.exercise) {
      for (const set of workoutExercise.sets) {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const setVolume = weight * reps;

        bucket.totalVolume += setVolume;
        bucket.totalSets += 1;
        bucket.totalReps += reps;

        if (weight > bucket.maxWeight) {
          bucket.maxWeight = weight;
        }

        const est1RM = calculateEstimated1RM(weight, reps);
        if (est1RM > bucket.maxEstimated1RM) {
          bucket.maxEstimated1RM = est1RM;
        }
      }
    }
  }

  // Convert map to sorted time-series array and round values
  return Array.from(timeSeriesMap.values())
    .map((item) => ({
      ...item,
      totalVolume: Number(item.totalVolume.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculates 1RM progression and volume history specifically for a single exercise.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user's ID.
 * @param {string} params.exerciseId - Target exercise ID.
 * @param {string} [params.startDate] - ISO start date boundary.
 * @param {string} [params.endDate] - ISO end date boundary.
 * @returns {Promise<Array<{ workoutId: string, date: string, maxWeight: number, estimated1RM: number, totalVolume: number, setsCount: number }>>}
 */
export async function getExerciseProgression({ userId, exerciseId, startDate, endDate }) {
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      completedAt: {
        not: null,
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
      exercise: {
        some: {
          exerciseId,
        },
      },
    },
    orderBy: {
      completedAt: 'asc',
    },
    include: {
      exercise: {
        where: {
          exerciseId,
        },
        include: {
          sets: true,
        },
      },
    },
  });

  return workouts.map((workout) => {
    let maxWeight = 0;
    let maxEstimated1RM = 0;
    let totalVolume = 0;
    let setsCount = 0;

    for (const we of workout.exercise) {
      for (const set of we.sets) {
        const weight = set.weight || 0;
        const reps = set.reps || 0;

        totalVolume += weight * reps;
        setsCount += 1;

        if (weight > maxWeight) {
          maxWeight = weight;
        }

        const e1rm = calculateEstimated1RM(weight, reps);
        if (e1rm > maxEstimated1RM) {
          maxEstimated1RM = e1rm;
        }
      }
    }

    return {
      workoutId: workout.id,
      workoutName: workout.name,
      date: workout.completedAt.toISOString(),
      maxWeight,
      estimated1RM: maxEstimated1RM,
      totalVolume: Number(totalVolume.toFixed(2)),
      setsCount,
    };
  });
}

export default {
  calculateEstimated1RM,
  getVolumeMetrics,
  getExerciseProgression,
};