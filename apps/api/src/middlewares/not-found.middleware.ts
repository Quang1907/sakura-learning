import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Đường dẫn API '${req.method} ${req.originalUrl}' không tồn tại trên hệ thống.`,
    },
  });
}
