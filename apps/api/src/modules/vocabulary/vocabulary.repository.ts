import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyDetailDto,
  VocabularyListQueryDto,
  JlptLevel,
} from '@sakura/shared';

interface VocabRow extends RowDataPacket {
  id: number;
  word: string;
  reading: string;
  romaji: string | null;
  part_of_speech: string;
  meaning_vi: string;
  audio_url: string | null;
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

interface KanjiRelRow extends RowDataPacket {
  id: number;
  character: string;
  han_viet: string;
}

// In-memory fallback dataset (matches seed 002)
const IN_MEMORY_VOCAB_RECORDS: VocabularyDetailDto[] = [
  {
    id: 1,
    word: '日本',
    reading: 'にほん',
    romaji: 'nihon',
    partOfSpeech: 'noun',
    meaningVi: 'Nhật Bản',
    jlptLevels: ['N5'],
    kanjiIds: [1],
    kanjiList: [
      { id: 1, character: '日', hanViet: 'NHẬT' },
      { id: 5, character: '本', hanViet: 'BẢN' },
    ],
    examples: [
      {
        id: 1,
        sentenceJp: '私は日本人です。',
        sentenceVi: 'Tôi là người Nhật Bản.',
      },
    ],
  },
  {
    id: 2,
    word: '月曜日',
    reading: 'げつようび',
    romaji: 'getsuyoubi',
    partOfSpeech: 'noun',
    meaningVi: 'Thứ Hai',
    jlptLevels: ['N5'],
    kanjiIds: [2],
    kanjiList: [
      { id: 2, character: '月', hanViet: 'NGUYỆT' },
      { id: 6, character: '曜', hanViet: 'DIỆU' },
      { id: 1, character: '日', hanViet: 'NHẬT' },
    ],
    examples: [
      {
        id: 2,
        sentenceJp: '今日は月曜日ではありません。',
        sentenceVi: 'Hôm nay không phải là thứ Hai.',
      },
    ],
  },
  {
    id: 3,
    word: '水',
    reading: 'みず',
    romaji: 'mizu',
    partOfSpeech: 'noun',
    meaningVi: 'Nước',
    jlptLevels: ['N5'],
    kanjiIds: [4],
    kanjiList: [
      { id: 4, character: '水', hanViet: 'THỦY' },
    ],
    examples: [
      {
        id: 3,
        sentenceJp: '水を飲みます。',
        sentenceVi: 'Tôi uống nước.',
      },
    ],
  },
];

let nextVocabId = 4;
let nextSentenceId = 10;

export class VocabularyRepository {
  /**
   * Find paginated Vocabulary list with optional search and JLPT level filter
   */
  public async findAll(
    query: VocabularyListQueryDto,
  ): Promise<{ items: VocabularyDetailDto[]; total: number }> {
    const { jlpt, partOfSpeech, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    try {
      const pool = getDatabasePool();
      let sql = `
        SELECT DISTINCT v.id, v.word, v.reading, v.romaji, v.part_of_speech,
               v.meaning_vi, v.audio_url, v.created_at, v.updated_at
        FROM vocabulary v
        LEFT JOIN vocab_jlpt vj ON v.id = vj.vocab_id
        WHERE v.deleted_at IS NULL AND v.status = 'PUBLISHED'
      `;
      const params: unknown[] = [];

      if (jlpt) {
        sql += ' AND vj.jlpt_level = ?';
        params.push(jlpt);
      }

      if (partOfSpeech) {
        sql += ' AND v.part_of_speech = ?';
        params.push(partOfSpeech);
      }

      if (search) {
        sql += ' AND (v.word LIKE ? OR v.reading LIKE ? OR v.meaning_vi LIKE ? OR v.romaji LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      const countSql = `SELECT COUNT(DISTINCT v.id) as total FROM (${sql}) as sub`;
      const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
        countSql,
        params,
      );
      const total = Number(countRows[0]?.total ?? 0);

      sql += ' ORDER BY v.id ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query<VocabRow[]>(sql, params);
      const items: VocabularyDetailDto[] = [];

      for (const row of rows) {
        const item = await this.findById(row.id);
        if (item) items.push(item);
      }

      return { items, total };
    } catch {
      // In-memory fallback
      let filtered = [...IN_MEMORY_VOCAB_RECORDS];

      if (jlpt) {
        filtered = filtered.filter((v) => v.jlptLevels.includes(jlpt));
      }

      if (partOfSpeech) {
        filtered = filtered.filter((v) => v.partOfSpeech === partOfSpeech);
      }

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.word.toLowerCase().includes(s) ||
            v.reading.toLowerCase().includes(s) ||
            v.meaningVi.toLowerCase().includes(s) ||
            (v.romaji && v.romaji.toLowerCase().includes(s)),
        );
      }

      const total = filtered.length;
      const items = filtered.slice(offset, offset + limit);
      return { items, total };
    }
  }

  /**
   * Find vocabulary by ID
   */
  public async findById(id: number): Promise<VocabularyDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<VocabRow[]>(
        `SELECT v.id, v.word, v.reading, v.romaji, v.part_of_speech,
                v.meaning_vi, v.audio_url, v.created_at, v.updated_at
         FROM vocabulary v
         WHERE v.id = ? AND v.deleted_at IS NULL LIMIT 1`,
        [id],
      );

      if (!rows || rows.length === 0) {
        const inMem = IN_MEMORY_VOCAB_RECORDS.find((v) => v.id === id);
        return inMem ?? null;
      }

      const row = rows[0];

      // Fetch JLPT levels
      const [jlptRows] = await pool.query<Array<RowDataPacket & { jlpt_level: string }>>(
        'SELECT jlpt_level FROM vocab_jlpt WHERE vocab_id = ?',
        [id],
      );
      const jlptLevels = jlptRows.map((r) => r.jlpt_level as JlptLevel);

      // Fetch linked Kanji
      const [kanjiRows] = await pool.query<KanjiRelRow[]>(
        `SELECT k.id, k.character, k.han_viet
         FROM vocab_kanji vk
         JOIN kanji k ON vk.kanji_id = k.id
         WHERE vk.vocab_id = ? AND k.deleted_at IS NULL`,
        [id],
      );

      // Fetch example sentences
      const [sentenceRows] = await pool.query<SentenceRow[]>(
        `SELECT id, sentence_jp, sentence_vi, audio_url
         FROM sentences
         WHERE vocab_id = ? AND deleted_at IS NULL`,
        [id],
      );

      return {
        id: row.id,
        word: row.word,
        reading: row.reading,
        romaji: row.romaji ?? undefined,
        partOfSpeech: row.part_of_speech,
        meaningVi: row.meaning_vi,
        audioUrl: row.audio_url ?? undefined,
        jlptLevels: jlptLevels.length > 0 ? jlptLevels : ['N5'],
        kanjiIds: kanjiRows.map((k) => k.id),
        kanjiList: kanjiRows.map((k) => ({
          id: k.id,
          character: k.character,
          hanViet: k.han_viet,
        })),
        examples: sentenceRows.map((s) => ({
          id: s.id,
          sentenceJp: s.sentence_jp,
          sentenceVi: s.sentence_vi,
          audioUrl: s.audio_url ?? undefined,
        })),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      };
    } catch {
      const inMem = IN_MEMORY_VOCAB_RECORDS.find((v) => v.id === id);
      return inMem ?? null;
    }
  }

  /**
   * Find vocabulary by exact word
   */
  public async findByWord(word: string): Promise<VocabularyDetailDto | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
        'SELECT id FROM vocabulary WHERE word = ? AND deleted_at IS NULL LIMIT 1',
        [word],
      );
      if (rows && rows.length > 0) {
        return this.findById(rows[0].id);
      }
    } catch {
      // In-memory fallback
    }

    const inMem = IN_MEMORY_VOCAB_RECORDS.find((v) => v.word === word);
    return inMem ?? null;
  }

  /**
   * Create new Vocabulary
   */
  public async create(data: CreateVocabularyDto): Promise<VocabularyDetailDto> {
    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [res] = await connection.query<ResultSetHeader>(
          `INSERT INTO vocabulary (word, reading, romaji, part_of_speech, meaning_vi, audio_url, status)
           VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
          [
            data.word,
            data.reading,
            data.romaji ?? null,
            data.partOfSpeech ?? 'noun',
            data.meaningVi,
            data.audioUrl ?? null,
          ],
        );
        const newId = res.insertId;

        // Insert JLPT levels
        for (const lvl of data.jlptLevels) {
          await connection.query(
            'INSERT INTO vocab_jlpt (vocab_id, jlpt_level) VALUES (?, ?)',
            [newId, lvl],
          );
        }

        // Insert Kanji associations
        if (data.kanjiIds && data.kanjiIds.length > 0) {
          for (const kId of data.kanjiIds) {
            await connection.query(
              'INSERT INTO vocab_kanji (vocab_id, kanji_id) VALUES (?, ?)',
              [newId, kId],
            );
          }
        }

        // Insert example sentences
        if (data.examples && data.examples.length > 0) {
          for (const ex of data.examples) {
            await connection.query(
              `INSERT INTO sentences (sentence_jp, sentence_vi, audio_url, vocab_id)
               VALUES (?, ?, ?, ?)`,
              [ex.sentenceJp, ex.sentenceVi, ex.audioUrl ?? null, newId],
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

    const newRecord: VocabularyDetailDto = {
      id: nextVocabId++,
      ...data,
      examples: (data.examples ?? []).map((e) => ({
        id: nextSentenceId++,
        sentenceJp: e.sentenceJp,
        sentenceVi: e.sentenceVi,
        audioUrl: e.audioUrl,
      })),
    };
    IN_MEMORY_VOCAB_RECORDS.push(newRecord);
    return newRecord;
  }

  /**
   * Update Vocabulary
   */
  public async update(id: number, data: UpdateVocabularyDto): Promise<VocabularyDetailDto | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE vocabulary SET
             word = COALESCE(?, word),
             reading = COALESCE(?, reading),
             romaji = COALESCE(?, romaji),
             part_of_speech = COALESCE(?, part_of_speech),
             meaning_vi = COALESCE(?, meaning_vi),
             audio_url = COALESCE(?, audio_url),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            data.word ?? null,
            data.reading ?? null,
            data.romaji ?? null,
            data.partOfSpeech ?? null,
            data.meaningVi ?? null,
            data.audioUrl ?? null,
            id,
          ],
        );

        if (data.jlptLevels && data.jlptLevels.length > 0) {
          await connection.query('DELETE FROM vocab_jlpt WHERE vocab_id = ?', [id]);
          for (const lvl of data.jlptLevels) {
            await connection.query(
              'INSERT INTO vocab_jlpt (vocab_id, jlpt_level) VALUES (?, ?)',
              [id, lvl],
            );
          }
        }

        if (data.kanjiIds) {
          await connection.query('DELETE FROM vocab_kanji WHERE vocab_id = ?', [id]);
          for (const kId of data.kanjiIds) {
            await connection.query(
              'INSERT INTO vocab_kanji (vocab_id, kanji_id) VALUES (?, ?)',
              [id, kId],
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

    const index = IN_MEMORY_VOCAB_RECORDS.findIndex((v) => v.id === id);
    if (index !== -1) {
      IN_MEMORY_VOCAB_RECORDS[index] = {
        ...IN_MEMORY_VOCAB_RECORDS[index],
        ...data,
      };
      return IN_MEMORY_VOCAB_RECORDS[index];
    }

    return this.findById(id);
  }

  /**
   * Soft delete Vocabulary
   */
  public async softDelete(id: number): Promise<boolean> {
    try {
      const pool = getDatabasePool();
      await pool.query('UPDATE vocabulary SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    } catch {
      // In-memory fallback
    }

    const index = IN_MEMORY_VOCAB_RECORDS.findIndex((v) => v.id === id);
    if (index !== -1) {
      IN_MEMORY_VOCAB_RECORDS.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const vocabularyRepository = new VocabularyRepository();
