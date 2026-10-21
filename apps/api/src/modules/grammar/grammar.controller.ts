import { Request, Response, NextFunction } from 'express';
import {
  CreateGrammarSchema,
  UpdateGrammarSchema,
  GrammarListQuerySchema,
} from '@sakura/shared';
import { grammarService, GrammarService } from './grammar.service.js';

export class GrammarController {
  constructor(private readonly service: GrammarService = grammarService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = GrammarListQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tham số truy vấn danh sách ngữ pháp không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const result = await this.service.listGrammar(parseResult.data);
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
            message: 'ID mẫu ngữ pháp phải là số nguyên dương.',
          },
        });
        return;
      }

      const grammar = await this.service.getGrammarById(id);
      res.status(200).json({
        success: true,
        data: grammar,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'GRAMMAR_NOT_FOUND',
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
      const parseResult = CreateGrammarSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu tạo mới ngữ pháp không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const created = await this.service.createGrammar(parseResult.data);
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
            code: 'DUPLICATE_GRAMMAR',
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
            message: 'ID mẫu ngữ pháp phải là số nguyên dương.',
          },
        });
        return;
      }

      const parseResult = UpdateGrammarSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu cập nhật ngữ pháp không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const updated = await this.service.updateGrammar(id, parseResult.data);
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
            code: 'GRAMMAR_NOT_FOUND',
            message,
          },
        });
        return;
      }
      if (message.includes('đã tồn tại')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_GRAMMAR',
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
            message: 'ID mẫu ngữ pháp phải là số nguyên dương.',
          },
        });
        return;
      }

      await this.service.deleteGrammar(id);
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
            code: 'GRAMMAR_NOT_FOUND',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const grammarController = new GrammarController();
