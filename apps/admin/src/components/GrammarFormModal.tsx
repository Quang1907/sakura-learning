import React, { useState, useEffect } from 'react';
import { CreateGrammarDto, GrammarDetailDto, JlptLevel, JLPT_LEVELS } from '@sakura/shared';

interface GrammarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateGrammarDto) => Promise<void>;
  initialData?: GrammarDetailDto | null;
}

export const GrammarFormModal: React.FC<GrammarFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [structure, setStructure] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [jlptLevels, setJlptLevels] = useState<JlptLevel[]>(['N5']);
  const [sentenceJp, setSentenceJp] = useState('');
  const [sentenceVi, setSentenceVi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setStructure(initialData.structure);
      setMeaningVi(initialData.meaningVi);
      setUsageNotes(initialData.usageNotes || '');
      setJlptLevels(initialData.jlptLevels || ['N5']);
      if (initialData.sentences && initialData.sentences.length > 0) {
        setSentenceJp(initialData.sentences[0].sentenceJp);
        setSentenceVi(initialData.sentences[0].sentenceVi);
      } else {
        setSentenceJp('');
        setSentenceVi('');
      }
    } else {
      setTitle('');
      setStructure('');
      setMeaningVi('');
      setUsageNotes('');
      setJlptLevels(['N5']);
      setSentenceJp('');
      setSentenceVi('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !structure.trim() || !meaningVi.trim()) {
      setError('Vui lòng điền đầy đủ mẫu ngữ pháp, cấu trúc và nghĩa tiếng Việt.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        structure: structure.trim(),
        meaningVi: meaningVi.trim(),
        usageNotes: usageNotes.trim() || undefined,
        jlptLevels,
        sentences: sentenceJp.trim()
          ? [
              {
                sentenceJp: sentenceJp.trim(),
                sentenceVi: sentenceVi.trim(),
              },
            ]
          : [],
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            {initialData ? 'Chỉnh sửa Mẫu Ngữ Pháp' : 'Thêm mới Mẫu Ngữ Pháp'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mẫu ngữ pháp (Tiêu đề) *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: 〜は〜です"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cấu trúc câu *</label>
            <input
              type="text"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="VD: N1 は N2 です"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ý nghĩa tiếng Việt *</label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="VD: N1 là N2 (câu khẳng định cơ bản)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú sử dụng (tùy chọn)</label>
            <textarea
              rows={2}
              value={usageNotes}
              onChange={(e) => setUsageNotes(e.target.value)}
              placeholder="VD: Trợ từ は đọc là wa khi đóng vai trò chủ ngữ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cấp độ JLPT</label>
            <div className="flex gap-2">
              {JLPT_LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setJlptLevels([lvl])}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                    jlptLevels.includes(lvl)
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <span className="block font-bold text-slate-700">Câu ví dụ minh họa (tùy chọn)</span>
            <input
              type="text"
              value={sentenceJp}
              onChange={(e) => setSentenceJp(e.target.value)}
              placeholder="Câu tiếng Nhật (VD: 私は日本人です。)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
            <input
              type="text"
              value={sentenceVi}
              onChange={(e) => setSentenceVi(e.target.value)}
              placeholder="Dịch nghĩa tiếng Việt (VD: Tôi là người Nhật Bản.)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
