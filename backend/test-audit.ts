// Test per creare un log di audit manualmente
// Esegui questo file con: cd backend && npx ts-node test-audit.ts

import { prisma } from './src/config/database';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

async function testAudit() {
  try {
    // Prima troviamo un utente esistente
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ Nessun utente trovato nel database. Creo un log senza userId.');
    }
    
    // Crea un log di test
    const log = await prisma.auditLog.create({
      data: {
        action: AuditAction.LOGIN_SUCCESS,
        entityType: 'User',
        entityId: user?.id,
        userId: user?.id, // può essere null
        userEmail: user?.email || 'system@test.com',
        userRole: user?.role,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test',
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SECURITY,
        metadata: {
          test: true,
          message: 'Questo è un log di test'
        }
      }
    });

    console.log('✅ Log di test creato con successo:', log.id);
    console.log('Ora dovresti vedere questo log nella dashboard!');

    // Conta i log totali
    const count = await prisma.auditLog.count();
    console.log(`📊 Totale log nel database: ${count}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAudit();
