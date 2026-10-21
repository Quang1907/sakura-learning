import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { jwtHelper } from './auth/jwt.helper.js';

describe('Core Learning Engine Integration Tests (Supertest)', () => {
  let userToken: string;

  beforeAll(() => {
    userToken = jwtHelper.generateAccessToken({
      userId: 2,
      email: 'user@sakura.app',
      role: 'USER',
    });
  });

  describe('Swipe Feed API (/api/v1/feed)', () => {
    it('should return 401 Unauthorized when Authorization header is missing', async () => {
      const res = await request(app).post('/api/v1/feed').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with feed cards and remainingCount', async () => {
      const res = await request(app)
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ limit: 5, jlpt: 'N5' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(typeof res.body.data.remainingCount).toBe('number');
    });

    it('should exclude cards currently in client buffer (Anti-Repetition)', async () => {
      const res = await request(app)
        .post('/api/v1/feed/next')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentCardIds: ['kanji_1'],
          limit: 5,
        });

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.items.map((i: { cardId: string }) => i.cardId);
      expect(returnedIds).not.toContain('kanji_1');
    });

    it('should never expose isCorrect or answers in feed question options', async () => {
      const res = await request(app)
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ limit: 10 });

      expect(res.status).toBe(200);
      const questionCards = res.body.data.items.filter(
        (c: { cardType: string }) => c.cardType === 'QUESTION',
      );

      for (const q of questionCards) {
        expect(q.content.explanation).toBeUndefined();
        expect(q.content.acceptableAnswers).toBeUndefined();
        if (q.content.options) {
          for (const opt of q.content.options) {
            expect(opt.isCorrect).toBeUndefined();
          }
        }
      }
    });
  });

  describe('Learning Progress & Events API (/api/v1/progress)', () => {
    it('should return 400 when progress payload fails validation', async () => {
      const res = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: 'not-a-uuid',
          action: 'INVALID',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should record SWIPE_RIGHT_KNOWN and promote to stage 1', async () => {
      const eventId = '11111111-2222-4333-8444-555555555555';
      const res = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: eventId,
          itemType: 'KANJI',
          itemId: 1,
          action: 'SWIPE_RIGHT_KNOWN',
          metadata: { timeSpentMs: 2500 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recorded).toBe(true);
      expect(res.body.data.srsStage).toBe(1);
      expect(res.body.data.expEarned).toBe(5);
      expect(res.body.data.nextReviewAt).toBeDefined();
    });

    it('should handle duplicate clientEventId idempotently without re-awarding EXP', async () => {
      const duplicateEventId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

      // First call
      const res1 = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: duplicateEventId,
          itemType: 'KANJI',
          itemId: 2,
          action: 'SWIPE_RIGHT_KNOWN',
        });
      expect(res1.status).toBe(200);
      const initialExp = res1.body.data.newTotalExp;

      // Duplicate call with exact same clientEventId
      const res2 = await request(app)
        .post('/api/v1/progress/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: duplicateEventId,
          itemType: 'KANJI',
          itemId: 2,
          action: 'SWIPE_RIGHT_KNOWN',
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data.recorded).toBe(true);
      expect(res2.body.data.newTotalExp).toBe(initialExp);
    });

    it('should return user stats via GET /api/v1/progress/stats', async () => {
      const res = await request(app)
        .get('/api/v1/progress/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalMastered).toBe('number');
      expect(typeof res.body.data.totalLearning).toBe('number');
      expect(res.body.data.byJlpt).toBeDefined();
    });
  });

  describe('Question Submission API (/api/v1/questions/:id/submit)', () => {
    it('should return 400 when question ID is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/questions/invalid-id/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          selectedOptionId: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUESTION_ID');
    });

    it('should return 404 when question does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/questions/9999/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          selectedOptionId: 1,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('QUESTION_NOT_FOUND');
    });

    it('should grade correct answer on Question 1, award 10 EXP and return explanation', async () => {
      const res = await request(app)
        .post('/api/v1/questions/1/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: '88888888-4444-4444-8888-121212121212',
          selectedOptionId: 1, // Option 1: "に" (Correct)
          durationMs: 3200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCorrect).toBe(true);
      expect(res.body.data.correctOptionId).toBe(1);
      expect(res.body.data.expEarned).toBe(10);
      expect(res.body.data.explanation).toContain('Nihon');
      expect(res.body.data.srsUpdated).toBe(true);
    });

    it('should grade incorrect answer on Question 1 and award 0 EXP', async () => {
      const res = await request(app)
        .post('/api/v1/questions/1/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientEventId: '77777777-3333-4444-8888-121212121212',
          selectedOptionId: 2, // Option 2: "つき" (Incorrect)
          durationMs: 4100,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCorrect).toBe(false);
      expect(res.body.data.expEarned).toBe(0);
      expect(res.body.data.correctOptionId).toBe(1);
    });
  });
});
