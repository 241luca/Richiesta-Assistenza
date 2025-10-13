// backend/src/services/auditLog.service.ts
import { prisma } from '../config/database';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';
import { Request } from 'express';
import { differenceWith, isEqual } from 'lodash';
import { createId } from '@paralleldrive/cuid2';

interface AuditLogData {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  oldValues?: any;
  newValues?: any;
  changes?: any;
  metadata?: any;
  success: boolean;
  errorMessage?: string;
  responseTime?: number;
  statusCode?: number;
  severity: LogSeverity;
  category: LogCategory;
}

class AuditLogService {
  /**
   * Registra un evento nel log di audit
   */
  async log(data: AuditLogData) {
    try {
      // Calcola automaticamente le modifiche se ci sono old e new values
      if (data.oldValues && data.newValues && !data.changes) {
        data.changes = this.calculateChanges(data.oldValues, data.newValues);
      }

      // Crea il log nel database
      const auditLog = await prisma.auditLog.create({
        data: {
          id: createId(),  // Aggiungiamo l'ID qui
          userId: data.userId,
          userEmail: data.userEmail,
          userRole: data.userRole,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          endpoint: data.endpoint,
          method: data.method,
          requestId: data.requestId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          changes: data.changes,
          metadata: data.metadata,
          success: data.success,
          errorMessage: data.errorMessage,
          responseTime: data.responseTime,
          statusCode: data.statusCode,
          severity: data.severity,
          category: data.category,
        }
      });

      // Controlla se devono scattare degli alert
      await this.checkAlerts(auditLog);

      return auditLog;
    } catch (error) {
      console.error('❌ AUDIT LOG ERROR - DETTAGLIO COMPLETO:');
      console.error('Error object:', error);
      console.error('Data che stava cercando di salvare:', JSON.stringify(data, null, 2));
      // Non blocchiamo l'operazione principale se il log fallisce
      return null;
    }
  }

  /**
   * Estrae informazioni dalla request
   */
  extractRequestInfo(req: Request): Partial<AuditLogData> {
    const user = (req as any).user;
    return {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      sessionId: (req as any).sessionID,
      endpoint: req.originalUrl,
      method: req.method,
      requestId: (req as any).id, // Assumendo che usiamo request-id middleware
    };
  }

  /**
   * Calcola le differenze tra due oggetti
   */
  private calculateChanges(oldValues: any, newValues: any): any {
    const changes: any = {};
    
    // Trova campi modificati
    for (const key in newValues) {
      if (!isEqual(oldValues[key], newValues[key])) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key]
        };
      }
    }
    
    // Trova campi rimossi
    for (const key in oldValues) {
      if (!(key in newValues)) {
        changes[key] = {
          old: oldValues[key],
          new: null,
          removed: true
        };
      }
    }
    
    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Verifica se devono scattare alert
   */
  private async checkAlerts(log: any) {
    try {
      const alerts = await prisma.auditLogAlert.findMany({
        where: { isActive: true }
      });

      for (const alert of alerts) {
        if (this.shouldTriggerAlert(log, alert.condition as any)) {
          await this.triggerAlert(alert, log);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Valuta se un alert deve essere triggerato
   */
  private shouldTriggerAlert(log: any, condition: any): boolean {
    // Implementazione semplificata - può essere estesa
    if (condition.action && log.action !== condition.action) return false;
    if (condition.severity && log.severity !== condition.severity) return false;
    if (condition.category && log.category !== condition.category) return false;
    if (condition.success !== undefined && log.success !== condition.success) return false;
    
    return true;
  }

  /**
   * Triggera un alert
   */
  private async triggerAlert(alert: any, log: any) {
    // Aggiorna il contatore dell'alert
    await prisma.auditLogAlert.update({
      where: { id: alert.id },
      data: {
        lastTriggered: new Date(),
        triggerCount: { increment: 1 }
      }
    });

    // Qui si potrebbero inviare email o chiamare webhook
    console.log(`Alert triggered: ${alert.name} for log ${log.id}`);
  }

  /**
   * Ricerca nei log con filtri
   */
  async search(filters: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    category?: LogCategory;
    severity?: LogSeverity;
    success?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    if (filters.success !== undefined) where.success = filters.success;
    
    if (filters.fromDate || filters.toDate) {
      where.timestamp = {};
      if (filters.fromDate) where.timestamp.gte = filters.fromDate;
      if (filters.toDate) where.timestamp.lte = filters.toDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        // La relazione utente su AuditLog è denominata in PascalCase (User)
        // Usiamo include con chiave "User" e normalizziamo il payload più sotto
        include: {
          User: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true
            }
          }
        } as any,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      }),
      prisma.auditLog.count({ where })
    ]);
    // Normalizza: esponi anche la proprietà camelCase "user" per compatibilità
    const normalizedLogs = logs.map((log: any) => ({
      ...log,
      user: log.User ?? null
    }));

    return { logs: normalizedLogs, total };
  }

  /**
   * Ottieni statistiche aggregate
   */
  async getStatistics(filters: {
    fromDate?: Date;
    toDate?: Date;
    groupBy?: 'day' | 'hour' | 'action' | 'category';
  }) {
    const where: any = {};
    
    if (filters.fromDate || filters.toDate) {
      where.timestamp = {};
      if (filters.fromDate) where.timestamp.gte = filters.fromDate;
      if (filters.toDate) where.timestamp.lte = filters.toDate;
    }

    // Statistiche generali
    const [
      totalLogs,
      failedOperations,
      uniqueUsers,
      topActions
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalLogs,
      failedOperations,
      uniqueUsers: uniqueUsers.length,
      successRate: totalLogs > 0 ? ((totalLogs - failedOperations) / totalLogs * 100).toFixed(2) : 0,
      topActions: topActions.map(a => ({
        action: a.action,
        count: a._count
      }))
    };
  }

  /**
   * Pulisci i log vecchi secondo le retention policy
   */
  async cleanupOldLogs() {
    const retentionPolicies = await prisma.auditLogRetention.findMany({
      where: { isActive: true }
    });

    for (const policy of retentionPolicies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      const deleted = await prisma.auditLog.deleteMany({
        where: {
          category: policy.category,
          timestamp: { lt: cutoffDate }
        }
      });

      console.log(`Deleted ${deleted.count} audit logs for category ${policy.category}`);
    }
  }
}

export const auditLogService = new AuditLogService();
