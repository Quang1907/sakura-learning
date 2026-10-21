import { z } from 'zod';
import { ITEM_TYPES, SWIPE_ACTIONS } from '../types/common.js';

export const ProgressEventMetadataSchema = z
  .object({
    timeSpentMs: z.number().int().nonnegative().optional(),
    offlineTimestamp: z.string().datetime().optional(),
  })
  .passthrough();

export type ProgressEventMetadataDto = z.infer<typeof ProgressEventMetadataSchema>;

export const ProgressEventSchema = z.object({
  clientEventId: z.string().uuid('clientEventId must be a valid UUID v4'),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.number().int().positive('itemId must be a positive integer'),
  action: z.enum(SWIPE_ACTIONS),
  metadata: ProgressEventMetadataSchema.optional(),
});

export type ProgressEventDto = z.infer<typeof ProgressEventSchema>;

export const ProgressEventResponseSchema = z.object({
  recorded: z.boolean(),
  nextReviewAt: z.string().nullable(),
  srsStage: z.number().int().min(0).max(8),
  expEarned: z.number().int().nonnegative(),
  newTotalExp: z.number().int().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
});

export type ProgressEventResponseDto = z.infer<typeof ProgressEventResponseSchema>;

export const JlptProgressItemSchema = z.object({
  total: z.number().int().nonnegative(),
  learned: z.number().int().nonnegative(),
  mastered: z.number().int().nonnegative(),
});

export type JlptProgressItemDto = z.infer<typeof JlptProgressItemSchema>;

export const UserStatsSchema = z.object({
  totalMastered: z.number().int().nonnegative(),
  totalLearning: z.number().int().nonnegative(),
  dueReviewsCount: z.number().int().nonnegative(),
  byJlpt: z.record(z.string(), JlptProgressItemSchema),
});

export type UserStatsDto = z.infer<typeof UserStatsSchema>;
