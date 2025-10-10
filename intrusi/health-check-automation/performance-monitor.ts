/**
 * Performance Monitor
 * Monitora le performance del sistema e delle API
 */

import { PrismaClient } from '@prisma/client';
import * as os from 'os';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  database: {
    activeConnections: number;
    queryTime: number;
    slowQueries: number;
  };
  api: {
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  healthChecks: {
    averageExecutionTime: number;
    checksPerHour: number;
    failureRate: number;
  };
}

export class PerformanceMonitor {
  private interval: NodeJS.Timeout | null = null;
  private metricsHistory: PerformanceMetrics[] = [];
  private config = {
    intervalSeconds: 60,
    historyLimit: 1440, // 24 ore di dati
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      responseTime: 1000,
      errorRate: 5
    }
  };

  /**
   * Avvia il monitoring
   */
  public async start(): Promise<void> {
    if (this.interval) {
      logger.warn('Performance monitor already running');
      return;
    }

    logger.info('📊 Starting performance monitor...');
    
    // Raccogli metriche iniziali
    await this.collectMetrics();
    
    // Schedula la raccolta periodica
    this.interval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.intervalSeconds * 1000);
    
    logger.info('✅ Performance monitor started');
  }

  /**
   * Ferma il monitoring
   */
  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('⏹️ Performance monitor stopped');
    }
  }

  /**
   * Raccoglie le metriche correnti
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        cpu: await this.getCPUMetrics(),
        memory: this.getMemoryMetrics(),
        database: await this.getDatabaseMetrics(),
        api: await this.getAPIMetrics(),
        healthChecks: await this.getHealthCheckMetrics()
      };

      // Aggiungi alla history
      this.metricsHistory.push(metrics);
      
      // Mantieni solo il limite configurato
      if (this.metricsHistory.length > this.config.historyLimit) {
        this.metricsHistory.shift();
      }

      // Controlla alert
      await this.checkAlerts(metrics);
      
      // Salva nel database
      await this.saveMetrics(metrics);
      
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Ottiene metriche CPU
   */
  private async getCPUMetrics(): Promise<any> {
    const cpus = os.cpus();
    const load = os.loadavg();
    
    // Calcola utilizzo CPU
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usage = 100 - ~~(100 * totalIdle / totalTick);
    
    return {
      usage,
      load
    };
  }

  /**
   * Ottiene metriche memoria
   */
  private getMemoryMetrics(): any {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);
    
    return {
      total,
      used,
      free,
      percentage
    };
  }

  /**
   * Ottiene metriche database
   */
  private async getDatabaseMetrics(): Promise<any> {
    try {
      // Conta connessioni attive
      const connectionResult = await prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      
      // Query time medio (ultimi 100 health checks)
      const recentChecks = await prisma.healthCheckResult.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        select: { executionTime: true }
      });
      
      const avgQueryTime = recentChecks.length > 0
        ? Math.round(recentChecks.reduce((sum, r) => sum + r.executionTime, 0) / recentChecks.length)
        : 0;
      
      // Conta slow queries (> 1000ms)
      const slowQueries = recentChecks.filter(r => r.executionTime > 1000).length;
      
      return {
        activeConnections: connectionResult[0]?.active_connections || 0,
        queryTime: avgQueryTime,
        slowQueries
      };
    } catch (error) {
      logger.error('Error getting database metrics:', error);
      return {
        activeConnections: 0,
        queryTime: 0,
        slowQueries: 0
      };
    }
  }

  /**
   * Ottiene metriche API
   */
  private async getAPIMetrics(): Promise<any> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      
      // Simula metriche API (in produzione verrebbero da un middleware)
      // Per ora usiamo i health check come proxy
      const recentResults = await prisma.healthCheckResult.count({
        where: {
          timestamp: { gte: oneMinuteAgo }
        }
      });
      
      const failedResults = await prisma.healthCheckResult.count({
        where: {
          timestamp: { gte: oneMinuteAgo },
          status: 'critical'
        }
      });
      
      return {
        responseTime: 150, // Placeholder
        requestsPerMinute: recentResults,
        errorRate: recentResults > 0 ? (failedResults / recentResults) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting API metrics:', error);
      return {
        responseTime: 0,
        requestsPerMinute: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Ottiene metriche health checks
   */
  private async getHealthCheckMetrics(): Promise<any> {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      
      const recentChecks = await prisma.healthCheckResult.findMany({
        where: {
          timestamp: { gte: oneHourAgo }
        },
        select: {
          executionTime: true,
          status: true
        }
      });
      
      const avgExecutionTime = recentChecks.length > 0
        ? Math.round(recentChecks.reduce((sum, r) => sum + r.executionTime, 0) / recentChecks.length)
        : 0;
      
      const failedChecks = recentChecks.filter(r => r.status === 'critical').length;
      const failureRate = recentChecks.length > 0 
        ? (failedChecks / recentChecks.length) * 100 
        : 0;
      
      return {
        averageExecutionTime: avgExecutionTime,
        checksPerHour: recentChecks.length,
        failureRate: Math.round(failureRate)
      };
    } catch (error) {
      logger.error('Error getting health check metrics:', error);
      return {
        averageExecutionTime: 0,
        checksPerHour: 0,
        failureRate: 0
      };
    }
  }

  /**
   * Controlla se servono alert
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const alerts: string[] = [];
    
    if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      alerts.push(`CPU usage high: ${metrics.cpu.usage}%`);
    }
    
    if (metrics.memory.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push(`Memory usage high: ${metrics.memory.percentage}%`);
    }
    
    if (metrics.api.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push(`API response time slow: ${metrics.api.responseTime}ms`);
    }
    
    if (metrics.api.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push(`API error rate high: ${metrics.api.errorRate}%`);
    }
    
    if (alerts.length > 0) {
      logger.warn('⚠️ Performance alerts:', alerts);
      // Qui potresti inviare notifiche usando il NotificationService
    }
  }

  /**
   * Salva metriche nel database
   */
  private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await prisma.performanceMetrics.create({
        data: {
          timestamp: metrics.timestamp,
          cpuUsage: metrics.cpu.usage,
          memoryUsage: metrics.memory.percentage,
          databaseConnections: metrics.database.activeConnections,
          apiResponseTime: metrics.api.responseTime,
          requestsPerMinute: metrics.api.requestsPerMinute,
          errorRate: metrics.api.errorRate,
          metrics: metrics as any
        }
      });
    } catch (error) {
      // Tabella potrebbe non esistere ancora
      logger.debug('Could not save performance metrics:', error.message);
    }
  }

  /**
   * Ottiene le metriche correnti (alias per compatibilità con routes)
   */
  public async getCurrentMetrics(): Promise<PerformanceMetrics | null> {
    return this.getMetrics();
  }

  /**
   * Ottiene la history delle metriche (alias per compatibilità con routes)
   */
  public async getHistory(startDate?: string, endDate?: string): Promise<any> {
    let filteredHistory = this.metricsHistory;
    
    if (startDate) {
      const start = new Date(startDate);
      filteredHistory = filteredHistory.filter(m => m.timestamp >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredHistory = filteredHistory.filter(m => m.timestamp <= end);
    }
    
    // Se non ci sono dati in memoria, prova a recuperarli dal database
    if (filteredHistory.length === 0) {
      try {
        const dbMetrics = await prisma.performanceMetrics.findMany({
          where: {
            timestamp: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        });
        
        return dbMetrics.map(m => ({
          timestamp: m.timestamp,
          cpuUsage: m.cpuUsage,
          memoryUsage: m.memoryUsage,
          databaseConnections: m.databaseConnections,
          apiResponseTime: m.apiResponseTime,
          requestsPerMinute: m.requestsPerMinute,
          errorRate: m.errorRate,
          ...(m.metrics as any || {})
        }));
      } catch (error) {
        logger.debug('Could not fetch history from database:', error.message);
      }
    }
    
    return filteredHistory;
  }

  /**
   * Ottiene le metriche correnti
   */
  public async getMetrics(): Promise<PerformanceMetrics | null> {
    if (this.metricsHistory.length === 0) {
      await this.collectMetrics();
    }
    
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Ottiene la history delle metriche
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return this.metricsHistory;
  }

  /**
   * Aggiorna configurazione
   */
  public async updateConfig(newConfig: Partial<typeof this.config>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Riavvia con nuova configurazione
    this.stop();
    await this.start();
  }

  /**
   * Ottiene statistiche aggregate
   */
  public getAggregateStats(minutes: number = 60): any {
    const cutoff = new Date(Date.now() - minutes * 60000);
    const relevantMetrics = this.metricsHistory.filter(m => m.timestamp >= cutoff);
    
    if (relevantMetrics.length === 0) {
      return null;
    }
    
    return {
      period: `Last ${minutes} minutes`,
      samples: relevantMetrics.length,
      cpu: {
        avg: Math.round(relevantMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / relevantMetrics.length),
        max: Math.max(...relevantMetrics.map(m => m.cpu.usage)),
        min: Math.min(...relevantMetrics.map(m => m.cpu.usage))
      },
      memory: {
        avg: Math.round(relevantMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) / relevantMetrics.length),
        max: Math.max(...relevantMetrics.map(m => m.memory.percentage)),
        min: Math.min(...relevantMetrics.map(m => m.memory.percentage))
      },
      api: {
        avgResponseTime: Math.round(relevantMetrics.reduce((sum, m) => sum + m.api.responseTime, 0) / relevantMetrics.length),
        totalRequests: relevantMetrics.reduce((sum, m) => sum + m.api.requestsPerMinute, 0),
        avgErrorRate: Math.round(relevantMetrics.reduce((sum, m) => sum + m.api.errorRate, 0) / relevantMetrics.length)
      }
    };
  }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor();