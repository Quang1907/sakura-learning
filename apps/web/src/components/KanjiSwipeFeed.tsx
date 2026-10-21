import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FeedCardDto, QuestionResultDto, JlptLevel, JLPT_LEVELS, ItemType } from '@sakura/shared';
import { apiClient } from '../api/client.js';
import { VocabularyCard } from './VocabularyCard.js';
import { GrammarCard } from './GrammarCard.js';
import { offlineFeedService } from '../services/feed/offline-feed.service.js';
import { storageService } from '../services/storage/indexeddb.js';
import { syncService } from '../services/sync/sync.service.js';

interface SwipeFeedProps {
  onExpChange?: (newExp: number) => void;
  onOpenStats?: () => void;
}

type ContentFilterType = 'ALL' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR';

export const KanjiSwipeFeed: React.FC<SwipeFeedProps> = ({ onExpChange, onOpenStats }) => {
  const [cards, setCards] = useState<FeedCardDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel>('N5');
  const [selectedContentType, setSelectedContentType] = useState<ContentFilterType>('ALL');

  // Question state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionResultDto | null>(null);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Offline state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  // Touch tracking for gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentCard = cards[currentIndex] ?? null;

  const loadFeed = useCallback(
    async (resetIndex = true) => {
      try {
        setLoading(true);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const offFeed = await offlineFeedService.generateOfflineFeed({
            limit: 10,
            currentCardIds: [],
            jlpt: selectedJlpt,
            contentType: selectedContentType,
          });
          setCards(offFeed.items);
          setIsOfflineMode(true);
          if (resetIndex) setCurrentIndex(0);
          return;
        }

        const res = await apiClient.getFeed(10, [], selectedJlpt, selectedContentType);
        setCards(res.items);
        setIsOfflineMode(false);
        if (resetIndex) {
          setCurrentIndex(0);
        }
      } catch {
        // Fallback to offline feed service from IndexedDB
        const offFeed = await offlineFeedService.generateOfflineFeed({
          limit: 10,
          currentCardIds: [],
          jlpt: selectedJlpt,
          contentType: selectedContentType,
        });
        setCards(offFeed.items);
        setIsOfflineMode(true);
        if (resetIndex) {
          setCurrentIndex(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedJlpt, selectedContentType],
  );

  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setQuestionResult(null);
      setFeedback(null);
    } else {
      // Load more cards retaining buffer history
      loadFeed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setQuestionResult(null);
      setFeedback(null);
    }
  };

  const handleSwipeKnown = async () => {
    if (!currentCard) return;

    // Disallow skipping unanswered question cards
    if (currentCard.cardType === 'QUESTION' && !questionResult) {
      setFeedback('Vui lòng trả lời câu hỏi trước khi đánh dấu đã biết!');
      return;
    }

    const eventId = crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}`;
    const content = currentCard.content as { id?: number };
    const itemType = (currentCard.cardType === 'QUESTION' ? 'KANJI' : currentCard.cardType) as ItemType;
    const itemId = Number(content.id ?? 1);

    setFeedback('Đã thuộc! (+5 EXP)');
    onExpChange?.(5);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await apiClient.recordProgressEvent({
        clientEventId: eventId,
        itemType,
        itemId,
        action: 'SWIPE_RIGHT_KNOWN',
      });
      if (res.newTotalExp !== undefined) {
        onExpChange?.(res.newTotalExp);
      }
    } catch {
      // Store in IndexedDB Outbox and update local progress
      await storageService.enqueueOutboxEvent({
        clientEventId: eventId,
        userId: 2,
        itemType,
        itemId,
        action: 'SWIPE_RIGHT_KNOWN',
        createdAt: new Date().toISOString(),
        metadata: { timeSpentMs: 2000, offlineTimestamp: new Date().toISOString() },
      });
      await storageService.saveLocalProgress({
        key: `${itemType}_${itemId}`,
        itemType,
        itemId,
        status: 'LEARNING',
        srsStage: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        totalViews: 1,
        totalCorrect: 1,
        totalIncorrect: 0,
        lastStudiedAt: new Date().toISOString(),
      });
      syncService.refreshPendingCount();
    } finally {
      setTimeout(handleNext, 500);
    }
  };

  const handleSwipeNeedsReview = async () => {
    if (!currentCard) return;

    // Disallow skipping unanswered question cards
    if (currentCard.cardType === 'QUESTION' && !questionResult) {
      setFeedback('Vui lòng trả lời câu hỏi trước khi bỏ qua!');
      return;
    }

    const eventId = crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}`;
    const content = currentCard.content as { id?: number };
    const itemType = (currentCard.cardType === 'QUESTION' ? 'KANJI' : currentCard.cardType) as ItemType;
    const itemId = Number(content.id ?? 1);

    setFeedback('Cần học lại! Đã lên lịch ôn 4h tới.');

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      await apiClient.recordProgressEvent({
        clientEventId: eventId,
        itemType,
        itemId,
        action: 'SWIPE_LEFT_AGAIN',
      });
    } catch {
      // Store in IndexedDB Outbox
      await storageService.enqueueOutboxEvent({
        clientEventId: eventId,
        userId: 2,
        itemType,
        itemId,
        action: 'SWIPE_LEFT_AGAIN',
        createdAt: new Date().toISOString(),
        metadata: { timeSpentMs: 1500, offlineTimestamp: new Date().toISOString() },
      });
      await storageService.saveLocalProgress({
        key: `${itemType}_${itemId}`,
        itemType,
        itemId,
        status: 'LEARNING',
        srsStage: 0,
        easeFactor: 2.4,
        nextReviewAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        totalViews: 1,
        totalCorrect: 0,
        totalIncorrect: 1,
        lastStudiedAt: new Date().toISOString(),
      });
      syncService.refreshPendingCount();
    } finally {
      setTimeout(handleNext, 500);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentCard || currentCard.cardType !== 'QUESTION' || selectedOption === null) return;

    const qContent = currentCard.content as { id: number };
    const eventId = crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}`;

    try {
      setSubmittingQuestion(true);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const result = await apiClient.submitQuestionAnswer(qContent.id, {
        clientEventId: eventId,
        selectedOptionId: selectedOption,
        durationMs: 1500,
      });

      setQuestionResult(result);
      if (result.isCorrect) {
        setFeedback('Chính xác! (+10 EXP)');
        if (result.expEarned) {
          onExpChange?.(result.expEarned);
        }
      } else {
        setFeedback('Chưa chính xác! Thử xem giải thích bên dưới.');
      }
    } catch {
      // Grade question locally from IndexedDB
      const offlineResult = await offlineFeedService.gradeQuestionOffline(
        qContent.id,
        selectedOption,
      );
      setQuestionResult(offlineResult);

      if (offlineResult.isCorrect) {
        setFeedback('Chính xác (Chấm ngoại tuyến)! (+10 EXP)');
        onExpChange?.(10);
      } else {
        setFeedback('Chưa chính xác! Thử xem giải thích bên dưới.');
      }

      // Enqueue event in outbox
      await storageService.enqueueOutboxEvent({
        clientEventId: eventId,
        userId: 2,
        itemType: 'KANJI',
        itemId: qContent.id,
        action: offlineResult.isCorrect ? 'SWIPE_RIGHT_KNOWN' : 'SWIPE_LEFT_AGAIN',
        createdAt: new Date().toISOString(),
        metadata: {
          timeSpentMs: 1500,
          offlineTimestamp: new Date().toISOString(),
        },
      });
      syncService.refreshPendingCount();
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Touch gesture listeners
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    const threshold = 50;

    // Detect primary swipe direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > threshold) {
        handleSwipeKnown(); // Right swipe: known
      } else if (diffX < -threshold) {
        handleSwipeNeedsReview(); // Left swipe: review
      }
    } else {
      // Vertical swipe
      if (diffY < -threshold) {
        // Swipe Up: next card
        if (currentCard?.cardType === 'QUESTION' && !questionResult) {
          setFeedback('Vui lòng trả lời câu hỏi trước khi chuyển tiếp!');
        } else {
          handleNext();
        }
      } else if (diffY > threshold) {
        handlePrevious(); // Swipe Down: previous card
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleSwipeKnown();
      if (e.key === 'ArrowLeft') handleSwipeNeedsReview();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (e.key === 'ArrowUp') {
          if (currentCard?.cardType === 'QUESTION' && !questionResult) {
            setFeedback('Vui lòng trả lời câu hỏi trước khi chuyển tiếp!');
          } else {
            handleNext();
          }
        } else {
          handlePrevious();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, questionResult, handleNext, handlePrevious, handleSwipeKnown, handleSwipeNeedsReview]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center text-slate-400">
        <div className="text-4xl animate-bounce mb-3">🌸</div>
        <p className="font-semibold text-slate-600 text-sm">Đang tải thẻ học...</p>
        <p className="text-xs text-slate-400 mt-1">Chuẩn bị nội dung từ vựng, kanji & ngữ pháp</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center bg-white rounded-3xl border border-pink-100 shadow-sm max-w-md mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-lg font-bold text-slate-800">Đã hoàn thành lượt học!</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Bạn đã duyệt qua tất cả thẻ trong bộ lọc này. Hãy tải thêm thẻ mới hoặc đổi cấp độ JLPT.
        </p>
        <button
          onClick={() => loadFeed(true)}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow hover:shadow-md transition-all"
        >
          Tải thẻ tiếp theo 🔄
        </button>
      </div>
    );
  }

  const isQuestion = currentCard?.cardType === 'QUESTION';
  const qContent = isQuestion
    ? (currentCard?.content as {
        id: number;
        prompt: string;
        options?: Array<{ id: number; content: string }>;
      })
    : null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Filter and Stats Bar */}
      <div className="w-full mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* JLPT Filter Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-pink-100 shadow-xs">
            {JLPT_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedJlpt(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  selectedJlpt === lvl
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Quick Stats Trigger */}
          {onOpenStats && (
            <button
              onClick={onOpenStats}
              className="px-3 py-1.5 rounded-xl bg-white border border-pink-100 text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors shadow-xs flex items-center gap-1"
            >
              <span>📊</span>
              <span>Thống kê</span>
            </button>
          )}
        </div>

        {/* Offline Mode Banner */}
        {isOfflineMode && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span>📱</span> Chế độ học Ngoại tuyến (Đã lưu máy)
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">Tự động đồng bộ</span>
          </div>
        )}

        {/* Content Type Filter */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-white/70 rounded-xl border border-pink-100/70 text-[11px] font-bold">
          <button
            onClick={() => setSelectedContentType('ALL')}
            className={`py-1 rounded-lg transition-colors ${
              selectedContentType === 'ALL'
                ? 'bg-pink-50 text-pink-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedContentType('KANJI')}
            className={`py-1 rounded-lg transition-colors ${
              selectedContentType === 'KANJI'
                ? 'bg-pink-50 text-pink-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Kanji
          </button>
          <button
            onClick={() => setSelectedContentType('VOCABULARY')}
            className={`py-1 rounded-lg transition-colors ${
              selectedContentType === 'VOCABULARY'
                ? 'bg-pink-50 text-pink-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Từ vựng
          </button>
          <button
            onClick={() => setSelectedContentType('GRAMMAR')}
            className={`py-1 rounded-lg transition-colors ${
              selectedContentType === 'GRAMMAR'
                ? 'bg-pink-50 text-pink-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ngữ pháp
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
        <span>
          Thẻ {currentIndex + 1} / {cards.length}
        </span>
        <div className="flex-1 mx-3 h-1.5 bg-pink-100/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-pink-600 font-extrabold uppercase">
          {currentCard?.cardType}
        </span>
      </div>

      {/* Interactive Feedback Toast */}
      {feedback && (
        <div className="w-full mb-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
          <span>✨</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Swipeable Card Container */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full min-h-[500px] rounded-3xl bg-white border border-pink-100/80 shadow-xl overflow-hidden flex flex-col justify-between transition-all transform hover:shadow-2xl select-none"
      >
        {isQuestion && qContent ? (
          /* QUESTION CARD VIEW */
          <div className="flex-1 flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                  Thử thách câu hỏi
                </span>
                <span className="text-xs text-slate-400">Chọn 1 đáp án đúng</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug mb-5">
                {qContent.prompt}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {qContent.options?.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={questionResult !== null}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                      questionResult
                        ? opt.id === questionResult.correctOptionId
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                          : opt.id === selectedOption
                            ? 'bg-rose-100 border-rose-500 text-rose-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        : selectedOption === opt.id
                          ? 'bg-pink-100 border-pink-500 text-pink-900 ring-2 ring-pink-300'
                          : 'bg-slate-50/80 border-slate-200 hover:border-pink-300 text-slate-700'
                    }`}
                  >
                    {opt.content}
                  </button>
                ))}
              </div>

              {/* Explanation after grading */}
              {questionResult && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">Lời giải:</span>
                  <p className="text-slate-600 leading-relaxed">{questionResult.explanation}</p>
                </div>
              )}
            </div>

            {/* Submit or Continue button */}
            <div className="mt-6">
              {!questionResult ? (
                <button
                  disabled={selectedOption === null || submittingQuestion}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submittingQuestion ? 'Đang chấm bài...' : 'Xác nhận đáp án'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm shadow hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Thẻ tiếp theo ➔
                </button>
              )}
            </div>
          </div>
        ) : currentCard?.cardType === 'VOCABULARY' ? (
          /* VOCABULARY CARD VIEW */
          <div className="flex-1 flex flex-col justify-between">
            <VocabularyCard
              vocab={currentCard.content}
              isReview={currentCard.srsContext?.isReview}
              srsStage={currentCard.srsContext?.stage}
            />
            {/* Bottom swipe action buttons */}
            <div className="grid grid-cols-2 gap-3 p-4 pt-3 border-t border-pink-100/60 bg-pink-50/20">
              <button
                onClick={handleSwipeNeedsReview}
                className="py-3 px-4 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ◀ Cần học lại
              </button>
              <button
                onClick={handleSwipeKnown}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Đã thuộc ▶
              </button>
            </div>
          </div>
        ) : currentCard?.cardType === 'GRAMMAR' ? (
          /* GRAMMAR CARD VIEW */
          <div className="flex-1 flex flex-col justify-between">
            <GrammarCard
              grammar={currentCard.content}
              isReview={currentCard.srsContext?.isReview}
              srsStage={currentCard.srsContext?.stage}
            />
            {/* Bottom swipe action buttons */}
            <div className="grid grid-cols-2 gap-3 p-4 pt-3 border-t border-purple-100/60 bg-purple-50/20">
              <button
                onClick={handleSwipeNeedsReview}
                className="py-3 px-4 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ◀ Cần học lại
              </button>
              <button
                onClick={handleSwipeKnown}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Đã thuộc ▶
              </button>
            </div>
          </div>
        ) : currentCard?.cardType === 'KANJI' ? (
          /* KANJI CARD VIEW */
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="text-center py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold">
                  Kanji {selectedJlpt}
                </span>
                {currentCard.srsContext?.isReview && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                    Ôn tập • Level {currentCard.srsContext.stage}
                  </span>
                )}
              </div>

              <div className="text-8xl font-black font-serif text-slate-800 my-2 drop-shadow-sm">
                {(currentCard.content as { character?: string }).character}
              </div>
              <h2 className="text-2xl font-black text-pink-600 tracking-widest uppercase">
                {(currentCard.content as { hanViet?: string }).hanViet}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {(currentCard.content as { meaningVi?: string }).meaningVi}
              </p>

              {/* Readings */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-left">
                <div className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-100">
                  <span className="font-bold text-pink-600 block text-[10px] uppercase">
                    On-yomi
                  </span>
                  <span className="font-medium text-slate-700 truncate">
                    {(currentCard.content as { onyomi?: string }).onyomi || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="font-bold text-emerald-600 block text-[10px] uppercase">
                    Kun-yomi
                  </span>
                  <span className="font-medium text-slate-700 truncate">
                    {(currentCard.content as { kunyomi?: string }).kunyomi || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom swipe accessibility action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-pink-100/60">
              <button
                onClick={handleSwipeNeedsReview}
                className="py-3 px-4 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ◀ Cần học lại
              </button>
              <button
                onClick={handleSwipeKnown}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Đã thuộc ▶
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation history controls */}
      <div className="flex items-center justify-between w-full mt-3 px-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors font-medium flex items-center gap-1 cursor-pointer"
        >
          ▲ Xem thẻ trước
        </button>

        <button
          onClick={handleNext}
          className="text-xs text-pink-600 hover:text-pink-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          Thẻ tiếp theo ▼
        </button>
      </div>
    </div>
  );
};

export const SwipeFeed = KanjiSwipeFeed;
