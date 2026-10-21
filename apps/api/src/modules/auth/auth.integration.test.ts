import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { jwtHelper } from './jwt.helper.js';

describe('Auth Module & User Isolation Integration Tests (Supertest)', () => {
  describe('Authentication Flow (/api/v1/auth)', () => {
    it('POST /api/v1/auth/login should authenticate seed user and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'user@sakura.app',
        password: 'User@Sakura2026!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('user@sakura.app');
      expect(res.body.data.user.role).toBe('USER');
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.length).toBeGreaterThan(20);
    });

    it('POST /api/v1/auth/login should return 401 for incorrect password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'user@sakura.app',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
    });

    it('POST /api/v1/auth/login should return 400 when validation fails', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'not-an-email',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/register should create new user account and return tokens', async () => {
      const uniqueEmail = `test_user_${Date.now()}@sakura.app`;
      const res = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        password: 'StrongPassword123!',
        displayName: 'Học Viên Mới',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.user.displayName).toBe('Học Viên Mới');
      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('POST /api/v1/auth/register should return 409 if email already exists', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'user@sakura.app',
        password: 'AnotherPassword123!',
        displayName: 'Trùng Lặp',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('GET /api/v1/auth/me should return authenticated user profile', async () => {
      const userToken = jwtHelper.generateAccessToken({
        userId: 2,
        email: 'user@sakura.app',
        role: 'USER',
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('user@sakura.app');
      expect(res.body.data.role).toBe('USER');
    });

    it('GET /api/v1/auth/me should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Progress Isolation & Authorization Matrix', () => {
    it('Flow 4: Account A and Account B have completely isolated progress and stats', async () => {
      // 1. User A (userId: 201)
      const tokenA = jwtHelper.generateAccessToken({
        userId: 201,
        email: 'usera@sakura.app',
        role: 'USER',
      });

      // 2. User B (userId: 202)
      const tokenB = jwtHelper.generateAccessToken({
        userId: 202,
        email: 'userb@sakura.app',
        role: 'USER',
      });

      // User A records an event and earns 5 EXP
      const eventResA = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          clientEventId: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
          itemType: 'KANJI',
          itemId: 1,
          action: 'SWIPE_RIGHT_KNOWN',
        });
      expect(eventResA.status).toBe(200);
      expect(eventResA.body.data.expEarned).toBe(5);
      const userAExp = eventResA.body.data.newTotalExp;
      expect(userAExp).toBeGreaterThanOrEqual(5);

      // User B inspects stats: must NOT reflect User A's progress
      const statsResB = await request(app)
        .get('/api/v1/progress/stats')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(statsResB.status).toBe(200);
      expect(statsResB.body.data.totalLearning).toBe(0);
      expect(statsResB.body.data.totalMastered).toBe(0);

      // User B records their own event
      const eventResB = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          clientEventId: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
          itemType: 'KANJI',
          itemId: 2,
          action: 'SWIPE_RIGHT_KNOWN',
        });
      expect(eventResB.status).toBe(200);
      expect(eventResB.body.data.expEarned).toBe(5);

      // User B now has 1 item in progress
      const updatedStatsB = await request(app)
        .get('/api/v1/progress/stats')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(updatedStatsB.body.data.totalLearning).toBe(1);
    });

    it('Flow 5: Regular USER cannot access Admin resources, only ADMIN is authorized', async () => {
      const userToken = jwtHelper.generateAccessToken({
        userId: 2,
        email: 'user@sakura.app',
        role: 'USER',
      });

      const adminToken = jwtHelper.generateAccessToken({
        userId: 1,
        email: 'admin@sakura.app',
        role: 'ADMIN',
      });

      // USER forbidden from creating Kanji
      const userKanjiRes = await request(app)
        .post('/api/v1/admin/kanji')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ character: '木', hanViet: 'MỘC', strokeCount: 4, meaningVi: 'Cây', jlptLevels: ['N5'] });
      expect(userKanjiRes.status).toBe(403);
      expect(userKanjiRes.body.error.code).toBe('FORBIDDEN');

      // USER forbidden from creating Vocabulary
      const userVocabRes = await request(app)
        .post('/api/v1/admin/vocabulary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ word: '水', reading: 'みず', partOfSpeech: 'noun', meaningVi: 'Nước', jlptLevels: ['N5'] });
      expect(userVocabRes.status).toBe(403);
      expect(userVocabRes.body.error.code).toBe('FORBIDDEN');

      // USER forbidden from creating Grammar
      const userGrammarRes = await request(app)
        .post('/api/v1/admin/grammar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '〜です', pattern: 'N + です', meaningVi: 'Là...', jlptLevel: 'N5' });
      expect(userGrammarRes.status).toBe(403);
      expect(userGrammarRes.body.error.code).toBe('FORBIDDEN');

      // ADMIN allowed to create resources
      const adminKanjiRes = await request(app)
        .post('/api/v1/admin/kanji')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          character: '土',
          hanViet: 'THỔ',
          strokeCount: 3,
          meaningVi: 'Đất, ngày thứ Bảy',
          jlptLevels: ['N5'],
        });
      expect(adminKanjiRes.status).toBe(201);
    });
  });
});
