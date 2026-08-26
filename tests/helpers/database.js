import { prisma } from '../../src/config/db.js';

/**
 * Cleans all database records in reverse dependency order.
 * Ensures tests run against a pristine database state without foreign key violations.
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.workoutSet.deleteMany(),
    prisma.workoutExercise.deleteMany(),
    prisma.workout.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Gracefully disconnects Prisma client.
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default {
  cleanDatabase,
  disconnectDatabase,
};
