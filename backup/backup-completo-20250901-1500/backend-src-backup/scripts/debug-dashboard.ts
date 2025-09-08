/**
 * Script di debug per verificare il problema dashboard professional
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDashboard() {
  console.log('\n=== DEBUG DASHBOARD PROFESSIONAL ===\n');

  try {
    // 1. Trova Mario Rossi
    const mario = await prisma.user.findFirst({
      where: {
        fullName: 'Mario Rossi',
        role: 'PROFESSIONAL'
      }
    });

    if (!mario) {
      console.log('❌ Mario Rossi non trovato');
      return;
    }

    console.log('✅ Mario Rossi trovato:');
    console.log(`   ID: ${mario.id} (tipo: ${typeof mario.id})`);
    console.log(`   Role: ${mario.role}`);
    console.log('');

    // 2. Conta TUTTE le richieste (come fa dashboard admin)
    const totalRequests = await prisma.assistanceRequest.count();
    console.log(`📊 Richieste TOTALI nel database: ${totalRequests}`);
    
    // 3. Conta richieste con professionalId = mario.id (come fa dashboard professional)
    const marioRequests = await prisma.assistanceRequest.count({
      where: { professionalId: mario.id }
    });
    console.log(`📊 Richieste assegnate a Mario (con professionalId = '${mario.id}'): ${marioRequests}`);
    
    // 4. Vediamo se ci sono richieste con professionalId non null
    const requestsWithProfessional = await prisma.assistanceRequest.count({
      where: { professionalId: { not: null } }
    });
    console.log(`📊 Richieste con un professionista qualsiasi: ${requestsWithProfessional}`);
    
    // 5. Mostra alcuni esempi di richieste
    console.log('\n📋 Prime 5 richieste nel database:');
    const sampleRequests = await prisma.assistanceRequest.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        professionalId: true
      }
    });
    
    sampleRequests.forEach(req => {
      console.log(`   - ${req.title}`);
      console.log(`     ID: ${req.id.substring(0, 8)}...`);
      console.log(`     Status: ${req.status}`);
      console.log(`     Client ID: ${req.clientId}`);
      console.log(`     Professional ID: ${req.professionalId || 'NON ASSEGNATO'}`);
      console.log('');
    });

    // 6. Se non ci sono richieste assegnate, assegniamone alcune a Mario
    if (marioRequests === 0 && totalRequests > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICATO: Nessuna richiesta è assegnata a Mario Rossi');
      console.log('   La dashboard mostra 0 perché professionalId non è mai stato impostato.\n');
      
      // Assegna le prime 3 richieste PENDING a Mario
      const pendingRequests = await prisma.assistanceRequest.findMany({
        where: {
          status: 'PENDING',
          professionalId: null
        },
        take: 3
      });

      if (pendingRequests.length > 0) {
        console.log(`🔧 Assegno ${pendingRequests.length} richieste PENDING a Mario Rossi...`);
        
        for (const req of pendingRequests) {
          await prisma.assistanceRequest.update({
            where: { id: req.id },
            data: {
              professionalId: mario.id,
              status: 'ASSIGNED',
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Assegnata richiesta: ${req.title}`);
        }
        
        // Verifica di nuovo
        const newCount = await prisma.assistanceRequest.count({
          where: { professionalId: mario.id }
        });
        console.log(`\n✅ Ora Mario ha ${newCount} richieste assegnate!`);
        console.log('   La dashboard dovrebbe ora mostrare i dati corretti.');
      } else {
        console.log('   Non ci sono richieste PENDING da assegnare.');
        console.log('   Creare nuove richieste o cambiare lo stato di quelle esistenti.');
      }
    } else if (marioRequests > 0) {
      console.log(`\n✅ Mario ha già ${marioRequests} richieste assegnate.`);
      console.log('   Se la dashboard mostra ancora 0, il problema è nel frontend o nell\'endpoint.');
    }

    // 7. Verifica preventivi
    const marioQuotes = await prisma.quote.count({
      where: { professionalId: mario.id }
    });
    console.log(`\n💰 Preventivi di Mario: ${marioQuotes}`);

    // 8. Test la query esatta della dashboard
    console.log('\n🔍 TEST QUERY DASHBOARD:');
    const [
      totalReqs,
      pendingReqs,
      inProgressReqs,
      completedReqs
    ] = await Promise.all([
      prisma.assistanceRequest.count({
        where: { professionalId: mario.id }
      }),
      prisma.assistanceRequest.count({
        where: { 
          professionalId: mario.id,
          status: { in: ['ASSIGNED', 'PENDING'] }
        }
      }),
      prisma.assistanceRequest.count({
        where: { 
          professionalId: mario.id,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.assistanceRequest.count({
        where: { 
          professionalId: mario.id,
          status: 'COMPLETED'
        }
      })
    ]);

    console.log(`   Total: ${totalReqs}`);
    console.log(`   Pending/Assigned: ${pendingReqs}`);
    console.log(`   In Progress: ${inProgressReqs}`);
    console.log(`   Completed: ${completedReqs}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
console.log('🚀 Avvio debug dashboard...');
debugDashboard().then(() => {
  console.log('\n✨ Debug completato!');
  process.exit(0);
}).catch(err => {
  console.error('Errore critico:', err);
  process.exit(1);
});
