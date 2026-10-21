import { describe, it, expect } from 'vitest';
import { SAKURA_SHARED_VERSION } from './index.js';

describe('@sakura/shared index', () => {
  it('should export the correct version string', () => {
    expect(SAKURA_SHARED_VERSION).toBe('0.1.0');
  });
});
