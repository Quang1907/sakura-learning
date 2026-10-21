import { IHealthRepository, healthRepository } from './health.repository.js';

export interface HealthCheckData {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    message?: string;
  };
}

export class HealthService {
  private startTime: number;
  private repository: IHealthRepository;

  constructor(repository: IHealthRepository = healthRepository) {
    this.startTime = Date.now();
    this.repository = repository;
  }

  async getHealthStatus(): Promise<HealthCheckData> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const dbStatus = await this.repository.checkDatabaseStatus();

    const isHealthy = dbStatus.connected;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        message: dbStatus.message,
      },
    };
  }
}

export const healthService = new HealthService();
