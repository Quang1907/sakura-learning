import React, { useState, useEffect, useCallback } from 'react';
import { VocabularyDetailDto, JlptLevel, JLPT_LEVELS } from '@sakura/shared';
import { apiClient } from '../api/client.js';

export const VocabularyExplorer: React.FC = () => {
  const [items, setItems] = useState<VocabularyDetailDto[]>([]);
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchVocabulary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getVocabularyList({
        jlpt: selectedJlpt === 'ALL' ? undefined : selectedJlpt,
        search: search.trim() || undefined,
        page,
        limit: 12,
      });
      setItems(res.items);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch {
      // Fallback sample cards
      setItems([
        {
          id: 1,
          word: '日本',
          reading: 'にほん',
          romaji: 'nihon',
          partOfSpeech: 'noun',
          meaningVi: 'Nhật Bản',
          jlptLevels: ['N5'],
          kanjiIds: [1],
          examples: [
            {
              sentenceJp: '日本の春は桜が綺麗です。',
              sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
            },
          ],
        },
        {
          id: 2,
          word: '月曜日',
          reading: 'げつようび',
          romaji: 'getsuyoubi',
          partOfSpeech: 'noun',
          meaningVi: 'Thứ Hai',
          jlptLevels: ['N5'],
          kanjiIds: [2],
          examples: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedJlpt, search, page]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const playPronunciation = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
      {/* Header and Search */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Kho Từ Vựng (Vocabulary)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tra cứu nghĩa tiếng Việt, cách đọc Hiragana, Romaji và câu ví dụ ({totalCount} từ)
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
              placeholder="Tìm từ vựng, hiragana, nghĩa..."
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

      {/* Grid of Vocabulary cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white/60 rounded-3xl border border-pink-100">
          <p className="text-slate-500 text-sm">Không tìm thấy từ vựng phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((vocab) => (
            <div
              key={vocab.id}
              className="p-5 rounded-3xl bg-white border border-pink-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold text-[10px]">
                    {vocab.jlptLevels?.[0] ?? 'N5'}
                  </span>
                  <button
                    onClick={() => playPronunciation(vocab.reading || vocab.word)}
                    className="text-pink-600 hover:text-pink-700 transition-colors"
                    title="Nghe phát âm"
                  >
                    🔊
                  </button>
                </div>

                <p className="text-xs text-pink-600 font-medium mb-0.5">{vocab.reading}</p>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{vocab.word}</h3>
                {vocab.romaji && (
                  <p className="text-[11px] text-slate-400 font-mono mb-2">/{vocab.romaji}/</p>
                )}
                <p className="text-sm font-bold text-slate-700 leading-snug">{vocab.meaningVi}</p>
              </div>

              {vocab.examples && vocab.examples.length > 0 && (
                <div className="mt-4 pt-3 border-t border-pink-50 text-xs text-left">
                  <p className="font-bold text-slate-800 text-[11px] truncate">
                    {vocab.examples[0].sentenceJp}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate">
                    {vocab.examples[0].sentenceVi}
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
