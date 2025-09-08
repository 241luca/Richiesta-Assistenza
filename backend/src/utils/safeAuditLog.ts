// backend/src/utils/safeAuditLog.ts
// Wrapper sicuro per audit log che non blocca mai le operazioni

import { auditLogService } from '../services/auditLog.service';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

interface SafeAuditLogData {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  severity: LogSeverity;
  category: LogCategory;
  metadata?: any;
}

/**
 * Log di audit sicuro che non blocca mai l'operazione principale
 * Se fallisce, logga solo su console
 */
export async function safeAuditLog(data: SafeAuditLogData): Promise<void> {
  // NON usare setImmediate, usa direttamente il service
  try {
    await auditLogService.log(data);
    console.log('[AUDIT] Log created successfully for action:', data.action);
  } catch (error) {
    console.error('[AUDIT] Failed to create audit log:', error);
    console.error('[AUDIT] Data was:', JSON.stringify(data));
  }
}
