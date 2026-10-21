import { Request, Response, NextFunction } from 'express';
import {
  CreateVocabularySchema,
  UpdateVocabularySchema,
  VocabularyListQuerySchema,
} from '@sakura/shared';
import { vocabularyService, VocabularyService } from './vocabulary.service.js';

export class VocabularyController {
  constructor(private readonly service: VocabularyService = vocabularyService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = VocabularyListQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tham số truy vấn danh sách từ vựng không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const result = await this.service.listVocabulary(parseResult.data);
      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID từ vựng phải là số nguyên dương.',
          },
        });
        return;
      }

      const vocab = await this.service.getVocabularyById(id);
      res.status(200).json({
        success: true,
        data: vocab,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VOCABULARY_NOT_FOUND',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = CreateVocabularySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu tạo mới từ vựng không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const created = await this.service.createVocabulary(parseResult.data);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('đã tồn tại')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_VOCABULARY',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID từ vựng phải là số nguyên dương.',
          },
        });
        return;
      }

      const parseResult = UpdateVocabularySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu cập nhật từ vựng không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const updated = await this.service.updateVocabulary(id, parseResult.data);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VOCABULARY_NOT_FOUND',
            message,
          },
        });
        return;
      }
      if (message.includes('đã tồn tại')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_VOCABULARY',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };

  public remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID từ vựng phải là số nguyên dương.',
          },
        });
        return;
      }

      await this.service.deleteVocabulary(id);
      res.status(200).json({
        success: true,
        data: {
          deleted: true,
          id,
        },
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VOCABULARY_NOT_FOUND',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const vocabularyController = new VocabularyController();
