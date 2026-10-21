import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { jwtHelper } from '../auth/jwt.helper.js';

describe('Vocabulary Module Integration Tests (Supertest)', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(() => {
    userToken = jwtHelper.generateAccessToken({
      userId: 2,
      email: 'user@sakura.app',
      role: 'USER',
    });

    adminToken = jwtHelper.generateAccessToken({
      userId: 1,
      email: 'admin@sakura.app',
      role: 'ADMIN',
    });
  });

  describe('Public Vocabulary Retrieval (/api/v1/vocabulary)', () => {
    it('GET /api/v1/vocabulary should return paginated Vocabulary list with meta', async () => {
      const res = await request(app).get('/api/v1/vocabulary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.page).toBe('number');
    });

    it('GET /api/v1/vocabulary?jlpt=N5 should filter Vocabulary by JLPT level', async () => {
      const res = await request(app).get('/api/v1/vocabulary?jlpt=N5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const item of res.body.data) {
        expect(item.jlptLevels).toContain('N5');
      }
    });

    it('GET /api/v1/vocabulary?search=nihon should search Vocabulary by reading/romaji', async () => {
      const res = await request(app).get('/api/v1/vocabulary?search=nihon');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].word).toBe('日本');
    });

    it('GET /api/v1/vocabulary/:id should return detailed Vocabulary with examples and linked kanji', async () => {
      const res = await request(app).get('/api/v1/vocabulary/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.word).toBe('日本');
      expect(res.body.data.reading).toBe('にほん');
      expect(Array.isArray(res.body.data.examples)).toBe(true);
    });

    it('GET /api/v1/vocabulary/:id should return 404 when Vocabulary does not exist', async () => {
      const res = await request(app).get('/api/v1/vocabulary/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VOCABULARY_NOT_FOUND');
    });

    it('GET /api/v1/vocabulary/:id should return 400 when ID is not an integer', async () => {
      const res = await request(app).get('/api/v1/vocabulary/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Admin Vocabulary Management (/api/v1/admin/vocabulary)', () => {
    it('POST /api/v1/admin/vocabulary should return 401 when missing token', async () => {
      const res = await request(app).post('/api/v1/admin/vocabulary').send({
        word: '友達',
        reading: 'ともだち',
        meaningVi: 'Bạn bè',
        jlptLevels: ['N5'],
      });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/admin/vocabulary should return 403 when regular USER attempts create', async () => {
      const res = await request(app)
        .post('/api/v1/admin/vocabulary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          word: '友達',
          reading: 'ともだち',
          meaningVi: 'Bạn bè',
          jlptLevels: ['N5'],
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/admin/vocabulary should successfully create new vocabulary when ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/vocabulary')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          word: '友達',
          reading: 'ともだち',
          romaji: 'tomodachi',
          meaningVi: 'Bạn bè',
          partOfSpeech: 'noun',
          jlptLevels: ['N5'],
          examples: [
            {
              sentenceJp: '彼は私の友達です。',
              sentenceVi: 'Anh ấy là bạn của tôi.',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.word).toBe('友達');
      expect(res.body.data.reading).toBe('ともだち');
      expect(res.body.data.examples.length).toBe(1);
    });

    it('PUT /api/v1/admin/vocabulary/:id should update existing vocabulary', async () => {
      const res = await request(app)
        .put('/api/v1/admin/vocabulary/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          meaningVi: 'Đất nước Nhật Bản (đã cập nhật)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meaningVi).toBe('Đất nước Nhật Bản (đã cập nhật)');
    });

    it('DELETE /api/v1/admin/vocabulary/:id should soft delete vocabulary', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/vocabulary/3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
