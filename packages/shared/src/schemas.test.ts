import { describe, it, expect } from 'vitest';
import {
  CreateKanjiSchema,
  QuestionSchema,
  SubmitAnswerSchema,
  ProgressEventSchema,
  FeedCardSchema,
  NextFeedBodySchema,
  JLPT_LEVELS,
  ITEM_TYPES,
  SWIPE_ACTIONS,
  CreateVocabularySchema,
  UpdateVocabularySchema,
  VocabularyListQuerySchema,
  CreateGrammarSchema,
  UpdateGrammarSchema,
  GrammarListQuerySchema,
} from './index.js';

describe('Shared Constants and Enums', () => {
  it('should have correct JLPT levels and actions', () => {
    expect(JLPT_LEVELS).toEqual(['N5', 'N4', 'N3', 'N2', 'N1']);
    expect(ITEM_TYPES).toContain('KANJI');
    expect(SWIPE_ACTIONS).toContain('SWIPE_RIGHT_KNOWN');
    expect(SWIPE_ACTIONS).toContain('SWIPE_LEFT_AGAIN');
  });
});

describe('Kanji Schemas', () => {
  it('should validate a valid Kanji payload', () => {
    const validKanji = {
      character: '日',
      hanViet: 'NHẬT',
      onyomi: 'ニチ, ジツ',
      kunyomi: 'ひ, -び, -か',
      strokeCount: 4,
      meaningVi: 'Mặt trời, ban ngày, ngày',
      jlptLevels: ['N5'],
      examples: [
        {
          word: '日本',
          reading: 'にほん',
          meaningVi: 'Nhật Bản',
          sentenceJp: '日本の春は桜が綺麗です。',
          sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
        },
      ],
    };

    const parsed = CreateKanjiSchema.safeParse(validKanji);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.character).toBe('日');
      expect(parsed.data.examples).toHaveLength(1);
    }
  });

  it('should reject invalid strokeCount or empty character', () => {
    const invalidKanji = {
      character: '',
      hanViet: 'NHẬT',
      strokeCount: 0,
      meaningVi: 'Mặt trời',
      jlptLevels: ['N5'],
    };

    const parsed = CreateKanjiSchema.safeParse(invalidKanji);
    expect(parsed.success).toBe(false);
  });
});

describe('Vocabulary Schemas', () => {
  it('should validate a valid Vocabulary payload', () => {
    const validVocab = {
      word: '桜',
      reading: 'さくら',
      romaji: 'sakura',
      meaningVi: 'Hoa anh đào',
      partOfSpeech: 'noun',
      jlptLevels: ['N5'],
      kanjiIds: [1],
      examples: [
        {
          sentenceJp: '春に桜が咲きます。',
          sentenceVi: 'Hoa anh đào nở vào mùa xuân.',
        },
      ],
    };

    const parsed = CreateVocabularySchema.safeParse(validVocab);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.word).toBe('桜');
      expect(parsed.data.reading).toBe('さくら');
      expect(parsed.data.jlptLevels).toContain('N5');
    }
  });

  it('should reject empty word or reading', () => {
    const invalidVocab = {
      word: '',
      reading: '',
      meaningVi: 'Hoa anh đào',
    };

    const parsed = CreateVocabularySchema.safeParse(invalidVocab);
    expect(parsed.success).toBe(false);
  });

  it('should validate vocabulary list query schema', () => {
    const validQuery = {
      page: 2,
      limit: 20,
      jlpt: 'N4',
      search: 'sakura',
    };

    const parsed = VocabularyListQuerySchema.safeParse(validQuery);
    expect(parsed.success).toBe(true);
  });

  it('should validate partial update for vocabulary', () => {
    const partialUpdate = {
      meaningVi: 'Hoa anh đào nở mùa xuân',
    };

    const parsed = UpdateVocabularySchema.safeParse(partialUpdate);
    expect(parsed.success).toBe(true);
  });
});

describe('Grammar Schemas', () => {
  it('should validate a valid Grammar payload', () => {
    const validGrammar = {
      title: '〜てください',
      structure: 'V-て + ください',
      meaningVi: 'Hãy làm V (yêu cầu lịch sự)',
      explanation: 'Dùng khi muốn yêu cầu, nhờ vả ai đó làm gì một cách lịch sự.',
      jlptLevels: ['N5'],
      sentences: [
        {
          sentenceJp: '日本語で話してください。',
          sentenceVi: 'Xin hãy nói bằng tiếng Nhật.',
        },
      ],
    };

    const parsed = CreateGrammarSchema.safeParse(validGrammar);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('〜てください');
      expect(parsed.data.sentences).toHaveLength(1);
    }
  });

  it('should reject grammar without structure or meaning', () => {
    const invalidGrammar = {
      title: '〜てください',
      structure: '',
      meaningVi: '',
    };

    const parsed = CreateGrammarSchema.safeParse(invalidGrammar);
    expect(parsed.success).toBe(false);
  });

  it('should validate grammar list query schema', () => {
    const validQuery = {
      page: 1,
      limit: 15,
      jlpt: 'N5',
    };

    const parsed = GrammarListQuerySchema.safeParse(validQuery);
    expect(parsed.success).toBe(true);
  });

  it('should validate partial update for grammar', () => {
    const partialUpdate = {
      meaningVi: 'Xin vui lòng làm gì đó',
    };

    const parsed = UpdateGrammarSchema.safeParse(partialUpdate);
    expect(parsed.success).toBe(true);
  });
});

describe('Question Schemas', () => {
  it('should validate a question with options', () => {
    const validQuestion = {
      id: 10,
      questionType: 'MULTIPLE_CHOICE',
      prompt: 'Chọn cách đọc đúng của chữ Kanji: 日 (trong từ 日本)',
      explanation: 'Trong từ 日本, chữ 日 đọc là に',
      itemType: 'KANJI',
      itemId: 1,
      options: [
        { id: 1, content: 'に', isCorrect: true },
        { id: 2, content: 'つき', isCorrect: false },
      ],
    };

    const parsed = QuestionSchema.safeParse(validQuestion);
    expect(parsed.success).toBe(true);
  });

  it('should reject submit answer with invalid UUID', () => {
    const invalidSubmit = {
      clientEventId: 'not-a-valid-uuid',
      selectedOptionId: 1,
      durationMs: 1200,
    };

    const parsed = SubmitAnswerSchema.safeParse(invalidSubmit);
    expect(parsed.success).toBe(false);
  });

  it('should accept submit answer with valid UUID', () => {
    const validSubmit = {
      clientEventId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      selectedOptionId: 1,
      durationMs: 1200,
    };

    const parsed = SubmitAnswerSchema.safeParse(validSubmit);
    expect(parsed.success).toBe(true);
  });
});

describe('Progress Event Schemas', () => {
  it('should validate swipe event with idempotency UUID', () => {
    const validEvent = {
      clientEventId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      itemType: 'KANJI',
      itemId: 1,
      action: 'SWIPE_RIGHT_KNOWN',
      metadata: {
        timeSpentMs: 3500,
      },
    };

    const parsed = ProgressEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid swipe action', () => {
    const invalidEvent = {
      clientEventId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      itemType: 'KANJI',
      itemId: 1,
      action: 'INVALID_ACTION',
    };

    const parsed = ProgressEventSchema.safeParse(invalidEvent);
    expect(parsed.success).toBe(false);
  });
});

describe('Feed Schemas', () => {
  it('should validate feed card with SRS context', () => {
    const validFeedCard = {
      cardId: 'kanji_1',
      cardType: 'KANJI',
      content: { character: '日' },
      srsContext: {
        isReview: false,
        stage: 0,
      },
    };

    const parsed = FeedCardSchema.safeParse(validFeedCard);
    expect(parsed.success).toBe(true);
  });

  it('should validate next feed request', () => {
    const validNextFeed = {
      currentCardIds: ['kanji_1', 'kanji_2'],
      limit: 10,
      jlpt: 'N5',
    };

    const parsed = NextFeedBodySchema.safeParse(validNextFeed);
    expect(parsed.success).toBe(true);
  });
});
