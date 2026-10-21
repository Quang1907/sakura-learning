import React, { useState } from 'react';
import { KanjiSwipeFeed } from './components/KanjiSwipeFeed.js';
import { KanjiExplorer } from './components/KanjiExplorer.js';
import { VocabularyExplorer } from './components/VocabularyExplorer.js';
import { GrammarExplorer } from './components/GrammarExplorer.js';
import { LearningStatsModal } from './components/LearningStatsModal.js';

type TabType = 'FEED' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('FEED');
  const [userExp, setUserExp] = useState(120);
  const [userStreak] = useState(3);
  const [showStatsModal, setShowStatsModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-pink-50/20 to-white text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🌸</span>
            <div>
              <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                Sakura Swipe
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Học tiếng Nhật vuốt dọc
              </p>
            </div>
          </div>

          {/* User Gamification Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
              title="Xem thống kê chi tiết"
            >
              <span>🔥</span>
              <span>{userStreak} ngày</span>
            </button>
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold hover:bg-pink-100 transition-colors cursor-pointer"
              title="Xem thống kê chi tiết"
            >
              <span>⭐</span>
              <span>{userExp} EXP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="max-w-lg mx-auto w-full px-4 pt-4">
        <div className="grid grid-cols-4 p-1 bg-pink-100/50 rounded-2xl border border-pink-100 text-center">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'FEED'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📱</span>
            <span className="hidden sm:inline">Bảng tin</span>
            <span className="sm:hidden">Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('KANJI')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'KANJI'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>漢</span>
            <span>Kanji</span>
          </button>
          <button
            onClick={() => setActiveTab('VOCABULARY')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'VOCABULARY'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📖</span>
            <span className="hidden sm:inline">Từ vựng</span>
            <span className="sm:hidden">Từ</span>
          </button>
          <button
            onClick={() => setActiveTab('GRAMMAR')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'GRAMMAR'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📐</span>
            <span className="hidden sm:inline">Ngữ pháp</span>
            <span className="sm:hidden">Pháp</span>
          </button>
        </div>
      </nav>

      {/* Page Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-start">
        {activeTab === 'FEED' && (
          <KanjiSwipeFeed
            onExpChange={(newExp) => setUserExp(newExp)}
            onOpenStats={() => setShowStatsModal(true)}
          />
        )}
        {activeTab === 'KANJI' && <KanjiExplorer />}
        {activeTab === 'VOCABULARY' && <VocabularyExplorer />}
        {activeTab === 'GRAMMAR' && <GrammarExplorer />}
      </main>

      {/* Learning Stats Modal */}
      {showStatsModal && (
        <LearningStatsModal onClose={() => setShowStatsModal(false)} />
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-pink-50">
        Sakura Swipe Learning © 2026 — Nền tảng học tiếng Nhật Mobile-First
      </footer>
    </div>
  );
};
