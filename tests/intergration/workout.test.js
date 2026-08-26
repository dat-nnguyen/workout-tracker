import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanDatabase, disconnectDatabase } from '../helpers/database.js';
import { createTestUserAndToken } from '../helpers/authHelper.js';
import { createExercise } from '../../src/modules/exercises/exercise.service.js';

describe('Workout Endpoints (Integration)', () => {
  let token;
  let user;
  let exercise;

  beforeEach(async () => {
    await cleanDatabase();
    const auth = await createTestUserAndToken();
    token = auth.token;
    user = auth.user;

    exercise = await createExercise({
      userId: user.id,
      name: 'Barbell Squat',
      category: 'Legs',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/v1/workouts', () => {
    test('should create a workout session with nested exercises and sets', async () => {
      const payload = {
        name: 'Leg Day Blast',
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
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Workout created successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.exercise).toHaveLength(1);
      expect(res.body.data.exercise[0].sets).toHaveLength(2);
    });
  });

  describe('GET /api/v1/workouts', () => {
    test('should fetch user workouts', async () => {
      await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Morning Workout',
          exercises: [{ exerciseId: exercise.id, order: 1, sets: [{ setNumber: 1, reps: 5, weight: 60 }] }],
        });

      const res = await request(app)
        .get('/api/v1/workouts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Workouts retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/workouts/:workoutId', () => {
    test('should fetch a single workout by its ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Single Workout Test',
          exercises: [{ exerciseId: exercise.id, order: 1, sets: [{ setNumber: 1, reps: 12, weight: 50 }] }],
        });

      const workoutId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(workoutId);
      expect(res.body.data.name).toBe('Single Workout Test');
    });

    test('should return 404 for non-existent workout ID', async () => {
      const res = await request(app)
        .get('/api/v1/workouts/non-existent-uuid-1234')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
