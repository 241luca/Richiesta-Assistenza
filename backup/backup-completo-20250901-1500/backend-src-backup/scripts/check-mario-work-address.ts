// Script per verificare l'indirizzo di lavoro di Mario Rossi
// cd backend && npx ts-node src/scripts/check-mario-work-address.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMarioWorkAddress() {
  console.log('\n=== VERIFICA INDIRIZZO LAVORO MARIO ROSSI ===\n');
  
  try {
    // Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        // Indirizzo residenza
        address: true,
        city: true,
        province: true,
        postalCode: true,
        // Indirizzo lavoro
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        workLatitude: true,
        workLongitude: true,
        useResidenceAsWorkAddress: true,
        travelRatePerKm: true
      }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }
    
    console.log('✅ Utente trovato:');
    console.log(`   Nome: ${mario.firstName} ${mario.lastName}`);
    console.log(`   Email: ${mario.email}`);
    console.log(`   Ruolo: ${mario.role}`);
    console.log('');
    
    console.log('📍 INDIRIZZO RESIDENZA:');
    console.log(`   ${mario.address || 'NON CONFIGURATO'}`);
    console.log(`   ${mario.city || ''} (${mario.province || ''}) ${mario.postalCode || ''}`);
    console.log('');
    
    console.log('🏢 INDIRIZZO LAVORO:');
    if (mario.useResidenceAsWorkAddress) {
      console.log('   ⚠️ USA INDIRIZZO DI RESIDENZA COME INDIRIZZO DI LAVORO');
    } else {
      console.log(`   ${mario.workAddress || 'NON CONFIGURATO'}`);
      console.log(`   ${mario.workCity || ''} (${mario.workProvince || ''}) ${mario.workPostalCode || ''}`);
      if (mario.workLatitude && mario.workLongitude) {
        console.log(`   Coordinate: ${mario.workLatitude}, ${mario.workLongitude}`);
      }
    }
    
    console.log('');
    console.log(`💰 Tariffa viaggio: €${mario.travelRatePerKm || 0}/km`);
    
    // Verifica quale indirizzo verrà usato per il calcolo distanze
    console.log('\n📐 INDIRIZZO USATO PER CALCOLO DISTANZE:');
    if (mario.useResidenceAsWorkAddress) {
      if (mario.address && mario.city) {
        console.log(`   ✅ ${mario.address}, ${mario.city} ${mario.province}`);
      } else {
        console.log('   ❌ NESSUN INDIRIZZO DISPONIBILE (residenza non configurata)');
      }
    } else {
      if (mario.workAddress && mario.workCity) {
        console.log(`   ✅ ${mario.workAddress}, ${mario.workCity} ${mario.workProvince}`);
      } else {
        console.log('   ❌ NESSUN INDIRIZZO DISPONIBILE (lavoro non configurato)');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMarioWorkAddress();
