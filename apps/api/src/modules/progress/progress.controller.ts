import { Request, Response, NextFunction } from 'express';
import { ProgressEventSchema } from '@sakura/shared';
import {
  learningProgressService,
  LearningProgressService,
} from './learning-progress.service.js';

export class ProgressController {
  constructor(
    private readonly service: LearningProgressService = learningProgressService,
  ) {}

  public recordEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = ProgressEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid progress event payload',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const userId = req.user?.userId ?? 2;
      const result = await this.service.recordEvent(userId, parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public getStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.userId ?? 2;
      const stats = await this.service.getStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  public recordBatch = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const events = req.body?.events;
      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Events array must be provided and not empty',
          },
        });
        return;
      }

      const validatedEvents = [];
      for (const item of events) {
        const parsed = ProgressEventSchema.safeParse(item);
        if (!parsed.success) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid progress event item in batch',
              details: parsed.error.issues,
            },
          });
          return;
        }
        validatedEvents.push(parsed.data);
      }

      const userId = req.user?.userId ?? 2;
      const batchResult = await this.service.recordBatchEvents(userId, validatedEvents);

      res.status(200).json({
        success: true,
        data: batchResult,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const progressController = new ProgressController();
