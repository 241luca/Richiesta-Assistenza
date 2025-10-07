// backend/src/scripts/setup-audit-alerts.ts
/**
 * Script per configurare alert automatici di audit
 * Eseguire una volta per impostare gli alert di sicurezza
 */

import { prisma } from '../config/database';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const defaultAlerts = [
  {
    id: createId(),
    name: 'Multiple Failed Logins',
    description: 'Alert when multiple login failures occur from same IP',
    condition: {
      action: AuditAction.LOGIN_FAILED,
      threshold: 5,
      timeWindow: 300, // 5 minuti
      groupBy: 'ipAddress'
    },
    severity: LogSeverity.WARNING,
    notifyEmails: ['security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Account Locked',
    description: 'Alert when an account is locked due to failed attempts',
    condition: {
      metadata: { accountLocked: true },
      severity: LogSeverity.ERROR
    },
    severity: LogSeverity.ERROR,
    notifyEmails: ['security@assistenza.it', 'admin@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Unauthorized Access Attempts',
    description: 'Alert on multiple 403 errors',
    condition: {
      statusCode: 403,
      threshold: 10,
      timeWindow: 60 // 1 minuto
    },
    severity: LogSeverity.CRITICAL,
    notifyEmails: ['security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Password Reset Surge',
    description: 'Alert when many password resets are requested',
    condition: {
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      threshold: 10,
      timeWindow: 600 // 10 minuti
    },
    severity: LogSeverity.WARNING,
    notifyEmails: ['security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'New Admin User Created',
    description: 'Alert when a new admin or super admin is created',
    condition: {
      action: AuditAction.CREATE,
      entityType: 'User',
      metadata: { registrationRole: ['ADMIN', 'SUPER_ADMIN'] }
    },
    severity: LogSeverity.WARNING,
    notifyEmails: ['admin@assistenza.it', 'security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: '2FA Disabled',
    description: 'Alert when 2FA is disabled on any account',
    condition: {
      action: AuditAction.TWO_FA_DISABLED
    },
    severity: LogSeverity.CRITICAL,
    notifyEmails: ['security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'High Error Rate',
    description: 'Alert when error rate is high',
    condition: {
      success: false,
      threshold: 20,
      timeWindow: 300 // 5 minuti
    },
    severity: LogSeverity.ERROR,
    notifyEmails: ['tech@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Suspicious Login Pattern',
    description: 'Alert on login from new location for admin accounts',
    condition: {
      action: AuditAction.LOGIN_SUCCESS,
      userRole: ['ADMIN', 'SUPER_ADMIN'],
      checkNewLocation: true
    },
    severity: LogSeverity.WARNING,
    notifyEmails: ['security@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Data Export',
    description: 'Alert when large amounts of data are exported',
    condition: {
      action: AuditAction.READ,
      metadata: { exportType: 'BULK' }
    },
    severity: LogSeverity.INFO,
    notifyEmails: ['compliance@assistenza.it'],
    isActive: true
  },
  {
    id: createId(),
    name: 'Account Deletion',
    description: 'Alert when any account is deleted',
    condition: {
      action: AuditAction.DELETE,
      entityType: 'User'
    },
    severity: LogSeverity.WARNING,
    notifyEmails: ['admin@assistenza.it', 'compliance@assistenza.it'],
    isActive: true
  }
];

const retentionPolicies = [
  {
    id: createId(),
    category: LogCategory.SECURITY,
    retentionDays: 365, // 1 anno per log di sicurezza
    description: 'Security logs retention for compliance',
    isActive: true
  },
  {
    id: createId(),
    category: LogCategory.BUSINESS,
    retentionDays: 90, // 3 mesi per log business
    description: 'Business operations logs',
    isActive: true
  },
  {
    id: createId(),
    category: LogCategory.API,
    retentionDays: 30, // 1 mese per log API
    description: 'API access logs',
    isActive: true
  },
  {
    id: createId(),
    category: LogCategory.USER_ACTIVITY,
    retentionDays: 60, // 2 mesi per attività utente
    description: 'User activity logs',
    isActive: true
  },
  {
    id: createId(),
    category: LogCategory.SYSTEM,
    retentionDays: 7, // 1 settimana per log sistema
    description: 'System logs',
    isActive: true
  }
];

async function setupAlerts() {
  console.log('🚀 Setting up audit alerts...');
  
  try {
    // Rimuovi alert esistenti (opzionale, commentare in produzione)
    // await prisma.auditLogAlert.deleteMany({});
    
    // Crea alert
    for (const alert of defaultAlerts) {
      const existing = await prisma.auditLogAlert.findFirst({
        where: { name: alert.name }
      });
      
      if (!existing) {
        await prisma.auditLogAlert.create({
          data: {
            ...alert,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created alert: ${alert.name}`);
      } else {
        console.log(`⏭️ Alert già esistente: ${alert.name}`);
      }
    }
    
    // Setup retention policies
    console.log('\n🗓️ Setting up retention policies...');
    
    for (const policy of retentionPolicies) {
      const existing = await prisma.auditLogRetention.findUnique({
        where: { category: policy.category }
      });
      
      if (!existing) {
        await prisma.auditLogRetention.create({
          data: {
            ...policy,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created retention policy for ${policy.category}: ${policy.retentionDays} days`);
      } else {
        // Aggiorna se diverso
        if (existing.retentionDays !== policy.retentionDays) {
          await prisma.auditLogRetention.update({
            where: { category: policy.category },
            data: { 
              retentionDays: policy.retentionDays,
              updatedAt: new Date()
            }
          });
          console.log(`🔄 Updated retention policy for ${policy.category}: ${policy.retentionDays} days`);
        } else {
          console.log(`⏭️ Retention policy già configurata per ${policy.category}`);
        }
      }
    }
    
    console.log('\n✅ Alert setup completed successfully!');
    console.log(`📊 Total alerts configured: ${defaultAlerts.length}`);
    console.log(`📅 Total retention policies: ${retentionPolicies.length}`);
    
  } catch (error) {
    console.error('❌ Error setting up alerts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  setupAlerts();
}

export { setupAlerts };