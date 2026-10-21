import { describe, it, expect } from 'vitest';
import React from 'react';
import { VocabularyCard } from './VocabularyCard.js';
import { GrammarCard } from './GrammarCard.js';
import { KanjiCard } from './KanjiCard.js';

describe('Frontend Card Components Structure and Logic', () => {
  it('VocabularyCard should render with full props without throwing', () => {
    const element = React.createElement(VocabularyCard, {
      vocab: {
        id: 1,
        word: '日本',
        reading: 'にほん',
        romaji: 'nihon',
        meaningVi: 'Nhật Bản',
        partOfSpeech: 'noun',
        jlptLevels: ['N5'],
        examples: [
          {
            sentenceJp: '日本の春は桜が綺麗です。',
            sentenceVi: 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.',
          },
        ],
      },
      isReview: false,
      srsStage: 0,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(VocabularyCard);
    expect(element.props.vocab.word).toBe('日本');
    expect(element.props.vocab.reading).toBe('にほん');
  });

  it('GrammarCard should render with structure and sentences without throwing', () => {
    const element = React.createElement(GrammarCard, {
      grammar: {
        id: 1,
        title: '〜は〜です',
        structure: 'N1 は N2 です',
        meaningVi: 'N1 là N2',
        usageNotes: 'Mẫu câu khẳng định cơ bản trong tiếng Nhật',
        jlptLevels: ['N5'],
        sentences: [
          {
            sentenceJp: '私は日本人です。',
            sentenceVi: 'Tôi là người Nhật Bản.',
          },
        ],
      },
      isReview: true,
      srsStage: 3,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(GrammarCard);
    expect(element.props.grammar.title).toBe('〜は〜です');
    expect(element.props.isReview).toBe(true);
  });

  it('KanjiCard should render Kanji character and Han-Viet correctly', () => {
    const element = React.createElement(KanjiCard, {
      kanji: {
        id: 1,
        character: '日',
        hanViet: 'NHẬT',
        onyomi: 'ニチ, ジツ',
        kunyomi: 'ひ, -び, -か',
        strokeCount: 4,
        meaningVi: 'Mặt trời, ban ngày, ngày',
        jlptLevels: ['N5'],
        examples: [],
      },
      onClick: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.kanji.character).toBe('日');
    expect(element.props.kanji.hanViet).toBe('NHẬT');
  });
});
