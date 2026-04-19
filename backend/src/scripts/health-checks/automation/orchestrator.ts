/**
 * Health Check Master Orchestrator
 * Coordina tutti i componenti del sistema Health Check della Fase 4
 */

import * as cron from 'node-cron';
import { scheduler } from './scheduler';
import { reportGenerator } from './report-generator';
import { autoRemediation } from './auto-remediation';
import { performanceMonitor } from './performance-monitor';
import { logger } from '../../../backend/src/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HealthCheckOrchestrator {
  private isRunning: boolean = false;
  private weeklyReportTask: cron.ScheduledTask | null = null;

  /**
   * Inizializza e avvia tutto il sistema
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ Health Check Orchestrator is already running');
      return;
    }

    logger.info('🎯 Starting Health Check Orchestrator...');

    try {
      // 1. Avvia lo scheduler principale
      await scheduler.start();
      logger.info('✅ Scheduler started');

      // 2. Configura il report settimanale (ogni lunedì alle 9:00)
      this.weeklyReportTask = cron.schedule('0 9 * * 1', async () => {
        logger.info('📊 Generating weekly report...');
        try {
          await reportGenerator.generateWeeklyReport();
        } catch (error: unknown) {
          logger.error('Failed to generate weekly report:', error instanceof Error ? error.message : String(error));
        }
      });
      logger.info('✅ Weekly report scheduler configured');

      // 3. Configura il monitoring delle performance
      await performanceMonitor.start();
      logger.info('✅ Performance monitor started');

      // 4. Verifica auto-remediation
      logger.info('✅ Auto-remediation system ready');

      this.isRunning = true;
      logger.info('🚀 Health Check Orchestrator fully operational');

      // Esegui un check iniziale
      await this.runInitialCheck();

    } catch (error: unknown) {
      logger.error('❌ Failed to start orchestrator:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Ferma tutto il sistema
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('⚠️ Orchestrator is not running');
      return;
    }

    logger.info('⏹️ Stopping Health Check Orchestrator...');

    // Ferma scheduler
    scheduler.stop();

    // Ferma report scheduler
    if (this.weeklyReportTask) {
      this.weeklyReportTask.stop();
    }

    // Ferma performance monitor
    performanceMonitor.stop();

    this.isRunning = false;
    logger.info('✅ Orchestrator stopped');
  }

  /**
   * Esegue un check iniziale al startup
   */
  private async runInitialCheck(): Promise<void> {
    logger.info('🔍 Running initial system check...');
    
    try {
      const results = await scheduler.runManualCheck();
      logger.info('✅ Initial check completed');
      
      // Se ci sono problemi critici, prova auto-remediation
      if (Array.isArray(results)) {
        for (const result of results) {
          if (result && result.status === 'critical') {
            logger.warn(`⚠️ Critical issue detected in ${result.module}`);
            await autoRemediation.evaluateAndRemediate(result);
          }
        }
      }
    } catch (error: unknown) {
      logger.error('Initial check failed:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Esegue un health check manuale con remediation
   */
  public async runManualCheckWithRemediation(module?: string): Promise<any> {
    logger.info(`🔍 Running manual check ${module ? `for ${module}` : 'for all modules'}`);
    
    const results = await scheduler.runManualCheck(module);
    
    // Applica auto-remediation se necessario
    if (results) {
      const resultsArray = Array.isArray(results) ? results : [results];
      
      for (const result of resultsArray) {
        if (result && (result.status === 'critical' || result.status === 'warning')) {
          const remediationResult = await autoRemediation.evaluateAndRemediate(result);
          
          if (remediationResult) {
            // Ri-esegui il check dopo remediation
            const newResult = await scheduler.runManualCheck(result.module);
            return {
              original: result,
              remediation: remediationResult,
              afterRemediation: newResult
            };
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Genera un report on-demand
   */
  public async generateReport(startDate?: Date, endDate?: Date): Promise<string> {
    if (!startDate || !endDate) {
      // Default: ultima settimana
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }
    
    return await reportGenerator.generateCustomReport(startDate, endDate);
  }

  /**
   * Ottiene lo stato corrente del sistema
   */
  public async getSystemStatus(): Promise<any> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Recupera ultimi risultati per ogni modulo
    const latestResults = await prisma.healthCheckResult.findMany({
      where: {
        timestamp: { gte: oneDayAgo }
      },
      orderBy: { timestamp: 'desc' },
      distinct: ['module']
    });
    
    // Calcola statistiche
    const stats = {
      totalModules: latestResults.length,
      healthyModules: latestResults.filter(r => r.status === 'healthy').length,
      warningModules: latestResults.filter(r => r.status === 'warning').length,
      criticalModules: latestResults.filter(r => r.status === 'critical').length,
      overallScore: Math.round(
        latestResults.reduce((sum, r) => sum + r.score, 0) / latestResults.length
      ),
      modules: latestResults.map(r => ({
        name: r.module,
        status: r.status,
        score: r.score,
        lastCheck: r.timestamp
      }))
    };
    
    return {
      orchestratorRunning: this.isRunning,
      schedulerConfig: scheduler.getConfig(),
      remediationRules: autoRemediation.getRules().filter(r => r.enabled).length,
      systemStats: stats,
      nextWeeklyReport: this.weeklyReportTask ? 'Monday 9:00 AM' : 'Not scheduled'
    };
  }

  /**
   * Aggiorna configurazione runtime
   */
  public async updateConfiguration(config: {
    scheduler?: any;
    remediation?: any;
    performance?: any;
  }): Promise<void> {
    if (config.scheduler) {
      await scheduler.updateConfig(config.scheduler);
      logger.info('✅ Scheduler configuration updated');
    }
    
    if (config.remediation) {
      for (const rule of config.remediation) {
        await autoRemediation.addOrUpdateRule(rule);
      }
      logger.info('✅ Remediation rules updated');
    }
    
    if (config.performance) {
      await performanceMonitor.updateConfig(config.performance);
      logger.info('✅ Performance monitor configuration updated');
    }
  }

  /**
   * Ottiene metriche di performance
   */
  public async getPerformanceMetrics(): Promise<any> {
    return await performanceMonitor.getMetrics();
  }

  /**
   * Esporta dati per analisi
   */
  public async exportData(format: 'json' | 'csv', startDate: Date, endDate: Date): Promise<string> {
    const data = await prisma.healthCheckResult.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });
    
    if (format === 'json') {
      const filepath = `/tmp/health-export-${Date.now()}.json`;
      require('fs').writeFileSync(filepath, JSON.stringify(data, null, 2));
      return filepath;
    } else {
      // CSV export
      const filepath = `/tmp/health-export-${Date.now()}.csv`;
      const csv = this.convertToCSV(data);
      require('fs').writeFileSync(filepath, csv);
      return filepath;
    }
  }

  /**
   * Converte dati in CSV
   */
  private convertToCSV(data: any[]): string {
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

// Singleton instance
export const orchestrator = new HealthCheckOrchestrator();

// CLI interface per testing
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      orchestrator.start().then(() => {
        logger.info('Orchestrator started via CLI');
      });
      break;
      
    case 'stop':
      orchestrator.stop();
      logger.info('Orchestrator stopped via CLI');
      break;
      
    case 'check':
      orchestrator.runManualCheckWithRemediation(process.argv[3]).then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      });
      break;
      
    case 'report':
      orchestrator.generateReport().then(filepath => {
        logger.info(`Report generated: ${filepath}`);
        process.exit(0);
      });
      break;
      
    case 'status':
      orchestrator.getSystemStatus().then(status => {
        console.log(JSON.stringify(status, null, 2));
        process.exit(0);
      });
      break;
      
    default:
      console.log(`
        Usage: ts-node orchestrator.ts [command]
        
        Commands:
          start   - Start the orchestrator
          stop    - Stop the orchestrator
          check   - Run manual health check
          report  - Generate report
          status  - Get system status
      `);
      process.exit(1);
  }
}