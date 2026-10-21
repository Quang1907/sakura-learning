import React from 'react';
import { VocabularyDetailDto } from '@sakura/shared';

interface VocabularyTableProps {
  items: VocabularyDetailDto[];
  onEdit: (item: VocabularyDetailDto) => void;
  onDelete: (item: VocabularyDetailDto) => void;
}

export const VocabularyTable: React.FC<VocabularyTableProps> = ({
  items,
  onEdit,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-400 text-sm">Không có dữ liệu từ vựng nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3.5 px-4">ID</th>
            <th className="py-3.5 px-4">Từ vựng</th>
            <th className="py-3.5 px-4">Cách đọc (Hiragana)</th>
            <th className="py-3.5 px-4">Romaji</th>
            <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
            <th className="py-3.5 px-4">JLPT</th>
            <th className="py-3.5 px-4">Loại từ</th>
            <th className="py-3.5 px-4">Ví dụ</th>
            <th className="py-3.5 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-mono text-slate-400">#{item.id}</td>
              <td className="py-3 px-4 font-bold text-slate-900 text-sm">{item.word}</td>
              <td className="py-3 px-4 text-pink-600 font-semibold">{item.reading}</td>
              <td className="py-3 px-4 font-mono text-slate-500">{item.romaji || '—'}</td>
              <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.meaningVi}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-800 font-bold text-[10px]">
                  {item.jlptLevels?.[0] ?? 'N5'}
                </span>
              </td>
              <td className="py-3 px-4 capitalize text-slate-500">{item.partOfSpeech || 'noun'}</td>
              <td className="py-3 px-4 text-slate-400">
                {item.examples?.length ? `${item.examples.length} câu` : '0'}
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium text-[11px]"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-medium text-[11px]"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
