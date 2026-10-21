import { app } from './app.js';
import { config } from './config/env.js';
import { testDatabaseConnection, closeDatabasePool } from './config/database.js';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  console.info(`🌸 Sakura API Server is running on http://localhost:${PORT}`);
  console.info(`🌸 Health check endpoint: http://localhost:${PORT}/api/v1/health`);

  const dbStatus = await testDatabaseConnection();
  if (dbStatus.connected) {
    console.info('🌸 Database connected successfully.');
  } else {
    console.warn(`⚠️ Database connection warning: ${dbStatus.message}`);
  }
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.info(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.info('HTTP server closed.');
    await closeDatabasePool();
    console.info('Database pool closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
