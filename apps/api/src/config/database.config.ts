import { config } from './env.js';

export const databaseConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.env === 'test' ? config.db.testName : config.db.name,
  connectionLimit: config.db.connectionLimit,
};

export default databaseConfig;
