import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthMiddleware } from './auth.middleware.js';
import { JwtHelper } from '../modules/auth/jwt.helper.js';

describe('Auth Middleware Integration Tests', () => {
  const secret = 'test_secret_for_vitest_auth_middleware_32_chars';
  const helper = new JwtHelper(secret);
  const { authenticate, requireRole } = createAuthMiddleware(helper);

  const testApp = express();
  testApp.use(express.json());

  // Protected route for all logged in users
  testApp.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
  });

  // Admin-only route
  testApp.get('/admin-only', authenticate, requireRole('ADMIN'), (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome admin' });
  });

  const userToken = helper.generateAccessToken({
    userId: 2,
    email: 'user@sakura.app',
    role: 'USER',
  });

  const adminToken = helper.generateAccessToken({
    userId: 1,
    email: 'admin@sakura.app',
    role: 'ADMIN',
  });

  it('should return 401 when Authorization header is missing', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid_token_xyz');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should allow valid user token on protected route', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('user@sakura.app');
  });

  it('should return 403 when standard user attempts to access admin-only route', async () => {
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow admin user to access admin-only route', async () => {
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Welcome admin');
  });
});
