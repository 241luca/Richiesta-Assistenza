// backend/src/utils/createAuditLog.ts
// Utility per creare log di audit manualmente dalle routes

import { auditLogService } from '../services/auditLog.service';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

export async function createAuditLog(data: {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  entityType?: string;
  entityId?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  metadata?: any;
}) {
  try {
    await auditLogService.create({
      ...data,
      severity: data.success ? LogSeverity.INFO : LogSeverity.WARNING,
      category: LogCategory.BUSINESS
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Helper per loggare login
export async function logLogin(userId: string, email: string, role: string, ipAddress: string, userAgent: string, success: boolean) {
  await createAuditLog({
    action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
    userId: success ? userId : undefined,
    userEmail: email,
    userRole: role,
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
    success
  });
}
