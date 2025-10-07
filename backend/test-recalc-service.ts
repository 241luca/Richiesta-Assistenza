// Test diretto del servizio di ricalcolo
import travelCalculationService from './src/services/travelCalculation.service';
import { PrismaClient } from '@prisma/client';
import { logger } from './src/utils/logger';

const prisma = new PrismaClient();

async function testRecalculation() {
  console.log('🧪 TEST DIRETTO DEL SERVIZIO DI RICALCOLO');
  console.log('=========================================\n');
  
  try {
    // 1. Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: { email: 'mario.rossi@assistenza.it' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workAddress: true,
        workCity: true
      }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }
    
    console.log(`👤 Trovato: ${mario.firstName} ${mario.lastName}`);
    console.log(`📍 Work address attuale: ${mario.workAddress}, ${mario.workCity}\n`);
    
    // 2. Chiama direttamente il servizio di ricalcolo
    console.log('🔄 Chiamo travelCalculationService.recalculateForProfessional()...\n');
    
    const updatedCount = await travelCalculationService.recalculateForProfessional(mario.id);
    
    console.log(`\n✅ RISULTATO: Ricalcolate ${updatedCount} richieste!\n`);
    
    // 3. Verifica i dati aggiornati
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: mario.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        travelDistance: true,
        travelDistanceText: true,
        travelDurationText: true,
        travelCost: true,
        travelCalculatedAt: true
      },
      take: 5
    });
    
    console.log('📊 Dati aggiornati nel database:');
    for (const req of requests) {
      console.log(`\n📍 ${req.title}`);
      if (req.travelDistance) {
        console.log(`   Distanza: ${req.travelDistanceText}`);
        console.log(`   Durata: ${req.travelDurationText}`);
        console.log(`   Costo: €${req.travelCost?.toFixed(2)}`);
        console.log(`   Aggiornato: ${req.travelCalculatedAt ? new Date(req.travelCalculatedAt).toLocaleString('it-IT') : 'mai'}`);
      } else {
        console.log(`   ❌ Nessun dato di viaggio`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    logger.error('Test recalculation error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testRecalculation();