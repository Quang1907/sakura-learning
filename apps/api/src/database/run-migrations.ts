import { runMigrations } from './migrator.js';
import { closeDatabasePool } from '../config/database.js';

async function main() {
  console.info('Starting database migrations...');
  const result = await runMigrations();
  console.info('Migration result:', result);
  await closeDatabasePool();
}

main().catch((err) => {
  console.error('Fatal error running migrations:', err);
  process.exit(1);
});
