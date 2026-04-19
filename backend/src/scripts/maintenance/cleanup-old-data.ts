/**
 * Script per pulire dati vecchi dal database
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

interface CleanupParams {
  days?: number;
  tables?: 'logs' | 'notifications' | 'audit' | 'all';
}

export async function execute(params: CleanupParams = { days: 90, tables: 'all' }) {
  try {
    logger.info('🗑️ Starting data cleanup...', params);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (params.days || 90));
    
    let deletedCounts: any = {};
    
    // Pulizia notifiche vecchie
    if (params.tables === 'notifications' || params.tables === 'all') {
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });
      deletedCounts.notifications = deletedNotifications.count;
      logger.info(`🔔 Deleted ${deletedNotifications.count} old notifications`);
    }
    
    // Pulizia audit log vecchi
    if (params.tables === 'audit' || params.tables === 'all') {
      const deletedAuditLogs = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          severity: 'INFO'
        }
      });
      deletedCounts.auditLogs = deletedAuditLogs.count;
      logger.info(`📝 Deleted ${deletedAuditLogs.count} old audit logs`);
    }
    
    logger.info('✅ Data cleanup completed');
    
    return {
      success: true,
      cutoffDate: cutoffDate.toISOString(),
      deletedCounts,
      message: `Cleaned data older than ${params.days} days`
    };
    
  } catch (error: any) {
    logger.error('❌ Data cleanup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
