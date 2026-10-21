import { z } from 'zod';
import { JLPT_LEVELS } from '../types/common.js';
import { KanjiDetailSchema } from './kanji.schema.js';
import { VocabularyDetailSchema } from './vocabulary.schema.js';
import { GrammarDetailSchema } from './grammar.schema.js';
import { QuestionSchema } from './question.schema.js';

export const OfflinePackageMetadataSchema = z.object({
  packageId: z.string().min(1),
  jlptLevel: z.enum(JLPT_LEVELS),
  title: z.string().min(1),
  description: z.string(),
  totalKanji: z.number().int().nonnegative(),
  totalVocabulary: z.number().int().nonnegative(),
  totalGrammar: z.number().int().nonnegative(),
  totalQuestions: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  sizeEstimateBytes: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export type OfflinePackageMetadataDto = z.infer<typeof OfflinePackageMetadataSchema>;

export const OfflinePackageDataSchema = z.object({
  metadata: OfflinePackageMetadataSchema,
  kanji: z.array(KanjiDetailSchema),
  vocabulary: z.array(VocabularyDetailSchema),
  grammar: z.array(GrammarDetailSchema),
  questions: z.array(QuestionSchema),
});

export type OfflinePackageDataDto = z.infer<typeof OfflinePackageDataSchema>;
