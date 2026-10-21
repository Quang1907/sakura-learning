import React from 'react';
import { VocabularyDetailDto } from '@sakura/shared';

interface VocabularyCardProps {
  vocab: Partial<VocabularyDetailDto>;
  isReview?: boolean;
  srsStage?: number;
  onKanjiClick?: (kanjiId: number) => void;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  vocab,
  isReview = false,
  srsStage = 0,
  onKanjiClick,
}) => {
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
    <div className="w-full flex flex-col items-center justify-between min-h-[460px] p-6 text-slate-800">
      {/* Top Meta Badges */}
      <div className="w-full flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 font-extrabold uppercase tracking-wider text-[11px]">
            {vocab.jlptLevels?.[0] ?? 'N5'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize text-[11px]">
            {vocab.partOfSpeech ?? 'Từ vựng'}
          </span>
          {isReview ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              Ôn tập • Level {srsStage}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              Từ mới
            </span>
          )}
        </div>

        {/* Audio Button */}
        <button
          onClick={() => playPronunciation(vocab.reading || vocab.word || '')}
          className="p-2.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors shadow-sm"
          title="Nghe phát âm"
          aria-label="Phát âm từ vựng"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77l-4.5-4H3v6h4l4.5 4v-6zm5.5-1c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        </button>
      </div>

      {/* Main Word Display */}
      <div className="my-auto text-center flex flex-col items-center">
        {/* Reading (Furigana / Hiragana) */}
        <p className="text-sm font-medium text-pink-600 tracking-wide mb-1">
          {vocab.reading}
        </p>

        {/* Kanji / Word */}
        <h2 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
          {vocab.word}
        </h2>

        {/* Romaji */}
        {vocab.romaji && (
          <p className="text-xs text-slate-400 font-mono tracking-wider mb-4">
            /{vocab.romaji}/
          </p>
        )}

        {/* Meaning Vi */}
        <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-50/80 to-rose-50/80 border border-pink-100/80 shadow-sm max-w-sm">
          <p className="text-lg font-bold text-slate-800 leading-snug">
            {vocab.meaningVi}
          </p>
        </div>

        {/* Linked Kanji if any */}
        {vocab.kanjiList && vocab.kanjiList.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Chữ Hán:</span>
            {vocab.kanjiList.map((k) => (
              <button
                key={k.id}
                onClick={() => onKanjiClick?.(k.id)}
                className="px-2 py-0.5 rounded-lg bg-white border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-50 transition-all shadow-xs"
              >
                {k.character} <span className="text-[10px] font-normal text-slate-500">({k.hanViet})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Example Sentences */}
      <div className="w-full mt-4 space-y-2">
        {vocab.examples && vocab.examples.length > 0 ? (
          vocab.examples.slice(0, 2).map((ex, idx) => (
            <div
              key={ex.id ?? idx}
              className="p-3.5 rounded-2xl bg-white/90 border border-pink-100/70 shadow-xs flex items-start justify-between gap-3 text-left"
            >
              <div className="space-y-0.5 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {ex.sentenceJp}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {ex.sentenceVi}
                </p>
              </div>
              <button
                onClick={() => playPronunciation(ex.sentenceJp)}
                className="text-slate-400 hover:text-pink-600 transition-colors pt-0.5"
                title="Nghe câu ví dụ"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-xs text-slate-400 italic">
            Chưa có câu ví dụ minh họa
          </p>
        )}
      </div>
    </div>
  );
};
