import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineFeedService } from './offline-feed.service.js';
import { StorageService } from '../storage/indexeddb.js';

describe('OfflineFeedService', () => {
  let storage: StorageService;
  let feedService: OfflineFeedService;

  beforeEach(async () => {
    storage = new StorageService();
    feedService = new OfflineFeedService(storage);

    // Seed mock content into storage
    await storage.savePackageData(
      {
        packageId: 'jlpt_n5',
        jlptLevel: 'N5',
        title: 'N5 Package',
        description: 'Test',
        totalKanji: 2,
        totalVocabulary: 1,
        totalGrammar: 1,
        totalQuestions: 1,
        version: 1,
        sizeEstimateBytes: 2000,
        updatedAt: new Date().toISOString(),
      },
      [
        {
          id: 1,
          character: '日',
          hanViet: 'NHẬT',
          onyomi: 'ニチ',
          kunyomi: 'ひ',
          strokeCount: 4,
          meaningVi: 'Mặt trời',
          jlptLevels: ['N5'],
          examples: [],
        },
        {
          id: 2,
          character: '月',
          hanViet: 'NGUYỆT',
          onyomi: 'ゲツ',
          kunyomi: 'つき',
          strokeCount: 4,
          meaningVi: 'Mặt trăng',
          jlptLevels: ['N5'],
          examples: [],
        },
      ],
      [
        {
          id: 1,
          word: '日本',
          reading: 'にほん',
          romaji: 'nihon',
          partOfSpeech: 'noun',
          meaningVi: 'Nhật Bản',
          jlptLevels: ['N5'],
          kanjiIds: [1],
          examples: [],
        },
      ],
      [
        {
          id: 1,
          title: '〜は〜です',
          structure: 'N1 は N2 です',
          meaningVi: 'N1 là N2',
          jlptLevels: ['N5'],
          sentences: [],
        },
      ],
      [
        {
          id: 1,
          questionType: 'MULTIPLE_CHOICE',
          prompt: 'Chọn cách đọc đúng của 日',
          explanation: 'Chữ 日 đọc là に',
          itemType: 'KANJI',
          itemId: 1,
          options: [
            { id: 1, content: 'に', isCorrect: true },
            { id: 2, content: 'つき', isCorrect: false },
          ],
        },
      ]
    );
  });

  it('should generate offline feed with cards and sanitize question options', async () => {
    const feed = await feedService.generateOfflineFeed({
      limit: 5,
      jlpt: 'N5',
      contentType: 'ALL',
    });

    expect(feed.isOffline).toBe(true);
    expect(feed.items.length).toBeGreaterThan(0);

    // Verify questions have NO isCorrect exposed
    const questions = feed.items.filter((c) => c.cardType === 'QUESTION');
    for (const q of questions) {
      const qContent = q.content as { options?: Array<{ id: number; content: string; isCorrect?: boolean }> };
      if (qContent.options) {
        for (const opt of qContent.options) {
          expect(opt.isCorrect).toBeUndefined();
        }
      }
    }
  });

  it('should respect Anti-Repetition by excluding currentCardIds', async () => {
    const feed = await feedService.generateOfflineFeed({
      limit: 5,
      currentCardIds: ['kanji_1'],
      jlpt: 'N5',
    });

    const cardIds = feed.items.map((c) => c.cardId);
    expect(cardIds).not.toContain('kanji_1');
  });

  it('should accurately grade offline questions', async () => {
    // Correct answer
    const correctResult = await feedService.gradeQuestionOffline(1, 1);
    expect(correctResult.isCorrect).toBe(true);
    expect(correctResult.expEarned).toBe(10);
    expect(correctResult.correctOptionId).toBe(1);

    // Incorrect answer
    const incorrectResult = await feedService.gradeQuestionOffline(1, 2);
    expect(incorrectResult.isCorrect).toBe(false);
    expect(incorrectResult.expEarned).toBe(0);
  });

  it('should calculate offline SRS progression correctly', () => {
    const knownResult = feedService.calculateOfflineSrs(0, 'SWIPE_RIGHT_KNOWN');
    expect(knownResult.newStage).toBe(1);
    expect(knownResult.expEarned).toBe(5);

    const reviewResult = feedService.calculateOfflineSrs(3, 'SWIPE_LEFT_AGAIN');
    expect(reviewResult.newStage).toBe(1);
    expect(reviewResult.expEarned).toBe(1);
  });
});
