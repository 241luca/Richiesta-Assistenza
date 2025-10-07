/**
 * Script per esportare i log di audit per analisi
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExportParams {
  startDate: string;
  endDate: string;
  category?: 'all' | 'auth' | 'data' | 'admin' | 'security';
  format?: 'csv' | 'json' | 'pdf';
}

export async function execute(params: ExportParams) {
  try {
    logger.info('📋 Exporting audit logs...', params);
    
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    
    // Query per i log
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (params.category && params.category !== 'all') {
      whereClause.category = params.category.toUpperCase();
    }
    
    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });
    
    // Genera il file di export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let exportPath = '';
    
    switch (params.format) {
      case 'csv':
        exportPath = path.join(process.cwd(), 'database-backups', 'reports', `audit-log-${timestamp}.csv`);
        const csvHeader = 'Date,User,Action,Entity Type,Entity ID,Success,IP Address,Category\n';
        const csvData = auditLogs.map(log => 
          `${log.createdAt},${log.user?.email || 'System'},${log.action},${log.entityType || ''},${log.entityId || ''},${log.success},${log.ipAddress || ''},${log.category || ''}`
        ).join('\n');
        await fs.writeFile(exportPath, csvHeader + csvData);
        break;
        
      case 'json':
      default:
        exportPath = path.join(process.cwd(), 'database-backups', 'reports', `audit-log-${timestamp}.json`);
        await fs.writeFile(exportPath, JSON.stringify(auditLogs, null, 2));
        break;
    }
    
    logger.info(`✅ Audit logs exported: ${exportPath}`);
    
    return {
      success: true,
      exportPath,
      totalRecords: auditLogs.length,
      format: params.format || 'json',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      category: params.category || 'all'
    };
    
  } catch (error: any) {
    logger.error('❌ Audit log export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
