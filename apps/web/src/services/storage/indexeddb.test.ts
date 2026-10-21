import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from './indexeddb.js';

describe('StorageService (IndexedDB & Local Storage Layer)', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService();
  });

  it('should save and retrieve package metadata', async () => {
    const metadata = {
      packageId: 'jlpt_n5',
      jlptLevel: 'N5' as const,
      title: 'JLPT N5 Core Package',
      description: 'Core N5 learning data',
      totalKanji: 1,
      totalVocabulary: 1,
      totalGrammar: 1,
      totalQuestions: 1,
      version: 1,
      sizeEstimateBytes: 2400,
      updatedAt: new Date().toISOString(),
    };

    const kanji = [
      {
        id: 1,
        character: '日',
        hanViet: 'NHẬT',
        onyomi: 'ニチ',
        kunyomi: 'ひ',
        strokeCount: 4,
        meaningVi: 'Mặt trời',
        jlptLevels: ['N5' as const],
        examples: [],
      },
    ];

    await storage.savePackageData(metadata, kanji, [], [], []);

    const isDownloaded = await storage.isPackageDownloaded('jlpt_n5');
    expect(isDownloaded).toBe(true);

    const pkgs = await storage.getPackages();
    expect(pkgs).toHaveLength(1);
    expect(pkgs[0]?.packageId).toBe('jlpt_n5');

    const retrievedKanji = await storage.getOfflineKanji('N5');
    expect(retrievedKanji).toHaveLength(1);
    expect(retrievedKanji[0]?.character).toBe('日');
  });

  it('should enqueue and retrieve pending outbox events', async () => {
    const eventId = 'outbox-test-uuid-1';
    await storage.enqueueOutboxEvent({
      clientEventId: eventId,
      userId: 2,
      itemType: 'KANJI',
      itemId: 1,
      action: 'SWIPE_RIGHT_KNOWN',
      createdAt: new Date().toISOString(),
      metadata: { timeSpentMs: 1500 },
    });

    const pending = await storage.getPendingOutboxEvents();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.clientEventId).toBe(eventId);
    expect(pending[0]?.syncStatus).toBe('PENDING');

    const count = await storage.getOutboxCount();
    expect(count).toBe(1);

    // Remove acknowledged event
    await storage.removeOutboxEvents([eventId]);
    const afterRemoveCount = await storage.getOutboxCount();
    expect(afterRemoveCount).toBe(0);
  });

  it('should save and retrieve local learning progress', async () => {
    await storage.saveLocalProgress({
      key: 'KANJI_1',
      itemType: 'KANJI',
      itemId: 1,
      status: 'LEARNING',
      srsStage: 2,
      easeFactor: 2.5,
      nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
      totalViews: 3,
      totalCorrect: 2,
      totalIncorrect: 1,
      lastStudiedAt: new Date().toISOString(),
    });

    const prog = await storage.getLocalProgress('KANJI', 1);
    expect(prog).not.toBeNull();
    expect(prog?.srsStage).toBe(2);
    expect(prog?.totalViews).toBe(3);
  });

  it('should clear content cache while preserving outbox and local progress', async () => {
    // 1. Add package and outbox event
    await storage.savePackageData(
      {
        packageId: 'jlpt_n5',
        jlptLevel: 'N5',
        title: 'JLPT N5',
        description: 'Test',
        totalKanji: 0,
        totalVocabulary: 0,
        totalGrammar: 0,
        totalQuestions: 0,
        version: 1,
        sizeEstimateBytes: 100,
        updatedAt: new Date().toISOString(),
      },
      [],
      [],
      [],
      []
    );

    await storage.enqueueOutboxEvent({
      clientEventId: 'preserve-me',
      userId: 2,
      itemType: 'VOCABULARY',
      itemId: 2,
      action: 'SWIPE_RIGHT_KNOWN',
      createdAt: new Date().toISOString(),
    });

    // 2. Clear content cache
    await storage.clearContentCache();

    // Packages should be gone
    const isDownloaded = await storage.isPackageDownloaded('jlpt_n5');
    expect(isDownloaded).toBe(false);

    // Outbox should be preserved
    const outboxCount = await storage.getOutboxCount();
    expect(outboxCount).toBe(1);
  });
});
