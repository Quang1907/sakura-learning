import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { UserTokenPayload } from '@sakura/shared';

export class JwtHelper {
  private secret: string;

  constructor(secret: string = config.jwt.secret) {
    this.secret = secret;
  }

  generateAccessToken(payload: UserTokenPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.accessExpiresIn as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.secret, options);
  }

  generateRefreshToken(payload: UserTokenPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.secret, options);
  }

  verifyAccessToken(token: string): UserTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded as UserTokenPayload;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      throw new Error(`Token verification failed: ${message}`);
    }
  }
}

export const jwtHelper = new JwtHelper();
