import { Request, Response, NextFunction } from 'express';
import { NextFeedBodySchema } from '@sakura/shared';
import { feedService, FeedService } from './feed.service.js';

export class FeedController {
  constructor(private readonly service: FeedService = feedService) {}

  public getFeed = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = NextFeedBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid feed query parameters',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Yêu cầu đăng nhập trước khi tải bảng tin học tập.',
          },
        });
        return;
      }

      const userId = req.user.userId;
      const feed = await this.service.getFeed(userId, parseResult.data);

      res.status(200).json({
        success: true,
        data: feed,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const feedController = new FeedController();
