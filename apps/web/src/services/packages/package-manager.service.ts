import { JlptLevel, OfflinePackageMetadataDto } from '@sakura/shared';
import { storageService, StorageService } from '../storage/indexeddb.js';
import { apiClient, ApiClient } from '../../api/client.js';

export interface PackageDownloadProgress {
  packageId: string;
  status: 'IDLE' | 'DOWNLOADING' | 'DOWNLOADED' | 'ERROR';
  progressPercent: number;
  message?: string;
  error?: string;
}

export type DownloadProgressListener = (progress: PackageDownloadProgress) => void;

export class PackageManagerService {
  private activeDownloads = new Map<string, PackageDownloadProgress>();
  private listeners = new Set<DownloadProgressListener>();

  constructor(
    private readonly storage: StorageService = storageService,
    private readonly client: ApiClient = apiClient,
  ) {}

  public subscribe(listener: DownloadProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(progress: PackageDownloadProgress): void {
    this.activeDownloads.set(progress.packageId, progress);
    for (const l of this.listeners) {
      l(progress);
    }
  }

  public async getAvailablePackages(): Promise<
    Array<{
      packageId: string;
      level: JlptLevel;
      title: string;
      description: string;
      isDownloaded: boolean;
      metadata?: OfflinePackageMetadataDto;
    }>
  > {
    const downloaded = await this.storage.getPackages();
    const downloadedMap = new Map(downloaded.map((p) => [p.packageId, p]));

    const packagesConfig: Array<{ level: JlptLevel; title: string; description: string }> = [
      {
        level: 'N5',
        title: 'JLPT N5 — Nhập môn & Cơ bản',
        description: 'Trọn bộ Kanji sơ cấp, từ vựng sinh hoạt hàng ngày và mẫu ngữ pháp Minna cơ bản.',
      },
      {
        level: 'N4',
        title: 'JLPT N4 — Sơ trung cấp',
        description: 'Mở rộng cấu trúc ngữ pháp điều kiện, kính ngữ cơ bản và vốn từ giao tiếp thường nhật.',
      },
      {
        level: 'N3',
        title: 'JLPT N3 — Trung cấp',
        description: 'Chữ Hán và ngữ pháp chuyển tiếp phục vụ đọc hiểu báo chí và hội thoại tự nhiên.',
      },
    ];

    return packagesConfig.map((cfg) => {
      const packageId = `jlpt_${cfg.level.toLowerCase()}`;
      const meta = downloadedMap.get(packageId);
      return {
        packageId,
        level: cfg.level,
        title: cfg.title,
        description: cfg.description,
        isDownloaded: Boolean(meta),
        metadata: meta,
      };
    });
  }

  /**
   * Download a complete offline package from backend and persist atomically into IndexedDB.
   */
  public async downloadPackage(level: JlptLevel): Promise<void> {
    const packageId = `jlpt_${level.toLowerCase()}`;

    this.notify({
      packageId,
      status: 'DOWNLOADING',
      progressPercent: 15,
      message: `Đang kết nối và tải gói dữ liệu JLPT ${level}...`,
    });

    try {
      this.notify({
        packageId,
        status: 'DOWNLOADING',
        progressPercent: 40,
        message: 'Đang tải nội dung Kanji, Từ vựng và Ngữ pháp...',
      });

      const packageData = await this.client.downloadPackage(level);

      this.notify({
        packageId,
        status: 'DOWNLOADING',
        progressPercent: 75,
        message: 'Đang lưu trữ dữ liệu vào bộ nhớ IndexedDB trên máy...',
      });

      // Persist atomically to IndexedDB
      await this.storage.savePackageData(
        packageData.metadata,
        packageData.kanji,
        packageData.vocabulary,
        packageData.grammar,
        packageData.questions,
      );

      this.notify({
        packageId,
        status: 'DOWNLOADED',
        progressPercent: 100,
        message: `Gói học ${level} đã sẵn sàng sử dụng ngoại tuyến!`,
      });
    } catch (err) {
      const errorMsg = (err as Error).message || 'Lỗi khi tải gói dữ liệu';
      this.notify({
        packageId,
        status: 'ERROR',
        progressPercent: 0,
        error: errorMsg,
      });
      throw err;
    }
  }

  public async deletePackage(packageId: string, level: JlptLevel): Promise<void> {
    await this.storage.deletePackage(packageId, level);
    this.notify({
      packageId,
      status: 'IDLE',
      progressPercent: 0,
    });
  }
}

export const packageManagerService = new PackageManagerService();
