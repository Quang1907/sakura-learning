import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService } from './sync.service.js';
import { StorageService } from '../storage/indexeddb.js';
import { ApiClient } from '../../api/client.js';

describe('SyncService (Offline Outbox & Batch Synchronization)', () => {
  let storage: StorageService;
  let client: ApiClient;
  let syncService: SyncService;

  beforeEach(() => {
    storage = new StorageService();
    client = new ApiClient();
    syncService = new SyncService(storage, client);
  });

  it('should return initial sync status', () => {
    const status = syncService.getStatus();
    expect(typeof status.isOnline).toBe('boolean');
    expect(status.isSyncing).toBe(false);
    expect(status.lastError).toBeNull();
  });

  it('should synchronize pending outbox events when online', async () => {
    // 1. Enqueue outbox event
    await storage.enqueueOutboxEvent({
      clientEventId: 'sync-test-uuid',
      userId: 2,
      itemType: 'KANJI',
      itemId: 1,
      action: 'SWIPE_RIGHT_KNOWN',
      createdAt: new Date().toISOString(),
    });

    const pendingBefore = await storage.getOutboxCount();
    expect(pendingBefore).toBe(1);

    // 2. Mock client.syncBatchEvents
    vi.spyOn(client, 'syncBatchEvents').mockResolvedValueOnce({
      results: [
        {
          clientEventId: 'sync-test-uuid',
          recorded: true,
          nextReviewAt: new Date().toISOString(),
          srsStage: 1,
          expEarned: 5,
          newTotalExp: 125,
          currentStreakDays: 3,
        },
      ],
      totalProcessed: 1,
      totalExpEarned: 5,
    });

    // 3. Trigger sync
    const result = await syncService.syncNow();
    expect(result.syncedCount).toBe(1);
    expect(result.errors).toBe(0);

    // 4. Verify outbox is cleared
    const pendingAfter = await storage.getOutboxCount();
    expect(pendingAfter).toBe(0);
  });

  it('should handle sync errors gracefully and preserve outbox events', async () => {
    // 1. Enqueue outbox event
    await storage.enqueueOutboxEvent({
      clientEventId: 'sync-fail-uuid',
      userId: 2,
      itemType: 'VOCABULARY',
      itemId: 2,
      action: 'SWIPE_LEFT_AGAIN',
      createdAt: new Date().toISOString(),
    });

    // 2. Mock client.syncBatchEvents failure
    vi.spyOn(client, 'syncBatchEvents').mockRejectedValueOnce(
      new Error('Network connection timeout')
    );

    // 3. Trigger sync
    const result = await syncService.syncNow();
    expect(result.syncedCount).toBe(0);
    expect(result.errors).toBe(1);

    // 4. Event must NOT be lost
    const count = await storage.getOutboxCount();
    expect(count).toBe(1);

    const status = syncService.getStatus();
    expect(status.lastError).toContain('timeout');
  });
});
