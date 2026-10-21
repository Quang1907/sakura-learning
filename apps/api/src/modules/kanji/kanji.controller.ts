import { Request, Response, NextFunction } from 'express';
import {
  CreateKanjiSchema,
  UpdateKanjiSchema,
  KanjiListQuerySchema,
} from '@sakura/shared';
import { kanjiService, KanjiService } from './kanji.service.js';

export class KanjiController {
  constructor(private readonly service: KanjiService = kanjiService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = KanjiListQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tham số truy vấn danh sách Kanji không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const result = await this.service.listKanji(parseResult.data);
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
            message: 'ID chữ Kanji phải là số nguyên dương.',
          },
        });
        return;
      }

      const kanji = await this.service.getKanjiById(id);
      res.status(200).json({
        success: true,
        data: kanji,
      });
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'KANJI_NOT_FOUND',
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
      const parseResult = CreateKanjiSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu tạo mới Kanji không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const created = await this.service.createKanji(parseResult.data);
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
            code: 'DUPLICATE_KANJI',
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
            message: 'ID chữ Kanji phải là số nguyên dương.',
          },
        });
        return;
      }

      const parseResult = UpdateKanjiSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu cập nhật Kanji không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const updated = await this.service.updateKanji(id, parseResult.data);
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
            code: 'KANJI_NOT_FOUND',
            message,
          },
        });
        return;
      }
      if (message.includes('đã tồn tại')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_KANJI',
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
            message: 'ID chữ Kanji phải là số nguyên dương.',
          },
        });
        return;
      }

      await this.service.deleteKanji(id);
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
            code: 'KANJI_NOT_FOUND',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const kanjiController = new KanjiController();
