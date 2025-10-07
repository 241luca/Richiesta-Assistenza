// Script per assegnare richieste a Mario e testare il ricalcolo
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAndTest() {
  console.log('🔧 SETUP E TEST RICALCOLO AUTOMATICO\n');
  
  try {
    // 1. Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: { email: 'mario.rossi@assistenza.it' }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }
    
    console.log(`✅ Mario Rossi trovato (ID: ${mario.id})\n`);
    
    // 2. Assicurati che abbia un work address
    if (!mario.workAddress || !mario.workCity) {
      console.log('⚠️ Mario non ha work address, lo imposto...');
      await prisma.user.update({
        where: { id: mario.id },
        data: {
          workAddress: 'Via Milano 1',
          workCity: 'Milano',
          workProvince: 'MI',
          workPostalCode: '20100'
        }
      });
      console.log('✅ Work address impostato\n');
    } else {
      console.log(`📍 Work address: ${mario.workAddress}, ${mario.workCity}\n`);
    }
    
    // 3. Trova richieste PENDING da assegnare
    const pendingRequests = await prisma.assistanceRequest.findMany({
      where: {
        status: 'PENDING',
        professionalId: null
      },
      take: 3
    });
    
    if (pendingRequests.length === 0) {
      console.log('⚠️ Nessuna richiesta PENDING trovata. Creo delle richieste...');
      
      // Crea 3 richieste di test
      for (let i = 1; i <= 3; i++) {
        const newRequest = await prisma.assistanceRequest.create({
          data: {
            title: `Test Richiesta ${i} - ${new Date().toLocaleTimeString()}`,
            description: `Richiesta di test per verificare il ricalcolo automatico`,
            category: 'Elettricità',
            status: 'PENDING',
            priority: 'MEDIUM',
            address: `Via Test ${i}`,
            city: 'Milano',
            province: 'MI',
            postalCode: '20100',
            clientId: mario.id // Mario fa da cliente per test
          }
        });
        console.log(`   ✅ Creata: ${newRequest.title}`);
      }
      
      // Ricarica le richieste
      const newPending = await prisma.assistanceRequest.findMany({
        where: {
          status: 'PENDING',
          professionalId: null
        },
        take: 3
      });
      pendingRequests.push(...newPending);
    }
    
    // 4. Assegna le richieste a Mario
    console.log(`\n📋 Assegno ${pendingRequests.length} richieste a Mario...`);
    
    for (const req of pendingRequests) {
      await prisma.assistanceRequest.update({
        where: { id: req.id },
        data: {
          professional: {
            connect: { id: mario.id }
          },
          status: 'ASSIGNED',
          assignedAt: new Date()
        }
      });
      console.log(`   ✅ Assegnata: ${req.title}`);
    }
    
    // 5. Verifica le richieste assegnate
    const assignedRequests = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        travelDistance: true,
        travelCalculatedAt: true
      }
    });
    
    console.log(`\n📊 Mario ha ${assignedRequests.length} richieste assegnate:`);
    for (const req of assignedRequests) {
      console.log(`   - ${req.title} (${req.address}, ${req.city})`);
      if (req.travelDistance) {
        console.log(`     Distanza: ${(req.travelDistance/1000).toFixed(1)} km`);
      }
    }
    
    // 6. Test chiamata diretta al servizio
    console.log('\n🔄 CHIAMO IL SERVIZIO DI RICALCOLO...\n');
    
    const travelCalculationService = require('./src/services/travelCalculation.service').default;
    const updatedCount = await travelCalculationService.recalculateForProfessional(mario.id);
    
    console.log(`\n✅ RISULTATO: ${updatedCount} richieste ricalcolate!\n`);
    
    // 7. Verifica i risultati
    const updatedRequests = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        title: true,
        travelDistance: true,
        travelDistanceText: true,
        travelDurationText: true,
        travelCost: true,
        travelCalculatedAt: true
      }
    });
    
    console.log('📍 DISTANZE CALCOLATE:');
    for (const req of updatedRequests) {
      console.log(`\n   ${req.title}`);
      if (req.travelDistance) {
        console.log(`   ✅ Distanza: ${req.travelDistanceText || (req.travelDistance/1000).toFixed(1) + ' km'}`);
        console.log(`   ⏱️ Durata: ${req.travelDurationText || Math.round(req.travelDistance/60) + ' min'}`);
        console.log(`   💰 Costo: €${req.travelCost?.toFixed(2) || '0.00'}`);
      } else {
        console.log(`   ❌ Calcolo fallito`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAndTest();