import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { jwtHelper } from '../auth/jwt.helper.js';

describe('Offline Package & Batch Sync Integration Tests (Supertest)', () => {
  let userToken: string;

  beforeAll(() => {
    userToken = jwtHelper.generateAccessToken({
      userId: 2,
      email: 'user@sakura.app',
      role: 'USER',
    });
  });

  describe('Offline Content Packages API (/api/v1/packages)', () => {
    it('should return 401 Unauthorized when missing token on package download', async () => {
      const res = await request(app).get('/api/v1/packages/jlpt/N5');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when requesting invalid JLPT level package', async () => {
      const res = await request(app)
        .get('/api/v1/packages/jlpt/INVALID')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_JLPT_LEVEL');
    });

    it('should return 200 with full offline package data for JLPT N5', async () => {
      const res = await request(app)
        .get('/api/v1/packages/jlpt/N5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metadata).toBeDefined();
      expect(res.body.data.metadata.jlptLevel).toBe('N5');
      expect(res.body.data.metadata.packageId).toBe('jlpt_n5');
      expect(Array.isArray(res.body.data.kanji)).toBe(true);
      expect(Array.isArray(res.body.data.vocabulary)).toBe(true);
      expect(Array.isArray(res.body.data.grammar)).toBe(true);
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(typeof res.body.data.metadata.sizeEstimateBytes).toBe('number');
    });
  });

  describe('Batch Progress Synchronization API (/api/v1/progress/batch)', () => {
    it('should return 400 when events array is empty or missing', async () => {
      const res = await request(app)
        .post('/api/v1/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ events: [] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully sync a batch of offline events', async () => {
      const event1Id = '99999999-1111-4111-8111-111111111111';
      const event2Id = '99999999-2222-4222-8222-222222222222';

      const res = await request(app)
        .post('/api/v1/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          events: [
            {
              clientEventId: event1Id,
              itemType: 'KANJI',
              itemId: 1,
              action: 'SWIPE_RIGHT_KNOWN',
              metadata: { timeSpentMs: 2000 },
            },
            {
              clientEventId: event2Id,
              itemType: 'VOCABULARY',
              itemId: 1,
              action: 'SWIPE_RIGHT_KNOWN',
              metadata: { timeSpentMs: 1800 },
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalProcessed).toBe(2);
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0].clientEventId).toBe(event1Id);
      expect(res.body.data.results[1].clientEventId).toBe(event2Id);
      expect(res.body.data.totalExpEarned).toBeGreaterThan(0);
    });

    it('should guarantee idempotency for duplicate batch sync submissions', async () => {
      const duplicateBatchEventId = '88888888-9999-4999-8999-999999999999';

      // First submission
      const res1 = await request(app)
        .post('/api/v1/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          events: [
            {
              clientEventId: duplicateBatchEventId,
              itemType: 'GRAMMAR',
              itemId: 1,
              action: 'SWIPE_RIGHT_KNOWN',
            },
          ],
        });
      expect(res1.status).toBe(200);
      const initialExp = res1.body.data.results[0].newTotalExp;

      // Duplicate submission
      const res2 = await request(app)
        .post('/api/v1/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          events: [
            {
              clientEventId: duplicateBatchEventId,
              itemType: 'GRAMMAR',
              itemId: 1,
              action: 'SWIPE_RIGHT_KNOWN',
            },
          ],
        });
      expect(res2.status).toBe(200);
      expect(res2.body.data.results[0].clientEventId).toBe(duplicateBatchEventId);
      expect(res2.body.data.results[0].newTotalExp).toBe(initialExp);
    });
  });
});
