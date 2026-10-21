import React, { useState, useEffect, useCallback } from 'react';
import { KanjiDetailDto, JlptLevel, JLPT_LEVELS } from '@sakura/shared';
import { KanjiCard } from './KanjiCard.js';
import { KanjiDetailModal } from './KanjiDetailModal.js';
import { apiClient } from '../api/client.js';

export const KanjiExplorer: React.FC = () => {
  const [items, setItems] = useState<KanjiDetailDto[]>([]);
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<KanjiDetailDto | null>(null);

  const fetchKanji = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getKanjiList({
        jlpt: selectedJlpt === 'ALL' ? undefined : selectedJlpt,
        search: search.trim() || undefined,
        page,
        limit: 12,
      });
      setItems(res.items);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch {
      // Fallback sample cards if server is unreachable
      setItems([
        {
          id: 1,
          character: '日',
          hanViet: 'NHẬT',
          onyomi: 'ニチ, ジツ',
          kunyomi: 'ひ, -び, -か',
          strokeCount: 4,
          meaningVi: 'Mặt trời, ban ngày, ngày',
          jlptLevels: ['N5'],
          examples: [],
        },
        {
          id: 2,
          character: '月',
          hanViet: 'NGUYỆT',
          onyomi: 'ゲツ, ガツ',
          kunyomi: 'つき',
          strokeCount: 4,
          meaningVi: 'Mặt trăng, tháng',
          jlptLevels: ['N5'],
          examples: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedJlpt, search, page]);

  useEffect(() => {
    fetchKanji();
  }, [fetchKanji]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
      {/* Header and Search */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Kho Chữ Hán (Kanji)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tra cứu nhanh âm Hán-Việt, nét viết và ví dụ ngữ cảnh ({totalCount} chữ)
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm chữ Hán, Hán-Việt, nghĩa..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/90 placeholder-slate-400 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        {/* JLPT Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedJlpt('ALL');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedJlpt === 'ALL'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-pink-50 text-slate-600 hover:bg-pink-100'
            }`}
          >
            Tất cả
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedJlpt(level);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedJlpt === level
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-pink-50 text-slate-600 hover:bg-pink-100'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Kanji cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white/60 rounded-3xl border border-pink-100">
          <p className="text-slate-500 text-sm">Không tìm thấy chữ Kanji phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((kanji) => (
            <KanjiCard
              key={kanji.id}
              kanji={kanji}
              onClick={() => setSelectedKanji(kanji)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-30 hover:bg-pink-50 transition-colors"
          >
            ◀ Trang trước
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Trang {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-30 hover:bg-pink-50 transition-colors"
          >
            Trang sau ▶
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <KanjiDetailModal
        kanji={selectedKanji}
        onClose={() => setSelectedKanji(null)}
      />
    </div>
  );
};
