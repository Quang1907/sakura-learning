import { Request, Response, NextFunction } from 'express';
import { LoginSchema, RegisterSchema } from '@sakura/shared';
import { authService, AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = LoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu đăng nhập không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const result = await this.service.login(parseResult.data);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('không chính xác')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: msg,
          },
        });
        return;
      }
      next(err);
    }
  };

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = RegisterSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu đăng ký không hợp lệ.',
            details: parseResult.error.issues,
          },
        });
        return;
      }

      const result = await this.service.register(parseResult.data);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('đã được sử dụng')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: msg,
          },
        });
        return;
      }
      next(err);
    }
  };

  public me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Yêu cầu đăng nhập.',
          },
        });
        return;
      }

      const profile = await this.service.getProfile(req.user.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
