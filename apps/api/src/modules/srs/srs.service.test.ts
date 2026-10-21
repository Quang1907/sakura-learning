import { describe, it, expect } from 'vitest';
import { SrsService } from './srs.service.js';

describe('SrsService (Spaced Repetition System)', () => {
  const service = new SrsService();
  const fixedBaseDate = new Date('2026-10-21T10:00:00.000Z');

  describe('Stage Interval Mapping', () => {
    it('should return exact interval hours for all stages 1 through 8', () => {
      expect(service.getIntervalHoursForStage(1)).toBe(4);
      expect(service.getIntervalHoursForStage(2)).toBe(8);
      expect(service.getIntervalHoursForStage(3)).toBe(24);
      expect(service.getIntervalHoursForStage(4)).toBe(72);
      expect(service.getIntervalHoursForStage(5)).toBe(168);
      expect(service.getIntervalHoursForStage(6)).toBe(336);
      expect(service.getIntervalHoursForStage(7)).toBe(720);
      expect(service.getIntervalHoursForStage(8)).toBe(2880);
      expect(service.getIntervalHoursForStage(0)).toBe(0);
      expect(service.getIntervalHoursForStage(99)).toBe(0);
    });
  });

  describe('Promoting Stages on Positive Actions', () => {
    it('TC-SRS-04: should promote stage 0 to 1 with 4 hours interval on SWIPE_RIGHT_KNOWN', () => {
      const result = service.calculateNextReview(0, 'SWIPE_RIGHT_KNOWN', 2.5, fixedBaseDate);

      expect(result.previousStage).toBe(0);
      expect(result.newStage).toBe(1);
      expect(result.intervalHours).toBe(4);
      expect(result.isPromoted).toBe(true);
      expect(result.isMastered).toBe(false);
      expect(result.expEarned).toBe(5);
      expect(result.easeFactor).toBe(2.6);

      const expectedReview = new Date(fixedBaseDate.getTime() + 4 * 3600 * 1000);
      expect(result.nextReviewAt.toISOString()).toBe(expectedReview.toISOString());
    });

    it('should award 10 EXP and promote on ANSWER_CORRECT', () => {
      const result = service.calculateNextReview(2, 'ANSWER_CORRECT', 2.5, fixedBaseDate);

      expect(result.previousStage).toBe(2);
      expect(result.newStage).toBe(3);
      expect(result.intervalHours).toBe(24);
      expect(result.expEarned).toBe(10);
      expect(result.isPromoted).toBe(true);
      expect(result.isMastered).toBe(false);
    });

    it('should reach Mastered (Stage 8) when promoting from Stage 7', () => {
      const result = service.calculateNextReview(7, 'SWIPE_RIGHT_KNOWN', 2.5, fixedBaseDate);

      expect(result.newStage).toBe(8);
      expect(result.intervalHours).toBe(2880);
      expect(result.isMastered).toBe(true);
      expect(result.isPromoted).toBe(true);
    });

    it('should cap at Stage 8 when already at Stage 8', () => {
      const result = service.calculateNextReview(8, 'SWIPE_RIGHT_KNOWN', 2.8, fixedBaseDate);

      expect(result.newStage).toBe(8);
      expect(result.isMastered).toBe(true);
      expect(result.isPromoted).toBe(false);
    });

    it('should clamp easeFactor at MAX_EASE_FACTOR (3.0)', () => {
      const result = service.calculateNextReview(5, 'SWIPE_RIGHT_KNOWN', 3.0, fixedBaseDate);
      expect(result.easeFactor).toBe(3.0);
    });
  });

  describe('Demoting Stages on Negative Actions', () => {
    it('TC-SRS-05: should demote stage 4 to 2 with 4 hours review on SWIPE_LEFT_AGAIN', () => {
      const result = service.calculateNextReview(4, 'SWIPE_LEFT_AGAIN', 2.5, fixedBaseDate);

      expect(result.previousStage).toBe(4);
      expect(result.newStage).toBe(2);
      expect(result.intervalHours).toBe(4);
      expect(result.isPromoted).toBe(false);
      expect(result.isMastered).toBe(false);
      expect(result.expEarned).toBe(0);
      expect(result.easeFactor).toBe(2.3);

      const expectedReview = new Date(fixedBaseDate.getTime() + 4 * 3600 * 1000);
      expect(result.nextReviewAt.toISOString()).toBe(expectedReview.toISOString());
    });

    it('should demote stage 2 to 1 on ANSWER_INCORRECT', () => {
      const result = service.calculateNextReview(2, 'ANSWER_INCORRECT', 2.5, fixedBaseDate);

      expect(result.newStage).toBe(1);
      expect(result.intervalHours).toBe(4);
      expect(result.expEarned).toBe(0);
      expect(result.isPromoted).toBe(false);
    });

    it('should not demote below stage 1 when currentStage is 1', () => {
      const result = service.calculateNextReview(1, 'SWIPE_LEFT_AGAIN', 2.5, fixedBaseDate);

      expect(result.newStage).toBe(1);
      expect(result.intervalHours).toBe(4);
    });

    it('should stay at stage 0 when currentStage is 0 on SWIPE_LEFT_AGAIN', () => {
      const result = service.calculateNextReview(0, 'SWIPE_LEFT_AGAIN', 2.5, fixedBaseDate);

      expect(result.newStage).toBe(0);
      expect(result.intervalHours).toBe(4);
    });

    it('should clamp easeFactor at MIN_EASE_FACTOR (1.3)', () => {
      const result = service.calculateNextReview(3, 'SWIPE_LEFT_AGAIN', 1.4, fixedBaseDate);
      expect(result.easeFactor).toBe(1.3);

      const resultAlreadyMin = service.calculateNextReview(3, 'SWIPE_LEFT_AGAIN', 1.3, fixedBaseDate);
      expect(resultAlreadyMin.easeFactor).toBe(1.3);
    });
  });

  describe('Review Due Checking', () => {
    it('should return false if nextReviewAt is null or undefined', () => {
      expect(service.isItemDueForReview(null, fixedBaseDate)).toBe(false);
      expect(service.isItemDueForReview(undefined, fixedBaseDate)).toBe(false);
    });

    it('should return true if nextReviewAt is in the past or exactly now', () => {
      const past = new Date(fixedBaseDate.getTime() - 1000);
      expect(service.isItemDueForReview(past, fixedBaseDate)).toBe(true);
      expect(service.isItemDueForReview(fixedBaseDate, fixedBaseDate)).toBe(true);
      expect(service.isItemDueForReview(past.toISOString(), fixedBaseDate)).toBe(true);
    });

    it('should return false if nextReviewAt is in the future', () => {
      const future = new Date(fixedBaseDate.getTime() + 1000 * 3600);
      expect(service.isItemDueForReview(future, fixedBaseDate)).toBe(false);
      expect(service.isItemDueForReview(future.toISOString(), fixedBaseDate)).toBe(false);
    });
  });
});
