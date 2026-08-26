import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanDatabase, disconnectDatabase } from '../helpers/database.js';
import { createTestUserAndToken } from '../helpers/authHelper.js';

describe('Exercise Endpoints (Integration)', () => {
  let token;
  let user;

  beforeEach(async () => {
    await cleanDatabase();
    const auth = await createTestUserAndToken();
    token = auth.token;
    user = auth.user;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/v1/exercises', () => {
    test('should create a custom exercise for authenticated user', async () => {
      const payload = {
        name: 'Incline Dumbbell Curl',
        category: 'Arms',
        favorite: true,
      };

      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Exercise created successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.category).toBe(payload.category);
      expect(res.body.data.userId).toBe(user.id);
    });

    test('should return 401 Unauthorized when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .send({ name: 'Bench Press', category: 'Chest' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/exercises', () => {
    test('should fetch list of visible exercises (global + custom user exercises)', async () => {
      // Create a custom exercise
      await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Custom Lateral Raise', category: 'Shoulders' });

      const res = await request(app)
        .get('/api/v1/exercises')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercises fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('should filter exercises by category query parameter', async () => {
      await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Preacher Curl', category: 'Arms' });

      await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Leg Extension', category: 'Legs' });

      const res = await request(app)
        .get('/api/v1/exercises?category=Arms')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((e) => e.category.toLowerCase() === 'arms')).toBe(true);
    });
  });
});
