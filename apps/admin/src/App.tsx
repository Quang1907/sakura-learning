import React, { useState, useEffect, useCallback } from 'react';
import {
  KanjiDetailDto,
  CreateKanjiDto,
  VocabularyDetailDto,
  CreateVocabularyDto,
  GrammarDetailDto,
  CreateGrammarDto,
  JlptLevel,
  JLPT_LEVELS,
} from '@sakura/shared';
import { KanjiTable } from './components/KanjiTable.js';
import { KanjiFormModal } from './components/KanjiFormModal.js';
import { VocabularyTable } from './components/VocabularyTable.js';
import { VocabularyFormModal } from './components/VocabularyFormModal.js';
import { GrammarTable } from './components/GrammarTable.js';
import { GrammarFormModal } from './components/GrammarFormModal.js';
import { adminApiClient } from './api/admin-client.js';

type AdminTab = 'KANJI' | 'VOCABULARY' | 'GRAMMAR';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('KANJI');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel | 'ALL'>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Kanji state
  const [kanjiItems, setKanjiItems] = useState<KanjiDetailDto[]>([]);
  const [isKanjiFormOpen, setIsKanjiFormOpen] = useState(false);
  const [editingKanji, setEditingKanji] = useState<KanjiDetailDto | null>(null);

  // Vocabulary state
  const [vocabItems, setVocabItems] = useState<VocabularyDetailDto[]>([]);
  const [isVocabFormOpen, setIsVocabFormOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabularyDetailDto | null>(null);

  // Grammar state
  const [grammarItems, setGrammarItems] = useState<GrammarDetailDto[]>([]);
  const [isGrammarFormOpen, setIsGrammarFormOpen] = useState(false);
  const [editingGrammar, setEditingGrammar] = useState<GrammarDetailDto | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const jlpt = selectedJlpt === 'ALL' ? undefined : selectedJlpt;
      const term = search.trim() || undefined;

      if (activeTab === 'KANJI') {
        const res = await adminApiClient.getKanjiList({ jlpt, search: term, limit: 50 });
        setKanjiItems(res.items);
      } else if (activeTab === 'VOCABULARY') {
        const res = await adminApiClient.getVocabularyList({ jlpt, search: term, limit: 50 });
        setVocabItems(res.items);
      } else if (activeTab === 'GRAMMAR') {
        const res = await adminApiClient.getGrammarList({ jlpt, search: term, limit: 50 });
        setGrammarItems(res.items);
      }
    } catch {
      // Fallback in case of network glitch
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedJlpt, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Kanji handlers
  const handleKanjiSubmit = async (dto: CreateKanjiDto) => {
    if (editingKanji) {
      await adminApiClient.updateKanji(editingKanji.id, dto);
      setMessage({ type: 'success', text: `Cập nhật thành công chữ Kanji: ${dto.character}` });
    } else {
      await adminApiClient.createKanji(dto);
      setMessage({ type: 'success', text: `Tạo mới thành công chữ Kanji: ${dto.character}` });
    }
    fetchData();
  };

  const handleKanjiDelete = async (item: KanjiDetailDto) => {
    if (window.confirm(`Bạn có chắc muốn xóa chữ Kanji "${item.character} (${item.hanViet})"?`)) {
      try {
        await adminApiClient.deleteKanji(item.id);
        setMessage({ type: 'success', text: `Đã xóa chữ Kanji: ${item.character}` });
        fetchData();
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    }
  };

  // Vocabulary handlers
  const handleVocabSubmit = async (dto: CreateVocabularyDto) => {
    if (editingVocab) {
      await adminApiClient.updateVocabulary(editingVocab.id, dto);
      setMessage({ type: 'success', text: `Cập nhật thành công từ vựng: ${dto.word}` });
    } else {
      await adminApiClient.createVocabulary(dto);
      setMessage({ type: 'success', text: `Tạo mới thành công từ vựng: ${dto.word}` });
    }
    fetchData();
  };

  const handleVocabDelete = async (item: VocabularyDetailDto) => {
    if (window.confirm(`Bạn có chắc muốn xóa từ vựng "${item.word}"?`)) {
      try {
        await adminApiClient.deleteVocabulary(item.id);
        setMessage({ type: 'success', text: `Đã xóa từ vựng: ${item.word}` });
        fetchData();
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    }
  };

  // Grammar handlers
  const handleGrammarSubmit = async (dto: CreateGrammarDto) => {
    if (editingGrammar) {
      await adminApiClient.updateGrammar(editingGrammar.id, dto);
      setMessage({ type: 'success', text: `Cập nhật thành công mẫu ngữ pháp: ${dto.title}` });
    } else {
      await adminApiClient.createGrammar(dto);
      setMessage({ type: 'success', text: `Tạo mới thành công mẫu ngữ pháp: ${dto.title}` });
    }
    fetchData();
  };

  const handleGrammarDelete = async (item: GrammarDetailDto) => {
    if (window.confirm(`Bạn có chắc muốn xóa mẫu ngữ pháp "${item.title}"?`)) {
      try {
        await adminApiClient.deleteGrammar(item.id);
        setMessage({ type: 'success', text: `Đã xóa mẫu ngữ pháp: ${item.title}` });
        fetchData();
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌸</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Sakura Admin Portal</h1>
              <p className="text-[10px] text-slate-400">Hệ thống Quản trị & Kiểm duyệt Nội dung</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              Admin Mode (Authorized)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => {
              setActiveTab('KANJI');
              setSearch('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'KANJI'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chữ Hán (Kanji)
          </button>
          <button
            onClick={() => {
              setActiveTab('VOCABULARY');
              setSearch('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'VOCABULARY'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Từ vựng (Vocabulary)
          </button>
          <button
            onClick={() => {
              setActiveTab('GRAMMAR');
              setSearch('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'GRAMMAR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ngữ pháp (Grammar)
          </button>
        </div>

        {/* Status Toast Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-700 font-normal ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Bar: Search, JLPT Filter, Add Button */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Tìm kiếm ${activeTab.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50/50"
              />
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            {/* JLPT Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedJlpt('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedJlpt === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              {JLPT_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedJlpt(lvl)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedJlpt === lvl
                      ? 'bg-pink-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* New Item Trigger */}
          <button
            onClick={() => {
              if (activeTab === 'KANJI') {
                setEditingKanji(null);
                setIsKanjiFormOpen(true);
              } else if (activeTab === 'VOCABULARY') {
                setEditingVocab(null);
                setIsVocabFormOpen(true);
              } else {
                setEditingGrammar(null);
                setIsGrammarFormOpen(true);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>
              Thêm mới {activeTab === 'KANJI' ? 'Kanji' : activeTab === 'VOCABULARY' ? 'Từ vựng' : 'Ngữ pháp'}
            </span>
          </button>
        </div>

        {/* Dynamic Table Section */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'KANJI' ? (
          <KanjiTable
            items={kanjiItems}
            loading={loading}
            onEdit={(item) => {
              setEditingKanji(item);
              setIsKanjiFormOpen(true);
            }}
            onDelete={handleKanjiDelete}
          />
        ) : activeTab === 'VOCABULARY' ? (
          <VocabularyTable
            items={vocabItems}
            onEdit={(item) => {
              setEditingVocab(item);
              setIsVocabFormOpen(true);
            }}
            onDelete={handleVocabDelete}
          />
        ) : (
          <GrammarTable
            items={grammarItems}
            onEdit={(item) => {
              setEditingGrammar(item);
              setIsGrammarFormOpen(true);
            }}
            onDelete={handleGrammarDelete}
          />
        )}
      </main>

      {/* Modals */}
      <KanjiFormModal
        isOpen={isKanjiFormOpen}
        onClose={() => setIsKanjiFormOpen(false)}
        onSubmit={handleKanjiSubmit}
        initialData={editingKanji}
      />

      <VocabularyFormModal
        isOpen={isVocabFormOpen}
        onClose={() => setIsVocabFormOpen(false)}
        onSubmit={handleVocabSubmit}
        initialData={editingVocab}
      />

      <GrammarFormModal
        isOpen={isGrammarFormOpen}
        onClose={() => setIsGrammarFormOpen(false)}
        onSubmit={handleGrammarSubmit}
        initialData={editingGrammar}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto bg-white">
        Sakura Swipe Learning Admin • Phân quyền Quản trị viên
      </footer>
    </div>
  );
};
