import { cleanupExpiredSessions } from '../services/session.service';
import logger from '../utils/logger.util';

/**
 * Cleanup expired user sessions
 * This can be run as a cron job or periodically
 */
export async function runSessionCleanup() {
  try {
    logger.info('Starting session cleanup task');
    const cleanedCount = await cleanupExpiredSessions();
    logger.info(`Session cleanup completed. Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  } catch (error) {
    logger.error('Session cleanup failed:', error);
    throw error;
  }
}

/**
 * Schedule session cleanup to run periodically
 * Call this in your app startup
 */
export function scheduleSessionCleanup(intervalHours: number = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  logger.info(`Scheduling session cleanup to run every ${intervalHours} hours`);
  
  // Run immediately on startup
  runSessionCleanup().catch(error => {
    logger.error('Initial session cleanup failed:', error);
  });
  
  // Schedule periodic cleanup
  setInterval(async () => {
    try {
      await runSessionCleanup();
    } catch (error) {
      logger.error('Scheduled session cleanup failed:', error);
    }
  }, intervalMs);
}
