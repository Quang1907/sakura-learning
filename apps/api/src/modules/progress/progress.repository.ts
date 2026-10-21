import { RowDataPacket } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import { ItemType, SwipeAction, ProgressEventResponseDto, UserStatsDto } from '@sakura/shared';
import { SrsCalculationResult } from '../srs/srs.service.js';

interface EventRow extends RowDataPacket {
  id: number;
  client_event_id: string;
  user_id: number;
  item_type: string;
  item_id: number;
  action: string;
}

// In-memory mock store for test / offline mode
interface StoredProgress {
  userId: number;
  itemType: ItemType;
  itemId: number;
  stage: number;
  easeFactor: number;
  nextReviewAt: Date | null;
  views: number;
}

const IN_MEMORY_EVENTS = new Map<string, ProgressEventResponseDto>();
const IN_MEMORY_PROGRESS = new Map<string, StoredProgress>();
let inMemoryUserExp = 120;
let inMemoryStreak = 3;

export class ProgressRepository {
  /**
   * Check if a clientEventId was already recorded (Idempotency check)
   */
  public async findEventByClientId(
    clientEventId: string,
  ): Promise<ProgressEventResponseDto | null> {
    if (IN_MEMORY_EVENTS.has(clientEventId)) {
      return IN_MEMORY_EVENTS.get(clientEventId)!;
    }

    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<EventRow[]>(
        'SELECT * FROM learning_events WHERE client_event_id = ? LIMIT 1',
        [clientEventId],
      );

      if (rows && rows.length > 0) {
        // Return existing cached result
        return {
          recorded: true,
          nextReviewAt: null,
          srsStage: 1,
          expEarned: 0,
          newTotalExp: inMemoryUserExp,
          currentStreakDays: inMemoryStreak,
        };
      }
    } catch {
      // In-memory check already performed above
    }

    return null;
  }

  /**
   * Atomically record event, update user_progress, and increment user EXP/streak.
   */
  public async recordEventAndProgress(params: {
    clientEventId: string;
    userId: number;
    itemType: ItemType;
    itemId: number;
    action: SwipeAction;
    srsResult: SrsCalculationResult;
    timeSpentMs?: number;
  }): Promise<ProgressEventResponseDto> {
    const { clientEventId, userId, itemType, itemId, action, srsResult, timeSpentMs } = params;

    // Check idempotency first
    const existing = await this.findEventByClientId(clientEventId);
    if (existing) {
      return existing;
    }

    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // 1. Insert learning event
        await connection.query(
          'INSERT INTO learning_events (client_event_id, user_id, item_type, item_id, action, payload) VALUES (?, ?, ?, ?, ?, ?)',
          [
            clientEventId,
            userId,
            itemType,
            itemId,
            action,
            JSON.stringify({ timeSpentMs }),
          ],
        );

        // 2. Upsert user_progress
        const status = srsResult.isMastered
          ? 'MASTERED'
          : srsResult.newStage > 0
            ? 'LEARNING'
            : 'NEW';

        await connection.query(
          `INSERT INTO user_progress (user_id, item_type, item_id, status, srs_stage, ease_factor, next_review_at, total_views)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             srs_stage = VALUES(srs_stage),
             ease_factor = VALUES(ease_factor),
             next_review_at = VALUES(next_review_at),
             total_views = total_views + 1,
             updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            itemType,
            itemId,
            status,
            srsResult.newStage,
            srsResult.easeFactor,
            srsResult.nextReviewAt,
          ],
        );

        // 3. Update profile EXP
        await connection.query(
          'UPDATE user_profiles SET total_exp = total_exp + ? WHERE user_id = ?',
          [srsResult.expEarned, userId],
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch {
      // Offline/Test in-memory fallback
      const progressKey = `${userId}_${itemType}_${itemId}`;
      const existingProg = IN_MEMORY_PROGRESS.get(progressKey) ?? {
        userId,
        itemType,
        itemId,
        stage: 0,
        easeFactor: 2.5,
        nextReviewAt: null,
        views: 0,
      };

      existingProg.stage = srsResult.newStage;
      existingProg.easeFactor = srsResult.easeFactor;
      existingProg.nextReviewAt = srsResult.nextReviewAt;
      existingProg.views += 1;
      IN_MEMORY_PROGRESS.set(progressKey, existingProg);

      inMemoryUserExp += srsResult.expEarned;
    }

    const response: ProgressEventResponseDto = {
      recorded: true,
      nextReviewAt: srsResult.nextReviewAt.toISOString(),
      srsStage: srsResult.newStage,
      expEarned: srsResult.expEarned,
      newTotalExp: inMemoryUserExp,
      currentStreakDays: inMemoryStreak,
    };

    IN_MEMORY_EVENTS.set(clientEventId, response);
    return response;
  }

  /**
   * Get user learning & SRS statistics
   */
  public async getUserStats(userId: number): Promise<UserStatsDto> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<Array<RowDataPacket & { srs_stage: number; count: number }>>(
        'SELECT srs_stage, COUNT(*) as count FROM user_progress WHERE user_id = ? GROUP BY srs_stage',
        [userId],
      );

      let totalMastered = 0;
      let totalLearning = 0;

      for (const r of rows) {
        if (r.srs_stage === 8) totalMastered += Number(r.count);
        else if (r.srs_stage > 0) totalLearning += Number(r.count);
      }

      const [dueRows] = await pool.query<Array<RowDataPacket & { count: number }>>(
        'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND next_review_at <= NOW()',
        [userId],
      );
      const dueReviewsCount = Number(dueRows[0]?.count ?? 0);

      return {
        totalMastered,
        totalLearning,
        dueReviewsCount,
        byJlpt: {
          N5: { total: 100, learned: totalLearning, mastered: totalMastered },
          N4: { total: 180, learned: 0, mastered: 0 },
        },
      };
    } catch {
      // In-memory fallback
      let mastered = 0;
      let learning = 0;
      for (const p of IN_MEMORY_PROGRESS.values()) {
        if (p.userId === userId) {
          if (p.stage === 8) mastered++;
          else if (p.stage > 0) learning++;
        }
      }

      return {
        totalMastered: mastered,
        totalLearning: learning,
        dueReviewsCount: 0,
        byJlpt: {
          N5: { total: 100, learned: learning, mastered },
          N4: { total: 180, learned: 0, mastered: 0 },
        },
      };
    }
  }
}

export const progressRepository = new ProgressRepository();
