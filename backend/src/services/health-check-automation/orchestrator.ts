/**
 * Orchestrator FIX - Integrazione con servizio Health Check reale
 */

import { healthCheckService } from '../healthCheck.service';
import { scheduler } from './scheduler';
import { reportGenerator } from './report-generator';
import { autoRemediation } from './auto-remediation';
import { performanceMonitor } from './performance-monitor';
import { auditLogService } from '../auditLog.service'; // 🆕 INTEGRAZIONE 2: Audit Log
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import * as cron from 'node-cron';

export class HealthCheckOrchestrator {
  private isRunning: boolean = false;
  private mainTask: cron.ScheduledTask | null = null;
  private weeklyReportTask: cron.ScheduledTask | null = null;

  /**
   * Ottiene lo stato del sistema - USA DATI REALI
   */
  public async getSystemStatus(): Promise<any> {
    try {
      // USA IL SERVIZIO REALE invece dei mock!
      const summary = await healthCheckService.getLastSummary();
      
      if (!summary) {
        // Se non ci sono dati, esegui un check completo
        const newSummary = await healthCheckService.runAllChecks();
        return newSummary;
      }
      
      return summary;
    } catch (error) {
      logger.error('Error getting system status:', error);
      
      // Fallback con struttura vuota
      return {
        overall: 'unknown',
        overallScore: 0,
        modules: [],
        lastCheck: new Date(),
        alerts: [],
        statistics: {
          totalModules: 0,
          healthyModules: 0,
          warningModules: 0,
          criticalModules: 0
        }
      };
    }
  }

  /**
   * Esegue un check manuale con remediation - USA SERVIZIO REALE
   * 🎯 INTEGRAZIONE 2: Aggiungo Audit Log per operazioni manuali
   */
  public async runManualCheckWithRemediation(moduleName?: string, triggeredBy?: string): Promise<any> {
    const startTime = Date.now();
    const checkType = moduleName ? `single:${moduleName}` : 'complete';
    
    try {
      let result;
      
      // 📝 AUDIT: Registra l'inizio del test manuale
      await auditLogService.log({
        userId: triggeredBy || 'MANUAL',
        action: 'HEALTH_CHECK_MANUAL_START',
        entityType: 'HealthCheck',
        entityId: checkType,
        details: {
          module: moduleName || 'all',
          triggeredBy: triggeredBy || 'Manual UI',
          timestamp: new Date().toISOString()
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Health Check Orchestrator'
      });
      
      if (moduleName) {
        // Check singolo modulo
        result = await healthCheckService.runSingleCheck(moduleName);
      } else {
        // Check completo
        result = await healthCheckService.runAllChecks();
      }
      
      // Se ci sono problemi, prova auto-remediation
      if (result.status === 'critical' || result.status === 'warning') {
        const remediationResult = await autoRemediation.executeForModule(moduleName || 'system');
        if (remediationResult.success) {
          // Riesegui il check dopo remediation
          if (moduleName) {
            result = await healthCheckService.runSingleCheck(moduleName);
          } else {
            result = await healthCheckService.runAllChecks();
          }
        }
      }
      
      // 📝 AUDIT: Registra il completamento del test
      const executionTime = Date.now() - startTime;
      await auditLogService.log({
        userId: triggeredBy || 'MANUAL',
        action: 'HEALTH_CHECK_MANUAL_COMPLETE',
        entityType: 'HealthCheck',
        entityId: checkType,
        details: {
          module: moduleName || 'all',
          score: result.overallScore || result.score,
          status: result.overall || result.status,
          executionTimeMs: executionTime,
          triggeredBy: triggeredBy || 'Manual UI',
          alerts: result.alerts?.length || 0
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Health Check Orchestrator'
      });
      
      logger.info(`✅ Manual health check completed: ${checkType} in ${executionTime}ms`);
      return result;
    } catch (error) {
      logger.error('Error running manual check:', error);
      throw error;
    }
  }

  /**
   * Avvia l'orchestrator
   * 🎯 INTEGRAZIONE 2: Aggiungo Audit Log per avvio sistema
   */
  public async start(startedBy?: string): Promise<void> {
    if (this.isRunning) {
      logger.warn('Orchestrator already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Health Check Orchestrator starting...');

    // 📝 AUDIT: Registra l'avvio del sistema
    await auditLogService.log({
      userId: startedBy || 'SYSTEM',
      action: 'HEALTH_CHECK_SYSTEM_START',
      entityType: 'HealthCheck',
      entityId: 'orchestrator',
      details: {
        startedBy: startedBy || 'System Boot',
        scheduledChecks: true,
        weeklyReports: true,
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Health Check Orchestrator'
    });

    // Configura scheduler per check automatici
    this.mainTask = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('⏰ Running scheduled health check...');
        await this.runManualCheckWithRemediation();
      } catch (error) {
        logger.error('Error in scheduled check:', error);
      }
    });

    // Report settimanale
    this.weeklyReportTask = cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('📊 Generating weekly report...');
        await this.generateReport();
      } catch (error) {
        logger.error('Error generating weekly report:', error);
      }
    });

    logger.info('✅ Orchestrator started successfully');
  }

  /**
   * Ferma l'orchestrator
   * 🎯 INTEGRAZIONE 2: Aggiungo Audit Log per stop sistema
   */
  public async stop(stoppedBy?: string): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Orchestrator not running');
      return;
    }

    if (this.mainTask) {
      this.mainTask.stop();
      this.mainTask = null;
    }

    if (this.weeklyReportTask) {
      this.weeklyReportTask.stop();
      this.weeklyReportTask = null;
    }

    // 📝 AUDIT: Registra lo stop del sistema
    await auditLogService.log({
      userId: stoppedBy || 'SYSTEM',
      action: 'HEALTH_CHECK_SYSTEM_STOP',
      entityType: 'HealthCheck',
      entityId: 'orchestrator',
      details: {
        stoppedBy: stoppedBy || 'Manual Stop',
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Health Check Orchestrator'
    });

    this.isRunning = false;
    logger.info('🛑 Orchestrator stopped');
  }

  /**
   * Genera report
   */
  public async generateReport(): Promise<string> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const report = await reportGenerator.generateReport(startDate, endDate, 'pdf');
    return report.filepath;
  }

  /**
   * Ottiene lo storico
   */
  public async getHistory(moduleName?: string, limit: number = 100): Promise<any[]> {
    return await healthCheckService.getHistory(moduleName, limit);
  }

  /**
   * Esporta dati
   */
  public async exportData(format: 'json' | 'csv', startDate?: string, endDate?: string): Promise<string> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const data = await healthCheckService.getHistory(undefined, 1000, start, end);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Converti in CSV
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : v
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }
  }
}

// Singleton instance
export const orchestrator = new HealthCheckOrchestrator();
