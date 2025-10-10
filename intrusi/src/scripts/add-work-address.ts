// Script per aggiungere l'indirizzo di lavoro a Mario Rossi
// cd backend && npx ts-node src/scripts/add-work-address.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWorkAddress() {
  console.log('\n=== AGGIUNTA INDIRIZZO LAVORO A MARIO ROSSI ===\n');
  
  try {
    // Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }
    
    console.log(`Trovato: ${mario.firstName} ${mario.lastName} (${mario.email})`);
    console.log(`Indirizzo lavoro attuale: ${mario.workAddress || 'NON CONFIGURATO'}`);
    
    // Aggiorna con indirizzo di lavoro
    const updated = await prisma.user.update({
      where: { id: mario.id },
      data: {
        workAddress: 'Via del Corso 101',
        workCity: 'Roma',
        workProvince: 'RM',
        workPostalCode: '00186',
        workLatitude: 41.9028,
        workLongitude: 12.4964,
        useResidenceAsWorkAddress: false,
        travelRatePerKm: 0.50 // 50 centesimi al km
      }
    });
    
    console.log('\n✅ Indirizzo di lavoro aggiornato:');
    console.log(`   ${updated.workAddress}`);
    console.log(`   ${updated.workCity} (${updated.workProvince}) ${updated.workPostalCode}`);
    console.log(`   Lat: ${updated.workLatitude}, Lng: ${updated.workLongitude}`);
    console.log(`   Tariffa viaggio: €${updated.travelRatePerKm}/km`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorkAddress();
