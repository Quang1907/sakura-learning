import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RowDataPacket } from 'mysql2';
import { getDatabasePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[] }> {
  const pool = getDatabasePool();
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return { applied: [], skipped: [] };
  }

  // Ensure _migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_migrations_name\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Get applied migrations
  const [rows] = await pool.query<Array<RowDataPacket & { name: string }>>(
    'SELECT name FROM `_migrations` ORDER BY id ASC'
  );
  const appliedSet = new Set<string>(rows.map((r) => r.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (appliedSet.has(file)) {
      skipped.push(file);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Split multiple SQL statements by semicolon if needed
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query('INSERT INTO `_migrations` (name) VALUES (?)', [file]);
      await connection.commit();
      applied.push(file);
    } catch (err) {
      await connection.rollback();
      throw new Error(`Failed to apply migration ${file}: ${(err as Error).message}`);
    } finally {
      connection.release();
    }
  }

  return { applied, skipped };
}
