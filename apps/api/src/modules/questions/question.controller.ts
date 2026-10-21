import { Request, Response, NextFunction } from 'express';
import { SubmitAnswerSchema } from '@sakura/shared';
import { questionService, QuestionService } from './question.service.js';

export class QuestionController {
  constructor(private readonly service: QuestionService = questionService) {}

  public submitAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const questionId = Number(req.params.id);
      if (!Number.isInteger(questionId) || questionId <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUESTION_ID',
            message: 'Question id must be a positive integer',
          },
        });
        return;
      }

      const parseResult = SubmitAnswerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid submission payload',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const userId = req.user?.userId ?? 2; // Default to authenticated user ID
      const result = await this.service.submitAnswer(
        questionId,
        parseResult.data,
        userId,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'QUESTION_NOT_FOUND',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const questionController = new QuestionController();
