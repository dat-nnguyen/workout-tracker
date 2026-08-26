import request from 'supertest';
import { app } from '../../src/app.js';

describe('Swagger Documentation & Health Endpoints (Integration)', () => {
  test('GET /health should return 200 and service health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('service is running');
  });

  test('GET /api/docs/ should serve the Swagger UI interface', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });
});
