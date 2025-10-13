/**
 * Health Check Report Generator
 * Genera report PDF settimanali con statistiche e trend
 */

import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { NotificationService } from '../../services/notification.service';
import { auditLogService } from '../../services/auditLog.service'; // 🆕 INTEGRAZIONE 2: Audit Log
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

interface ModuleStats {
  module: string;
  avgScore: number;
  minScore: number;
  maxScore: number;
  totalChecks: number;
  failureCount: number;
  warningCount: number;
  uptime: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export class HealthCheckReportGenerator {
  private reportsDir: string;

  constructor() {
    this.reportsDir = path.join(__dirname, '../../../reports/health-checks');
    this.ensureReportsDirectory();
  }

  /**
   * Assicura che la directory dei report esista
   */
  private ensureReportsDirectory(): void {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Genera il report settimanale
   */
  public async generateWeeklyReport(): Promise<string> {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      logger.info('📊 Generating weekly health check report...');

      // Recupera i dati dal database
      const currentWeekData = await this.getHealthCheckData(weekStart, weekEnd);
      const previousWeekData = await this.getHealthCheckData(previousWeekStart, weekStart);

      // Calcola le statistiche
      const moduleStats = await this.calculateModuleStats(currentWeekData, previousWeekData);
      const overallHealth = this.calculateOverallHealth(currentWeekData);

      // Genera il PDF
      const filename = `health-report-${format(weekStart, 'yyyy-MM-dd')}.pdf`;
      const filepath = path.join(this.reportsDir, filename);
      
      await this.createPDF(filepath, {
        weekStart,
        weekEnd,
        moduleStats,
        overallHealth,
        totalChecks: currentWeekData.length,
        incidents: await this.getIncidents(weekStart, weekEnd)
      });

      // Invia il report agli admin
      await this.sendReportToAdmins(filepath, weekStart);

      logger.info(`✅ Weekly report generated: ${filename}`);
      return filepath;

    } catch (error) {
      logger.error('Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * Recupera i dati dei health check dal database
   */
  private async getHealthCheckData(startDate: Date, endDate: Date): Promise<any[]> {
    return await prisma.healthCheckResult.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  /**
   * Calcola le statistiche per ogni modulo
   */
  private async calculateModuleStats(
    currentData: any[],
    previousData: any[]
  ): Promise<ModuleStats[]> {
    const modules = [...new Set(currentData.map(d => d.module))];
    const stats: ModuleStats[] = [];

    for (const module of modules) {
      const moduleData = currentData.filter(d => d.module === module);
      const prevModuleData = previousData.filter(d => d.module === module);

      const scores = moduleData.map(d => d.score);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const prevAvgScore = prevModuleData.length > 0
        ? prevModuleData.map(d => d.score).reduce((a, b) => a + b, 0) / prevModuleData.length
        : avgScore;

      stats.push({
        module,
        avgScore: Math.round(avgScore),
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        totalChecks: moduleData.length,
        failureCount: moduleData.filter(d => d.status === 'critical').length,
        warningCount: moduleData.filter(d => d.status === 'warning').length,
        uptime: this.calculateUptime(moduleData),
        trend: avgScore > prevAvgScore ? 'improving' : 
               avgScore < prevAvgScore ? 'degrading' : 'stable'
      });
    }

    return stats.sort((a, b) => a.avgScore - b.avgScore);
  }

  /**
   * Calcola l'uptime percentuale
   */
  private calculateUptime(data: any[]): number {
    const healthyChecks = data.filter(d => d.status === 'healthy').length;
    return Math.round((healthyChecks / data.length) * 100);
  }

  /**
   * Calcola la salute complessiva del sistema
   */
  private calculateOverallHealth(data: any[]): number {
    if (data.length === 0) return 0;
    const totalScore = data.reduce((sum, d) => sum + d.score, 0);
    return Math.round(totalScore / data.length);
  }

  /**
   * Recupera gli incidenti della settimana
   */
  private async getIncidents(startDate: Date, endDate: Date): Promise<any[]> {
    const criticalResults = await prisma.healthCheckResult.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        },
        status: 'critical'
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return criticalResults.map(r => ({
      module: r.module,
      timestamp: r.timestamp,
      score: r.score,
      errors: r.errors
    }));
  }

  /**
   * Crea il documento PDF
   */
  private async createPDF(filepath: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24)
         .text('REPORT SETTIMANALE HEALTH CHECK', { align: 'center' })
         .moveDown();

      doc.fontSize(12)
         .text(`Periodo: ${format(data.weekStart, 'dd/MM/yyyy', { locale: it })} - ${format(data.weekEnd, 'dd/MM/yyyy', { locale: it })}`)
         .text(`Generato: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`)
         .moveDown();

      // Summary Box
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text('RIEPILOGO GENERALE', { underline: true })
         .fillColor('black')
         .moveDown(0.5);

      doc.fontSize(11)
         .text(`Health Score Globale: ${data.overallHealth}/100`)
         .text(`Controlli Totali: ${data.totalChecks}`)
         .text(`Moduli Monitorati: ${data.moduleStats.length}`)
         .moveDown();

      // Stato Moduli
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text('STATO DEI MODULI', { underline: true })
         .fillColor('black')
         .moveDown(0.5);

      // Tabella moduli
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 280;
      const col4 = 360;
      const col5 = 440;

      // Header tabella
      doc.fontSize(10)
         .text('Modulo', col1, tableTop)
         .text('Score Medio', col2, tableTop)
         .text('Uptime %', col3, tableTop)
         .text('Errori', col4, tableTop)
         .text('Trend', col5, tableTop);

      doc.moveTo(col1, tableTop + 15)
         .lineTo(520, tableTop + 15)
         .stroke();

      // Righe tabella
      let yPosition = tableTop + 25;
      for (const stat of data.moduleStats) {
        const statusColor = stat.avgScore >= 80 ? '#10b981' : 
                           stat.avgScore >= 60 ? '#f59e0b' : '#ef4444';

        doc.fontSize(9)
           .fillColor('black')
           .text(stat.module, col1, yPosition)
           .fillColor(statusColor)
           .text(`${stat.avgScore}/100`, col2, yPosition)
           .fillColor('black')
           .text(`${stat.uptime}%`, col3, yPosition)
           .text(stat.failureCount.toString(), col4, yPosition);

        // Trend icon
        const trendSymbol = stat.trend === 'improving' ? '↑' :
                          stat.trend === 'degrading' ? '↓' : '→';
        const trendColor = stat.trend === 'improving' ? '#10b981' :
                         stat.trend === 'degrading' ? '#ef4444' : '#6b7280';
        
        doc.fillColor(trendColor)
           .text(trendSymbol, col5, yPosition)
           .fillColor('black');

        yPosition += 20;

        // Nuova pagina se necessario
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }

      doc.moveDown(2);

      // Incidenti critici
      if (data.incidents.length > 0) {
        doc.fontSize(14)
           .fillColor('#ef4444')
           .text('INCIDENTI CRITICI', { underline: true })
           .fillColor('black')
           .moveDown(0.5);

        for (const incident of data.incidents.slice(0, 5)) {
          doc.fontSize(9)
             .text(`• ${format(incident.timestamp, 'dd/MM HH:mm')} - ${incident.module} (Score: ${incident.score}/100)`)
             .text(`  ${incident.errors.join(', ')}`, { indent: 10 })
             .moveDown(0.5);
        }
      }

      // Raccomandazioni
      doc.moveDown()
         .fontSize(14)
         .fillColor('#2563eb')
         .text('RACCOMANDAZIONI', { underline: true })
         .fillColor('black')
         .moveDown(0.5);

      const recommendations = this.generateRecommendations(data.moduleStats);
      doc.fontSize(10);
      for (const rec of recommendations) {
        doc.text(`• ${rec}`).moveDown(0.5);
      }

      // Footer
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('Report generato automaticamente dal Sistema Health Check', 50, 750, { align: 'center' })
         .text('© 2025 LM Tecnologie - Sistema Richiesta Assistenza', { align: 'center' });

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * Genera raccomandazioni basate sui dati
   */
  private generateRecommendations(stats: ModuleStats[]): string[] {
    const recommendations: string[] = [];

    // Moduli critici
    const criticalModules = stats.filter(s => s.avgScore < 60);
    if (criticalModules.length > 0) {
      recommendations.push(
        `Attenzione immediata richiesta per: ${criticalModules.map(m => m.module).join(', ')}`
      );
    }

    // Moduli in peggioramento
    const degradingModules = stats.filter(s => s.trend === 'degrading');
    if (degradingModules.length > 0) {
      recommendations.push(
        `Monitorare attentamente i moduli in peggioramento: ${degradingModules.map(m => m.module).join(', ')}`
      );
    }

    // Uptime basso
    const lowUptimeModules = stats.filter(s => s.uptime < 90);
    if (lowUptimeModules.length > 0) {
      recommendations.push(
        `Migliorare la stabilità per: ${lowUptimeModules.map(m => m.module).join(', ')}`
      );
    }

    // Raccomandazioni generiche
    if (recommendations.length === 0) {
      recommendations.push('Sistema generalmente stabile, continuare il monitoraggio regolare');
      recommendations.push('Considerare l\'ottimizzazione dei moduli con score < 90');
    }

    return recommendations;
  }

  /**
   * Invia il report agli amministratori
   */
  private async sendReportToAdmins(filepath: string, weekStart: Date): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });

      const weekString = format(weekStart, 'dd/MM/yyyy', { locale: it });

      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          type: 'health_check_report',
          title: '📊 Report Settimanale Health Check',
          message: `Il report health check della settimana del ${weekString} è disponibile.`,
          data: {
            reportPath: filepath,
            weekStart: weekStart.toISOString()
          },
          priority: 'normal',
          channels: ['email', 'websocket']
        });
      }

      logger.info(`📧 Report sent to ${admins.length} administrators`);
    } catch (error) {
      logger.error('Error sending report to admins:', error);
    }
  }

  /**
   * Genera report on-demand
   */
  public async generateCustomReport(startDate: Date, endDate: Date): Promise<string> {
    const data = await this.getHealthCheckData(startDate, endDate);
    const filename = `health-report-custom-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    const filepath = path.join(this.reportsDir, filename);

    const moduleStats = await this.calculateModuleStats(data, []);
    const overallHealth = this.calculateOverallHealth(data);

    await this.createPDF(filepath, {
      weekStart: startDate,
      weekEnd: endDate,
      moduleStats,
      overallHealth,
      totalChecks: data.length,
      incidents: await this.getIncidents(startDate, endDate)
    });

    return filepath;
  }

  /**
   * Genera un report (wrapper per compatibilità API)
   * 🎯 INTEGRAZIONE 2: Aggiungo Audit Log per report generati
   */
  public async generateReport(
    startDate: string | Date,
    endDate: string | Date,
    format: 'pdf' | 'csv' = 'pdf',
    generatedBy?: string
  ): Promise<{ filename: string; filepath: string }> {
    const startTime = Date.now();
    
    // 📝 AUDIT: Registra l'inizio della generazione report
    await auditLogService.log({
      userId: generatedBy || 'MANUAL',
      action: 'HEALTH_REPORT_GENERATION_START',
      entityType: 'HealthCheck',
      entityId: 'report',
      details: {
        startDate: typeof startDate === 'string' ? startDate : startDate.toISOString(),
        endDate: typeof endDate === 'string' ? endDate : endDate.toISOString(),
        format: format,
        triggeredBy: generatedBy || 'Manual Request',
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Report Generator'
    });
    
    try {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

      logger.info(`📊 Generating report from ${start.toISOString()} to ${end.toISOString()}...`);

      const filepath = await this.generateCustomReport(start, end);
      
      // Ottieni info sul file generato
      const stats = await fs.promises.stat(filepath);
      const fileSizeKB = Math.round(stats.size / 1024);
      const executionTime = Date.now() - startTime;
      
      // 📝 AUDIT: Registra il successo della generazione
      await auditLogService.log({
        userId: generatedBy || 'MANUAL',
        action: 'HEALTH_REPORT_GENERATION_SUCCESS',
        entityType: 'HealthCheck',
        entityId: 'report',
        details: {
          filename: path.basename(filepath),
          filepath: filepath,
          fileSizeKB: fileSizeKB,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          format: format,
          executionTimeMs: executionTime,
          triggeredBy: generatedBy || 'Manual Request',
          timestamp: new Date().toISOString()
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Report Generator'
      });
      
      logger.info(`✅ Report generated: ${path.basename(filepath)} (${fileSizeKB}KB) in ${executionTime}ms`);

      return {
        filename: path.basename(filepath),
        filepath: filepath
      };
    } catch (error) {
      // 📝 AUDIT: Registra il fallimento
      const executionTime = Date.now() - startTime;
      await auditLogService.log({
        userId: generatedBy || 'MANUAL',
        action: 'HEALTH_REPORT_GENERATION_FAILED',
        entityType: 'HealthCheck',
        entityId: 'report',
        details: {
          startDate: typeof startDate === 'string' ? startDate : startDate.toISOString(),
          endDate: typeof endDate === 'string' ? endDate : endDate.toISOString(),
          format: format,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString()
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Report Generator'
      });
      
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Ottiene lo storico dei report generati
   */
  public async getReportHistory(): Promise<Array<{
    filename: string;
    filepath: string;
    size: number;
    created: Date;
    modified: Date;
  }>> {
    try {
      const files = await fs.promises.readdir(this.reportsDir);

      const reports = await Promise.all(
        files
          .filter(f => f.endsWith('.pdf'))
          .map(async (filename) => {
            const filepath = path.join(this.reportsDir, filename);
            const stats = await fs.promises.stat(filepath);

            return {
              filename,
              filepath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            };
          })
      );

      // Ordina per data modificato (più recente prima)
      return reports.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (error) {
      logger.error('Error getting report history:', error);
      return [];
    }
  }

  /**
   * Ottiene il path di un report specifico
   */
  public async getReportPath(filename: string): Promise<string | null> {
    try {
      const filepath = path.join(this.reportsDir, filename);

      // Verifica che il file esista
      await fs.promises.access(filepath, fs.constants.F_OK);

      return filepath;
    } catch (error) {
      logger.debug(`Report file not found: ${filename}`);
      return null;
    }
  }
}

// Export singleton
export const reportGenerator = new HealthCheckReportGenerator();