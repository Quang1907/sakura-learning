import { z } from 'zod';
import { JLPT_LEVELS } from '../types/common.js';

export const VocabularySentenceSchema = z.object({
  id: z.number().int().positive().optional(),
  sentenceJp: z.string().min(1, 'Japanese sentence is required'),
  sentenceVi: z.string().min(1, 'Vietnamese sentence translation is required'),
  audioUrl: z.string().optional(),
});

export type VocabularySentenceDto = z.infer<typeof VocabularySentenceSchema>;

export const CreateVocabularySchema = z.object({
  word: z.string().min(1, 'Word is required').max(191),
  reading: z.string().min(1, 'Reading is required').max(191),
  romaji: z.string().max(191).optional(),
  partOfSpeech: z.string().max(50).default('noun'),
  meaningVi: z.string().min(1, 'Vietnamese meaning is required').max(1000),
  audioUrl: z.string().max(255).optional(),
  jlptLevels: z.array(z.enum(JLPT_LEVELS)).min(1, 'At least one JLPT level is required'),
  kanjiIds: z.array(z.number().int().positive()).default([]),
  examples: z.array(VocabularySentenceSchema).default([]),
});

export type CreateVocabularyDto = z.infer<typeof CreateVocabularySchema>;

export const UpdateVocabularySchema = CreateVocabularySchema.partial();
export type UpdateVocabularyDto = z.infer<typeof UpdateVocabularySchema>;

export const VocabularyDetailSchema = CreateVocabularySchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  kanjiList: z
    .array(
      z.object({
        id: z.number().int().positive(),
        character: z.string(),
        hanViet: z.string(),
      }),
    )
    .optional(),
});

export type VocabularyDetailDto = z.infer<typeof VocabularyDetailSchema>;

export const VocabularyListQuerySchema = z.object({
  jlpt: z.enum(JLPT_LEVELS).optional(),
  partOfSpeech: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(50).optional(),
});

export type VocabularyListQueryDto = z.infer<typeof VocabularyListQuerySchema>;
