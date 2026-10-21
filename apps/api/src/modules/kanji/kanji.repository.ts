import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import {
  CreateKanjiDto,
  UpdateKanjiDto,
  KanjiDetailDto,
  KanjiListQueryDto,
  JlptLevel,
} from '@sakura/shared';

interface KanjiRow extends RowDataPacket {
  id: number;
  character: string;
  han_viet: string;
  onyomi: string;
  kunyomi: string;
  stroke_count: number;
  radical: string | null;
  meaning_vi: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface ExampleRow extends RowDataPacket {
  id: number;
  kanji_id: number;
  word: string;
  reading: string;
  meaning_vi: string;
  sentence_jp: string | null;
  sentence_vi: string | null;
}

// In-memory fallback mock dataset (matches migration 002 seed)
const IN_MEMORY_KANJI_RECORDS: KanjiDetailDto[] = [
  {
    id: 1,
    character: '日',
    hanViet: 'NHẬT',
    onyomi: 'ニチ, ジツ',
    kunyomi: 'ひ, -び, -か',
    strokeCount: 4,
    radical: '日',
    meaningVi: 'Mặt trời, ban ngày, ngày',
    jlptLevels: ['N5'],
    examples: [
      {
        id: 1,
        word: '日本',
        reading: 'にほん',
        meaningVi: 'Nhật Bản',
        sentenceJp: '日本の春は桜が綺麗です。',
        sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
      },
      {
        id: 2,
        word: '日曜日',
        reading: 'にちようび',
        meaningVi: 'Chủ nhật',
        sentenceJp: '日曜日に休みます。',
        sentenceVi: 'Tôi nghỉ vào ngày Chủ nhật.',
      },
    ],
  },
  {
    id: 2,
    character: '月',
    hanViet: 'NGUYỆT',
    onyomi: 'ゲツ, ガツ',
    kunyomi: 'つき',
    strokeCount: 4,
    radical: '月',
    meaningVi: 'Mặt trăng, tháng',
    jlptLevels: ['N5'],
    examples: [
      {
        id: 3,
        word: '月曜日',
        reading: 'げつようび',
        meaningVi: 'Thứ Hai',
        sentenceJp: '月曜日に学校へ行きます。',
        sentenceVi: 'Tôi đi học vào thứ Hai.',
      },
    ],
  },
  {
    id: 3,
    character: '木',
    hanViet: 'MỘC',
    onyomi: 'モク, ボク',
    kunyomi: 'き, こ-',
    strokeCount: 4,
    radical: '木',
    meaningVi: 'Cây, gỗ, ngày thứ Năm',
    jlptLevels: ['N5'],
    examples: [
      {
        id: 4,
        word: '木曜日',
        reading: 'もくようび',
        meaningVi: 'Thứ Năm',
        sentenceJp: '木曜日に買い物をします。',
        sentenceVi: 'Tôi đi mua sắm vào thứ Năm.',
      },
    ],
  },
  {
    id: 4,
    character: '水',
    hanViet: 'THỦY',
    onyomi: 'スイ',
    kunyomi: 'みず',
    strokeCount: 4,
    radical: '水',
    meaningVi: 'Nước, chất lỏng, ngày thứ Tư',
    jlptLevels: ['N5'],
    examples: [
      {
        id: 5,
        word: '水曜日',
        reading: 'すいようび',
        meaningVi: 'Thứ Tư',
        sentenceJp: '水曜日に泳ぎます。',
        sentenceVi: 'Tôi bơi vào thứ Tư.',
      },
    ],
  },
];

let nextKanjiId = 5;

export class KanjiRepository {
  /**
   * Find paginated Kanji list with optional search and JLPT level filter
   */
  public async findAll(
    query: KanjiListQueryDto,
  ): Promise<{ items: KanjiDetailDto[]; total: number }> {
    const { jlpt, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    try {
      const pool = getDatabasePool();
      let sql = `
        SELECT DISTINCT k.id, k.character, k.han_viet, k.onyomi, k.kunyomi,
               k.stroke_count, k.radical, k.meaning_vi, k.created_at, k.updated_at
        FROM kanji k
        LEFT JOIN kanji_jlpt kj ON k.id = kj.kanji_id
        WHERE k.deleted_at IS NULL AND k.status = 'PUBLISHED'
      `;
      const params: unknown[] = [];

      if (jlpt) {
        sql += ' AND kj.jlpt_level = ?';
        params.push(jlpt);
      }

      if (search) {
        sql += ' AND (k.character LIKE ? OR k.han_viet LIKE ? OR k.meaning_vi LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      // Count query
      const countSql = `SELECT COUNT(DISTINCT k.id) as total FROM (${sql}) as sub`;
      const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
        countSql,
        params,
      );
      const total = Number(countRows[0]?.total ?? 0);

      sql += ' ORDER BY k.id ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query<KanjiRow[]>(sql, params);
      const items: KanjiDetailDto[] = [];

      for (const row of rows) {
        const item = await this.findById(row.id);
        if (item) items.push(item);
      }

      return { items, total };
    } catch {
      // In-memory fallback
      let filtered = [...IN_MEMORY_KANJI_RECORDS];

      if (jlpt) {
        filtered = filtered.filter((k) => k.jlptLevels.includes(jlpt));
      }

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (k) =>
            k.character.toLowerCase().includes(s) ||
            k.hanViet.toLowerCase().includes(s) ||
            k.meaningVi.toLowerCase().includes(s),
        );
      }

      const total = filtered.length;
      const items = filtered.slice(offset, offset + limit);
      return { items, total };
    }
  }

  /**
   * Find a Kanji by its primary ID
   */
  public async findById(id: number): Promise<KanjiDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<KanjiRow[]>(
        `SELECT k.id, k.character, k.han_viet, k.onyomi, k.kunyomi,
                k.stroke_count, k.radical, k.meaning_vi, k.created_at, k.updated_at
         FROM kanji k
         WHERE k.id = ? AND k.deleted_at IS NULL LIMIT 1`,
        [id],
      );

      if (!rows || rows.length === 0) {
        const inMem = IN_MEMORY_KANJI_RECORDS.find((k) => k.id === id);
        return inMem ?? null;
      }

      const row = rows[0];

      // Fetch JLPT levels
      const [jlptRows] = await pool.query<Array<RowDataPacket & { jlpt_level: string }>>(
        'SELECT jlpt_level FROM kanji_jlpt WHERE kanji_id = ?',
        [id],
      );
      const jlptLevels = jlptRows.map((r) => r.jlpt_level as JlptLevel);

      // Fetch examples
      const [exRows] = await pool.query<ExampleRow[]>(
        'SELECT id, word, reading, meaning_vi, sentence_jp, sentence_vi FROM kanji_examples WHERE kanji_id = ? AND deleted_at IS NULL ORDER BY order_index ASC',
        [id],
      );

      return {
        id: row.id,
        character: row.character,
        hanViet: row.han_viet,
        onyomi: row.onyomi,
        kunyomi: row.kunyomi,
        strokeCount: row.stroke_count,
        radical: row.radical ?? undefined,
        meaningVi: row.meaning_vi,
        jlptLevels: jlptLevels.length > 0 ? jlptLevels : ['N5'],
        examples: exRows.map((e) => ({
          id: e.id,
          word: e.word,
          reading: e.reading,
          meaningVi: e.meaning_vi,
          sentenceJp: e.sentence_jp ?? '',
          sentenceVi: e.sentence_vi ?? '',
        })),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      };
    } catch {
      const inMem = IN_MEMORY_KANJI_RECORDS.find((k) => k.id === id);
      return inMem ?? null;
    }
  }

  /**
   * Find a Kanji by its character
   */
  public async findByCharacter(character: string): Promise<KanjiDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
        'SELECT id FROM kanji WHERE character = ? AND deleted_at IS NULL LIMIT 1',
        [character],
      );
      if (rows && rows.length > 0) {
        return this.findById(rows[0].id);
      }
    } catch {
      // In-memory fallback
    }

    const inMem = IN_MEMORY_KANJI_RECORDS.find((k) => k.character === character);
    return inMem ?? null;
  }

  /**
   * Create a new Kanji in database
   */
  public async create(data: CreateKanjiDto): Promise<KanjiDetailDto> {
    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [res] = await connection.query<ResultSetHeader>(
          `INSERT INTO kanji (character, han_viet, onyomi, kunyomi, stroke_count, radical, meaning_vi, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
          [
            data.character,
            data.hanViet,
            data.onyomi,
            data.kunyomi,
            data.strokeCount,
            data.radical ?? null,
            data.meaningVi,
          ],
        );
        const newId = res.insertId;

        // Insert JLPT levels
        for (const lvl of data.jlptLevels) {
          await connection.query(
            'INSERT INTO kanji_jlpt (kanji_id, jlpt_level) VALUES (?, ?)',
            [newId, lvl],
          );
        }

        // Insert examples
        if (data.examples && data.examples.length > 0) {
          for (let i = 0; i < data.examples.length; i++) {
            const ex = data.examples[i];
            await connection.query(
              `INSERT INTO kanji_examples (kanji_id, word, reading, meaning_vi, sentence_jp, sentence_vi, order_index)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [newId, ex.word, ex.reading, ex.meaningVi, ex.sentenceJp, ex.sentenceVi, i + 1],
            );
          }
        }

        await connection.commit();
        const created = await this.findById(newId);
        if (created) return created;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch {
      // In-memory fallback
    }

    const newRecord: KanjiDetailDto = {
      id: nextKanjiId++,
      ...data,
      examples: data.examples ?? [],
    };
    IN_MEMORY_KANJI_RECORDS.push(newRecord);
    return newRecord;
  }

  /**
   * Update an existing Kanji
   */
  public async update(id: number, data: UpdateKanjiDto): Promise<KanjiDetailDto | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE kanji SET
             han_viet = COALESCE(?, han_viet),
             onyomi = COALESCE(?, onyomi),
             kunyomi = COALESCE(?, kunyomi),
             stroke_count = COALESCE(?, stroke_count),
             radical = COALESCE(?, radical),
             meaning_vi = COALESCE(?, meaning_vi),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            data.hanViet ?? null,
            data.onyomi ?? null,
            data.kunyomi ?? null,
            data.strokeCount ?? null,
            data.radical ?? null,
            data.meaningVi ?? null,
            id,
          ],
        );

        if (data.jlptLevels && data.jlptLevels.length > 0) {
          await connection.query('DELETE FROM kanji_jlpt WHERE kanji_id = ?', [id]);
          for (const lvl of data.jlptLevels) {
            await connection.query(
              'INSERT INTO kanji_jlpt (kanji_id, jlpt_level) VALUES (?, ?)',
              [id, lvl],
            );
          }
        }

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch {
      // In-memory fallback
    }

    const index = IN_MEMORY_KANJI_RECORDS.findIndex((k) => k.id === id);
    if (index !== -1) {
      IN_MEMORY_KANJI_RECORDS[index] = {
        ...IN_MEMORY_KANJI_RECORDS[index],
        ...data,
      };
      return IN_MEMORY_KANJI_RECORDS[index];
    }

    return this.findById(id);
  }

  /**
   * Soft delete a Kanji
   */
  public async softDelete(id: number): Promise<boolean> {
    try {
      const pool = getDatabasePool();
      await pool.query('UPDATE kanji SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    } catch {
      // In-memory fallback
    }

    const index = IN_MEMORY_KANJI_RECORDS.findIndex((k) => k.id === id);
    if (index !== -1) {
      IN_MEMORY_KANJI_RECORDS.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const kanjiRepository = new KanjiRepository();
