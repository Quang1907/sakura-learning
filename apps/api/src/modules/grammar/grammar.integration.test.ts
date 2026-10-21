import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { jwtHelper } from '../auth/jwt.helper.js';

describe('Grammar Module Integration Tests (Supertest)', () => {
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

  describe('Public Grammar Retrieval (/api/v1/grammar)', () => {
    it('GET /api/v1/grammar should return paginated Grammar list with meta', async () => {
      const res = await request(app).get('/api/v1/grammar');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.page).toBe('number');
    });

    it('GET /api/v1/grammar?jlpt=N5 should filter Grammar by JLPT level', async () => {
      const res = await request(app).get('/api/v1/grammar?jlpt=N5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const item of res.body.data) {
        expect(item.jlptLevels).toContain('N5');
      }
    });

    it('GET /api/v1/grammar?search=です should search Grammar by title/structure', async () => {
      const res = await request(app).get('/api/v1/grammar?search=です');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/grammar/:id should return detailed Grammar with sentences', async () => {
      const res = await request(app).get('/api/v1/grammar/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.title).toBe('〜は〜です');
      expect(Array.isArray(res.body.data.sentences)).toBe(true);
    });

    it('GET /api/v1/grammar/:id should return 404 when Grammar does not exist', async () => {
      const res = await request(app).get('/api/v1/grammar/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('GRAMMAR_NOT_FOUND');
    });

    it('GET /api/v1/grammar/:id should return 400 when ID is not an integer', async () => {
      const res = await request(app).get('/api/v1/grammar/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Admin Grammar Management (/api/v1/admin/grammar)', () => {
    it('POST /api/v1/admin/grammar should return 401 when missing token', async () => {
      const res = await request(app).post('/api/v1/admin/grammar').send({
        title: '〜も',
        structure: 'N + も',
        meaningVi: 'Cũng',
        jlptLevels: ['N5'],
      });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/admin/grammar should return 403 when standard USER attempts create', async () => {
      const res = await request(app)
        .post('/api/v1/admin/grammar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '〜も',
          structure: 'N + も',
          meaningVi: 'Cũng',
          jlptLevels: ['N5'],
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/admin/grammar should successfully create new grammar when ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/grammar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '〜も',
          structure: 'N + も',
          meaningVi: 'Cũng (trợ từ tương đương)',
          usageNotes: 'Thay thế trợ từ は hoặc が',
          jlptLevels: ['N5'],
          sentences: [
            {
              sentenceJp: '私もベトナム人です。',
              sentenceVi: 'Tôi cũng là người Việt Nam.',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('〜も');
      expect(res.body.data.sentences.length).toBe(1);
    });

    it('PUT /api/v1/admin/grammar/:id should update existing grammar', async () => {
      const res = await request(app)
        .put('/api/v1/admin/grammar/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          meaningVi: 'N1 là N2 (câu khẳng định lịch sự)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meaningVi).toBe('N1 là N2 (câu khẳng định lịch sự)');
    });

    it('DELETE /api/v1/admin/grammar/:id should soft delete grammar', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/grammar/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
