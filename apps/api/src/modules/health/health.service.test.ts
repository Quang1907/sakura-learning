import { describe, it, expect } from 'vitest';
import { HealthService } from './health.service.js';
import { IHealthRepository } from './health.repository.js';

describe('HealthService Unit Tests', () => {
  it('should return healthy status when database is connected', async () => {
    const mockRepo: IHealthRepository = {
      checkDatabaseStatus: async () => ({
        connected: true,
        message: 'Connected to MySQL',
      }),
    };

    const service = new HealthService(mockRepo);
    const result = await service.getHealthStatus();

    expect(result.status).toBe('healthy');
    expect(result.database.status).toBe('connected');
    expect(result.database.message).toBe('Connected to MySQL');
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded status when database is disconnected', async () => {
    const mockRepo: IHealthRepository = {
      checkDatabaseStatus: async () => ({
        connected: false,
        message: 'Connection failed',
      }),
    };

    const service = new HealthService(mockRepo);
    const result = await service.getHealthStatus();

    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('disconnected');
    expect(result.database.message).toBe('Connection failed');
  });
});
