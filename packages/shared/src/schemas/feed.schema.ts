import { z } from 'zod';
import { FEED_CARD_TYPES, JLPT_LEVELS } from '../types/common.js';

export const SrsContextSchema = z.object({
  isReview: z.boolean(),
  stage: z.number().int().min(0).max(8),
});

export type SrsContextDto = z.infer<typeof SrsContextSchema>;

export const FeedCardSchema = z.object({
  cardId: z.string().min(1),
  cardType: z.enum(FEED_CARD_TYPES),
  content: z.record(z.string(), z.unknown()),
  srsContext: SrsContextSchema.optional(),
});

export type FeedCardDto = z.infer<typeof FeedCardSchema>;

export const FeedResponseSchema = z.object({
  items: z.array(FeedCardSchema),
  remainingCount: z.number().int().nonnegative(),
});

export type FeedResponseDto = z.infer<typeof FeedResponseSchema>;

export const NextFeedBodySchema = z.object({
  currentCardIds: z.array(z.string()).default([]),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  jlpt: z.enum(JLPT_LEVELS).optional(),
  contentType: z.enum(['ALL', 'KANJI', 'VOCABULARY', 'GRAMMAR']).optional(),
});

export type NextFeedBodyDto = z.infer<typeof NextFeedBodySchema>;
