import {
  KanjiDetailDto,
  VocabularyDetailDto,
  GrammarDetailDto,
  QuestionDto,
  OfflinePackageMetadataDto,
  JlptLevel,
  ItemType,
  SwipeAction,
} from '@sakura/shared';

export interface LocalProgressRecord {
  key: string; // `${itemType}_${itemId}`
  itemType: ItemType;
  itemId: number;
  status: 'NEW' | 'LEARNING' | 'REVIEW_DUE' | 'MASTERED';
  srsStage: number;
  easeFactor: number;
  nextReviewAt: string | null;
  totalViews: number;
  totalCorrect: number;
  totalIncorrect: number;
  lastStudiedAt: string;
}

export interface OutboxEventRecord {
  clientEventId: string;
  userId: number;
  itemType: ItemType;
  itemId: number;
  action: SwipeAction;
  metadata?: {
    timeSpentMs?: number;
    offlineTimestamp?: string;
  };
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

const DB_NAME = 'sakura_swipe_offline_db';
const DB_VERSION = 1;

export class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = {
    packages: new Map<string, OfflinePackageMetadataDto>(),
    kanji: new Map<number, KanjiDetailDto>(),
    vocabulary: new Map<number, VocabularyDetailDto>(),
    grammar: new Map<number, GrammarDetailDto>(),
    questions: new Map<number, QuestionDto>(),
    localProgress: new Map<string, LocalProgressRecord>(),
    outbox: new Map<string, OutboxEventRecord>(),
    metadata: new Map<string, unknown>(),
  };

  private isIdbAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.isIdbAvailable()) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Packages store
        if (!db.objectStoreNames.contains('packages')) {
          const store = db.createObjectStore('packages', { keyPath: 'packageId' });
          store.createIndex('jlptLevel', 'jlptLevel', { unique: false });
        }

        // 2. Kanji store
        if (!db.objectStoreNames.contains('kanji')) {
          const store = db.createObjectStore('kanji', { keyPath: 'id' });
          store.createIndex('character', 'character', { unique: true });
        }

        // 3. Vocabulary store
        if (!db.objectStoreNames.contains('vocabulary')) {
          const store = db.createObjectStore('vocabulary', { keyPath: 'id' });
          store.createIndex('word', 'word', { unique: false });
          store.createIndex('reading', 'reading', { unique: false });
        }

        // 4. Grammar store
        if (!db.objectStoreNames.contains('grammar')) {
          const store = db.createObjectStore('grammar', { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
        }

        // 5. Questions store
        if (!db.objectStoreNames.contains('questions')) {
          const store = db.createObjectStore('questions', { keyPath: 'id' });
          store.createIndex('questionType', 'questionType', { unique: false });
        }

        // 6. Local progress store
        if (!db.objectStoreNames.contains('local_progress')) {
          const store = db.createObjectStore('local_progress', { keyPath: 'key' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('nextReviewAt', 'nextReviewAt', { unique: false });
        }

        // 7. Outbox events store
        if (!db.objectStoreNames.contains('outbox_events')) {
          const store = db.createObjectStore('outbox_events', { keyPath: 'clientEventId' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 8. App metadata store
        if (!db.objectStoreNames.contains('app_metadata')) {
          db.createObjectStore('app_metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by another tab');
      };
    });

    return this.dbPromise;
  }

  // --- Content Packages ---

  public async savePackageData(
    metadata: OfflinePackageMetadataDto,
    kanji: KanjiDetailDto[],
    vocabulary: VocabularyDetailDto[],
    grammar: GrammarDetailDto[],
    questions: QuestionDto[],
  ): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(
          ['packages', 'kanji', 'vocabulary', 'grammar', 'questions'],
          'readwrite',
        );

        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();

        const pkgStore = tx.objectStore('packages');
        pkgStore.put(metadata);

        const kanjiStore = tx.objectStore('kanji');
        for (const k of kanji) kanjiStore.put(k);

        const vocabStore = tx.objectStore('vocabulary');
        for (const v of vocabulary) vocabStore.put(v);

        const grammarStore = tx.objectStore('grammar');
        for (const g of grammar) grammarStore.put(g);

        const qStore = tx.objectStore('questions');
        for (const q of questions) qStore.put(q);
      });
    } catch {
      // Memory fallback
      this.memoryFallback.packages.set(metadata.packageId, metadata);
      for (const k of kanji) this.memoryFallback.kanji.set(k.id, k);
      for (const v of vocabulary) this.memoryFallback.vocabulary.set(v.id, v);
      for (const g of grammar) this.memoryFallback.grammar.set(g.id, g);
      for (const q of questions) this.memoryFallback.questions.set(q.id, q);
    }
  }

  public async getPackages(): Promise<OfflinePackageMetadataDto[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('packages', 'readonly');
        const store = tx.objectStore('packages');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.packages.values());
    }
  }

  public async isPackageDownloaded(packageId: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction('packages', 'readonly');
        const store = tx.objectStore('packages');
        const req = store.get(packageId);
        req.onsuccess = () => resolve(Boolean(req.result));
        req.onerror = () => resolve(false);
      });
    } catch {
      return this.memoryFallback.packages.has(packageId);
    }
  }

  public async deletePackage(packageId: string, jlptLevel: JlptLevel): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(
          ['packages', 'kanji', 'vocabulary', 'grammar', 'questions'],
          'readwrite',
        );
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();

        tx.objectStore('packages').delete(packageId);

        // Filter and delete items for this JLPT level
        const kanjiStore = tx.objectStore('kanji');
        const kReq = kanjiStore.getAll();
        kReq.onsuccess = () => {
          for (const item of (kReq.result as KanjiDetailDto[]) || []) {
            if (item.jlptLevels.includes(jlptLevel)) {
              kanjiStore.delete(item.id);
            }
          }
        };

        const vocabStore = tx.objectStore('vocabulary');
        const vReq = vocabStore.getAll();
        vReq.onsuccess = () => {
          for (const item of (vReq.result as VocabularyDetailDto[]) || []) {
            if (item.jlptLevels.includes(jlptLevel)) {
              vocabStore.delete(item.id);
            }
          }
        };

        const grammarStore = tx.objectStore('grammar');
        const gReq = grammarStore.getAll();
        gReq.onsuccess = () => {
          for (const item of (gReq.result as GrammarDetailDto[]) || []) {
            if (item.jlptLevels.includes(jlptLevel)) {
              grammarStore.delete(item.id);
            }
          }
        };
      });
    } catch {
      this.memoryFallback.packages.delete(packageId);
    }
  }

  // --- Content Queries for Offline Feed ---

  public async getOfflineKanji(jlpt?: JlptLevel): Promise<KanjiDetailDto[]> {
    try {
      const db = await this.getDb();
      const all: KanjiDetailDto[] = await new Promise((res, rej) => {
        const tx = db.transaction('kanji', 'readonly');
        const req = tx.objectStore('kanji').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      return jlpt ? all.filter((k) => k.jlptLevels.includes(jlpt)) : all;
    } catch {
      const list = Array.from(this.memoryFallback.kanji.values());
      return jlpt ? list.filter((k) => k.jlptLevels.includes(jlpt)) : list;
    }
  }

  public async getOfflineVocabulary(jlpt?: JlptLevel): Promise<VocabularyDetailDto[]> {
    try {
      const db = await this.getDb();
      const all: VocabularyDetailDto[] = await new Promise((res, rej) => {
        const tx = db.transaction('vocabulary', 'readonly');
        const req = tx.objectStore('vocabulary').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      return jlpt ? all.filter((v) => v.jlptLevels.includes(jlpt)) : all;
    } catch {
      const list = Array.from(this.memoryFallback.vocabulary.values());
      return jlpt ? list.filter((v) => v.jlptLevels.includes(jlpt)) : list;
    }
  }

  public async getOfflineGrammar(jlpt?: JlptLevel): Promise<GrammarDetailDto[]> {
    try {
      const db = await this.getDb();
      const all: GrammarDetailDto[] = await new Promise((res, rej) => {
        const tx = db.transaction('grammar', 'readonly');
        const req = tx.objectStore('grammar').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      return jlpt ? all.filter((g) => g.jlptLevels.includes(jlpt)) : all;
    } catch {
      const list = Array.from(this.memoryFallback.grammar.values());
      return jlpt ? list.filter((g) => g.jlptLevels.includes(jlpt)) : list;
    }
  }

  public async getOfflineQuestions(): Promise<QuestionDto[]> {
    try {
      const db = await this.getDb();
      return new Promise((res, rej) => {
        const tx = db.transaction('questions', 'readonly');
        const req = tx.objectStore('questions').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.questions.values());
    }
  }

  // --- Local Progress (SRS & Offline Mastery) ---

  public async getLocalProgress(itemType: ItemType, itemId: number): Promise<LocalProgressRecord | null> {
    const key = `${itemType}_${itemId}`;
    try {
      const db = await this.getDb();
      return new Promise((res) => {
        const tx = db.transaction('local_progress', 'readonly');
        const req = tx.objectStore('local_progress').get(key);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
    } catch {
      return this.memoryFallback.localProgress.get(key) || null;
    }
  }

  public async saveLocalProgress(progress: LocalProgressRecord): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((res, rej) => {
        const tx = db.transaction('local_progress', 'readwrite');
        tx.objectStore('local_progress').put(progress);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch {
      this.memoryFallback.localProgress.set(progress.key, progress);
    }
  }

  public async getAllLocalProgress(): Promise<LocalProgressRecord[]> {
    try {
      const db = await this.getDb();
      return new Promise((res, rej) => {
        const tx = db.transaction('local_progress', 'readonly');
        const req = tx.objectStore('local_progress').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.localProgress.values());
    }
  }

  // --- Outbox Events (Offline Learning Synchronization) ---

  public async enqueueOutboxEvent(event: Omit<OutboxEventRecord, 'syncStatus' | 'retryCount'>): Promise<void> {
    const record: OutboxEventRecord = {
      ...event,
      syncStatus: 'PENDING',
      retryCount: 0,
    };

    try {
      const db = await this.getDb();
      await new Promise<void>((res, rej) => {
        const tx = db.transaction('outbox_events', 'readwrite');
        tx.objectStore('outbox_events').put(record);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch {
      this.memoryFallback.outbox.set(record.clientEventId, record);
    }
  }

  public async getPendingOutboxEvents(limit = 50): Promise<OutboxEventRecord[]> {
    try {
      const db = await this.getDb();
      const all: OutboxEventRecord[] = await new Promise((res, rej) => {
        const tx = db.transaction('outbox_events', 'readonly');
        const req = tx.objectStore('outbox_events').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      return all.filter((e) => e.syncStatus !== 'SYNCING').slice(0, limit);
    } catch {
      return Array.from(this.memoryFallback.outbox.values())
        .filter((e) => e.syncStatus !== 'SYNCING')
        .slice(0, limit);
    }
  }

  public async removeOutboxEvents(clientEventIds: string[]): Promise<void> {
    if (clientEventIds.length === 0) return;

    try {
      const db = await this.getDb();
      await new Promise<void>((res, rej) => {
        const tx = db.transaction('outbox_events', 'readwrite');
        const store = tx.objectStore('outbox_events');
        for (const id of clientEventIds) {
          store.delete(id);
        }
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch {
      for (const id of clientEventIds) {
        this.memoryFallback.outbox.delete(id);
      }
    }
  }

  public async markOutboxFailed(clientEventId: string, error: string): Promise<void> {
    try {
      const db = await this.getDb();
      const record = await new Promise<OutboxEventRecord | null>((res) => {
        const tx = db.transaction('outbox_events', 'readonly');
        const req = tx.objectStore('outbox_events').get(clientEventId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });

      if (record) {
        record.syncStatus = 'FAILED';
        record.retryCount += 1;
        record.lastError = error;
        await new Promise<void>((res, rej) => {
          const tx = db.transaction('outbox_events', 'readwrite');
          tx.objectStore('outbox_events').put(record);
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      }
    } catch {
      const record = this.memoryFallback.outbox.get(clientEventId);
      if (record) {
        record.syncStatus = 'FAILED';
        record.retryCount += 1;
        record.lastError = error;
      }
    }
  }

  public async getOutboxCount(): Promise<number> {
    try {
      const db = await this.getDb();
      return new Promise((res) => {
        const tx = db.transaction('outbox_events', 'readonly');
        const req = tx.objectStore('outbox_events').count();
        req.onsuccess = () => res(req.result || 0);
        req.onerror = () => res(0);
      });
    } catch {
      return this.memoryFallback.outbox.size;
    }
  }

  // --- Storage Quota & Clean-up ---

  public async getStorageEstimate(): Promise<{ usageBytes: number; quotaBytes: number; percentage: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage ?? 0;
        const quota = estimate.quota ?? 1;
        return {
          usageBytes: usage,
          quotaBytes: quota,
          percentage: Math.min(100, Math.round((usage / quota) * 100)),
        };
      } catch {
        // Fallback
      }
    }

    return {
      usageBytes: 0,
      quotaBytes: 50 * 1024 * 1024, // 50MB estimate
      percentage: 0,
    };
  }

  public async clearContentCache(): Promise<void> {
    // Only clears downloaded content packages, preserves user local_progress and outbox!
    try {
      const db = await this.getDb();
      await new Promise<void>((res, rej) => {
        const tx = db.transaction(['packages', 'kanji', 'vocabulary', 'grammar', 'questions'], 'readwrite');
        tx.objectStore('packages').clear();
        tx.objectStore('kanji').clear();
        tx.objectStore('vocabulary').clear();
        tx.objectStore('grammar').clear();
        tx.objectStore('questions').clear();
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch {
      this.memoryFallback.packages.clear();
      this.memoryFallback.kanji.clear();
      this.memoryFallback.vocabulary.clear();
      this.memoryFallback.grammar.clear();
      this.memoryFallback.questions.clear();
    }
  }
}

export const storageService = new StorageService();
