// Script per verificare cosa è successo ai dati
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== ANALISI DATABASE ===\n');
    
    // Conta utenti per ruolo
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    const professionalCount = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    
    console.log('📊 CONTEGGIO UTENTI:');
    console.log(`- SUPER_ADMIN: ${superAdminCount}`);
    console.log(`- ADMIN: ${adminCount}`);
    console.log(`- PROFESSIONAL: ${professionalCount}`);
    console.log(`- CLIENT: ${clientCount}`);
    console.log(`- TOTALE: ${adminCount + superAdminCount + professionalCount + clientCount}`);
    
    // Lista professionisti
    console.log('\n👷 PROFESSIONISTI NEL SISTEMA:');
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true
      }
    });
    
    if (professionals.length === 0) {
      console.log('❌ NESSUN PROFESSIONISTA TROVATO!');
    } else {
      professionals.forEach(p => {
        console.log(`- ${p.fullName} (${p.email}) - Creato: ${p.createdAt}`);
      });
    }
    
    // Verifica categorie
    const categoryCount = await prisma.category.count();
    const subcategoryCount = await prisma.subcategory.count();
    
    console.log('\n📁 CATEGORIE:');
    console.log(`- Categorie: ${categoryCount}`);
    console.log(`- Sottocategorie: ${subcategoryCount}`);
    
    // Verifica richieste
    const requestCount = await prisma.assistanceRequest.count();
    console.log('\n📋 RICHIESTE ASSISTENZA: ' + requestCount);
    
    // Verifica quando è stato l'ultimo backup
    const lastBackup = await prisma.systemBackup.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (lastBackup) {
      console.log('\n💾 ULTIMO BACKUP: ' + lastBackup.createdAt);
    } else {
      console.log('\n💾 NESSUN BACKUP TROVATO');
    }
    
    // Controlla se c'è stata qualche operazione di reset recente
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['DATABASE_RESET', 'USER_DELETED', 'BULK_DELETE']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (recentAuditLogs.length > 0) {
      console.log('\n⚠️ OPERAZIONI CRITICHE RECENTI:');
      recentAuditLogs.forEach(log => {
        console.log(`- ${log.action} il ${log.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
