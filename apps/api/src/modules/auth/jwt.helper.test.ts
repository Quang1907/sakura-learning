import { describe, it, expect } from 'vitest';
import { JwtHelper } from './jwt.helper.js';
import { UserTokenPayload } from '@sakura/shared';

describe('JwtHelper Unit Tests', () => {
  const secret = 'test_secret_for_vitest_runner_minimum_32_characters';
  const helper = new JwtHelper(secret);

  const samplePayload: UserTokenPayload = {
    userId: 10,
    email: 'test@sakura.app',
    role: 'USER',
  };

  it('should generate and verify an access token correctly', () => {
    const token = helper.generateAccessToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = helper.verifyAccessToken(token);
    expect(decoded.userId).toBe(samplePayload.userId);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.role).toBe(samplePayload.role);
  });

  it('should throw an error when verifying an invalid token', () => {
    expect(() => {
      helper.verifyAccessToken('invalid.token.signature');
    }).toThrow('Token verification failed');
  });
});
