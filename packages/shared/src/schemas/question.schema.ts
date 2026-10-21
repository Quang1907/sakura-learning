import { z } from 'zod';
import { QUESTION_TYPES, ITEM_TYPES } from '../types/common.js';

export const QuestionOptionSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1, 'Option content is required').max(500),
  isCorrect: z.boolean().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export type QuestionOptionDto = z.infer<typeof QuestionOptionSchema>;

export const QuestionSchema = z.object({
  id: z.number().int().positive(),
  questionType: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1, 'Prompt is required').max(1000),
  explanation: z.string().max(1000).default(''),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.number().int().positive(),
  options: z.array(QuestionOptionSchema).min(2, 'At least two options are required'),
});

export type QuestionDto = z.infer<typeof QuestionSchema>;

export const SubmitAnswerSchema = z.object({
  clientEventId: z.string().uuid('clientEventId must be a valid UUID v4'),
  selectedOptionId: z.number().int().positive().nullable().optional(),
  textAnswer: z.string().max(255).nullable().optional(),
  durationMs: z.number().int().nonnegative('durationMs must be non-negative').default(0),
});

export type SubmitAnswerDto = z.infer<typeof SubmitAnswerSchema>;

export const QuestionResultSchema = z.object({
  isCorrect: z.boolean(),
  correctOptionId: z.number().int().positive().optional(),
  explanation: z.string(),
  expEarned: z.number().int().nonnegative(),
  srsUpdated: z.boolean(),
  nextReviewAt: z.string().nullable().optional(),
});

export type QuestionResultDto = z.infer<typeof QuestionResultSchema>;
