// backend/check-audit-logs.ts
// Esegui con: cd backend && npx ts-node check-audit-logs.ts

import { prisma } from './src/config/database';

async function checkAuditLogs() {
  try {
    // Conta i log totali
    const count = await prisma.auditLog.count();
    console.log(`\n📊 Totale Audit Logs nel database: ${count}`);
    
    if (count > 0) {
      // Mostra gli ultimi 5 log
      const logs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' }
      });
      
      console.log('\n📋 Ultimi 5 log:');
      logs.forEach(log => {
        console.log(`- ${log.action} by ${log.userEmail || 'unknown'} at ${log.timestamp}`);
      });
    } else {
      console.log('\n⚠️  Nessun log trovato nel database!');
      
      // Proviamo a creare un log di test direttamente
      console.log('\n🔧 Creo un log di test...');
      
      const testLog = await prisma.auditLog.create({
        data: {
          action: 'LOGIN_SUCCESS',
          entityType: 'User',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Script',
          success: true,
          severity: 'INFO',
          category: 'SECURITY',
          userEmail: 'test@example.com',
          metadata: { test: true, createdBy: 'check-audit-logs.ts' }
        }
      });
      
      console.log('✅ Log di test creato con ID:', testLog.id);
      console.log('🔄 Ricarica la dashboard per vedere il log!');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();
