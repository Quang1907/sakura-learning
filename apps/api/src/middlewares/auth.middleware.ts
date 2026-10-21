import { Request, Response, NextFunction } from 'express';
import { UserRole, UserTokenPayload } from '@sakura/shared';
import { jwtHelper, JwtHelper } from '../modules/auth/jwt.helper.js';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

export function createAuthMiddleware(helper: JwtHelper = jwtHelper) {
  function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Yêu cầu đăng nhập: Thiếu Authorization Header hoặc sai định dạng Bearer token.',
        },
      });
      return;
    }

    const token = authHeader.substring(7).trim();

    try {
      const payload = helper.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token xác thực không hợp lệ hoặc đã hết hạn.',
        },
      });
    }
  }

  function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Yêu cầu đăng nhập trước khi truy cập tài nguyên này.',
          },
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Quyền truy cập bị từ chối: Yêu cầu vai trò [${allowedRoles.join(', ')}].`,
          },
        });
        return;
      }

      next();
    };
  }

  return { authenticate, requireRole };
}

const defaultAuth = createAuthMiddleware();
export const authenticate = defaultAuth.authenticate;
export const authenticateJwt = defaultAuth.authenticate;
export const requireRole = defaultAuth.requireRole;
