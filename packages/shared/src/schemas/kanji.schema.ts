import { z } from 'zod';
import { JLPT_LEVELS } from '../types/common.js';

export const KanjiExampleSchema = z.object({
  id: z.number().int().positive().optional(),
  word: z.string().min(1, 'Word is required').max(50),
  reading: z.string().min(1, 'Reading is required').max(50),
  meaningVi: z.string().min(1, 'Vietnamese meaning is required').max(255),
  sentenceJp: z.string().min(1, 'Japanese sentence is required').max(500),
  sentenceVi: z.string().min(1, 'Vietnamese sentence translation is required').max(500),
});

export type KanjiExampleDto = z.infer<typeof KanjiExampleSchema>;

export const CreateKanjiSchema = z.object({
  character: z.string().min(1, 'Character is required').max(4),
  hanViet: z.string().min(1, 'Han-Viet reading is required').max(50),
  onyomi: z.string().max(100).default(''),
  kunyomi: z.string().max(100).default(''),
  strokeCount: z.number().int().min(1, 'Stroke count must be at least 1').max(64),
  radical: z.string().max(10).optional(),
  meaningVi: z.string().min(1, 'Vietnamese meaning is required').max(255),
  jlptLevels: z.array(z.enum(JLPT_LEVELS)).min(1, 'At least one JLPT level is required'),
  examples: z.array(KanjiExampleSchema).default([]),
});

export type CreateKanjiDto = z.infer<typeof CreateKanjiSchema>;

export const UpdateKanjiSchema = CreateKanjiSchema.partial();
export type UpdateKanjiDto = z.infer<typeof UpdateKanjiSchema>;

export const KanjiDetailSchema = CreateKanjiSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type KanjiDetailDto = z.infer<typeof KanjiDetailSchema>;

export const KanjiListQuerySchema = z.object({
  jlpt: z.enum(JLPT_LEVELS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(50).optional(),
});

export type KanjiListQueryDto = z.infer<typeof KanjiListQuerySchema>;
