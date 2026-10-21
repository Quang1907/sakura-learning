import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool: mysql.Pool | null = null;

export function getDatabasePool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export interface ConnectionStatus {
  connected: boolean;
  message?: string;
  activeConnections?: number;
}

export async function testDatabaseConnection(): Promise<ConnectionStatus> {
  try {
    const currentPool = getDatabasePool();
    const [rows] = await currentPool.query('SELECT 1 as ping');
    if (Array.isArray(rows) && rows.length > 0) {
      return {
        connected: true,
        message: 'MySQL connection established successfully',
      };
    }
    return {
      connected: false,
      message: 'Unexpected query result from MySQL',
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      message: errMessage || 'Failed to connect to MySQL database',
    };
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
