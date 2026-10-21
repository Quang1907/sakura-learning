import React from 'react';
import { KanjiDetailDto } from '@sakura/shared';

interface KanjiDetailModalProps {
  kanji: KanjiDetailDto | null;
  onClose: () => void;
  onMarkKnown?: (kanji: KanjiDetailDto) => void;
  onMarkNeedsReview?: (kanji: KanjiDetailDto) => void;
}

export const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({
  kanji,
  onClose,
  onMarkKnown,
  onMarkNeedsReview,
}) => {
  if (!kanji) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(255, 117, 143, 0.25)',
        }}
      >
        {/* Header decoration */}
        <div className="relative bg-gradient-to-r from-pink-500 via-pink-400 to-rose-400 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors text-lg"
            aria-label="Đóng"
          >
            ✕
          </button>

          <span className="inline-block px-3 py-1 rounded-full bg-white/25 text-xs font-semibold uppercase tracking-wider mb-2">
            JLPT {kanji.jlptLevels.join(', ')}
          </span>

          <div className="text-7xl font-bold font-serif my-2 drop-shadow-md">
            {kanji.character}
          </div>

          <h2 className="text-2xl font-black tracking-widest uppercase">
            {kanji.hanViet}
          </h2>
          <p className="text-pink-100 text-sm mt-1">{kanji.meaningVi}</p>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Attributes grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wider block mb-1">
                Âm On (Onyomi)
              </span>
              <span className="text-sm font-medium text-slate-800">
                {kanji.onyomi || '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Âm Kun (Kunyomi)
              </span>
              <span className="text-sm font-medium text-slate-800">
                {kanji.kunyomi || '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Số nét
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {kanji.strokeCount} nét
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Bộ thủ (Radical)
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {kanji.radical || '—'}
              </span>
            </div>
          </div>

          {/* Examples list */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Từ vựng & Ví dụ minh họa
            </h4>

            {kanji.examples.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Chưa có câu ví dụ cho chữ Hán này.
              </p>
            ) : (
              <div className="space-y-3">
                {kanji.examples.map((ex, idx) => (
                  <div
                    key={ex.id ?? idx}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-base font-bold text-slate-900">
                        {ex.word}
                      </span>
                      <span className="text-xs text-pink-600 font-medium">
                        【{ex.reading}】
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{ex.meaningVi}</p>
                    {ex.sentenceJp && (
                      <div className="pt-2 border-t border-slate-200/60 text-xs space-y-0.5">
                        <p className="text-slate-700 font-medium">{ex.sentenceJp}</p>
                        <p className="text-slate-500">{ex.sentenceVi}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer action buttons */}
        <div className="p-4 bg-slate-50 border-t border-pink-50 flex items-center gap-3">
          <button
            onClick={() => onMarkNeedsReview?.(kanji)}
            className="flex-1 py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            ↺ Cần học lại
          </button>
          <button
            onClick={() => onMarkKnown?.(kanji)}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            ✓ Đã thuộc
          </button>
        </div>
      </div>
    </div>
  );
};
