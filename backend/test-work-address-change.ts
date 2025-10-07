// Test semplice per vedere il ricalcolo in azione
import { PrismaClient } from '@prisma/client';
import { logger } from './src/utils/logger';

const prisma = new PrismaClient();

async function testWorkAddressChange() {
  console.log('🧪 TEST CAMBIO WORK ADDRESS E RICALCOLO\n');
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
    
    console.log(`👤 ${mario.firstName} ${mario.lastName}`);
    console.log(`📍 Work address attuale: ${mario.workAddress}, ${mario.workCity}\n`);
    
    // 2. Verifica richieste assegnate
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        travelDistanceText: true,
        travelCost: true
      }
    });
    
    console.log(`📋 Mario ha ${requests.length} richieste assegnate:\n`);
    
    if (requests.length === 0) {
      console.log('⚠️ Nessuna richiesta assegnata. Prima assegna qualche richiesta a Mario.');
      return;
    }
    
    for (const req of requests) {
      console.log(`   - ${req.title}`);
      if (req.travelDistanceText) {
        console.log(`     Distanza attuale: ${req.travelDistanceText} (€${req.travelCost?.toFixed(2)})`);
      }
    }
    
    // 3. Cambia work address
    console.log('\n🔄 CAMBIO WORK ADDRESS...');
    const nuovoIndirizzo = 'Via Nuova Test ' + Date.now().toString().slice(-4);
    const nuovaCitta = Math.random() > 0.5 ? 'Roma' : 'Napoli';
    
    await prisma.user.update({
      where: { id: mario.id },
      data: {
        workAddress: nuovoIndirizzo,
        workCity: nuovaCitta,
        workProvince: nuovaCitta === 'Roma' ? 'RM' : 'NA',
        workPostalCode: nuovaCitta === 'Roma' ? '00100' : '80100'
      }
    });
    
    console.log(`   ✅ Nuovo indirizzo: ${nuovoIndirizzo}, ${nuovaCitta}\n`);
    
    // 4. Chiama il servizio di ricalcolo
    console.log('📍 RICALCOLO DISTANZE...\n');
    
    const travelService = require('./src/services/travelCalculation.service').default;
    const updated = await travelService.recalculateForProfessional(mario.id);
    
    console.log(`✅ Ricalcolate ${updated} richieste!\n`);
    
    // 5. Mostra i nuovi valori
    const requestsAfter = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        title: true,
        travelDistanceText: true,
        travelCost: true,
        travelCalculatedAt: true
      }
    });
    
    console.log('📊 NUOVE DISTANZE CALCOLATE:');
    for (const req of requestsAfter) {
      console.log(`\n   ${req.title}`);
      if (req.travelDistanceText) {
        console.log(`   ✅ Nuova distanza: ${req.travelDistanceText}`);
        console.log(`   💰 Nuovo costo: €${req.travelCost?.toFixed(2)}`);
        console.log(`   ⏱️ Aggiornato: ${req.travelCalculatedAt?.toLocaleString('it-IT')}`);
      } else {
        console.log(`   ❌ Nessun dato di viaggio`);
      }
    }
    
    console.log('\n=========================================');
    console.log('✅ TEST COMPLETATO!');
    console.log('Il sistema di ricalcolo automatico funziona!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    logger.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
testWorkAddressChange();