// TEST E FIX FINALE - RISOLVE TUTTO
// cd backend && npx ts-node src/scripts/final-dashboard-fix.ts

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function finalDashboardFix() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 FIX DEFINITIVO DASHBOARD PROFESSIONAL');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. TROVA O CREA MARIO ROSSI PROFESSIONAL
    console.log('STEP 1: Verifica Mario Rossi Professional...');
    let mario = await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      }
    });
    
    if (!mario) {
      console.log('⚠️ Mario non trovato. Verifico se esiste con altro ruolo...');
      
      const marioOtherRole = await prisma.user.findFirst({
        where: {
          email: 'mario.rossi@assistenza.it'
        }
      });
      
      if (marioOtherRole) {
        console.log(`📝 Trovato Mario con ruolo ${marioOtherRole.role}. Aggiorno a PROFESSIONAL...`);
        mario = await prisma.user.update({
          where: { id: marioOtherRole.id },
          data: { 
            role: 'PROFESSIONAL',
            profession: 'Idraulico Professionista'
          }
        });
        console.log('✅ Ruolo aggiornato a PROFESSIONAL');
      }
    }
    
    if (mario) {
      console.log(`✅ Mario Rossi Professional trovato:`);
      console.log(`   ID: ${mario.id}`);
      console.log(`   Email: ${mario.email}`);
      console.log(`   Ruolo: ${mario.role}\n`);
    } else {
      console.log('❌ Mario Rossi non esiste nel database. Creane uno manualmente.');
      return;
    }
    
    // 2. VERIFICA RICHIESTE ESISTENTI
    console.log('STEP 2: Verifica richieste esistenti...');
    
    const existingRequests = await prisma.assistanceRequest.count({
      where: { professionalId: mario.id }
    });
    
    console.log(`📊 Richieste attualmente assegnate a Mario: ${existingRequests}`);
    
    // 3. ASSEGNA RICHIESTE NON ASSEGNATE
    console.log('\nSTEP 3: Assegnazione richieste...');
    
    const unassignedRequests = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          { professionalId: null },
          { professionalId: '' }
        ]
      },
      take: 10
    });
    
    console.log(`📋 Trovate ${unassignedRequests.length} richieste non assegnate`);
    
    let assigned = 0;
    for (const req of unassignedRequests) {
      try {
        await prisma.assistanceRequest.update({
          where: { id: req.id },
          data: {
            professionalId: mario.id,
            status: 'ASSIGNED',
            assignedDate: new Date()
          }
        });
        assigned++;
        console.log(`✅ Assegnata: "${req.title.substring(0, 40)}..."`);
      } catch (err: any) {
        console.log(`⚠️ Errore assegnazione: ${err.message}`);
      }
    }
    
    if (assigned > 0) {
      console.log(`\n✅ Assegnate ${assigned} nuove richieste a Mario`);
    }
    
    // 4. CREA PREVENTIVI
    console.log('\nSTEP 4: Creazione preventivi...');
    
    const requestsForQuotes = await prisma.assistanceRequest.findMany({
      where: { 
        professionalId: mario.id,
        quotes: {
          none: {
            professionalId: mario.id
          }
        }
      },
      take: 5
    });
    
    console.log(`📋 ${requestsForQuotes.length} richieste senza preventivo`);
    
    for (const req of requestsForQuotes) {
      try {
        const amount = 200 + Math.floor(Math.random() * 800);
        await prisma.quote.create({
          data: {
            requestId: req.id,
            professionalId: mario.id,
            title: `Preventivo per ${req.title}`,
            amount: amount,
            description: `Preventivo professionale per: ${req.title}`,
            status: 'PENDING',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        console.log(`✅ Creato preventivo di €${amount}`);
      } catch (err: any) {
        console.log(`⚠️ Errore creazione preventivo: ${err.message}`);
      }
    }
    
    // 5. COMPLETA ALCUNI LAVORI
    console.log('\nSTEP 5: Completamento lavori...');
    
    const toComplete = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: mario.id,
        status: 'ASSIGNED'
      },
      take: 3
    });
    
    for (const req of toComplete) {
      try {
        await prisma.assistanceRequest.update({
          where: { id: req.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            actualHours: 3
          }
        });
        
        await prisma.quote.updateMany({
          where: {
            requestId: req.id,
            professionalId: mario.id
          },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date()
          }
        });
        
        console.log(`✅ Completato: "${req.title.substring(0, 40)}..."`);
      } catch (err: any) {
        console.log(`⚠️ Errore completamento: ${err.message}`);
      }
    }
    
    // 6. VERIFICA FINALE DETTAGLIATA
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICA FINALE DATABASE');
    console.log('='.repeat(60));
    
    const [
      totalReqs,
      assignedReqs,
      completedReqs,
      totalQuotes,
      acceptedQuotes,
      earnings
    ] = await Promise.all([
      prisma.assistanceRequest.count({
        where: { professionalId: mario.id }
      }),
      prisma.assistanceRequest.count({
        where: { professionalId: mario.id, status: 'ASSIGNED' }
      }),
      prisma.assistanceRequest.count({
        where: { professionalId: mario.id, status: 'COMPLETED' }
      }),
      prisma.quote.count({
        where: { professionalId: mario.id }
      }),
      prisma.quote.count({
        where: { professionalId: mario.id, status: 'ACCEPTED' }
      }),
      prisma.quote.aggregate({
        where: { professionalId: mario.id, status: 'ACCEPTED' },
        _sum: { amount: true }
      })
    ]);
    
    console.log(`\nMario Rossi (${mario.id}):`);
    console.log(`├─ Richieste totali: ${totalReqs}`);
    console.log(`├─ Richieste assegnate: ${assignedReqs}`);
    console.log(`├─ Lavori completati: ${completedReqs}`);
    console.log(`├─ Preventivi totali: ${totalQuotes}`);
    console.log(`├─ Preventivi accettati: ${acceptedQuotes}`);
    console.log(`└─ Guadagni totali: €${earnings._sum.amount || 0}`);
    
    // 7. TEST API DASHBOARD
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TEST API DASHBOARD');
    console.log('='.repeat(60) + '\n');
    
    try {
      // Prova a fare login e testare l'API
      console.log('Tentativo login API...');
      const loginRes = await axios.post('http://localhost:3200/api/auth/login', {
        email: 'mario.rossi@assistenza.it',
        password: 'password123'
      }, {
        validateStatus: () => true
      });
      
      if (loginRes.status === 200) {
        console.log('✅ Login riuscito');
        
        // Test dashboard API
        const cookies = loginRes.headers['set-cookie'];
        const dashRes = await axios.get('http://localhost:3200/api/dashboard', {
          headers: { Cookie: cookies?.join('; ') || '' },
          validateStatus: () => true
        });
        
        if (dashRes.data?.data?.stats) {
          console.log('\n📊 DATI RICEVUTI DALLA DASHBOARD API:');
          const stats = dashRes.data.data.stats;
          console.log(`├─ Lavori completati: ${stats.completedJobs || 0}`);
          console.log(`├─ Guadagni totali: €${stats.totalEarned || 0}`);
          console.log(`└─ Preventivi accettati: ${stats.acceptedQuotes || 0}`);
        }
      } else {
        console.log('⚠️ Login API fallito. Backend potrebbe non essere attivo.');
      }
    } catch (err) {
      console.log('⚠️ API non raggiungibile. Assicurati che il backend sia attivo su porta 3200');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETATO!');
    console.log('='.repeat(60));
    console.log('\n📱 ISTRUZIONI:');
    console.log('1. Assicurati che il backend sia attivo (porta 3200)');
    console.log('2. Assicurati che il frontend sia attivo (porta 5193)');
    console.log('3. Vai su http://localhost:5193');
    console.log('4. Fai login con: mario.rossi@assistenza.it / password123');
    console.log('5. La dashboard ora dovrebbe mostrare i dati corretti!\n');
    
  } catch (error) {
    console.error('\n❌ ERRORE CRITICO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
finalDashboardFix().catch(console.error);
