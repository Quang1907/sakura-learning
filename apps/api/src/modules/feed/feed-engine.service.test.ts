import { describe, it, expect } from 'vitest';
import { FeedEngineService, FeedCandidatePool } from './feed-engine.service.js';
import { FeedCardDto } from '@sakura/shared';

describe('FeedEngineService (Content Distribution & Feed Engine)', () => {
  const service = new FeedEngineService();

  // Helper to generate mock feed cards
  function createMockCard(id: string, type: FeedCardDto['cardType'], isReview = false): FeedCardDto {
    return {
      cardId: id,
      cardType: type,
      content: { sample: `Content for ${id}` },
      srsContext:
        type !== 'QUESTION'
          ? {
              isReview,
              stage: isReview ? 2 : 0,
            }
          : undefined,
    };
  }

  // Generate an abundant pool
  function createAbundantPool(): FeedCandidatePool {
    return {
      newItems: Array.from({ length: 20 }, (_, i) => createMockCard(`new_${i + 1}`, 'KANJI', false)),
      reviewItems: Array.from({ length: 15 }, (_, i) =>
        createMockCard(`review_${i + 1}`, 'KANJI', true),
      ),
      questionItems: Array.from({ length: 10 }, (_, i) =>
        createMockCard(`question_${i + 1}`, 'QUESTION'),
      ),
    };
  }

  describe('TC-SRS-01: 60/30/10 Content Distribution Ratio', () => {
    it('should assemble a feed of 10 items with 6 new (60%), 3 review (30%), 1 question (10%)', () => {
      const pool = createAbundantPool();
      const result = service.assembleFeed(pool, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.counts.total).toBe(10);
      expect(result.counts.newItems).toBe(6);
      expect(result.counts.reviewItems).toBe(3);
      expect(result.counts.questionItems).toBe(1);

      const newCount = result.items.filter((c) => c.cardId.startsWith('new_')).length;
      const reviewCount = result.items.filter((c) => c.cardId.startsWith('review_')).length;
      const questionCount = result.items.filter((c) => c.cardType === 'QUESTION').length;

      expect(newCount).toBe(6);
      expect(reviewCount).toBe(3);
      expect(questionCount).toBe(1);
    });
  });

  describe('TC-SRS-02: Anti-Repetition Rule', () => {
    it('should exclude any cards currently in the client buffer', () => {
      const pool = createAbundantPool();
      const clientBuffer = ['new_1', 'new_2', 'review_1', 'review_2', 'question_1'];

      const result = service.assembleFeed(pool, { limit: 10, currentCardIds: clientBuffer });

      expect(result.items).toHaveLength(10);
      expect(service.containsExcludedCards(result.items, clientBuffer)).toBe(false);

      for (const card of result.items) {
        expect(clientBuffer).not.toContain(card.cardId);
      }
    });

    it('should not include duplicate card IDs in the returned feed', () => {
      const pool = createAbundantPool();
      const result = service.assembleFeed(pool, { limit: 10 });

      const cardIds = result.items.map((c) => c.cardId);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(cardIds.length);
    });
  });

  describe('TC-SRS-03: Anti-Fatigue Rule', () => {
    it('should never place two questions consecutively', () => {
      const pool = createAbundantPool();
      // Test across multiple runs with different limits
      for (const limit of [5, 10, 15, 20]) {
        const result = service.assembleFeed(pool, { limit });
        expect(service.hasConsecutiveQuestions(result.items)).toBe(false);

        for (let i = 0; i < result.items.length - 1; i++) {
          if (result.items[i].cardType === 'QUESTION') {
            expect(result.items[i + 1].cardType).not.toBe('QUESTION');
          }
        }
      }
    });

    it('should never have consecutive questions even when question pool is heavily forced', () => {
      const pool: FeedCandidatePool = {
        newItems: [createMockCard('new_1', 'KANJI', false), createMockCard('new_2', 'KANJI', false)],
        reviewItems: [createMockCard('review_1', 'KANJI', true)],
        questionItems: Array.from({ length: 8 }, (_, i) =>
          createMockCard(`question_${i + 1}`, 'QUESTION'),
        ),
      };

      const result = service.assembleFeed(pool, { limit: 10 });
      expect(service.hasConsecutiveQuestions(result.items)).toBe(false);
    });
  });

  describe('Dynamic Fallback & Edge Cases', () => {
    it('should dynamically fill with new items if user has 0 review items (new learner)', () => {
      const pool: FeedCandidatePool = {
        newItems: Array.from({ length: 20 }, (_, i) => createMockCard(`new_${i + 1}`, 'KANJI', false)),
        reviewItems: [], // No due reviews yet
        questionItems: [createMockCard('question_1', 'QUESTION')],
      };

      const result = service.assembleFeed(pool, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.counts.reviewItems).toBe(0);
      expect(result.counts.newItems).toBe(9);
      expect(result.counts.questionItems).toBe(1);
      expect(service.hasConsecutiveQuestions(result.items)).toBe(false);
    });

    it('should dynamically fill if question pool is empty', () => {
      const pool: FeedCandidatePool = {
        newItems: Array.from({ length: 10 }, (_, i) => createMockCard(`new_${i + 1}`, 'KANJI', false)),
        reviewItems: Array.from({ length: 10 }, (_, i) =>
          createMockCard(`review_${i + 1}`, 'KANJI', true),
        ),
        questionItems: [], // No questions available
      };

      const result = service.assembleFeed(pool, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.counts.questionItems).toBe(0);
      expect(result.counts.newItems).toBe(7); // 6 + 1 deficit fallback
      expect(result.counts.reviewItems).toBe(3);
    });

    it('should handle small limits gracefully (e.g. limit = 5)', () => {
      const pool = createAbundantPool();
      const result = service.assembleFeed(pool, { limit: 5 });

      expect(result.items).toHaveLength(5);
      expect(service.hasConsecutiveQuestions(result.items)).toBe(false);
    });
  });
});
