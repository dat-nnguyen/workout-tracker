import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { cleanDatabase, disconnectDatabase } from '../helpers/database.js';
import { createTestUserAndToken } from '../helpers/authHelper.js';
import { createExercise } from '../../src/modules/exercises/exercise.service.js';

describe('Workout Endpoints & Multi-Tenant Security (Integration)', () => {
  let userA;
  let userB;
  let exercise;

  beforeEach(async () => {
    await cleanDatabase();

    // Create User A and User B with isolated tokens
    userA = await createTestUserAndToken({
      name: 'User A',
      email: 'user_a@example.com',
    });

    userB = await createTestUserAndToken({
      name: 'User B',
      email: 'user_b@example.com',
    });

    // Create a shared test exercise
    exercise = await createExercise({
      userId: userA.user.id,
      name: 'Barbell Squat',
      category: 'Legs',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Nested Workout Creation & Database Persistence', () => {
    test('User A creates a workout with nested exercises and sets -> 201 Created and persists in DB', async () => {
      const payload = {
        name: 'Heavy Leg Day',
        startedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseId: exercise.id,
            order: 1,
            sets: [
              { setNumber: 1, reps: 10, weight: 100, rpe: 8 },
              { setNumber: 2, reps: 8, weight: 110, rpe: 9 },
            ],
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Workout created successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Heavy Leg Day');
      expect(res.body.data.exercise).toHaveLength(1);
      expect(res.body.data.exercise[0].sets).toHaveLength(2);

      const createdWorkoutId = res.body.data.id;

      // Verify direct database persistence and nested relations in PostgreSQL
      const dbWorkout = await prisma.workout.findUnique({
        where: { id: createdWorkoutId },
        include: {
          exercise: {
            include: {
              sets: true,
            },
          },
        },
      });

      expect(dbWorkout).not.toBeNull();
      expect(dbWorkout.userId).toBe(userA.user.id);
      expect(dbWorkout.name).toBe('Heavy Leg Day');
      expect(dbWorkout.exercise).toHaveLength(1);
      expect(dbWorkout.exercise[0].exerciseId).toBe(exercise.id);
      expect(dbWorkout.exercise[0].sets).toHaveLength(2);
      expect(dbWorkout.exercise[0].sets[0].reps).toBe(10);
      expect(dbWorkout.exercise[0].sets[0].weight).toBe(100);
      expect(dbWorkout.exercise[0].sets[1].reps).toBe(8);
      expect(dbWorkout.exercise[0].sets[1].weight).toBe(110);
    });
  });

  describe('Multi-Tenant Isolation & IDOR Prevention', () => {
    test("User B cannot access or view User A's workout (assert 404 Not Found)", async () => {
      // 1. User A creates a workout
      const createRes = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          name: "User A's Confidential Workout",
          exercises: [
            {
              exerciseId: exercise.id,
              order: 1,
              sets: [{ setNumber: 1, reps: 5, weight: 140 }],
            },
          ],
        });

      const userAWorkoutId = createRes.body.data.id;

      // 2. User B attempts to access User A's workout
      const accessRes = await request(app)
        .get(`/api/v1/workouts/${userAWorkoutId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(accessRes.status).toBe(404);
      expect(accessRes.body.message).toMatch(/not found/i);
    });

    test("User B cannot delete User A's workout (assert 404 Not Found and verify record remains untouched)", async () => {
      // 1. User A creates a workout
      const createRes = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          name: "Protected Workout",
          exercises: [
            {
              exerciseId: exercise.id,
              order: 1,
              sets: [{ setNumber: 1, reps: 10, weight: 80 }],
            },
          ],
        });

      const userAWorkoutId = createRes.body.data.id;

      // 2. Adversary User B attempts to delete User A's workout
      const deleteRes = await request(app)
        .delete(`/api/v1/workouts/${userAWorkoutId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(deleteRes.status).toBe(404);

      // 3. Verify in database that User A's workout is still intact
      const dbWorkout = await prisma.workout.findUnique({
        where: { id: userAWorkoutId },
      });
      expect(dbWorkout).not.toBeNull();
      expect(dbWorkout.userId).toBe(userA.user.id);
    });
  });

  describe('Cascade Deletion', () => {
    test('User A deletes their workout -> 200 OK and cleanly cascades related exercises and sets', async () => {
      // 1. User A creates a workout with nested exercises and sets
      const createRes = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          name: 'Workout To Delete',
          exercises: [
            {
              exerciseId: exercise.id,
              order: 1,
              sets: [
                { setNumber: 1, reps: 12, weight: 70 },
                { setNumber: 2, reps: 10, weight: 75 },
              ],
            },
          ],
        });

      const workoutId = createRes.body.data.id;
      const workoutExerciseId = createRes.body.data.exercise[0].id;

      // Verify records exist in database before deletion
      const workoutBefore = await prisma.workout.findUnique({ where: { id: workoutId } });
      const exercisesBefore = await prisma.workoutExercise.findMany({ where: { workoutId } });
      const setsBefore = await prisma.workoutSet.findMany({ where: { workoutExerciseId } });

      expect(workoutBefore).not.toBeNull();
      expect(exercisesBefore).toHaveLength(1);
      expect(setsBefore).toHaveLength(2);

      // 2. User A deletes their workout
      const deleteRes = await request(app)
        .delete(`/api/v1/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBe('Workout deleted successfully');

      // 3. Verify database cascade constraints cleaned up all child records
      const workoutAfter = await prisma.workout.findUnique({ where: { id: workoutId } });
      const exercisesAfter = await prisma.workoutExercise.findMany({ where: { workoutId } });
      const setsAfter = await prisma.workoutSet.findMany({ where: { workoutExerciseId } });

      expect(workoutAfter).toBeNull();
      expect(exercisesAfter).toHaveLength(0);
      expect(setsAfter).toHaveLength(0);
    });
  });
});
