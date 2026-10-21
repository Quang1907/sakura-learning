import React from 'react';
import { GrammarDetailDto } from '@sakura/shared';

interface GrammarCardProps {
  grammar: Partial<GrammarDetailDto>;
  isReview?: boolean;
  srsStage?: number;
}

export const GrammarCard: React.FC<GrammarCardProps> = ({
  grammar,
  isReview = false,
  srsStage = 0,
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
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-extrabold uppercase tracking-wider text-[11px]">
            {grammar.jlptLevels?.[0] ?? 'N5'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
            Ngữ pháp
          </span>
          {isReview ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              Ôn tập • Level {srsStage}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              Mẫu mới
            </span>
          )}
        </div>

        {/* Audio Button */}
        <button
          onClick={() => playPronunciation(grammar.title || '')}
          className="p-2.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors shadow-sm"
          title="Nghe phát âm tiêu đề ngữ pháp"
          aria-label="Phát âm mẫu ngữ pháp"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77l-4.5-4H3v6h4l4.5 4v-6zm5.5-1c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        </button>
      </div>

      {/* Main Grammar Display */}
      <div className="my-auto text-center flex flex-col items-center max-w-sm">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
          {grammar.title}
        </h2>

        {/* Structure formula */}
        <div className="px-4 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-mono font-bold mb-3 tracking-wide">
          {grammar.structure}
        </div>

        {/* Meaning Vi */}
        <div className="px-5 py-2.5 rounded-2xl bg-white border border-purple-100 shadow-xs mb-3 w-full">
          <p className="text-base font-bold text-slate-800 leading-snug">
            {grammar.meaningVi}
          </p>
        </div>

        {/* Usage notes */}
        {grammar.usageNotes && (
          <p className="text-xs text-slate-500 font-medium px-2 leading-relaxed">
            💡 {grammar.usageNotes}
          </p>
        )}
      </div>

      {/* Example Sentences */}
      <div className="w-full mt-4 space-y-2">
        {grammar.sentences && grammar.sentences.length > 0 ? (
          grammar.sentences.slice(0, 2).map((s, idx) => (
            <div
              key={s.id ?? idx}
              className="p-3.5 rounded-2xl bg-white/90 border border-purple-100/70 shadow-xs flex items-start justify-between gap-3 text-left"
            >
              <div className="space-y-0.5 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {s.sentenceJp}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {s.sentenceVi}
                </p>
              </div>
              <button
                onClick={() => playPronunciation(s.sentenceJp)}
                className="text-slate-400 hover:text-purple-600 transition-colors pt-0.5"
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
