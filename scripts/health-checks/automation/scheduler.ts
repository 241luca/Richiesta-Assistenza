/**
 * Health Check Scheduler
 * Sistema di schedulazione configurabile per l'esecuzione automatica dei controlli
 * Integrato con il sistema di notifiche esistente
 */

import * as cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../../backend/src/services/notification.service';
import { logger } from '../../../backend/src/utils/logger';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const notificationService = new NotificationService();

interface ScheduleConfig {
  enabled: boolean;
  interval: string; // Cron expression
  modules: {
    [key: string]: string; // module: cron expression
  };
  alerts: {
    enabled: boolean;
    channels: string[];
    thresholds: {
      critical: number;
      warning: number;
    };
  };
  retention: {
    days: number;
    compress: boolean;
  };
}

interface HealthCheckResult {
  module: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  checks: any[];
  warnings: string[];
  errors: string[];
  executionTime: number;
}

export class HealthCheckScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private config: ScheduleConfig;
  private configPath: string;

  constructor() {
    this.configPath = path.join(__dirname, '../config/schedule.config.json');
    this.loadConfiguration();
  }

  /**
   * Carica la configurazione dal file JSON
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configFile = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configFile);
      logger.info('✅ Health check schedule configuration loaded');
    } catch (error) {
      logger.warn('⚠️ No configuration file found, using defaults');
      this.config = this.getDefaultConfig();
      await this.saveConfiguration();
    }
  }

  /**
   * Salva la configurazione corrente
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
      logger.info('✅ Configuration saved');
    } catch (error) {
      logger.error('❌ Error saving configuration:', error);
    }
  }

  /**
   * Configurazione di default
   */
  private getDefaultConfig(): ScheduleConfig {
    return {
      enabled: true,
      interval: '*/30 * * * *', // Ogni 30 minuti
      modules: {
        'auth-system': '*/15 * * * *',      // Ogni 15 minuti
        'database-health': '*/5 * * * *',    // Ogni 5 minuti
        'notification-system': '*/30 * * * *', // Ogni 30 minuti
        'backup-system': '0 */6 * * *',      // Ogni 6 ore
        'chat-system': '*/20 * * * *',       // Ogni 20 minuti
        'payment-system': '0 * * * *',       // Ogni ora
        'ai-system': '*/30 * * * *',         // Ogni 30 minuti
        'request-system': '*/15 * * * *'     // Ogni 15 minuti
      },
      alerts: {
        enabled: true,
        channels: ['email', 'websocket'],
        thresholds: {
          critical: 60,
          warning: 80
        }
      },
      retention: {
        days: 30,
        compress: true
      }
    };
  }

  /**
   * Avvia lo scheduler
   */
  public async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('⏸️ Health check scheduler is disabled');
      return;
    }

    logger.info('🚀 Starting health check scheduler...');

    // Schedule principale per tutti i moduli
    if (this.config.interval) {
      const mainTask = cron.schedule(this.config.interval, async () => {
        await this.runAllChecks();
      });
      this.tasks.set('main', mainTask);
    }

    // Schedule specifici per modulo
    for (const [module, cronExpression] of Object.entries(this.config.modules)) {
      if (cronExpression) {
        const task = cron.schedule(cronExpression, async () => {
          await this.runModuleCheck(module);
        });
        this.tasks.set(module, task);
        logger.info(`📅 Scheduled ${module}: ${cronExpression}`);
      }
    }

    // Pulizia vecchi risultati
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldResults();
    });
    this.tasks.set('cleanup', cleanupTask);

    logger.info('✅ Scheduler started with ' + this.tasks.size + ' tasks');
  }

  /**
   * Ferma lo scheduler
   */
  public stop(): void {
    logger.info('⏹️ Stopping health check scheduler...');
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`⏹️ Stopped task: ${name}`);
    }
    this.tasks.clear();
  }

  /**
   * Esegue il controllo di un singolo modulo
   */
  private async runModuleCheck(moduleName: string): Promise<HealthCheckResult | null> {
    try {
      logger.info(`🔍 Running health check for: ${moduleName}`);
      
      const scriptPath = path.join(__dirname, '../modules', `${moduleName}-check.ts`);
      const startTime = Date.now();
      
      // Esegue lo script TypeScript
      const { stdout, stderr } = await execAsync(`npx ts-node ${scriptPath}`);
      
      if (stderr) {
        logger.error(`Error in ${moduleName}:`, stderr);
      }

      const result: HealthCheckResult = JSON.parse(stdout);
      result.executionTime = Date.now() - startTime;

      // Salva il risultato nel database
      await this.saveResult(result);

      // Controlla se servono alert
      await this.checkAlerts(result);

      logger.info(`✅ ${moduleName} check completed - Score: ${result.score}/100`);
      return result;

    } catch (error) {
      logger.error(`❌ Error running ${moduleName} check:`, error);
      
      // Crea un risultato di errore
      const errorResult: HealthCheckResult = {
        module: moduleName,
        timestamp: new Date(),
        status: 'unknown',
        score: 0,
        checks: [],
        warnings: [],
        errors: [`Failed to execute health check: ${error.message}`],
        executionTime: 0
      };

      await this.saveResult(errorResult);
      await this.checkAlerts(errorResult);
      
      return errorResult;
    }
  }

  /**
   * Esegue tutti i controlli
   */
  private async runAllChecks(): Promise<void> {
    logger.info('🔄 Running all health checks...');
    
    const modules = Object.keys(this.config.modules);
    const results = await Promise.all(
      modules.map(module => this.runModuleCheck(module))
    );

    // Calcola health score totale
    const validResults = results.filter(r => r !== null);
    const totalScore = validResults.reduce((sum, r) => sum + r.score, 0);
    const averageScore = Math.round(totalScore / validResults.length);

    logger.info(`📊 Overall health score: ${averageScore}/100`);

    // Invia summary notification
    if (averageScore < this.config.alerts.thresholds.critical) {
      await this.sendNotification(
        'critical',
        '🚨 Sistema in stato critico',
        `Health score globale: ${averageScore}/100. Intervento immediato richiesto.`,
        { score: averageScore, modules: validResults }
      );
    }
  }

  /**
   * Salva il risultato nel database
   */
  private async saveResult(result: HealthCheckResult): Promise<void> {
    try {
      await prisma.healthCheckResult.create({
        data: {
          module: result.module,
          status: result.status,
          score: result.score,
          checks: result.checks,
          warnings: result.warnings,
          errors: result.errors,
          metrics: result as any,
          executionTime: result.executionTime,
          timestamp: result.timestamp
        }
      });
    } catch (error) {
      logger.error('Error saving health check result:', error);
    }
  }

  /**
   * Controlla se servono alert basati sui risultati
   */
  private async checkAlerts(result: HealthCheckResult): Promise<void> {
    if (!this.config.alerts.enabled) return;

    const { critical, warning } = this.config.alerts.thresholds;

    if (result.score < critical) {
      await this.sendNotification(
        'critical',
        `🚨 ${result.module} - CRITICO`,
        `Score: ${result.score}/100. Errori: ${result.errors.join(', ')}`,
        result
      );
    } else if (result.score < warning) {
      await this.sendNotification(
        'warning',
        `⚠️ ${result.module} - ATTENZIONE`,
        `Score: ${result.score}/100. Avvisi: ${result.warnings.join(', ')}`,
        result
      );
    }
  }

  /**
   * Invia notifica usando il sistema esistente
   */
  private async sendNotification(
    severity: 'critical' | 'warning' | 'info',
    title: string,
    message: string,
    data: any
  ): Promise<void> {
    try {
      // Mappa severity su priority del sistema notifiche
      const priorityMap = {
        'critical': 'urgent' as const,
        'warning': 'high' as const,
        'info': 'normal' as const
      };

      // Trova tutti gli admin da notificare
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        },
        select: { id: true }
      });

      // Invia notifica a tutti gli admin
      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          type: 'health_check_alert',
          title,
          message,
          data,
          priority: priorityMap[severity],
          channels: this.config.alerts.channels as any
        });
      }

      logger.info(`📧 Alert sent: ${title}`);
    } catch (error) {
      logger.error('Error sending alert:', error);
    }
  }

  /**
   * Pulisce i risultati vecchi dal database
   */
  private async cleanupOldResults(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention.days);

      const deleted = await prisma.healthCheckResult.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      logger.info(`🧹 Cleaned up ${deleted.count} old health check results`);
    } catch (error) {
      logger.error('Error cleaning up old results:', error);
    }
  }

  /**
   * Aggiorna la configurazione runtime
   */
  public async updateConfig(newConfig: Partial<ScheduleConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfiguration();
    
    // Riavvia lo scheduler con la nuova configurazione
    this.stop();
    await this.start();
  }

  /**
   * Ottiene la configurazione corrente
   */
  public getConfig(): ScheduleConfig {
    return this.config;
  }

  /**
   * Esegue un check manuale immediato
   */
  public async runManualCheck(module?: string): Promise<any> {
    if (module) {
      return await this.runModuleCheck(module);
    } else {
      return await this.runAllChecks();
    }
  }
}

// Export singleton instance
export const scheduler = new HealthCheckScheduler();