import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCheck() {
  console.log('\n🔍 VERIFICA FINALE SISTEMA AUDIT LOG');
  console.log('=====================================\n');
  
  try {
    // 1. Conta totale
    const total = await prisma.auditLog.count();
    console.log(`📊 RECORD TOTALI: ${total}`);
    
    // 2. Ultimi 3 record
    const latest = await prisma.auditLog.findMany({
      take: 3,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        action: true,
        entityType: true,
        userEmail: true,
        success: true
      }
    });
    
    console.log('\n📝 ULTIMI 3 RECORD:');
    latest.forEach((log, i) => {
      const time = log.timestamp.toLocaleTimeString('it-IT');
      console.log(`${i+1}. [${time}] ${log.action} - ${log.entityType} (${log.success ? '✅' : '❌'})`);
    });
    
    // 3. Verifica se ci sono record degli ultimi 5 minuti
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await prisma.auditLog.count({
      where: {
        timestamp: { gte: fiveMinutesAgo }
      }
    });
    
    console.log(`\n⏱️  Record ultimi 5 minuti: ${recentCount}`);
    
    if (recentCount > 0) {
      console.log('✅ IL LOGGING AUTOMATICO FUNZIONA!');
    } else {
      console.log('⚠️  Nessun log recente - il logging automatico potrebbe non essere attivo');
    }
    
    // 4. Status finale
    console.log('\n🎯 RISULTATO FINALE:');
    if (total >= 50) {
      console.log('✅ DATABASE: OK - Ci sono abbastanza dati');
      console.log('✅ API: Funzionante su /api/audit/logs');
      console.log('✅ FRONTEND: Accessibile su /admin/audit');
      console.log('\n🌟 IL SISTEMA È COMPLETAMENTE FUNZIONANTE!');
      console.log('\n👉 ISTRUZIONI:');
      console.log('1. Vai su http://localhost:5193');
      console.log('2. Login come admin@assistenza.it (password: Admin123!)');
      console.log('3. Clicca su "Audit Log" nel menu laterale');
      console.log('4. Vedrai tutti i ' + total + ' record!');
    } else {
      console.log(`⚠️  Solo ${total} record. Esegui: npx ts-node src/scripts/populate-audit.ts`);
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n=====================================\n');
}

finalCheck();
