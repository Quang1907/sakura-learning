import React from 'react';
import { KanjiDetailDto } from '@sakura/shared';

interface KanjiTableProps {
  items: KanjiDetailDto[];
  loading?: boolean;
  onEdit: (item: KanjiDetailDto) => void;
  onDelete: (item: KanjiDetailDto) => void;
}

export const KanjiTable: React.FC<KanjiTableProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-400 text-xs">Chưa có chữ Kanji nào trong danh sách.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Ký tự</th>
              <th className="py-3 px-4">Hán-Việt</th>
              <th className="py-3 px-4">JLPT</th>
              <th className="py-3 px-4">Nét</th>
              <th className="py-3 px-4">Nghĩa tiếng Việt</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((k) => (
              <tr key={k.id} className="hover:bg-pink-50/30 transition-colors">
                <td className="py-3.5 px-4 font-mono text-slate-400">{k.id}</td>
                <td className="py-3.5 px-4">
                  <span className="text-2xl font-bold font-serif text-slate-900">
                    {k.character}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-extrabold text-pink-600 tracking-wide">
                  {k.hanViet}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px]">
                    {k.jlptLevels.join(', ')}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-medium">
                  {k.strokeCount}
                </td>
                <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                  {k.meaningVi}
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => onEdit(k)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(k)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
