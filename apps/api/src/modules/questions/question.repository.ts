import { RowDataPacket } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import { QuestionData } from './question-grading.service.js';

interface QuestionRow extends RowDataPacket {
  id: number;
  item_type: string;
  item_id: number;
  question_type: string;
  prompt: string;
  explanation_vi: string;
  acceptable_answers: string | null;
}

interface OptionRow extends RowDataPacket {
  id: number;
  question_id: number;
  content: string;
  is_correct: number | boolean;
  order_index: number;
}

// In-memory fallback mock dataset (matches migration 002 seed)
const IN_MEMORY_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    questionType: 'MULTIPLE_CHOICE',
    prompt: 'Chọn cách đọc đúng của chữ Kanji: 日 (trong từ 日本)',
    explanationVi: 'Trong từ 日本 (Nihon), chữ 日 (Nhật) đọc là に.',
    acceptableAnswers: null,
    options: [
      { id: 1, content: 'に', isCorrect: true, orderIndex: 1 },
      { id: 2, content: 'つき', isCorrect: false, orderIndex: 2 },
      { id: 3, content: 'ほん', isCorrect: false, orderIndex: 3 },
      { id: 4, content: 'みず', isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    id: 2,
    questionType: 'FILL_IN_BLANK',
    prompt: 'Nhập cách đọc hiragana của chữ: 月 (trong từ 月曜日)',
    explanationVi: 'Trong từ 月曜日 (getsuyoubi), chữ 月 đọc là げつ.',
    acceptableAnswers: ['げつ', 'getsu'],
    options: [],
  },
  {
    id: 3,
    questionType: 'MEANING_MATCH',
    prompt: 'Chọn nghĩa đúng của từ: 水 (みず)',
    explanationVi: '水 (みず) có nghĩa là nước.',
    acceptableAnswers: null,
    options: [
      { id: 5, content: 'Nước', isCorrect: true, orderIndex: 1 },
      { id: 6, content: 'Lửa', isCorrect: false, orderIndex: 2 },
      { id: 7, content: 'Cây', isCorrect: false, orderIndex: 3 },
      { id: 8, content: 'Đất', isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    id: 4,
    questionType: 'ORDER_WORDS',
    prompt: 'Sắp xếp các từ thành câu đúng: "Tôi là người Nhật Bản"',
    explanationVi: 'Cấu trúc: 私は [N] です -> 私は日本人です。',
    acceptableAnswers: ['私は日本人です', 'わたしはにほんじんです'],
    options: [],
  },
];

export class QuestionRepository {
  /**
   * Find a question by its primary ID, including its options
   */
  public async findById(id: number): Promise<QuestionData | null> {
    try {
      const pool = getDatabasePool();
      const [qRows] = await pool.query<QuestionRow[]>(
        'SELECT * FROM questions WHERE id = ? AND deleted_at IS NULL AND status = "PUBLISHED" LIMIT 1',
        [id],
      );

      if (!qRows || qRows.length === 0) {
        // Fallback to in-memory seed if available
        const found = IN_MEMORY_QUESTIONS.find((q) => q.id === id);
        return found ?? null;
      }

      const row = qRows[0];
      const [optRows] = await pool.query<OptionRow[]>(
        'SELECT id, content, is_correct, order_index FROM question_options WHERE question_id = ? ORDER BY order_index ASC',
        [id],
      );

      let acceptableAnswers: string[] | null = null;
      if (row.acceptable_answers) {
        acceptableAnswers =
          typeof row.acceptable_answers === 'string'
            ? JSON.parse(row.acceptable_answers)
            : row.acceptable_answers;
      }

      return {
        id: row.id,
        questionType: row.question_type as QuestionData['questionType'],
        prompt: row.prompt,
        explanationVi: row.explanation_vi,
        acceptableAnswers,
        options: optRows.map((opt) => ({
          id: opt.id,
          content: opt.content,
          isCorrect: Boolean(opt.is_correct),
          orderIndex: opt.order_index,
        })),
      };
    } catch {
      // In-memory fallback
      const found = IN_MEMORY_QUESTIONS.find((q) => q.id === id);
      return found ?? null;
    }
  }

  /**
   * Find active questions for feed assembly
   */
  public async findRandomActive(
    limit: number = 5,
    excludeIds: number[] = [],
  ): Promise<QuestionData[]> {
    try {
      const pool = getDatabasePool();
      let sql =
        'SELECT id FROM questions WHERE deleted_at IS NULL AND status = "PUBLISHED"';
      const params: unknown[] = [];

      if (excludeIds.length > 0) {
        sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`;
        params.push(...excludeIds);
      }

      sql += ' ORDER BY RAND() LIMIT ?';
      params.push(limit);

      const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
        sql,
        params,
      );

      const results: QuestionData[] = [];
      for (const r of rows) {
        const q = await this.findById(r.id);
        if (q) results.push(q);
      }

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Fallback to in-memory
    }

    const excludeSet = new Set(excludeIds);
    return IN_MEMORY_QUESTIONS.filter((q) => !excludeSet.has(q.id)).slice(0, limit);
  }
}

export const questionRepository = new QuestionRepository();
