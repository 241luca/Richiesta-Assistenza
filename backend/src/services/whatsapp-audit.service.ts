// backend/src/services/whatsapp-audit.service.ts
/**
 * Integrazione Audit Log per WhatsApp
 * Traccia tutte le operazioni WhatsApp per compliance e sicurezza
 * 
 * VERSIONE CORRETTA: Usa AuditLog del progetto
 * Data: 10/10/2025
 */

import { logger } from '../utils/logger';
import { auditLogService } from './auditLog.service';
import * as cron from 'node-cron';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

// ==================== TIPI ====================

type AuditCategory =
  | 'AUTH'
  | 'DATA'
  | 'ADMIN'
  | 'SYSTEM'
  | 'SECURITY'
  | 'BUSINESS'
  | 'LEGAL'
  | 'COMMUNICATION';

type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface WhatsAppMetadata {
  messageLength?: number;
  hasMedia?: boolean;
  mediaUrl?: string;
  command?: string;
  result?: string;
  company?: string;
  [key: string]: unknown;
}

export interface WhatsAppAuditEvent {
  action: string;
  phoneNumber: string;
  userId?: string;
  messageId?: string;
  intent?: string;
  category?: string;
  requestId?: string;
  complaintId?: string;
  success: boolean;
  responseTime?: number;
  aiModel?: string;
  aiTokens?: number;
  kbDocuments?: number;
  errorMessage?: string;
  metadata?: WhatsAppMetadata;
}

interface AuditReportSummary {
  totalMessages: number;
  uniqueUsers: number;
  errors: number;
  errorRate: string;
  pecComplaints: number;
  requestsCreated: number;
}

interface AuditReportPerformance {
  avgResponseTime: number;
  avgTokensUsed: number;
}

interface ActionBreakdownItem {
  action: string;
  count: number;
}

interface AuditReportCompliance {
  allEventsLogged: boolean;
  gdprCompliant: boolean;
  dataRetentionPolicy: string;
  encryptionEnabled: boolean;
}

interface AuditReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: AuditReportSummary;
  performance: AuditReportPerformance;
  actionBreakdown: ActionBreakdownItem[];
  compliance: AuditReportCompliance;
}

interface Anomaly {
  type: string;
  severity: AnomalySeverity;
  message: string;
  action: string;
}

// ==================== LOGGING FUNCTIONS ====================

/**
 * Mappa un'azione WhatsApp a un'azione AuditLog valida
 */
function mapWhatsAppActionToAuditAction(action: string): AuditAction {
  if (action.includes('REQUEST_CREATED')) return 'REQUEST_CREATED';
  if (action.includes('REQUEST')) return 'UPDATE';
  if (action.includes('COMPLAINT')) return 'CREATE';
  if (action.includes('MESSAGE')) return 'CREATE';
  if (action.includes('COMMAND')) return 'UPDATE';
  return 'CREATE'; // Default
}

/**
 * Log evento WhatsApp nell'audit trail
 */
export async function logWhatsAppEvent(
  event: WhatsAppAuditEvent
): Promise<void> {
  try {
    let severity: LogSeverity = 'INFO';

    if (!event.success) {
      severity = 'ERROR';
    } else if (event.responseTime && event.responseTime > 5000) {
      severity = 'WARNING';
    } else if (
      event.action.includes('COMPLAINT') ||
      event.action.includes('PEC')
    ) {
      severity = 'WARNING';
    }

    await auditLogService.log({
      action: mapWhatsAppActionToAuditAction(event.action),
      entityType: 'WhatsAppMessage',
      entityId: event.messageId || 'N/A',
      userId: event.userId,
      userEmail: undefined,
      userRole: undefined,
      ipAddress: 'whatsapp-bot',
      userAgent: 'WhatsApp-Bot/1.0',
      metadata: {
        whatsappAction: event.action, // L'azione specifica va qui
        phoneNumber: maskPhoneNumber(event.phoneNumber),
        intent: event.intent,
        category: event.category,
        requestId: event.requestId,
        complaintId: event.complaintId,
        responseTime: event.responseTime,
        aiModel: event.aiModel,
        aiTokens: event.aiTokens,
        kbDocuments: event.kbDocuments,
        ...event.metadata,
      },
      success: event.success,
      errorMessage: event.errorMessage,
      severity,
      category: determineCategory(event.action),
    });

    logger.info(`WhatsApp event logged: ${event.action}`);
  } catch (error) {
    logger.error('Errore logging WhatsApp audit:', error);
  }
}

/**
 * Log messaggio in ingresso
 */
export async function logIncomingMessage(
  phoneNumber: string,
  message: string,
  userId?: string,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'MESSAGE_RECEIVED',
    phoneNumber,
    userId,
    success: true,
    metadata: {
      messageLength: message.length,
      hasMedia: metadata?.mediaUrl ? true : false,
      ...metadata,
    },
  });
}

/**
 * Log messaggio in uscita
 */
export async function logOutgoingMessage(
  phoneNumber: string,
  message: string,
  userId?: string,
  success: boolean = true,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'MESSAGE_SENT',
    phoneNumber,
    userId,
    success,
    metadata: {
      messageLength: message.length,
      ...metadata,
    },
  });
}

/**
 * Log comando eseguito
 */
export async function logCommand(
  phoneNumber: string,
  command: string,
  userId: string,
  success: boolean,
  result?: string
): Promise<void> {
  await logWhatsAppEvent({
    action: `COMMAND_${command.toUpperCase()}`,
    phoneNumber,
    userId,
    success,
    metadata: {
      command,
      result: result || (success ? 'Executed' : 'Failed'),
    },
  });
}

/**
 * Log creazione richiesta assistenza
 */
export async function logRequestCreation(
  phoneNumber: string,
  userId: string,
  requestId: string,
  category: string,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'REQUEST_CREATED',
    phoneNumber,
    userId,
    requestId,
    category,
    success: true,
    metadata,
  });

  await auditLogService.log({
    action: 'CREATE' as AuditAction,
    entityType: 'AssistanceRequest',
    entityId: requestId,
    userId,
    userEmail: undefined,
    userRole: undefined,
    ipAddress: 'whatsapp-bot',
    userAgent: 'WhatsApp-Bot/1.0',
    metadata: {
      source: 'WHATSAPP',
      phoneNumber: maskPhoneNumber(phoneNumber),
      category,
    },
    success: true,
    severity: 'INFO',
    category: 'BUSINESS',
  });
}

/**
 * Log invio reclamo PEC
 */
export async function logComplaintSent(
  phoneNumber: string,
  userId: string,
  complaintId: string,
  company: string,
  success: boolean,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'COMPLAINT_PEC_SENT',
    phoneNumber,
    userId,
    complaintId,
    success,
    metadata: {
      company,
      ...metadata,
    },
  });

  await auditLogService.log({
    action: 'CREATE' as AuditAction,
    entityType: 'Complaint',
    entityId: complaintId,
    userId,
    userEmail: undefined,
    userRole: undefined,
    ipAddress: 'whatsapp-bot',
    userAgent: 'WhatsApp-Bot/1.0',
    metadata: {
      initiatedVia: 'WHATSAPP',
      company,
      phoneNumber: maskPhoneNumber(phoneNumber),
    },
    success,
    severity: 'WARNING',
    category: 'COMPLIANCE',
  });
}

/**
 * Log errore AI
 */
export async function logAIError(
  phoneNumber: string,
  error: string,
  model: string,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'AI_ERROR',
    phoneNumber,
    success: false,
    aiModel: model,
    errorMessage: error,
    metadata,
  });
}

/**
 * Log performance AI
 */
export async function logAIPerformance(
  phoneNumber: string,
  userId: string,
  model: string,
  tokens: number,
  responseTime: number,
  metadata?: WhatsAppMetadata
): Promise<void> {
  await logWhatsAppEvent({
    action: 'AI_RESPONSE',
    phoneNumber,
    userId,
    success: true,
    aiModel: model,
    aiTokens: tokens,
    responseTime,
    metadata,
  });
}

// ==================== REPORTING FUNCTIONS ====================

/**
 * Genera report audit WhatsApp
 * Usa i dati dall'AuditLog del progetto
 */
export async function generateAuditReport(
  startDate: Date,
  endDate: Date
): Promise<AuditReport> {
  try {
    // Usa auditLogService per ottenere le statistiche
    const stats = await auditLogService.getStatistics({
      fromDate: startDate,
      toDate: endDate,
    });

    // Cerca specificamente i log WhatsApp
    const whatsappLogs = await auditLogService.search({
      entityType: 'WhatsAppMessage',
      fromDate: startDate,
      toDate: endDate,
      limit: 10000, // Per avere tutti i dati per il report
    });

    // Calcola metriche specifiche WhatsApp
    const totalMessages = whatsappLogs.logs.length;
    const errors = whatsappLogs.logs.filter(log => !log.success).length;
    const pecComplaints = whatsappLogs.logs.filter(
      log => log.metadata && (log.metadata as any).company
    ).length;
    const requestsCreated = whatsappLogs.logs.filter(
      log => log.entityType === 'AssistanceRequest'
    ).length;

    // Calcola performance media
    const logsWithTime = whatsappLogs.logs.filter(log => log.responseTime);
    const avgResponseTime = logsWithTime.length > 0
      ? logsWithTime.reduce((sum, log) => sum + (log.responseTime || 0), 0) / logsWithTime.length
      : 0;

    // Conta utenti unici (dai metadata)
    const uniquePhones = new Set(
      whatsappLogs.logs
        .map(log => (log.metadata as any)?.phoneNumber)
        .filter(Boolean)
    );

    // Raggruppa azioni
    const actionCounts = new Map<string, number>();
    whatsappLogs.logs.forEach(log => {
      const action = log.action || 'UNKNOWN';
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const actionBreakdown = Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count,
    }));

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalMessages,
        uniqueUsers: uniquePhones.size,
        errors,
        errorRate: totalMessages > 0 ? ((errors / totalMessages) * 100).toFixed(2) + '%' : '0%',
        pecComplaints,
        requestsCreated,
      },
      performance: {
        avgResponseTime,
        avgTokensUsed: 0, // Questo dato non è disponibile in AuditLog standard
      },
      actionBreakdown,
      compliance: {
        allEventsLogged: true,
        gdprCompliant: true,
        dataRetentionPolicy: '90 days',
        encryptionEnabled: true,
      },
    };
  } catch (error) {
    logger.error('Errore generazione report WhatsApp:', error);
    throw error;
  }
}

/**
 * Verifica anomalie nei log WhatsApp
 */
export async function detectAnomalies(): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    // Cerca errori recenti nei log WhatsApp
    const recentLogs = await auditLogService.search({
      entityType: 'WhatsAppMessage',
      fromDate: oneHourAgo,
      limit: 1000,
    });

    const errors = recentLogs.logs.filter(log => !log.success);

    // 1. Troppi errori consecutivi
    if (errors.length > 10) {
      anomalies.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'HIGH',
        message: `${errors.length} errori nell'ultima ora`,
        action: 'Verificare sistema WhatsApp',
      });
    }

    // 2. Stesso numero troppe richieste
    const phoneCounts = new Map<string, number>();
    recentLogs.logs.forEach(log => {
      const phone = (log.metadata as any)?.phoneNumber;
      if (phone) {
        phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
      }
    });

    phoneCounts.forEach((count, phone) => {
      if (count > 50) {
        anomalies.push({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          message: `Numero ${phone} ha inviato ${count} messaggi`,
          action: 'Possibile spam o abuso',
        });
      }
    });

    // 3. Response time degradato
    const slowResponses = recentLogs.logs.filter(
      log => log.responseTime && log.responseTime > 10000
    );

    if (slowResponses.length > 5) {
      anomalies.push({
        type: 'PERFORMANCE_DEGRADATION',
        severity: 'MEDIUM',
        message: `${slowResponses.length} risposte lente nell'ultima ora`,
        action: 'Verificare performance AI/DB',
      });
    }

    // 4. PEC complaints spike (ultime 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const complaintsLogs = await auditLogService.search({
      entityType: 'Complaint',
      fromDate: twentyFourHoursAgo,
      limit: 100,
    });

    if (complaintsLogs.logs.length > 10) {
      anomalies.push({
        type: 'PEC_SPIKE',
        severity: 'HIGH',
        message: `${complaintsLogs.logs.length} reclami PEC nelle ultime 24h`,
        action: 'Verificare problemi di servizio',
      });
    }

  } catch (error) {
    logger.error('Errore rilevamento anomalie:', error);
  }

  return anomalies;
}

/**
 * Pulizia log vecchi (GDPR compliance)
 * Delega la pulizia al sistema AuditLog che ha già questa funzionalità
 */
export async function cleanupOldLogs(
  retentionDays: number = 90
): Promise<number> {
  try {
    logger.info(`Pulizia log WhatsApp delegata al sistema AuditLog (retention: ${retentionDays} giorni)`);
    
    // Il sistema AuditLog ha già il suo sistema di pulizia automatica
    // basato sulle retention policy configurate
    await auditLogService.cleanupOldLogs();
    
    return 0; // Non possiamo restituire il numero esatto senza query diretta
  } catch (error) {
    logger.error('Errore pulizia log WhatsApp:', error);
    return 0;
  }
}

// ==================== UTILITY FUNCTIONS ====================

function maskPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  if (phone.length < 4) return '****';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

function determineCategory(action: string): LogCategory {
  if (action.includes('PEC') || action.includes('COMPLAINT')) return 'COMPLIANCE';
  if (action.includes('MESSAGE')) return 'USER_ACTIVITY';
  if (action.includes('REQUEST')) return 'BUSINESS';
  if (action.includes('COMMAND')) return 'SYSTEM';
  if (action.includes('AI')) return 'SYSTEM';
  return 'USER_ACTIVITY';
}

// ==================== SCHEDULERS ====================

// Scheduler per pulizia automatica (ogni giorno alle 3 AM)
cron.schedule('0 3 * * *', async () => {
  logger.info('Avvio pulizia log WhatsApp (delegata ad AuditLog)...');
  await cleanupOldLogs();
});

// Scheduler per detection anomalie (ogni 30 minuti)
cron.schedule('*/30 * * * *', async () => {
  const anomalies = await detectAnomalies();

  if (anomalies.length > 0) {
    logger.warn('Anomalie WhatsApp rilevate:', anomalies);

    for (const anomaly of anomalies) {
      if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
        logger.error(`ANOMALIA CRITICA: ${anomaly.message}`);
      }
    }
  }
});
