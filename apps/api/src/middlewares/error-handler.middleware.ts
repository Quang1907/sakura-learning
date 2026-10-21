import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown[];
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Đã xảy ra lỗi hệ thống không mong muốn.';

  // In production, avoid leaking internal stack traces
  const responsePayload: {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown[];
      stack?: string;
    };
  } = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(err.details && { details: err.details }),
    },
  };

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
