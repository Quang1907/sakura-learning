import { RowDataPacket } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import { JlptLevel, FeedCardDto } from '@sakura/shared';

const IN_MEMORY_KANJI_CARDS: FeedCardDto[] = [
  {
    cardId: 'kanji_1',
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
          sentenceJp: '日本の春は桜が綺麗です。',
          sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'kanji_2',
    cardType: 'KANJI',
    content: {
      id: 2,
      character: '月',
      hanViet: 'NGUYỆT',
      onyomi: 'ゲツ, ガツ',
      kunyomi: 'つき',
      strokeCount: 4,
      meaningVi: 'Mặt trăng, tháng',
      examples: [
        {
          word: '月曜日',
          reading: 'げつようび',
          meaningVi: 'Thứ Hai',
          sentenceJp: '月曜日に学校へ行きます。',
          sentenceVi: 'Tôi đi học vào thứ Hai.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'kanji_3',
    cardType: 'KANJI',
    content: {
      id: 3,
      character: '木',
      hanViet: 'MỘC',
      onyomi: 'モク, ボク',
      kunyomi: 'き, こ-',
      strokeCount: 4,
      meaningVi: 'Cây, gỗ, ngày thứ Năm',
      examples: [],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'kanji_4',
    cardType: 'KANJI',
    content: {
      id: 4,
      character: '水',
      hanViet: 'THỦY',
      onyomi: 'スイ',
      kunyomi: 'みず',
      strokeCount: 4,
      meaningVi: 'Nước, chất lỏng, ngày thứ Tư',
      examples: [],
    },
    srsContext: { isReview: false, stage: 0 },
  },
];

const IN_MEMORY_VOCAB_CARDS: FeedCardDto[] = [
  {
    cardId: 'vocab_1',
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
          sentenceJp: '私は日本人です。',
          sentenceVi: 'Tôi là người Nhật Bản.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'vocab_2',
    cardType: 'VOCABULARY',
    content: {
      id: 2,
      word: '月曜日',
      reading: 'げつようび',
      romaji: 'getsuyoubi',
      partOfSpeech: 'noun',
      meaningVi: 'Thứ Hai',
      examples: [
        {
          sentenceJp: '今日は月曜日ではありません。',
          sentenceVi: 'Hôm nay không phải là thứ Hai.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'vocab_3',
    cardType: 'VOCABULARY',
    content: {
      id: 3,
      word: '水',
      reading: 'みず',
      romaji: 'mizu',
      partOfSpeech: 'noun',
      meaningVi: 'Nước',
      examples: [
        {
          sentenceJp: '水を飲みます。',
          sentenceVi: 'Tôi uống nước.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
];

const IN_MEMORY_GRAMMAR_CARDS: FeedCardDto[] = [
  {
    cardId: 'grammar_1',
    cardType: 'GRAMMAR',
    content: {
      id: 1,
      title: '〜は〜です',
      structure: 'N1 は N2 です',
      meaningVi: 'N1 là N2',
      usageNotes: 'Mẫu câu khẳng định cơ bản trong tiếng Nhật',
      sentences: [
        {
          sentenceJp: '私は日本人です。',
          sentenceVi: 'Tôi là người Nhật Bản.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
  {
    cardId: 'grammar_2',
    cardType: 'GRAMMAR',
    content: {
      id: 2,
      title: '〜は〜ではありません',
      structure: 'N1 は N2 ではありません',
      meaningVi: 'N1 không phải là N2',
      usageNotes: 'Mẫu câu phủ định lịch sự',
      sentences: [
        {
          sentenceJp: '今日は月曜日ではありません。',
          sentenceVi: 'Hôm nay không phải là thứ Hai.',
        },
      ],
    },
    srsContext: { isReview: false, stage: 0 },
  },
];

export class ContentRepository {
  /**
   * Find candidate content cards for a given JLPT level and optional content type
   */
  public async findCandidates(
    jlpt: JlptLevel = 'N5',
    limit: number = 20,
    excludeCardIds: string[] = [],
    contentType?: 'ALL' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR',
  ): Promise<FeedCardDto[]> {
    const excludeSet = new Set(excludeCardIds);
    const candidates: FeedCardDto[] = [];

    try {
      const pool = getDatabasePool();

      // 1. Fetch Kanji if requested
      if (!contentType || contentType === 'ALL' || contentType === 'KANJI') {
        const [rows] = await pool.query<Array<RowDataPacket & {
          id: number;
          character: string;
          han_viet: string;
          onyomi: string;
          kunyomi: string;
          stroke_count: number;
          meaning_vi: string;
        }>>(
          `SELECT k.id, k.character, k.han_viet, k.onyomi, k.kunyomi, k.stroke_count, k.meaning_vi
           FROM kanji k
           JOIN kanji_jlpt kj ON k.id = kj.kanji_id
           WHERE kj.jlpt_level = ? AND k.deleted_at IS NULL AND k.status = 'PUBLISHED'
           LIMIT ?`,
          [jlpt, limit],
        );

        if (rows && rows.length > 0) {
          for (const r of rows) {
            candidates.push({
              cardId: `kanji_${r.id}`,
              cardType: 'KANJI',
              content: {
                id: r.id,
                character: r.character,
                hanViet: r.han_viet,
                onyomi: r.onyomi,
                kunyomi: r.kunyomi,
                strokeCount: r.stroke_count,
                meaningVi: r.meaning_vi,
                examples: [],
              },
              srsContext: { isReview: false, stage: 0 },
            });
          }
        }
      }

      // 2. Fetch Vocabulary if requested
      if (!contentType || contentType === 'ALL' || contentType === 'VOCABULARY') {
        const [vRows] = await pool.query<Array<RowDataPacket & {
          id: number;
          word: string;
          reading: string;
          romaji: string | null;
          part_of_speech: string;
          meaning_vi: string;
        }>>(
          `SELECT v.id, v.word, v.reading, v.romaji, v.part_of_speech, v.meaning_vi
           FROM vocabulary v
           JOIN vocab_jlpt vj ON v.id = vj.vocab_id
           WHERE vj.jlpt_level = ? AND v.deleted_at IS NULL AND v.status = 'PUBLISHED'
           LIMIT ?`,
          [jlpt, limit],
        );

        if (vRows && vRows.length > 0) {
          for (const v of vRows) {
            candidates.push({
              cardId: `vocab_${v.id}`,
              cardType: 'VOCABULARY',
              content: {
                id: v.id,
                word: v.word,
                reading: v.reading,
                romaji: v.romaji ?? undefined,
                partOfSpeech: v.part_of_speech,
                meaningVi: v.meaning_vi,
                examples: [],
              },
              srsContext: { isReview: false, stage: 0 },
            });
          }
        }
      }

      // 3. Fetch Grammar if requested
      if (!contentType || contentType === 'ALL' || contentType === 'GRAMMAR') {
        const [gRows] = await pool.query<Array<RowDataPacket & {
          id: number;
          title: string;
          structure: string;
          meaning_vi: string;
          usage_notes: string | null;
        }>>(
          `SELECT g.id, g.title, g.structure, g.meaning_vi, g.usage_notes
           FROM grammar g
           JOIN grammar_jlpt gj ON g.id = gj.grammar_id
           WHERE gj.jlpt_level = ? AND g.deleted_at IS NULL AND g.status = 'PUBLISHED'
           LIMIT ?`,
          [jlpt, limit],
        );

        if (gRows && gRows.length > 0) {
          for (const g of gRows) {
            candidates.push({
              cardId: `grammar_${g.id}`,
              cardType: 'GRAMMAR',
              content: {
                id: g.id,
                title: g.title,
                structure: g.structure,
                meaningVi: g.meaning_vi,
                usageNotes: g.usage_notes ?? undefined,
                sentences: [],
              },
              srsContext: { isReview: false, stage: 0 },
            });
          }
        }
      }

      if (candidates.length > 0) {
        return candidates.filter((card) => !excludeSet.has(card.cardId)).slice(0, limit);
      }
    } catch {
      // In-memory fallback
    }

    // In-memory fallback dataset
    let fallbackCards: FeedCardDto[] = [];
    if (!contentType || contentType === 'ALL') {
      fallbackCards = [
        ...IN_MEMORY_KANJI_CARDS,
        ...IN_MEMORY_VOCAB_CARDS,
        ...IN_MEMORY_GRAMMAR_CARDS,
      ];
    } else if (contentType === 'KANJI') {
      fallbackCards = [...IN_MEMORY_KANJI_CARDS];
    } else if (contentType === 'VOCABULARY') {
      fallbackCards = [...IN_MEMORY_VOCAB_CARDS];
    } else if (contentType === 'GRAMMAR') {
      fallbackCards = [...IN_MEMORY_GRAMMAR_CARDS];
    }

    return fallbackCards.filter((k) => !excludeSet.has(k.cardId)).slice(0, limit);
  }
}

export const contentRepository = new ContentRepository();
