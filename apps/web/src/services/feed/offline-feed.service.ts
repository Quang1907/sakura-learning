import {
  FeedCardDto,
  JlptLevel,
  SwipeAction,
  QuestionResultDto,
} from '@sakura/shared';
import { storageService, StorageService } from '../storage/indexeddb.js';

export type OfflineContentType = 'ALL' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR';

export class OfflineFeedService {
  constructor(private readonly storage: StorageService = storageService) {}

  /**
   * Generate feed cards from locally downloaded IndexedDB content.
   * Enforces Anti-Repetition and Anti-Fatigue rules.
   */
  public async generateOfflineFeed(params: {
    limit?: number;
    currentCardIds?: string[];
    jlpt?: JlptLevel;
    contentType?: OfflineContentType;
  }): Promise<{ items: FeedCardDto[]; remainingCount: number; isOffline: boolean }> {
    const { limit = 10, currentCardIds = [], jlpt = 'N5', contentType = 'ALL' } = params;
    const excludeSet = new Set(currentCardIds);

    const [kanjiList, vocabList, grammarList, questionList] = await Promise.all([
      contentType === 'ALL' || contentType === 'KANJI' ? this.storage.getOfflineKanji(jlpt) : [],
      contentType === 'ALL' || contentType === 'VOCABULARY' ? this.storage.getOfflineVocabulary(jlpt) : [],
      contentType === 'ALL' || contentType === 'GRAMMAR' ? this.storage.getOfflineGrammar(jlpt) : [],
      this.storage.getOfflineQuestions(),
    ]);

    const cards: FeedCardDto[] = [];

    // Map Kanji to FeedCardDto
    for (const k of kanjiList) {
      const cardId = `kanji_${k.id}`;
      if (!excludeSet.has(cardId)) {
        cards.push({
          cardId,
          cardType: 'KANJI',
          content: k,
          srsContext: { isReview: false, stage: 0 },
        });
      }
    }

    // Map Vocabulary to FeedCardDto
    for (const v of vocabList) {
      const cardId = `vocab_${v.id}`;
      if (!excludeSet.has(cardId)) {
        cards.push({
          cardId,
          cardType: 'VOCABULARY',
          content: v,
          srsContext: { isReview: false, stage: 0 },
        });
      }
    }

    // Map Grammar to FeedCardDto
    for (const g of grammarList) {
      const cardId = `grammar_${g.id}`;
      if (!excludeSet.has(cardId)) {
        cards.push({
          cardId,
          cardType: 'GRAMMAR',
          content: g,
          srsContext: { isReview: false, stage: 0 },
        });
      }
    }

    // Shuffle content cards
    const shuffledContent = this.shuffle(cards);

    // Filter relevant questions and sanitize options
    const availableQuestions = questionList.filter((q) => !excludeSet.has(`question_${q.id}`));
    const sanitizedQuestionCards: FeedCardDto[] = availableQuestions.map((q) => ({
      cardId: `question_${q.id}`,
      cardType: 'QUESTION',
      content: {
        id: q.id,
        questionType: q.questionType,
        prompt: q.prompt,
        options: q.options.map((opt) => ({
          id: opt.id,
          content: opt.content,
        })),
      },
    }));

    // Interleave questions according to Anti-Fatigue: max 1 question every 3 cards, never consecutive
    const result: FeedCardDto[] = [];
    let qIndex = 0;

    for (let i = 0; i < shuffledContent.length && result.length < limit; i++) {
      result.push(shuffledContent[i]!);

      // Insert a question card if available and not right after another question
      if (
        sanitizedQuestionCards.length > 0 &&
        (result.length + 1) % 4 === 0 &&
        qIndex < sanitizedQuestionCards.length
      ) {
        result.push(sanitizedQuestionCards[qIndex++]!);
      }
    }

    // If result is empty because no downloaded package exists, provide default starter cards
    if (result.length === 0) {
      return {
        items: this.getStarterOfflineCards(),
        remainingCount: 0,
        isOffline: true,
      };
    }

    return {
      items: result.slice(0, limit),
      remainingCount: Math.max(0, shuffledContent.length - result.length),
      isOffline: true,
    };
  }

  /**
   * Grade questions locally offline using the stored question options.
   */
  public async gradeQuestionOffline(
    questionId: number,
    selectedOptionId: number | null,
    textAnswer?: string | null,
  ): Promise<QuestionResultDto> {
    const questions = await this.storage.getOfflineQuestions();
    const target = questions.find((q) => q.id === questionId);

    if (!target) {
      return {
        isCorrect: false,
        explanation: 'Không tìm thấy dữ liệu câu hỏi trong bộ nhớ ngoại tuyến.',
        expEarned: 0,
        srsUpdated: false,
      };
    }

    let isCorrect = false;
    let correctOptionId: number | undefined;

    if (selectedOptionId !== null) {
      const correctOption = target.options.find((opt) => opt.isCorrect);
      correctOptionId = correctOption?.id;
      isCorrect = selectedOptionId === correctOptionId;
    } else if (textAnswer) {
      const normalized = textAnswer.trim().toLowerCase();
      // Check if text matches any correct option or acceptable answers
      const correctOption = target.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption.content.trim().toLowerCase() === normalized) {
        isCorrect = true;
      }
    }

    return {
      isCorrect,
      correctOptionId,
      explanation: target.explanation || 'Đáp án đã được lưu trong bộ nhớ offline.',
      expEarned: isCorrect ? 10 : 0,
      srsUpdated: true,
      nextReviewAt: new Date(Date.now() + (isCorrect ? 24 * 3600 * 1000 : 300 * 1000)).toISOString(),
    };
  }

  /**
   * Calculate next review interval locally (SM-2 simplified for offline mode)
   */
  public calculateOfflineSrs(currentStage: number, action: SwipeAction): { newStage: number; expEarned: number } {
    if (action === 'SWIPE_RIGHT_KNOWN') {
      const newStage = Math.min(8, currentStage + 1);
      return { newStage, expEarned: 5 };
    }
    return { newStage: 1, expEarned: 1 };
  }

  private shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i]!;
      copy[i] = copy[j]!;
      copy[j] = temp;
    }
    return copy;
  }

  private getStarterOfflineCards(): FeedCardDto[] {
    return [
      {
        cardId: 'offline_kanji_1',
        cardType: 'KANJI',
        content: {
          id: 1,
          character: '日',
          hanViet: 'NHẬT',
          onyomi: 'ニチ, ジツ',
          kunyomi: 'ひ, -び, -か',
          strokeCount: 4,
          meaningVi: 'Mặt trời, ban ngày, ngày',
          examples: [
            {
              word: '日本',
              reading: 'にほん',
              meaningVi: 'Nhật Bản',
            },
          ],
        },
        srsContext: { isReview: false, stage: 0 },
      },
      {
        cardId: 'offline_vocab_1',
        cardType: 'VOCABULARY',
        content: {
          id: 1,
          word: '日本',
          reading: 'にほん',
          romaji: 'nihon',
          partOfSpeech: 'noun',
          meaningVi: 'Nhật Bản',
          examples: [
            {
              sentenceJp: '日本の春は桜が綺麗です。',
              sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
            },
          ],
        },
        srsContext: { isReview: false, stage: 0 },
      },
    ];
  }
}

export const offlineFeedService = new OfflineFeedService();
