import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanDatabase, disconnectDatabase } from '../helpers/database.js';

describe('Auth Endpoints (Integration)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully with 201 Created', async () => {
      const payload = {
        email: 'tester@example.com',
        password: 'Password123!',
        name: 'John Doe',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe(payload.email);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.password).toBeUndefined(); // Ensure password is NOT leaked in response
    });

    test('should return 400 Bad Request when validation fails (invalid email)', async () => {
      const payload = {
        email: 'invalid-email-format',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    test('should return 409 Conflict when attempting to register an existing email', async () => {
      const payload = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        name: 'Initial User',
      };

      // Initial registration
      await request(app).post('/api/v1/auth/register').send(payload);

      // Duplicate registration attempt
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should authenticate valid credentials and return JWT token', async () => {
      const credentials = {
        email: 'login_tester@example.com',
        password: 'SecurePassword123!',
        name: 'Login Tester',
      };

      // Register user first
      await request(app).post('/api/v1/auth/register').send(credentials);

      // Attempt login
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User logged in successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.user.email).toBe(credentials.email);
    });

    test('should return 401 Unauthorized for incorrect password', async () => {
      const credentials = {
        email: 'wrong_pw_user@example.com',
        password: 'CorrectPassword123!',
      };

      await request(app).post('/api/v1/auth/register').send(credentials);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });
  });
});
