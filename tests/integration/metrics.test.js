import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanDatabase, disconnectDatabase } from '../helpers/database.js';
import { createTestUserAndToken } from '../helpers/authHelper.js';
import { createExercise } from '../../src/modules/exercises/exercise.service.js';
import { createWorkout } from '../../src/modules/workouts/workout.service.js';

describe('Metrics & Analytics Endpoints (Integration)', () => {
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
      name: 'Bench Press',
      category: 'Chest',
    });

    // Create a completed workout session
    await createWorkout({
      userId: user.id,
      name: 'Chest Volume Session',
      startedAt: '2026-08-01T10:00:00.000Z',
      completedAt: '2026-08-01T11:00:00.000Z',
      exercises: [
        {
          exerciseId: exercise.id,
          order: 1,
          sets: [
            { setNumber: 1, reps: 10, weight: 100 }, // 1000 kg volume
            { setNumber: 2, reps: 10, weight: 100 }, // 1000 kg volume
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('GET /api/v1/metrics (Volume Progression)', () => {
    test('should return aggregated volume progression time-series', async () => {
      const res = await request(app)
        .get('/api/v1/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Volume metrics retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].totalVolume).toBe(2000);
      expect(res.body.data[0].totalSets).toBe(2);
      expect(res.body.data[0].totalReps).toBe(20);
    });

    test('should filter volume by date boundaries', async () => {
      // Query outside the date range
      const res = await request(app)
        .get('/api/v1/metrics?startDate=2026-09-01T00:00:00.000Z&endDate=2026-09-30T00:00:00.000Z')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/metrics/exercises/:exerciseId', () => {
    test('should return progression and estimated 1RM for single exercise', async () => {
      const res = await request(app)
        .get(`/api/v1/metrics/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercise progression metrics retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].maxWeight).toBe(100);
      expect(res.body.data[0].estimated1RM).toBe(133.3);
    });
  });
});
