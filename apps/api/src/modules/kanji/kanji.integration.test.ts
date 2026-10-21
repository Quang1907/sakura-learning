import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { jwtHelper } from '../auth/jwt.helper.js';

describe('Kanji Module Integration Tests (Supertest)', () => {
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

  describe('Public Kanji Retrieval (/api/v1/kanji)', () => {
    it('GET /api/v1/kanji should return paginated Kanji list with standard meta envelope', async () => {
      const res = await request(app).get('/api/v1/kanji');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.page).toBe('number');
    });

    it('GET /api/v1/kanji?jlpt=N5 should filter Kanji by JLPT level', async () => {
      const res = await request(app).get('/api/v1/kanji?jlpt=N5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const item of res.body.data) {
        expect(item.jlptLevels).toContain('N5');
      }
    });

    it('GET /api/v1/kanji?search=NHẬT should search Kanji by Han-Viet reading', async () => {
      const res = await request(app).get('/api/v1/kanji?search=NHẬT');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].character).toBe('日');
    });

    it('GET /api/v1/kanji/:id should return detailed Kanji with examples', async () => {
      const res = await request(app).get('/api/v1/kanji/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.character).toBe('日');
      expect(res.body.data.hanViet).toBe('NHẬT');
      expect(Array.isArray(res.body.data.examples)).toBe(true);
    });

    it('GET /api/v1/kanji/:id should return 404 when Kanji does not exist', async () => {
      const res = await request(app).get('/api/v1/kanji/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('KANJI_NOT_FOUND');
    });

    it('GET /api/v1/kanji/:id should return 400 when ID is not an integer', async () => {
      const res = await request(app).get('/api/v1/kanji/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Admin Kanji Management (/api/v1/admin/kanji)', () => {
    it('POST /api/v1/admin/kanji should return 401 Unauthorized when missing token', async () => {
      const res = await request(app).post('/api/v1/admin/kanji').send({
        character: '火',
        hanViet: 'HỎA',
        strokeCount: 4,
        meaningVi: 'Lửa',
        jlptLevels: ['N5'],
      });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/admin/kanji should return 403 Forbidden when standard USER attempts to create', async () => {
      const res = await request(app)
        .post('/api/v1/admin/kanji')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          character: '火',
          hanViet: 'HỎA',
          strokeCount: 4,
          meaningVi: 'Lửa',
          jlptLevels: ['N5'],
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/admin/kanji should create new Kanji with 201 Created when ADMIN calls', async () => {
      const newKanji = {
        character: '金',
        hanViet: 'KIM',
        onyomi: 'キン, コン',
        kunyomi: 'かね, かな-',
        strokeCount: 8,
        radical: '金',
        meaningVi: 'Vàng, tiền, ngày thứ Sáu',
        jlptLevels: ['N5'],
        examples: [
          {
            word: '金曜日',
            reading: 'きんようび',
            meaningVi: 'Thứ Sáu',
            sentenceJp: '金曜日に映画を見ます。',
            sentenceVi: 'Tôi xem phim vào thứ Sáu.',
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/admin/kanji')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newKanji);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.character).toBe('金');
      expect(res.body.data.hanViet).toBe('KIM');
      expect(res.body.data.examples).toHaveLength(1);
    });

    it('POST /api/v1/admin/kanji should return 409 Conflict when creating existing character', async () => {
      const duplicateKanji = {
        character: '日', // Already exists
        hanViet: 'NHẬT',
        strokeCount: 4,
        meaningVi: 'Mặt trời',
        jlptLevels: ['N5'],
      };

      const res = await request(app)
        .post('/api/v1/admin/kanji')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateKanji);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_KANJI');
    });

    it('PUT /api/v1/admin/kanji/:id should update Kanji with 200 OK', async () => {
      const res = await request(app)
        .put('/api/v1/admin/kanji/3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          meaningVi: 'Cây, gỗ (đã cập nhật nghĩa)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meaningVi).toContain('đã cập nhật nghĩa');
    });

    it('DELETE /api/v1/admin/kanji/:id should soft delete Kanji with 200 OK', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/kanji/4')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
