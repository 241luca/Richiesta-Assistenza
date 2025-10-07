// Test rapido per verificare che Prisma veda ScheduledIntervention
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testScheduledIntervention() {
  try {
    console.log('🔍 Verifico tabella ScheduledIntervention...');
    
    // Prova a contare i record
    const count = await prisma.scheduledIntervention.count();
    console.log(`✅ Tabella trovata! Record presenti: ${count}`);
    
    // Verifica i campi
    const first = await prisma.scheduledIntervention.findFirst();
    console.log('📋 Struttura tabella:', first || 'Tabella vuota ma esistente');
    
    console.log('✅ TUTTO OK! La tabella esiste e Prisma la vede!');
  } catch (error: any) {
    console.error('❌ ERRORE:', error.message);
    console.log('');
    console.log('🔧 SOLUZIONE:');
    console.log('1. Esegui: npx prisma generate');
    console.log('2. Riavvia il backend');
  } finally {
    await prisma.$disconnect();
  }
}

testScheduledIntervention();
