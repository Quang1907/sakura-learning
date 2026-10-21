import { SwipeAction } from '@sakura/shared';

export type SrsAction = SwipeAction | 'ANSWER_CORRECT' | 'ANSWER_INCORRECT';

export interface SrsCalculationResult {
  previousStage: number;
  newStage: number;
  intervalHours: number;
  nextReviewAt: Date;
  easeFactor: number;
  isPromoted: boolean;
  isMastered: boolean;
  expEarned: number;
}

export class SrsService {
  /**
   * SRS Stage Interval Mapping (in hours) as defined in docs/ARCHITECTURE.md
   * Stage 1: 4 hours
   * Stage 2: 8 hours
   * Stage 3: 24 hours (1 day)
   * Stage 4: 72 hours (3 days)
   * Stage 5: 168 hours (7 days)
   * Stage 6: 336 hours (14 days)
   * Stage 7: 720 hours (30 days)
   * Stage 8: 2880 hours (120 days - Mastered)
   */
  public static readonly STAGE_INTERVALS: Readonly<Record<number, number>> = {
    1: 4,
    2: 8,
    3: 24,
    4: 72,
    5: 168,
    6: 336,
    7: 720,
    8: 2880,
  };

  public static readonly DEFAULT_EASE_FACTOR = 2.5;
  public static readonly MIN_EASE_FACTOR = 1.3;
  public static readonly MAX_EASE_FACTOR = 3.0;
  public static readonly MAX_STAGE = 8;
  public static readonly EXP_SWIPE_KNOWN = 5;
  public static readonly EXP_ANSWER_CORRECT = 10;

  /**
   * Return interval hours for a specific SRS stage (1-8).
   * For stage 0 or unrecognized, returns 0.
   */
  public getIntervalHoursForStage(stage: number): number {
    return SrsService.STAGE_INTERVALS[stage] ?? 0;
  }

  /**
   * Check if an item is currently due for review given its nextReviewAt timestamp.
   */
  public isItemDueForReview(
    nextReviewAt: Date | string | null | undefined,
    referenceDate: Date = new Date(),
  ): boolean {
    if (!nextReviewAt) return false;
    const reviewDate = typeof nextReviewAt === 'string' ? new Date(nextReviewAt) : nextReviewAt;
    return reviewDate.getTime() <= referenceDate.getTime();
  }

  /**
   * Calculate next SRS stage, review timestamp, ease factor, and earned EXP based on learner action.
   *
   * Rules:
   * - Positive action (SWIPE_RIGHT_KNOWN, ANSWER_CORRECT):
   *   - newStage = Math.min(8, currentStage + 1)
   *   - nextReviewAt = baseDate + intervalHours[newStage]
   *   - easeFactor increases by 0.1 (up to MAX_EASE_FACTOR)
   *   - expEarned: 5 for swipe right, 10 for correct question answer
   *
   * - Negative action (SWIPE_LEFT_AGAIN, ANSWER_INCORRECT):
   *   - If currentStage === 0: remains 0
   *   - If currentStage > 0: newStage = Math.max(1, currentStage - 2)
   *   - nextReviewAt = baseDate + 4 hours (immediate re-study)
   *   - easeFactor decreases by 0.2 (down to MIN_EASE_FACTOR)
   *   - expEarned: 0
   */
  public calculateNextReview(
    currentStage: number,
    action: SrsAction,
    currentEaseFactor: number = SrsService.DEFAULT_EASE_FACTOR,
    baseDate: Date = new Date(),
  ): SrsCalculationResult {
    const isPositive = action === 'SWIPE_RIGHT_KNOWN' || action === 'ANSWER_CORRECT';

    let newStage: number;
    let intervalHours: number;
    let easeFactor = currentEaseFactor;
    let expEarned = 0;

    if (isPositive) {
      newStage = Math.min(SrsService.MAX_STAGE, currentStage + 1);
      intervalHours = this.getIntervalHoursForStage(newStage);
      easeFactor = Math.min(SrsService.MAX_EASE_FACTOR, Number((easeFactor + 0.1).toFixed(2)));
      expEarned = action === 'ANSWER_CORRECT' ? SrsService.EXP_ANSWER_CORRECT : SrsService.EXP_SWIPE_KNOWN;
    } else {
      if (currentStage === 0) {
        newStage = 0;
      } else {
        newStage = Math.max(1, currentStage - 2);
      }
      // When marked for re-learning, scheduled 4 hours out
      intervalHours = 4;
      easeFactor = Math.max(SrsService.MIN_EASE_FACTOR, Number((easeFactor - 0.2).toFixed(2)));
      expEarned = 0;
    }

    const nextReviewAt = new Date(baseDate.getTime() + intervalHours * 3600 * 1000);
    const isPromoted = newStage > currentStage;
    const isMastered = newStage === SrsService.MAX_STAGE;

    return {
      previousStage: currentStage,
      newStage,
      intervalHours,
      nextReviewAt,
      easeFactor,
      isPromoted,
      isMastered,
      expEarned,
    };
  }
}

export const srsService = new SrsService();
