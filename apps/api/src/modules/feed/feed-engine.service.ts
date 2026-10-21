import { FeedCardDto } from '@sakura/shared';

export interface FeedCandidatePool {
  newItems: FeedCardDto[];
  reviewItems: FeedCardDto[];
  questionItems: FeedCardDto[];
}

export interface AssembleFeedOptions {
  limit?: number; // default 10
  currentCardIds?: string[]; // IDs to exclude (anti-repetition)
}

export interface AssembleFeedResult {
  items: FeedCardDto[];
  counts: {
    newItems: number;
    reviewItems: number;
    questionItems: number;
    total: number;
  };
}

export class FeedEngineService {
  public static readonly DEFAULT_LIMIT = 10;
  public static readonly TARGET_NEW_RATIO = 0.6; // 60%
  public static readonly TARGET_REVIEW_RATIO = 0.3; // 30%
  public static readonly TARGET_QUESTION_RATIO = 0.1; // 10%

  /**
   * Assembles a swipe feed respecting:
   * 1. 60/30/10 distribution ratio (with dynamic fallback if pools are scarce)
   * 2. Anti-repetition: excludes currentCardIds and avoids duplicates
   * 3. Anti-fatigue: questions never appear consecutively
   */
  public assembleFeed(
    pool: FeedCandidatePool,
    options: AssembleFeedOptions = {},
  ): AssembleFeedResult {
    const limit = Math.max(1, options.limit ?? FeedEngineService.DEFAULT_LIMIT);
    const excludeSet = new Set(options.currentCardIds ?? []);

    // Filter candidates to ensure anti-repetition against client buffer
    const availableNew = pool.newItems.filter((c) => !excludeSet.has(c.cardId));
    const availableReview = pool.reviewItems.filter((c) => !excludeSet.has(c.cardId));
    const availableQuestions = pool.questionItems.filter((c) => !excludeSet.has(c.cardId));

    // Calculate ideal target quotas based on limit
    let targetQuestionCount = Math.round(limit * FeedEngineService.TARGET_QUESTION_RATIO);
    if (limit >= 5 && targetQuestionCount === 0 && availableQuestions.length > 0) {
      targetQuestionCount = 1;
    }
    const targetReviewCount = Math.round(limit * FeedEngineService.TARGET_REVIEW_RATIO);
    const targetNewCount = limit - targetReviewCount - targetQuestionCount;

    // Pick candidates respecting availability
    const selectedQuestions: FeedCardDto[] = availableQuestions.slice(0, targetQuestionCount);
    const selectedReview: FeedCardDto[] = availableReview.slice(0, targetReviewCount);
    const selectedNew: FeedCardDto[] = availableNew.slice(0, targetNewCount);

    // Calculate deficit if any pool did not have enough items
    let needed =
      limit - (selectedQuestions.length + selectedReview.length + selectedNew.length);

    // Fallback 1: fill from remaining new items
    if (needed > 0 && availableNew.length > selectedNew.length) {
      const extraNew = availableNew.slice(selectedNew.length, selectedNew.length + needed);
      selectedNew.push(...extraNew);
      needed -= extraNew.length;
    }

    // Fallback 2: fill from remaining review items
    if (needed > 0 && availableReview.length > selectedReview.length) {
      const extraReview = availableReview.slice(
        selectedReview.length,
        selectedReview.length + needed,
      );
      selectedReview.push(...extraReview);
      needed -= extraReview.length;
    }

    // Fallback 3: fill from remaining questions if still needed (observing anti-fatigue capacity)
    if (needed > 0 && availableQuestions.length > selectedQuestions.length) {
      const maxAdditionalQuestions = Math.floor(
        (selectedNew.length + selectedReview.length) / 2,
      );
      const extraQuestions = availableQuestions.slice(
        selectedQuestions.length,
        selectedQuestions.length + Math.min(needed, maxAdditionalQuestions),
      );
      selectedQuestions.push(...extraQuestions);
      needed -= extraQuestions.length;
    }

    // Interleave content cards (new and review) first
    const contentCards: FeedCardDto[] = [];

    let newIdx = 0;
    let reviewIdx = 0;

    // Distribute approx 2 new : 1 review pattern
    while (newIdx < selectedNew.length || reviewIdx < selectedReview.length) {
      if (newIdx < selectedNew.length) {
        contentCards.push(selectedNew[newIdx++]);
      }
      if (newIdx < selectedNew.length && selectedNew.length > selectedReview.length * 2) {
        contentCards.push(selectedNew[newIdx++]);
      }
      if (reviewIdx < selectedReview.length) {
        contentCards.push(selectedReview[reviewIdx++]);
      }
    }

    // Interleave question cards respecting anti-fatigue (no 2 questions adjacent)
    const interleavedItems: FeedCardDto[] = [];
    const questionQueue = [...selectedQuestions];

    if (contentCards.length === 0) {
      // If only questions exist, we can at most return 1 question to prevent consecutive fatigue
      if (questionQueue.length > 0) {
        interleavedItems.push(questionQueue[0]);
      }
    } else {
      // Calculate ideal step interval for questions
      const step = Math.max(2, Math.floor(contentCards.length / (questionQueue.length + 1)));
      let contentCounter = 0;

      for (const card of contentCards) {
        interleavedItems.push(card);
        contentCounter++;

        // Insert a question if enough content cards have passed and questions remain
        if (
          questionQueue.length > 0 &&
          contentCounter >= step &&
          interleavedItems[interleavedItems.length - 1].cardType !== 'QUESTION'
        ) {
          interleavedItems.push(questionQueue.shift()!);
          contentCounter = 0;
        }
      }

      // If any question is left and the last card is not a question, append at most 1
      if (
        questionQueue.length > 0 &&
        interleavedItems.length > 0 &&
        interleavedItems[interleavedItems.length - 1].cardType !== 'QUESTION'
      ) {
        interleavedItems.push(questionQueue.shift()!);
      }
    }

    return {
      items: interleavedItems,
      counts: {
        newItems: selectedNew.length,
        reviewItems: selectedReview.length,
        questionItems: selectedQuestions.length,
        total: interleavedItems.length,
      },
    };
  }

  /**
   * Helper to verify that anti-fatigue rule holds (no consecutive questions)
   */
  public hasConsecutiveQuestions(items: FeedCardDto[]): boolean {
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].cardType === 'QUESTION' && items[i + 1].cardType === 'QUESTION') {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to verify that anti-repetition rule holds (no card is in excluded list)
   */
  public containsExcludedCards(items: FeedCardDto[], currentCardIds: string[]): boolean {
    const excludeSet = new Set(currentCardIds);
    return items.some((item) => excludeSet.has(item.cardId));
  }
}

export const feedEngineService = new FeedEngineService();
