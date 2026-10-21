import { testDatabaseConnection, ConnectionStatus } from '../../config/database.js';

export interface IHealthRepository {
  checkDatabaseStatus(): Promise<ConnectionStatus>;
}

export class HealthRepository implements IHealthRepository {
  async checkDatabaseStatus(): Promise<ConnectionStatus> {
    return testDatabaseConnection();
  }
}

export const healthRepository = new HealthRepository();
