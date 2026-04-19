/**
 * WhatsApp Error Handler Service
 * Gestione errori categorizzata e robusta per WhatsApp
 * FASE 1 - Correzioni Urgenti: Error Handling
 * 
 * AGGIORNATO: Usa il sistema di notifiche e audit log esistente
 */

import logger from '../utils/logger';
import { prisma } from '../config/database';
import { NotificationService } from './notification.service';
import { auditLogService } from './auditLog.service';
import { LogSeverity, LogCategory } from '@prisma/client';

const notificationService = new NotificationService();

// Tipi di errore WhatsApp
export enum WhatsAppErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  MEDIA_ERROR = 'MEDIA_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// Severità errore
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Classe errore WhatsApp personalizzata
export class WhatsAppError extends Error {
  public timestamp: Date;
  
  constructor(
    message: string,
    public type: WhatsAppErrorType,
    public details?: any,
    public retry: boolean = false,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'WhatsAppError';
    this.timestamp = new Date();
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      retry: this.retry,
      userMessage: this.userMessage,
      timestamp: this.timestamp
    };
  }
}

export class WhatsAppErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: WhatsAppError[] = [];
  private maxErrorHistory = 100;
  
  /**
   * Gestisce un errore generico e lo categorizza
   */
  async handleError(error: any, context?: string): Promise<WhatsAppError> {
    logger.error(`❌ Errore in ${context || 'WhatsApp'}:`, error instanceof Error ? error.message : String(error));
    
    // Categorizza l'errore
    const categorizedError = this.categorizeError(error);
    
    // Usa il sistema AuditLog esistente per salvare l'errore
    await auditLogService.log({
      action: 'WHATSAPP_ERROR' as any,
      entityType: 'WhatsApp',
      entityId: context || 'system',
      userId: undefined,
      ipAddress: 'system',
      userAgent: 'whatsapp-error-handler',
      metadata: {
        error: categorizedError.toJSON(),
        context: context
      },
      success: false,
      errorMessage: categorizedError.message,
      severity: this.mapSeverityToAudit(categorizedError.severity),
      category: LogCategory.SYSTEM
    });
    
    // Aggiorna contatori
    this.updateErrorCounts(categorizedError.type);
    
    // Aggiungi alla storia
    this.addToHistory(categorizedError);
    
    // Usa il sistema di notifiche esistente per errori critici
    if (categorizedError.severity === ErrorSeverity.CRITICAL) {
      await this.notifyAdminsViaNotificationService(categorizedError);
    }
    
    // Tenta auto-recovery se possibile
    if (this.canAutoRecover(categorizedError)) {
      await this.attemptAutoRecovery(categorizedError);
    }
    
    return categorizedError;
  }
  
  /**
   * Mappa la severità per il sistema AuditLog esistente
   */
  private mapSeverityToAudit(severity: ErrorSeverity): LogSeverity {
    switch(severity) {
      case ErrorSeverity.LOW: return LogSeverity.INFO;
      case ErrorSeverity.MEDIUM: return LogSeverity.WARNING;
      case ErrorSeverity.HIGH: return LogSeverity.ERROR;
      case ErrorSeverity.CRITICAL: return LogSeverity.CRITICAL;
      default: return LogSeverity.INFO;
    }
  }
  
  /**
   * Categorizza un errore generico
   */
  private categorizeError(error: any): WhatsAppError {
    const errorMessage = error instanceof Error ? error.message : String(error) || error.toString() || 'Unknown error';
    
    // Connection errors
    if (this.isConnectionError(errorMessage)) {
      return new WhatsAppError(
        'Connessione WhatsApp persa',
        WhatsAppErrorType.CONNECTION_ERROR,
        { originalError: errorMessage },
        true, // retry
        ErrorSeverity.HIGH,
        'WhatsApp non è connesso. Riconnessione in corso...'
      );
    }
    
    // Rate limiting
    if (this.isRateLimitError(errorMessage)) {
      return new WhatsAppError(
        'Rate limit raggiunto',
        WhatsAppErrorType.RATE_LIMIT,
        { 
          originalError: errorMessage,
          waitTime: this.extractWaitTime(errorMessage) 
        },
        true, // retry after wait
        ErrorSeverity.MEDIUM,
        'Troppi messaggi inviati. Attendere qualche minuto.'
      );
    }
    
    // Validation errors
    if (this.isValidationError(errorMessage)) {
      return new WhatsAppError(
        'Errore di validazione',
        WhatsAppErrorType.VALIDATION_ERROR,
        { originalError: errorMessage },
        false, // no retry
        ErrorSeverity.LOW,
        'Dati non validi. Verificare il numero o il messaggio.'
      );
    }
    
    // Session errors
    if (this.isSessionError(errorMessage)) {
      return new WhatsAppError(
        'Errore sessione WhatsApp',
        WhatsAppErrorType.SESSION_ERROR,
        { 
          originalError: errorMessage,
          needsQR: errorMessage.includes('QR') 
        },
        false,
        ErrorSeverity.CRITICAL,
        'Sessione WhatsApp scaduta. Necessario nuovo QR Code.'
      );
    }
    
    // Network errors
    if (this.isNetworkError(errorMessage)) {
      return new WhatsAppError(
        'Errore di rete',
        WhatsAppErrorType.NETWORK_ERROR,
        { originalError: errorMessage },
        true,
        ErrorSeverity.MEDIUM,
        'Problema di connessione. Riprova tra poco.'
      );
    }
    
    // Timeout errors
    if (this.isTimeoutError(errorMessage)) {
      return new WhatsAppError(
        'Timeout operazione',
        WhatsAppErrorType.TIMEOUT_ERROR,
        { originalError: errorMessage },
        true,
        ErrorSeverity.MEDIUM,
        'L\'operazione ha impiegato troppo tempo. Riprova.'
      );
    }
    
    // Media errors
    if (this.isMediaError(errorMessage)) {
      return new WhatsAppError(
        'Errore gestione media',
        WhatsAppErrorType.MEDIA_ERROR,
        { originalError: errorMessage },
        false,
        ErrorSeverity.LOW,
        'Problema con il file. Verifica formato e dimensione.'
      );
    }
    
    // Default: Unknown error
    return new WhatsAppError(
      'Errore sconosciuto',
      WhatsAppErrorType.UNKNOWN,
      { originalError: errorMessage },
      false,
      ErrorSeverity.LOW,
      'Si è verificato un errore. Riprova più tardi.'
    );
  }
  
  // Helper methods per identificare tipi di errore
  private isConnectionError(message: string): boolean {
    const patterns = [
      /not connected/i,
      /connection lost/i,
      /disconnected/i,
      /no connection/i,
      /ECONNREFUSED/i,
      /socket hang up/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isRateLimitError(message: string): boolean {
    const patterns = [
      /rate limit/i,
      /too many requests/i,
      /429/,
      /quota exceeded/i,
      /throttle/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isValidationError(message: string): boolean {
    const patterns = [
      /invalid/i,
      /validation/i,
      /required/i,
      /must be/i,
      /should be/i,
      /formato non valido/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isSessionError(message: string): boolean {
    const patterns = [
      /session/i,
      /unauthorized/i,
      /not authenticated/i,
      /QR/i,
      /logout/i,
      /unpaired/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isNetworkError(message: string): boolean {
    const patterns = [
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /EHOSTUNREACH/i,
      /network/i,
      /DNS/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isTimeoutError(message: string): boolean {
    const patterns = [
      /timeout/i,
      /timed out/i,
      /ETIMEDOUT/i,
      /deadline/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private isMediaError(message: string): boolean {
    const patterns = [
      /media/i,
      /file/i,
      /image/i,
      /video/i,
      /audio/i,
      /document/i,
      /size/i,
      /format/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Estrae tempo di attesa da messaggio rate limit
   */
  private extractWaitTime(message: string): number {
    const match = message.match(/(\d+)\s*(second|minute|hour)/i);
    if (!match) return 60; // default 1 minuto
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch(unit) {
      case 'second': return value;
      case 'minute': return value * 60;
      case 'hour': return value * 3600;
      default: return 60;
    }
  }
  
  /**
   * Aggiorna contatori errori
   */
  private updateErrorCounts(errorType: string): void {
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);
  }
  
  /**
   * Aggiunge errore alla storia
   */
  private addToHistory(error: WhatsAppError): void {
    this.lastErrors.unshift(error);
    if (this.lastErrors.length > this.maxErrorHistory) {
      this.lastErrors = this.lastErrors.slice(0, this.maxErrorHistory);
    }
  }
  
  /**
   * Verifica se può fare auto-recovery
   */
  private canAutoRecover(error: WhatsAppError): boolean {
    // Auto-recovery solo per alcuni tipi di errore
    const recoverableTypes = [
      WhatsAppErrorType.CONNECTION_ERROR,
      WhatsAppErrorType.NETWORK_ERROR,
      WhatsAppErrorType.TIMEOUT_ERROR
    ];
    
    return recoverableTypes.includes(error.type) && error.retry;
  }
  
  /**
   * Tenta auto-recovery
   */
  private async attemptAutoRecovery(error: WhatsAppError): Promise<void> {
    logger.info(`🔄 Tentativo auto-recovery per ${error.type}`);
    
    // Log nel sistema audit
    await auditLogService.log({
      action: 'WHATSAPP_AUTO_RECOVERY_ATTEMPT' as any,
      entityType: 'WhatsApp',
      entityId: 'system',
      ipAddress: 'system',
      userAgent: 'whatsapp-error-handler',
      metadata: {
        errorType: error.type,
        errorMessage: error instanceof Error ? error.message : String(error)
      },
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.SYSTEM
    });
    
    switch(error.type) {
      case WhatsAppErrorType.CONNECTION_ERROR:
        // TODO: Implementare reconnect WhatsApp
        logger.info('📱 Tentativo riconnessione WhatsApp...');
        break;
      
      case WhatsAppErrorType.NETWORK_ERROR:
      case WhatsAppErrorType.TIMEOUT_ERROR:
        // Attendere e riprovare
        logger.info('⏰ Attesa prima di riprovare...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        break;
      
      default:
        logger.warn('⚠️ Auto-recovery non disponibile per questo tipo di errore');
    }
  }
  
  /**
   * Notifica amministratori usando il sistema di notifiche esistente
   */
  private async notifyAdminsViaNotificationService(error: WhatsAppError): Promise<void> {
    try {
      // Trova tutti gli admin
      const admins = await (prisma.user.findMany as any)({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });
      
      // Usa il sistema di notifiche esistente per ogni admin
      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          title: '🚨 Errore Critico WhatsApp',
          message: error.userMessage || error instanceof Error ? error.message : String(error),
          type: 'whatsapp_error',
          priority: 'high',
          data: {
            errorType: error.type,
            severity: error.severity,
            details: error.details
          }
        });
      }
      
      logger.info(`📨 Notifica inviata a ${admins.length} amministratori via NotificationService`);
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'WHATSAPP_CRITICAL_ERROR_NOTIFIED' as any,
        entityType: 'WhatsApp',
        entityId: 'system',
        ipAddress: 'system',
        userAgent: 'whatsapp-error-handler',
        metadata: {
          error: error.toJSON(),
          adminsNotified: admins.length
        },
        success: true,
        severity: LogSeverity.CRITICAL,
        category: LogCategory.SYSTEM
      });
      
    } catch (notifyError) {
      logger.error('Impossibile notificare amministratori:', notifyError);
    }
  }
  
  /**
   * Ottieni statistiche errori
   */
  getErrorStats(): any {
    const stats: any = {
      totalErrors: 0,
      byType: {},
      lastErrors: this.lastErrors.slice(0, 10),
      criticalCount: 0
    };
    
    // Conta per tipo
    for (const [type, count] of this.errorCounts.entries()) {
      stats.byType[type] = count;
      stats.totalErrors += count;
    }
    
    // Conta critici
    stats.criticalCount = this.lastErrors.filter(
      e => e.severity === ErrorSeverity.CRITICAL
    ).length;
    
    return stats;
  }
  
  /**
   * Reset contatori errori
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
    logger.info('🔄 Contatori errori resettati');
    
    // Log nel sistema audit
    auditLogService.log({
      action: 'WHATSAPP_ERROR_COUNTERS_RESET' as any,
      entityType: 'WhatsApp',
      entityId: 'system',
      userId: undefined,
      ipAddress: 'system',
      userAgent: 'whatsapp-error-handler',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.SYSTEM
    }).catch((err: any) => logger.error('Errore log audit:', err));
  }
  
  /**
   * Ottieni suggerimenti per risolvere un errore
   */
  getSuggestions(error: WhatsAppError): string[] {
    const suggestions: string[] = [];
    
    switch(error.type) {
      case WhatsAppErrorType.CONNECTION_ERROR:
        suggestions.push('Verificare che WhatsApp Web sia connesso sul telefono');
        suggestions.push('Controllare la connessione internet');
        suggestions.push('Provare a riconnettere scansionando un nuovo QR Code');
        break;
      
      case WhatsAppErrorType.RATE_LIMIT:
        suggestions.push('Attendere qualche minuto prima di inviare altri messaggi');
        suggestions.push('Ridurre la frequenza di invio');
        suggestions.push('Considerare l\'uso di WhatsApp Business API per volumi maggiori');
        break;
      
      case WhatsAppErrorType.VALIDATION_ERROR:
        suggestions.push('Verificare che il numero sia nel formato corretto');
        suggestions.push('Controllare che il messaggio non sia vuoto');
        suggestions.push('Assicurarsi che il numero abbia WhatsApp');
        break;
      
      case WhatsAppErrorType.SESSION_ERROR:
        suggestions.push('Scansionare un nuovo QR Code');
        suggestions.push('Verificare che WhatsApp non sia aperto su altri dispositivi');
        suggestions.push('Controllare che il telefono sia online');
        break;
      
      case WhatsAppErrorType.MEDIA_ERROR:
        suggestions.push('Verificare che il file non superi i 16MB');
        suggestions.push('Controllare che il formato sia supportato');
        suggestions.push('Provare a comprimere il file');
        break;
      
      default:
        suggestions.push('Riprovare tra qualche minuto');
        suggestions.push('Contattare il supporto tecnico se il problema persiste');
    }
    
    return suggestions;
  }
}

// Singleton
export const whatsAppErrorHandler = new WhatsAppErrorHandler();
