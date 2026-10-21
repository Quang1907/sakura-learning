import { testDatabaseConnection, closeDatabasePool } from '../config/database.js';

async function main() {
  console.info('Testing MySQL connection...');
  const result = await testDatabaseConnection();
  console.info(`Connection result:`, result);
  await closeDatabasePool();
}

main().catch((err) => {
  console.error('Fatal error during connection test:', err);
  process.exit(1);
});
