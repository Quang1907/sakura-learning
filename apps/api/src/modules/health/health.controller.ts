import { Request, Response, NextFunction } from 'express';
import { healthService, HealthService } from './health.service.js';

export class HealthController {
  private service: HealthService;

  constructor(service: HealthService = healthService) {
    this.service = service;
  }

  getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getHealthStatus();
      res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
