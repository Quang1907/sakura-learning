import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { closeDatabasePool } from '../../config/database.js';

describe('Health & Routing Integration Tests (Supertest)', () => {
  afterAll(async () => {
    await closeDatabasePool();
  });

  it('GET /api/v1/health should return 200 with standard response envelope', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toMatch(/healthy|degraded/);
    expect(res.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.data.database).toBeDefined();
    expect(res.body.meta.timestamp).toBeDefined();
  });

  it('GET /api/v1/non-existent-route should return 404 with error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('không tồn tại');
  });
});
