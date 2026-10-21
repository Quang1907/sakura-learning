import { ProgressEventDto } from '@sakura/shared';
import { storageService, StorageService } from '../storage/indexeddb.js';
import { apiClient, ApiClient } from '../../api/client.js';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

export type SyncStateListener = (status: SyncStatus) => void;

export class SyncService {
  private isSyncing = false;
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;
  private listeners = new Set<SyncStateListener>();

  constructor(
    private readonly storage: StorageService = storageService,
    private readonly client: ApiClient = apiClient,
  ) {
    this.setupNetworkListeners();
    this.refreshPendingCount();
  }

  public isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: 0, // updated dynamically
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify(): Promise<void> {
    const count = await this.storage.getOutboxCount();
    const status: SyncStatus = {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: count,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.lastError = null;
      this.notify();
      // Auto-trigger sync when network reconnects
      this.syncNow().catch(() => {});
    });

    window.addEventListener('offline', () => {
      this.notify();
    });
  }

  public async refreshPendingCount(): Promise<number> {
    const count = await this.storage.getOutboxCount();
    this.notify();
    return count;
  }

  /**
   * Synchronize pending outbox learning events with server.
   * Processes events in batches with automatic retry & deduplication.
   */
  public async syncNow(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncing) {
      return { syncedCount: 0, errors: 0 };
    }

    if (!this.isOnline()) {
      this.lastError = 'Thiết bị đang ngoại tuyến. Không thể kết nối tới máy chủ.';
      this.notify();
      return { syncedCount: 0, errors: 0 };
    }

    const pendingEvents = await this.storage.getPendingOutboxEvents(50);
    if (pendingEvents.length === 0) {
      this.lastError = null;
      this.lastSyncAt = new Date().toISOString();
      this.notify();
      return { syncedCount: 0, errors: 0 };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let syncedCount = 0;
    let errors = 0;

    try {
      const dtoArray: ProgressEventDto[] = pendingEvents.map((e) => ({
        clientEventId: e.clientEventId,
        itemType: e.itemType,
        itemId: e.itemId,
        action: e.action,
        metadata: e.metadata,
      }));

      // Send batch to server
      const res = await this.client.syncBatchEvents(dtoArray);

      // Successfully processed items can be safely removed from outbox
      const acknowledgedIds = res.results.map((r) => r.clientEventId);
      await this.storage.removeOutboxEvents(acknowledgedIds);

      syncedCount = acknowledgedIds.length;
      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;
    } catch (err) {
      errors = pendingEvents.length;
      this.lastError = (err as Error).message || 'Lỗi kết nối khi đồng bộ dữ liệu.';

      // Mark first batch items as failed for retry tracking
      for (const e of pendingEvents) {
        await this.storage.markOutboxFailed(e.clientEventId, this.lastError);
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { syncedCount, errors };
  }
}

export const syncService = new SyncService();
