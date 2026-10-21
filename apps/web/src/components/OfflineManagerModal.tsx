import React, { useEffect, useState } from 'react';
import { JlptLevel } from '@sakura/shared';
import { syncService, SyncStatus } from '../services/sync/sync.service.js';
import { packageManagerService } from '../services/packages/package-manager.service.js';
import { storageService } from '../services/storage/indexeddb.js';

interface OfflineManagerModalProps {
  onClose: () => void;
  onRefreshFeed?: () => void;
}

interface PackageItemView {
  packageId: string;
  level: JlptLevel;
  title: string;
  description: string;
  isDownloaded: boolean;
  itemCount?: number;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({ onClose, onRefreshFeed }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [packages, setPackages] = useState<PackageItemView[]>([]);
  const [downloadingLevel, setDownloadingLevel] = useState<JlptLevel | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<string>('0 KB');

  const loadData = async () => {
    const pkgs = await packageManagerService.getAvailablePackages();
    setPackages(
      pkgs.map((p) => ({
        packageId: p.packageId,
        level: p.level,
        title: p.title,
        description: p.description,
        isDownloaded: p.isDownloaded,
        itemCount: p.metadata
          ? p.metadata.totalKanji + p.metadata.totalVocabulary + p.metadata.totalGrammar + p.metadata.totalQuestions
          : undefined,
      }))
    );

    const estimate = await storageService.getStorageEstimate();
    const mb = (estimate.usageBytes / (1024 * 1024)).toFixed(2);
    setStorageUsage(`${mb} MB`);
  };

  useEffect(() => {
    loadData();

    // Subscribe to sync service
    const unsubscribeSync = syncService.subscribe((status) => {
      setSyncStatus(status);
    });

    // Subscribe to package manager download events
    const unsubscribePkg = packageManagerService.subscribe((p) => {
      setDownloadProgress(p.progressPercent);
      if (p.message) setStatusMessage(p.message);
      if (p.status === 'DOWNLOADED' || p.status === 'ERROR') {
        setDownloadingLevel(null);
        loadData();
      }
    });

    return () => {
      unsubscribeSync();
      unsubscribePkg();
    };
  }, []);

  const handleSyncNow = async () => {
    setStatusMessage('Đang đồng bộ sự kiện học tập lên máy chủ...');
    const result = await syncService.syncNow();
    if (result.errors === 0) {
      setStatusMessage(`Đã đồng bộ thành công ${result.syncedCount} sự kiện!`);
    } else {
      setStatusMessage(`Lỗi đồng bộ: vui lòng kiểm tra kết nối mạng.`);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDownload = async (level: JlptLevel) => {
    setDownloadingLevel(level);
    setDownloadProgress(10);
    setStatusMessage(`Bắt đầu tải gói ${level}...`);

    try {
      await packageManagerService.downloadPackage(level);
      onRefreshFeed?.();
      setStatusMessage(`Tải gói ${level} thành công!`);
    } catch (err) {
      setStatusMessage(`Lỗi tải gói: ${(err as Error).message}`);
    }
  };

  const handleDeletePackage = async (packageId: string, level: JlptLevel) => {
    if (confirm(`Bạn có chắc chắn muốn xóa gói dữ liệu offline ${level}?`)) {
      await packageManagerService.deletePackage(packageId, level);
      loadData();
      onRefreshFeed?.();
      setStatusMessage(`Đã xóa gói dữ liệu ${level}.`);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleClearAllContent = async () => {
    if (confirm('Xóa toàn bộ nội dung offline đã tải? (Tiến trình học và điểm số của bạn vẫn được giữ nguyên an toàn)')) {
      await storageService.clearContentCache();
      loadData();
      onRefreshFeed?.();
      setStatusMessage('Đã làm trống bộ nhớ đệm nội dung offline.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-left">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-pink-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-base font-black text-slate-800">Quản Lý Học Ngoại Tuyến</h3>
              <p className="text-[11px] text-slate-400">Offline PWA & Đồng bộ dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Network & Outbox Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50/70 to-rose-50/70 border border-pink-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  syncStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-700">
                {syncStatus.isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} sự kiện đang chờ gửi lên server`
                : 'Mọi tiến độ đã được đồng bộ an toàn'}
            </p>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline || syncStatus.pendingCount === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              syncStatus.isSyncing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : syncStatus.pendingCount > 0 && syncStatus.isOnline
                ? 'bg-pink-600 hover:bg-pink-700 text-white cursor-pointer'
                : 'bg-white text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {syncStatus.isSyncing ? 'Đang gửi...' : 'Đồng bộ ngay'}
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-pink-100/60 border border-pink-200 text-pink-800 text-xs text-center font-medium">
            {statusMessage}
          </div>
        )}

        {/* Download Packages Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Gói bài học tải về máy
            </h4>
            <span className="text-[10px] text-slate-400">Đã dùng: {storageUsage}</span>
          </div>

          <div className="space-y-2">
            {packages.map((pkg) => (
              <div
                key={pkg.packageId}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{pkg.title}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      {pkg.description}
                    </span>
                    {pkg.isDownloaded && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        ✓ Đã sẵn sàng ({pkg.itemCount ?? 0} thẻ)
                      </span>
                    )}
                  </div>

                  <div>
                    {pkg.isDownloaded ? (
                      <button
                        onClick={() => handleDeletePackage(pkg.packageId, pkg.level)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Gỡ gói
                      </button>
                    ) : downloadingLevel === pkg.level ? (
                      <div className="text-xs font-bold text-pink-600 animate-pulse">
                        {downloadProgress}%
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(pkg.level)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Tải về
                      </button>
                    )}
                  </div>
                </div>

                {downloadingLevel === pkg.level && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-pink-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* iPhone Installation Guide */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <span>💡</span> Cài đặt Sakura lên iPhone (Safari)
          </span>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Mở trình duyệt Safari trên iPhone &rarr; Chọn biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới &rarr; Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> để mở ứng dụng như app gốc mà không cần mở MacBook.
          </p>
        </div>

        {/* Storage Maintenance */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={handleClearAllContent}
            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-[11px]"
          >
            Làm trống bộ nhớ đệm
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
