// FIX DEFINITIVO CORRETTO - USA LA SINTASSI GIUSTA PRISMA
// cd backend && npx ts-node src/scripts/force-fix-correct.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFixCorrect() {
  console.log('\n=== FIX DASHBOARD CON SINTASSI CORRETTA ===\n');
  
  try {
    // 1. Trova Mario Rossi PROFESSIONAL
    const mario = await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      }
    });
    
    if (!mario) {
      console.log('❌ Mario Rossi professional non trovato!');
      return;
    }
    
    console.log(`✅ Mario Professional trovato: ${mario.id}`);
    console.log(`   Email: ${mario.email}`);
    
    // 2. Trova le richieste non assegnate o con professionalId nullo
    const unassignedRequests = await prisma.assistanceRequest.findMany({
      where: {
        professional: null  // Usa la relazione, non il campo diretto
      }
    });
    
    console.log(`\n📋 Trovate ${unassignedRequests.length} richieste non assegnate`);
    
    // 3. Assegna le prime 10 richieste a Mario
    let assigned = 0;
    for (const req of unassignedRequests.slice(0, 10)) {
      try {
        const updated = await prisma.assistanceRequest.update({
          where: { id: req.id },
          data: {
            professional: {
              connect: { id: mario.id }  // USA CONNECT per la relazione!
            },
            status: 'ASSIGNED',
            assignedDate: new Date(),
            updatedAt: new Date()
          }
        });
        assigned++;
        console.log(`✅ Assegnata: "${updated.title.substring(0, 40)}..."`);
      } catch (err) {
        console.log(`❌ Errore assegnazione ${req.id}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Assegnate ${assigned} richieste a Mario Rossi`);
    
    // 4. Crea preventivi per le richieste assegnate
    console.log('\n💰 CREAZIONE PREVENTIVI...\n');
    
    const assignedRequests = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        }
      },
      take: 5
    });
    
    for (const req of assignedRequests) {
      try {
        // Verifica se esiste già un preventivo
        const existingQuote = await prisma.quote.findFirst({
          where: {
            requestId: req.id,
            professional: {
              id: mario.id
            }
          }
        });
        
        if (!existingQuote) {
          const amount = 200 + Math.floor(Math.random() * 800); // 200-1000 euro
          const quote = await prisma.quote.create({
            data: {
              assistanceRequest: {
                connect: { id: req.id }
              },
              user: {
                connect: { id: mario.id }  // Relazione con User (professional)
              },
              amount: amount,
              description: `Preventivo professionale per: ${req.title}
              
Dettagli del servizio:
- Sopralluogo e analisi del problema
- Fornitura materiali certificati
- Manodopera specializzata
- Garanzia 12 mesi sul lavoro
- Assistenza post-intervento`,
              status: 'PENDING',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });
          console.log(`✅ Creato preventivo di €${quote.amount} per richiesta ${req.id.substring(0, 8)}...`);
        }
      } catch (err) {
        console.log(`❌ Errore creazione preventivo: ${err.message}`);
      }
    }
    
    // 5. Completa alcune richieste per le statistiche
    console.log('\n✅ COMPLETAMENTO LAVORI...\n');
    
    const toComplete = await prisma.assistanceRequest.findMany({
      where: {
        professional: {
          id: mario.id
        },
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
            actualHours: 2 + Math.floor(Math.random() * 4)
          }
        });
        
        // Accetta anche il preventivo correlato
        await prisma.quote.updateMany({
          where: {
            requestId: req.id,
            professionalId: mario.id  // Qui possiamo usare professionalId direttamente nella where
          },
          data: {
            status: 'ACCEPTED'
          }
        });
        
        console.log(`✅ Completato lavoro per: "${req.title.substring(0, 40)}..."`);
      } catch (err) {
        console.log(`❌ Errore completamento: ${err.message}`);
      }
    }
    
    // 6. VERIFICA FINALE - Conta tutto
    console.log('\n📊 VERIFICA STATISTICHE FINALI...\n');
    
    const totalRequests = await prisma.assistanceRequest.count({
      where: {
        professional: {
          id: mario.id
        }
      }
    });
    
    const completedRequests = await prisma.assistanceRequest.count({
      where: {
        professional: {
          id: mario.id
        },
        status: 'COMPLETED'
      }
    });
    
    const inProgressRequests = await prisma.assistanceRequest.count({
      where: {
        professional: {
          id: mario.id
        },
        status: 'IN_PROGRESS'
      }
    });
    
    const totalQuotes = await prisma.quote.count({
      where: {
        user: {
          id: mario.id
        }
      }
    });
    
    const acceptedQuotes = await prisma.quote.count({
      where: {
        user: {
          id: mario.id
        },
        status: 'ACCEPTED'
      }
    });
    
    const earnings = await prisma.quote.aggregate({
      where: {
        user: {
          id: mario.id
        },
        status: 'ACCEPTED'
      },
      _sum: {
        amount: true
      }
    });
    
    console.log('='.repeat(50));
    console.log('📊 DASHBOARD MARIO ROSSI - DATI FINALI');
    console.log('='.repeat(50));
    console.log(`ID: ${mario.id}`);
    console.log(`Email: ${mario.email}`);
    console.log(`Nome: ${mario.firstName} ${mario.lastName}`);
    console.log('-'.repeat(50));
    console.log(`✅ Richieste totali: ${totalRequests}`);
    console.log(`✅ Lavori completati: ${completedRequests}`);
    console.log(`✅ Lavori in corso: ${inProgressRequests}`);
    console.log(`✅ Preventivi totali: ${totalQuotes}`);
    console.log(`✅ Preventivi accettati: ${acceptedQuotes}`);
    console.log(`✅ Guadagni totali: €${earnings._sum.amount || 0}`);
    console.log('='.repeat(50));
    
    console.log('\n🎉 FIX COMPLETATO CON SUCCESSO!');
    console.log('🔄 Ora ricarica la dashboard nel browser');
    console.log('📱 URL: http://localhost:5193');
    
  } catch (error) {
    console.error('❌ ERRORE CRITICO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
forceFixCorrect().catch(console.error);
