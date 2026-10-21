import React from 'react';
import { GrammarDetailDto } from '@sakura/shared';

interface GrammarTableProps {
  items: GrammarDetailDto[];
  onEdit: (item: GrammarDetailDto) => void;
  onDelete: (item: GrammarDetailDto) => void;
}

export const GrammarTable: React.FC<GrammarTableProps> = ({
  items,
  onEdit,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-400 text-sm">Không có dữ liệu ngữ pháp nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3.5 px-4">ID</th>
            <th className="py-3.5 px-4">Mẫu ngữ pháp</th>
            <th className="py-3.5 px-4">Cấu trúc câu</th>
            <th className="py-3.5 px-4">Ý nghĩa tiếng Việt</th>
            <th className="py-3.5 px-4">JLPT</th>
            <th className="py-3.5 px-4">Ghi chú sử dụng</th>
            <th className="py-3.5 px-4">Ví dụ</th>
            <th className="py-3.5 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-mono text-slate-400">#{item.id}</td>
              <td className="py-3 px-4 font-bold text-slate-900 text-sm">{item.title}</td>
              <td className="py-3 px-4 font-mono text-purple-700 font-semibold">{item.structure}</td>
              <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.meaningVi}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                  {item.jlptLevels?.[0] ?? 'N5'}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                {item.usageNotes || '—'}
              </td>
              <td className="py-3 px-4 text-slate-400">
                {item.sentences?.length ? `${item.sentences.length} câu` : '0'}
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
