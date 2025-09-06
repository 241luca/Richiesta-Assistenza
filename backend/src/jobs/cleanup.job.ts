import cron from 'node-cron';
import { fileService } from '../services/file.service';
import { logger } from '../utils/logger';

/**
 * Cron job per pulizia file orfani
 * Esegue ogni giorno alle 03:00 AM
 */
export const initializeCleanupJobs = () => {
  // Pulizia file orfani ogni notte alle 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Starting orphan files cleanup job');
    
    try {
      await fileService.cleanupOrphanFiles();
      logger.info('Orphan files cleanup completed successfully');
    } catch (error) {
      logger.error('Error during orphan files cleanup:', error);
    }
  });
  
  // Log statistiche storage ogni giorno alle 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Generating storage statistics');
    
    try {
      const stats = await fileService.getStorageStats();
      logger.info('Storage statistics:', stats);
    } catch (error) {
      logger.error('Error generating storage statistics:', error);
    }
  });
  
  logger.info('File cleanup cron jobs initialized');
};
