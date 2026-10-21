import React from 'react';
import { KanjiDetailDto } from '@sakura/shared';

interface KanjiCardProps {
  kanji: KanjiDetailDto;
  onClick?: () => void;
}

export const KanjiCard: React.FC<KanjiCardProps> = ({ kanji, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      className="group relative bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-pink-100 hover:border-pink-300 flex flex-col justify-between cursor-pointer text-left overflow-hidden"
      style={{
        boxShadow: '0 8px 30px rgba(255, 117, 143, 0.08)',
      }}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-700 tracking-wider">
          {kanji.jlptLevels[0] ?? 'N5'}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {kanji.strokeCount} nét
        </span>
      </div>

      {/* Main glyph & Han-Viet reading */}
      <div className="flex items-center space-x-4 my-2">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 text-4xl font-bold font-serif shadow-inner group-hover:scale-105 transition-transform duration-300">
          {kanji.character}
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-wide group-hover:text-pink-600 transition-colors">
            {kanji.hanViet}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-1 mt-0.5">
            {kanji.meaningVi}
          </p>
        </div>
      </div>

      {/* Readings snippet */}
      <div className="mt-4 pt-3 border-t border-pink-50 flex flex-col gap-1 text-xs text-slate-500">
        {kanji.onyomi && (
          <div className="flex items-center gap-1.5">
            <span className="text-pink-400 font-semibold">On:</span>
            <span className="truncate">{kanji.onyomi}</span>
          </div>
        )}
        {kanji.kunyomi && (
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">Kun:</span>
            <span className="truncate">{kanji.kunyomi}</span>
          </div>
        )}
      </div>

      {/* Sakura decorative petal effect */}
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-200/20 rounded-full blur-md group-hover:bg-pink-300/30 transition-colors" />
    </div>
  );
};
