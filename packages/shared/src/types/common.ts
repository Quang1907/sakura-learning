export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

export const ITEM_TYPES = ['KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const FEED_CARD_TYPES = ['KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE', 'QUESTION'] as const;
export type FeedCardType = (typeof FEED_CARD_TYPES)[number];

export const SWIPE_ACTIONS = [
  'SWIPE_RIGHT_KNOWN',
  'SWIPE_LEFT_AGAIN',
  'SWIPE_UP_NEXT',
] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

export const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'FILL_IN_BLANK',
  'ORDER_WORDS',
  'MEANING_MATCH',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/**
 * Standard API Response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
