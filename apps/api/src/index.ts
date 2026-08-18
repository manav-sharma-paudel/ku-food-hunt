import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { scheduleOrphanSweep } from './lib/upload-sweep';

const app = createApp();

// Vercel serverless: skip listen, just export the app.
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Periodically reclaim abandoned upload files. Long-lived process only — on
  // serverless the FS is read-only and there is no process to host the timer.
  scheduleOrphanSweep();

  function shutdown(signal: string): void {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
