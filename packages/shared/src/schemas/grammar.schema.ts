import { z } from 'zod';
import { JLPT_LEVELS } from '../types/common.js';

export const GrammarSentenceSchema = z.object({
  id: z.number().int().positive().optional(),
  sentenceJp: z.string().min(1, 'Japanese sentence is required'),
  sentenceVi: z.string().min(1, 'Vietnamese sentence translation is required'),
});

export type GrammarSentenceDto = z.infer<typeof GrammarSentenceSchema>;

export const CreateGrammarSchema = z.object({
  title: z.string().min(1, 'Title is required').max(191),
  structure: z.string().min(1, 'Grammar structure is required'),
  meaningVi: z.string().min(1, 'Vietnamese meaning is required'),
  usageNotes: z.string().optional(),
  jlptLevels: z.array(z.enum(JLPT_LEVELS)).min(1, 'At least one JLPT level is required'),
  sentences: z.array(GrammarSentenceSchema).default([]),
});

export type CreateGrammarDto = z.infer<typeof CreateGrammarSchema>;

export const UpdateGrammarSchema = CreateGrammarSchema.partial();
export type UpdateGrammarDto = z.infer<typeof UpdateGrammarSchema>;

export const GrammarDetailSchema = CreateGrammarSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type GrammarDetailDto = z.infer<typeof GrammarDetailSchema>;

export const GrammarListQuerySchema = z.object({
  jlpt: z.enum(JLPT_LEVELS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(50).optional(),
});

export type GrammarListQueryDto = z.infer<typeof GrammarListQuerySchema>;
