import { Request, Response, NextFunction } from 'express';
import { JLPT_LEVELS, JlptLevel } from '@sakura/shared';
import { packageService, PackageService } from './package.service.js';

export class PackageController {
  constructor(private readonly service: PackageService = packageService) {}

  public getByJlpt = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paramLevel = req.params['level'];
      const levelStr = Array.isArray(paramLevel) ? paramLevel[0] : paramLevel;
      const level = (levelStr ? levelStr.toUpperCase() : '') as JlptLevel;
      if (!level || !JLPT_LEVELS.includes(level)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_JLPT_LEVEL',
            message: `Invalid JLPT level. Allowed values: ${JLPT_LEVELS.join(', ')}`,
          },
        });
        return;
      }

      const pkg = await this.service.getPackageByJlpt(level);

      res.status(200).json({
        success: true,
        data: pkg,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const packageController = new PackageController();
