import React, { useState, useEffect } from 'react';
import { CreateVocabularyDto, VocabularyDetailDto, JlptLevel, JLPT_LEVELS } from '@sakura/shared';

interface VocabularyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateVocabularyDto) => Promise<void>;
  initialData?: VocabularyDetailDto | null;
}

export const VocabularyFormModal: React.FC<VocabularyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [word, setWord] = useState('');
  const [reading, setReading] = useState('');
  const [romaji, setRomaji] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [meaningVi, setMeaningVi] = useState('');
  const [jlptLevels, setJlptLevels] = useState<JlptLevel[]>(['N5']);
  const [sentenceJp, setSentenceJp] = useState('');
  const [sentenceVi, setSentenceVi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word);
      setReading(initialData.reading);
      setRomaji(initialData.romaji || '');
      setPartOfSpeech(initialData.partOfSpeech || 'noun');
      setMeaningVi(initialData.meaningVi);
      setJlptLevels(initialData.jlptLevels || ['N5']);
      if (initialData.examples && initialData.examples.length > 0) {
        setSentenceJp(initialData.examples[0].sentenceJp);
        setSentenceVi(initialData.examples[0].sentenceVi);
      } else {
        setSentenceJp('');
        setSentenceVi('');
      }
    } else {
      setWord('');
      setReading('');
      setRomaji('');
      setPartOfSpeech('noun');
      setMeaningVi('');
      setJlptLevels(['N5']);
      setSentenceJp('');
      setSentenceVi('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !reading.trim() || !meaningVi.trim()) {
      setError('Vui lòng điền đầy đủ từ vựng, cách đọc và nghĩa tiếng Việt.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        word: word.trim(),
        reading: reading.trim(),
        romaji: romaji.trim() || undefined,
        partOfSpeech,
        meaningVi: meaningVi.trim(),
        jlptLevels,
        kanjiIds: [],
        examples: sentenceJp.trim()
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
            {initialData ? 'Chỉnh sửa Từ Vựng' : 'Thêm mới Từ Vựng'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Từ vựng (Kanji/Kana) *</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="VD: 日本"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cách đọc (Hiragana) *</label>
              <input
                type="text"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="VD: にほん"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Romaji</label>
              <input
                type="text"
                value={romaji}
                onChange={(e) => setRomaji(e.target.value)}
                placeholder="VD: nihon"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loại từ</label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                <option value="noun">Danh từ (Noun)</option>
                <option value="verb">Động từ (Verb)</option>
                <option value="adjective">Tính từ (Adjective)</option>
                <option value="adverb">Phó từ (Adverb)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nghĩa tiếng Việt *</label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="VD: Nhật Bản, đất nước Nhật Bản"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
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
                      ? 'bg-pink-600 text-white'
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
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
            />
            <input
              type="text"
              value={sentenceVi}
              onChange={(e) => setSentenceVi(e.target.value)}
              placeholder="Dịch nghĩa tiếng Việt (VD: Tôi là người Nhật Bản.)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
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
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
