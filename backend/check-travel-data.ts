// Script per verificare se il ricalcolo sta funzionando
// Controlla i valori nel database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTravelData() {
  console.log('🔍 Verifica dati viaggio nel database\n');
  
  try {
    // 1. Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: { email: 'mario.rossi@assistenza.it' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workAddress: true,
        workCity: true,
        address: true,
        city: true
      }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }
    
    console.log('👤 Mario Rossi trovato:');
    console.log(`   ID: ${mario.id}`);
    console.log(`   Work Address: ${mario.workAddress || 'non impostato'}, ${mario.workCity || 'non impostato'}`);
    console.log(`   Home Address: ${mario.address}, ${mario.city}`);
    console.log('');
    
    // 2. Trova le richieste assegnate a Mario
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: mario.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        travelDistance: true,
        travelDuration: true,
        travelDistanceText: true,
        travelDurationText: true,
        travelCost: true,
        travelCalculatedAt: true
      }
    });
    
    console.log(`📋 Trovate ${requests.length} richieste assegnate a Mario:\n`);
    
    for (const req of requests) {
      console.log(`📍 ${req.title}`);
      console.log(`   Indirizzo: ${req.address}, ${req.city}`);
      
      if (req.travelDistance) {
        console.log(`   ✅ Distanza: ${req.travelDistanceText || (req.travelDistance/1000).toFixed(1) + ' km'}`);
        console.log(`   ⏱️ Durata: ${req.travelDurationText || Math.round(req.travelDuration/60) + ' min'}`);
        console.log(`   💰 Costo: €${req.travelCost?.toFixed(2) || '0.00'}`);
        console.log(`   📅 Calcolato: ${req.travelCalculatedAt ? new Date(req.travelCalculatedAt).toLocaleString('it-IT') : 'mai'}`);
      } else {
        console.log(`   ❌ Nessun dato di viaggio salvato`);
      }
      console.log('');
    }
    
    // 3. Test aggiornamento work address e verifica ricalcolo
    console.log('🔄 TEST: Aggiorno work address di Mario...');
    const nuovoIndirizzo = `Via Test ${Date.now()}`;
    
    await prisma.user.update({
      where: { id: mario.id },
      data: {
        workAddress: nuovoIndirizzo,
        workCity: 'Roma',
        workProvince: 'RM',
        workPostalCode: '00100'
      }
    });
    
    console.log(`   Nuovo indirizzo: ${nuovoIndirizzo}, Roma`);
    console.log('');
    console.log('⏳ Aspetta 3 secondi per vedere se c\'è ricalcolo automatico...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ricontrolla i dati
    const requestsAfter = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: mario.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        travelCalculatedAt: true,
        travelDistanceText: true
      }
    });
    
    console.log('📊 Controllo se i dati sono stati ricalcolati:');
    for (const req of requestsAfter) {
      const before = requests.find(r => r.id === req.id);
      const beforeTime = before?.travelCalculatedAt ? new Date(before.travelCalculatedAt).getTime() : 0;
      const afterTime = req.travelCalculatedAt ? new Date(req.travelCalculatedAt).getTime() : 0;
      
      if (afterTime > beforeTime) {
        console.log(`   ✅ ${req.title}: RICALCOLATO! Nuova distanza: ${req.travelDistanceText}`);
      } else {
        console.log(`   ❌ ${req.title}: NON ricalcolato`);
      }
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTravelData();