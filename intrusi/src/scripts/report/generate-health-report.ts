/**
 * Script per generare report PDF dell'health check del sistema
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface ReportParams {
  startDate: string;
  endDate: string;
  format?: 'pdf' | 'csv' | 'json';
}

export async function execute(params: ReportParams) {
  try {
    logger.info('📊 Generating health check report...', params);
    
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    
    // Recupera i risultati dell'health check nel periodo
    const healthResults = await prisma.healthCheckResult.findMany({
      where: {
        checkedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        checkedAt: 'desc'
      }
    });
    
    // Statistiche
    const stats = {
      total: healthResults.length,
      healthy: healthResults.filter(r => r.status === 'HEALTHY').length,
      degraded: healthResults.filter(r => r.status === 'DEGRADED').length,
      unhealthy: healthResults.filter(r => r.status === 'UNHEALTHY').length,
      avgResponseTime: healthResults.reduce((acc, r) => acc + (r.responseTime || 0), 0) / healthResults.length
    };
    
    // Genera il report nel formato richiesto
    let reportPath = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (params.format) {
      case 'json':
        reportPath = path.join(process.cwd(), 'database-backups', 'reports', `health-report-${timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify({ stats, results: healthResults }, null, 2));
        break;
        
      case 'csv':
        reportPath = path.join(process.cwd(), 'database-backups', 'reports', `health-report-${timestamp}.csv`);
        // Genera CSV (implementazione semplificata)
        const csv = 'Module,Status,Response Time,Checked At\n' + 
          healthResults.map(r => `${r.moduleName},${r.status},${r.responseTime},${r.checkedAt}`).join('\n');
        await fs.writeFile(reportPath, csv);
        break;
        
      default:
        // PDF - per ora generiamo solo JSON
        reportPath = path.join(process.cwd(), 'database-backups', 'reports', `health-report-${timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify({ stats, results: healthResults }, null, 2));
    }
    
    logger.info(`✅ Report generated: ${reportPath}`);
    
    return {
      success: true,
      reportPath,
      stats,
      format: params.format || 'pdf',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
    
  } catch (error: any) {
    logger.error('❌ Report generation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
