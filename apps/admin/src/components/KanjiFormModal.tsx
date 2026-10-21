import React, { useState, useEffect } from 'react';
import { CreateKanjiDto, KanjiDetailDto, JLPT_LEVELS, JlptLevel } from '@sakura/shared';

interface KanjiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKanjiDto) => Promise<void>;
  initialData?: KanjiDetailDto | null;
}

export const KanjiFormModal: React.FC<KanjiFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [character, setCharacter] = useState('');
  const [hanViet, setHanViet] = useState('');
  const [onyomi, setOnyomi] = useState('');
  const [kunyomi, setKunyomi] = useState('');
  const [strokeCount, setStrokeCount] = useState(4);
  const [radical, setRadical] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel[]>(['N5']);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCharacter(initialData.character);
      setHanViet(initialData.hanViet);
      setOnyomi(initialData.onyomi);
      setKunyomi(initialData.kunyomi);
      setStrokeCount(initialData.strokeCount);
      setRadical(initialData.radical ?? '');
      setMeaningVi(initialData.meaningVi);
      setSelectedJlpt(initialData.jlptLevels);
    } else {
      setCharacter('');
      setHanViet('');
      setOnyomi('');
      setKunyomi('');
      setStrokeCount(4);
      setRadical('');
      setMeaningVi('');
      setSelectedJlpt(['N5']);
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!character.trim()) {
      setErrorMsg('Vui lòng nhập ký tự Kanji.');
      return;
    }
    if (!hanViet.trim()) {
      setErrorMsg('Vui lòng nhập âm Hán-Việt.');
      return;
    }
    if (!meaningVi.trim()) {
      setErrorMsg('Vui lòng nhập nghĩa tiếng Việt.');
      return;
    }
    if (selectedJlpt.length === 0) {
      setErrorMsg('Chọn ít nhất một cấp độ JLPT.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        character: character.trim(),
        hanViet: hanViet.trim().toUpperCase(),
        onyomi: onyomi.trim(),
        kunyomi: kunyomi.trim(),
        strokeCount: Number(strokeCount),
        radical: radical.trim() || undefined,
        meaningVi: meaningVi.trim(),
        jlptLevels: selectedJlpt,
        examples: initialData?.examples ?? [],
      });
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJlpt = (level: JlptLevel) => {
    setSelectedJlpt((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {initialData ? `Chỉnh sửa Kanji: ${initialData.character}` : 'Thêm mới Chữ Hán (Kanji)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cổng quản trị nội dung chuẩn hóa Sakura
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Ký tự Kanji <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={4}
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="Ví dụ: 日"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-base font-bold text-center"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Âm Hán-Việt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={hanViet}
                onChange={(e) => setHanViet(e.target.value)}
                placeholder="Ví dụ: NHẬT"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold uppercase text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Âm On (Onyomi)</label>
              <input
                type="text"
                value={onyomi}
                onChange={(e) => setOnyomi(e.target.value)}
                placeholder="ニチ, ジツ"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Âm Kun (Kunyomi)</label>
              <input
                type="text"
                value={kunyomi}
                onChange={(e) => setKunyomi(e.target.value)}
                placeholder="ひ, -び, -か"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Số nét</label>
              <input
                type="number"
                min={1}
                max={64}
                value={strokeCount}
                onChange={(e) => setStrokeCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Bộ thủ (Radical)</label>
              <input
                type="text"
                value={radical}
                onChange={(e) => setRadical(e.target.value)}
                placeholder="Ví dụ: 日"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nghĩa tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="Giải thích nghĩa chi tiết..."
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Cấp độ JLPT <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {JLPT_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => toggleJlpt(level)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    selectedJlpt.includes(level)
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors shadow"
            >
              {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
