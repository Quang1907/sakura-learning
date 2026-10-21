import {
  ProgressEventDto,
  ProgressEventResponseDto,
  UserStatsDto,
} from '@sakura/shared';
import { progressRepository, ProgressRepository } from './progress.repository.js';
import { srsService, SrsService } from '../srs/srs.service.js';

export class LearningProgressService {
  constructor(
    private readonly repo: ProgressRepository = progressRepository,
    private readonly srs: SrsService = srsService,
  ) {}

  /**
   * Record a learning swipe event (SWIPE_RIGHT_KNOWN, SWIPE_LEFT_AGAIN, SWIPE_UP_NEXT).
   * Idempotency is strictly guaranteed via clientEventId.
   */
  public async recordEvent(
    userId: number,
    dto: ProgressEventDto,
  ): Promise<ProgressEventResponseDto> {
    // 1. Check idempotency
    const existing = await this.repo.findEventByClientId(dto.clientEventId);
    if (existing) {
      return existing;
    }

    // 2. Compute SRS progression
    const srsResult = this.srs.calculateNextReview(0, dto.action);

    // 3. Atomically update progress, event log, and user EXP/streak
    return this.repo.recordEventAndProgress({
      clientEventId: dto.clientEventId,
      userId,
      itemType: dto.itemType,
      itemId: dto.itemId,
      action: dto.action,
      srsResult,
      timeSpentMs: dto.metadata?.timeSpentMs,
    });
  }

  /**
   * Get learning stats and mastery breakdown
   */
  public async getStats(userId: number): Promise<UserStatsDto> {
    return this.repo.getUserStats(userId);
  }

  /**
   * Record a batch of learning swipe events from offline outbox synchronization.
   * Guarantees idempotency for each event individually.
   */
  public async recordBatchEvents(
    userId: number,
    events: ProgressEventDto[],
  ): Promise<{
    results: Array<ProgressEventResponseDto & { clientEventId: string }>;
    totalProcessed: number;
    totalExpEarned: number;
  }> {
    const results: Array<ProgressEventResponseDto & { clientEventId: string }> = [];
    let totalExpEarned = 0;

    for (const event of events) {
      const res = await this.recordEvent(userId, event);
      results.push({
        ...res,
        clientEventId: event.clientEventId,
      });
      totalExpEarned += res.expEarned;
    }

    return {
      results,
      totalProcessed: results.length,
      totalExpEarned,
    };
  }
}

export const learningProgressService = new LearningProgressService();
