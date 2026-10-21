import { describe, it, expect } from 'vitest';
import { QuestionGradingService, QuestionData } from './question-grading.service.js';

describe('QuestionGradingService', () => {
  const service = new QuestionGradingService();

  describe('Multiple Choice Grading', () => {
    const mcQuestion: QuestionData = {
      id: 1,
      questionType: 'MULTIPLE_CHOICE',
      prompt: 'Chọn cách đọc đúng của chữ Kanji: 日 (trong từ 日本)',
      explanationVi: 'Trong từ 日本, chữ 日 đọc là に.',
      options: [
        { id: 10, content: 'に', isCorrect: true },
        { id: 11, content: 'つき', isCorrect: false },
        { id: 12, content: 'ほん', isCorrect: false },
      ],
    };

    it('should mark as correct when selectedOptionId matches correct option', () => {
      const result = service.gradeAnswer(mcQuestion, { selectedOptionId: 10 });

      expect(result.isCorrect).toBe(true);
      expect(result.correctOptionId).toBe(10);
      expect(result.expEarned).toBe(10);
      expect(result.explanation).toBe(mcQuestion.explanationVi);
    });

    it('should mark as incorrect when selectedOptionId is wrong', () => {
      const result = service.gradeAnswer(mcQuestion, { selectedOptionId: 11 });

      expect(result.isCorrect).toBe(false);
      expect(result.correctOptionId).toBe(10);
      expect(result.expEarned).toBe(0);
    });

    it('should mark as incorrect when selectedOptionId is missing or null', () => {
      const result = service.gradeAnswer(mcQuestion, { selectedOptionId: null });

      expect(result.isCorrect).toBe(false);
      expect(result.expEarned).toBe(0);
    });
  });

  describe('Fill In Blank Grading', () => {
    const fillQuestion: QuestionData = {
      id: 2,
      questionType: 'FILL_IN_BLANK',
      prompt: 'Điền cách đọc hiragana của từ 月曜日',
      explanationVi: '月曜日 đọc là げつようび.',
      acceptableAnswers: ['げつようび', 'getsu'],
      options: [],
    };

    it('should accept exact match', () => {
      const result = service.gradeAnswer(fillQuestion, { textAnswer: 'げつようび' });
      expect(result.isCorrect).toBe(true);
      expect(result.expEarned).toBe(10);
    });

    it('should accept match with extra spaces or case differences', () => {
      const result = service.gradeAnswer(fillQuestion, { textAnswer: '  GETSU  ' });
      expect(result.isCorrect).toBe(true);
      expect(result.expEarned).toBe(10);
    });

    it('should reject incorrect answer', () => {
      const result = service.gradeAnswer(fillQuestion, { textAnswer: 'かようび' });
      expect(result.isCorrect).toBe(false);
      expect(result.expEarned).toBe(0);
    });
  });

  describe('Order Words Grading', () => {
    const orderQuestion: QuestionData = {
      id: 3,
      questionType: 'ORDER_WORDS',
      prompt: 'Sắp xếp: [です / 日本人 / 私 / は]',
      explanationVi: 'Câu hoàn chỉnh: 私は日本人です。',
      acceptableAnswers: ['私は日本人です', 'わたしはにほんじんです'],
      options: [],
    };

    it('should accept correct arranged sentence regardless of space formatting', () => {
      const result = service.gradeAnswer(orderQuestion, {
        textAnswer: '私 は 日本人 です',
      });
      expect(result.isCorrect).toBe(true);
      expect(result.expEarned).toBe(10);
    });

    it('should accept alternative accepted answer', () => {
      const result = service.gradeAnswer(orderQuestion, {
        textAnswer: 'わたしはにほんじんです',
      });
      expect(result.isCorrect).toBe(true);
      expect(result.expEarned).toBe(10);
    });

    it('should reject incorrect arrangement', () => {
      const result = service.gradeAnswer(orderQuestion, {
        textAnswer: '日本人です私は',
      });
      expect(result.isCorrect).toBe(false);
      expect(result.expEarned).toBe(0);
    });
  });

  describe('Text Normalization Helpers', () => {
    it('should handle Japanese full-width spaces and Unicode NFC', () => {
      const input = '　テスト　テキスト　';
      expect(service.normalizeText(input)).toBe('テスト テキスト');
      expect(service.stripSpaces(input)).toBe('テストテキスト');
    });
  });
});
