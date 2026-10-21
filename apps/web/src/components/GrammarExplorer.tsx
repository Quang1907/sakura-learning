import React, { useState, useEffect, useCallback } from 'react';
import { GrammarDetailDto, JlptLevel, JLPT_LEVELS } from '@sakura/shared';
import { apiClient } from '../api/client.js';

export const GrammarExplorer: React.FC = () => {
  const [items, setItems] = useState<GrammarDetailDto[]>([]);
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchGrammar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getGrammarList({
        jlpt: selectedJlpt === 'ALL' ? undefined : selectedJlpt,
        search: search.trim() || undefined,
        page,
        limit: 12,
      });
      setItems(res.items);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch {
      setItems([
        {
          id: 1,
          title: '〜は〜です',
          structure: 'N1 は N2 です',
          meaningVi: 'N1 là N2',
          usageNotes: 'Mẫu câu khẳng định cơ bản trong tiếng Nhật',
          jlptLevels: ['N5'],
          sentences: [
            {
              id: 1,
              sentenceJp: '私は日本人です。',
              sentenceVi: 'Tôi là người Nhật Bản.',
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedJlpt, search, page]);

  useEffect(() => {
    fetchGrammar();
  }, [fetchGrammar]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
      {/* Header and Search */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Kho Ngữ Pháp (Grammar)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tra cứu cấu trúc ngữ pháp, điều kiện sử dụng và ví dụ ({totalCount} mẫu)
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
              placeholder="Tìm mẫu ngữ pháp, cấu trúc..."
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

      {/* Grid of Grammar cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white/60 rounded-3xl border border-pink-100">
          <p className="text-slate-500 text-sm">Không tìm thấy mẫu ngữ pháp phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((grammar) => (
            <div
              key={grammar.id}
              className="p-5 rounded-3xl bg-white border border-purple-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px]">
                    {grammar.jlptLevels?.[0] ?? 'N5'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Ngữ pháp</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-1.5">{grammar.title}</h3>
                <div className="inline-block px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-mono font-bold mb-2">
                  {grammar.structure}
                </div>
                <p className="text-sm font-bold text-slate-700 leading-snug mb-2">
                  {grammar.meaningVi}
                </p>
                {grammar.usageNotes && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    💡 {grammar.usageNotes}
                  </p>
                )}
              </div>

              {grammar.sentences && grammar.sentences.length > 0 && (
                <div className="mt-4 pt-3 border-t border-purple-50 text-xs text-left">
                  <p className="font-bold text-slate-800 text-[11px] truncate">
                    {grammar.sentences[0].sentenceJp}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate">
                    {grammar.sentences[0].sentenceVi}
                  </p>
                </div>
              )}
            </div>
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
    </div>
  );
};
