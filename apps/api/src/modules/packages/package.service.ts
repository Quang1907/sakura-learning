import { JlptLevel, OfflinePackageDataDto } from '@sakura/shared';
import { kanjiRepository, KanjiRepository } from '../kanji/kanji.repository.js';
import { vocabularyRepository, VocabularyRepository } from '../vocabulary/vocabulary.repository.js';
import { grammarRepository, GrammarRepository } from '../grammar/grammar.repository.js';
import { questionRepository, QuestionRepository } from '../questions/question.repository.js';

export class PackageService {
  constructor(
    private readonly kanjiRepo: KanjiRepository = kanjiRepository,
    private readonly vocabRepo: VocabularyRepository = vocabularyRepository,
    private readonly grammarRepo: GrammarRepository = grammarRepository,
    private readonly questionRepo: QuestionRepository = questionRepository,
  ) {}

  /**
   * Assemble a complete offline package for a JLPT level (e.g. N5).
   * Bundles Kanji, Vocabulary, Grammar, Sentences, and Questions into a verified package.
   */
  public async getPackageByJlpt(level: JlptLevel): Promise<OfflinePackageDataDto> {
    const [kanjiRes, vocabRes, grammarRes, questions] = await Promise.all([
      this.kanjiRepo.findAll({ page: 1, limit: 200, jlpt: level }),
      this.vocabRepo.findAll({ page: 1, limit: 200, jlpt: level }),
      this.grammarRepo.findAll({ page: 1, limit: 200, jlpt: level }),
      this.questionRepo.findRandomActive(50),
    ]);

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      prompt: q.prompt,
      explanation: q.explanationVi,
      itemType: 'KANJI' as const,
      itemId: q.id,
      options: q.options.map((opt) => ({
        id: opt.id,
        content: opt.content,
        isCorrect: opt.isCorrect,
        orderIndex: opt.orderIndex,
      })),
    }));

    // Estimate total payload size in bytes
    const totalItems = kanjiRes.items.length + vocabRes.items.length + grammarRes.items.length + formattedQuestions.length;
    const approximateSizeBytes = Math.round(totalItems * 850);

    return {
      metadata: {
        packageId: `jlpt_${level.toLowerCase()}`,
        jlptLevel: level,
        title: `Gói học offline JLPT ${level}`,
        description: `Trọn bộ Kanji, Từ vựng, Ngữ pháp và Câu hỏi trắc nghiệm trình độ ${level} dành cho học tập ngoại tuyến.`,
        totalKanji: kanjiRes.items.length,
        totalVocabulary: vocabRes.items.length,
        totalGrammar: grammarRes.items.length,
        totalQuestions: formattedQuestions.length,
        version: 1,
        sizeEstimateBytes: approximateSizeBytes,
        updatedAt: new Date().toISOString(),
      },
      kanji: kanjiRes.items,
      vocabulary: vocabRes.items,
      grammar: grammarRes.items,
      questions: formattedQuestions,
    };
  }
}

export const packageService = new PackageService();
