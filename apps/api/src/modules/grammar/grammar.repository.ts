import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import {
  CreateGrammarDto,
  UpdateGrammarDto,
  GrammarDetailDto,
  GrammarListQueryDto,
  JlptLevel,
} from '@sakura/shared';

interface GrammarRow extends RowDataPacket {
  id: number;
  title: string;
  structure: string;
  meaning_vi: string;
  usage_notes: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface SentenceRow extends RowDataPacket {
  id: number;
  sentence_jp: string;
  sentence_vi: string;
  audio_url: string | null;
}

// In-memory fallback dataset (matches seed 002)
const IN_MEMORY_GRAMMAR_RECORDS: GrammarDetailDto[] = [
  {
    id: 1,
    title: '〜は〜です',
    structure: 'N1 は N2 です',
    meaningVi: 'N1 là N2',
    usageNotes: 'Mẫu câu khẳng định cơ bản trong tiếng Nhật',
    jlptLevels: ['N5'],
    sentences: [
      {
        id: 1,
        sentenceJp: '私は日本人です。',
        sentenceVi: 'Tôi là người Nhật Bản.',
      },
    ],
  },
  {
    id: 2,
    title: '〜は〜ではありません',
    structure: 'N1 は N2 ではありません',
    meaningVi: 'N1 không phải là N2',
    usageNotes: 'Mẫu câu phủ định lịch sự',
    jlptLevels: ['N5'],
    sentences: [
      {
        id: 2,
        sentenceJp: '今日は月曜日ではありません。',
        sentenceVi: 'Hôm nay không phải là thứ Hai.',
      },
    ],
  },
];

let nextGrammarId = 3;
let nextSentenceId = 20;

export class GrammarRepository {
  /**
   * Find paginated Grammar list with optional search and JLPT level filter
   */
  public async findAll(
    query: GrammarListQueryDto,
  ): Promise<{ items: GrammarDetailDto[]; total: number }> {
    const { jlpt, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    try {
      const pool = getDatabasePool();
      let sql = `
        SELECT DISTINCT g.id, g.title, g.structure, g.meaning_vi, g.usage_notes,
               g.created_at, g.updated_at
        FROM grammar g
        LEFT JOIN grammar_jlpt gj ON g.id = gj.grammar_id
        WHERE g.deleted_at IS NULL AND g.status = 'PUBLISHED'
      `;
      const params: unknown[] = [];

      if (jlpt) {
        sql += ' AND gj.jlpt_level = ?';
        params.push(jlpt);
      }

      if (search) {
        sql += ' AND (g.title LIKE ? OR g.structure LIKE ? OR g.meaning_vi LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      const countSql = `SELECT COUNT(DISTINCT g.id) as total FROM (${sql}) as sub`;
      const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
        countSql,
        params,
      );
      const total = Number(countRows[0]?.total ?? 0);

      sql += ' ORDER BY g.id ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query<GrammarRow[]>(sql, params);
      const items: GrammarDetailDto[] = [];

      for (const row of rows) {
        const item = await this.findById(row.id);
        if (item) items.push(item);
      }

      return { items, total };
    } catch {
      // In-memory fallback
      let filtered = [...IN_MEMORY_GRAMMAR_RECORDS];

      if (jlpt) {
        filtered = filtered.filter((g) => g.jlptLevels.includes(jlpt));
      }

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (g) =>
            g.title.toLowerCase().includes(s) ||
            g.structure.toLowerCase().includes(s) ||
            g.meaningVi.toLowerCase().includes(s),
        );
      }

      const total = filtered.length;
      const items = filtered.slice(offset, offset + limit);
      return { items, total };
    }
  }

  /**
   * Find grammar by ID
   */
  public async findById(id: number): Promise<GrammarDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<GrammarRow[]>(
        `SELECT g.id, g.title, g.structure, g.meaning_vi, g.usage_notes,
                g.created_at, g.updated_at
         FROM grammar g
         WHERE g.id = ? AND g.deleted_at IS NULL LIMIT 1`,
        [id],
      );

      if (!rows || rows.length === 0) {
        const inMem = IN_MEMORY_GRAMMAR_RECORDS.find((g) => g.id === id);
        return inMem ?? null;
      }

      const row = rows[0];

      // Fetch JLPT levels
      const [jlptRows] = await pool.query<Array<RowDataPacket & { jlpt_level: string }>>(
        'SELECT jlpt_level FROM grammar_jlpt WHERE grammar_id = ?',
        [id],
      );
      const jlptLevels = jlptRows.map((r) => r.jlpt_level as JlptLevel);

      // Fetch example sentences
      const [sentenceRows] = await pool.query<SentenceRow[]>(
        `SELECT id, sentence_jp, sentence_vi, audio_url
         FROM sentences
         WHERE grammar_id = ? AND deleted_at IS NULL`,
        [id],
      );

      return {
        id: row.id,
        title: row.title,
        structure: row.structure,
        meaningVi: row.meaning_vi,
        usageNotes: row.usage_notes ?? undefined,
        jlptLevels: jlptLevels.length > 0 ? jlptLevels : ['N5'],
        sentences: sentenceRows.map((s) => ({
          id: s.id,
          sentenceJp: s.sentence_jp,
          sentenceVi: s.sentence_vi,
        })),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      };
    } catch {
      const inMem = IN_MEMORY_GRAMMAR_RECORDS.find((g) => g.id === id);
      return inMem ?? null;
    }
  }

  /**
   * Find grammar by exact title
   */
  public async findByTitle(title: string): Promise<GrammarDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
        'SELECT id FROM grammar WHERE title = ? AND deleted_at IS NULL LIMIT 1',
        [title],
      );
      if (rows && rows.length > 0) {
        return this.findById(rows[0].id);
      }
    } catch {
      // In-memory fallback
    }

    const inMem = IN_MEMORY_GRAMMAR_RECORDS.find((g) => g.title === title);
    return inMem ?? null;
  }

  /**
   * Create new Grammar
   */
  public async create(data: CreateGrammarDto): Promise<GrammarDetailDto> {
    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [res] = await connection.query<ResultSetHeader>(
          `INSERT INTO grammar (title, structure, meaning_vi, usage_notes, status)
           VALUES (?, ?, ?, ?, 'PUBLISHED')`,
          [data.title, data.structure, data.meaningVi, data.usageNotes ?? null],
        );
        const newId = res.insertId;

        // Insert JLPT levels
        for (const lvl of data.jlptLevels) {
          await connection.query(
            'INSERT INTO grammar_jlpt (grammar_id, jlpt_level) VALUES (?, ?)',
            [newId, lvl],
          );
        }

        // Insert example sentences
        if (data.sentences && data.sentences.length > 0) {
          for (const s of data.sentences) {
            await connection.query(
              `INSERT INTO sentences (sentence_jp, sentence_vi, grammar_id)
               VALUES (?, ?, ?)`,
              [s.sentenceJp, s.sentenceVi, newId],
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

    const newRecord: GrammarDetailDto = {
      id: nextGrammarId++,
      ...data,
      sentences: (data.sentences ?? []).map((s) => ({
        id: nextSentenceId++,
        sentenceJp: s.sentenceJp,
        sentenceVi: s.sentenceVi,
      })),
    };
    IN_MEMORY_GRAMMAR_RECORDS.push(newRecord);
    return newRecord;
  }

  /**
   * Update Grammar
   */
  public async update(id: number, data: UpdateGrammarDto): Promise<GrammarDetailDto | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE grammar SET
             title = COALESCE(?, title),
             structure = COALESCE(?, structure),
             meaning_vi = COALESCE(?, meaning_vi),
             usage_notes = COALESCE(?, usage_notes),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            data.title ?? null,
            data.structure ?? null,
            data.meaningVi ?? null,
            data.usageNotes ?? null,
            id,
          ],
        );

        if (data.jlptLevels && data.jlptLevels.length > 0) {
          await connection.query('DELETE FROM grammar_jlpt WHERE grammar_id = ?', [id]);
          for (const lvl of data.jlptLevels) {
            await connection.query(
              'INSERT INTO grammar_jlpt (grammar_id, jlpt_level) VALUES (?, ?)',
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

    const index = IN_MEMORY_GRAMMAR_RECORDS.findIndex((g) => g.id === id);
    if (index !== -1) {
      IN_MEMORY_GRAMMAR_RECORDS[index] = {
        ...IN_MEMORY_GRAMMAR_RECORDS[index],
        ...data,
      };
      return IN_MEMORY_GRAMMAR_RECORDS[index];
    }

    return this.findById(id);
  }

  /**
   * Soft delete Grammar
   */
  public async softDelete(id: number): Promise<boolean> {
    try {
      const pool = getDatabasePool();
      await pool.query('UPDATE grammar SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    } catch {
      // In-memory fallback
    }

    const index = IN_MEMORY_GRAMMAR_RECORDS.findIndex((g) => g.id === id);
    if (index !== -1) {
      IN_MEMORY_GRAMMAR_RECORDS.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const grammarRepository = new GrammarRepository();
