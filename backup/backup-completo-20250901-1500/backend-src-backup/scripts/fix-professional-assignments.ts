// Script per correggere l'assegnazione delle richieste a Mario Rossi
// Esegui con: cd backend && npx ts-node src/scripts/fix-professional-assignments.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function fixProfessionalAssignments() {
  try {
    console.log('\n=== FIX ASSEGNAZIONI PROFESSIONISTA ===\n');
    
    // 1. Trova Mario Rossi professionista
    const marioRossi = await prisma.user.findFirst({
      where: {
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'PROFESSIONAL'
      }
    });

    if (!marioRossi) {
      console.log('❌ Mario Rossi professionista non trovato!');
      return;
    }

    console.log(`✅ Mario Rossi trovato: ID = ${marioRossi.id}`);
    console.log(`   Email: ${marioRossi.email}`);
    console.log(`   Ruolo: ${marioRossi.role}\n`);

    // 2. Verifica richieste esistenti assegnate a Mario
    const existingRequests = await prisma.assistanceRequest.count({
      where: { professionalId: marioRossi.id }
    });
    
    console.log(`📊 Richieste attualmente assegnate a Mario Rossi: ${existingRequests}\n`);

    // 3. Trova tutte le richieste che potrebbero essere assegnate
    const requestsToFix = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          // Richieste con status ASSIGNED ma senza professionalId
          {
            status: 'ASSIGNED',
            professionalId: null
          },
          // Richieste PENDING che possiamo assegnare
          {
            status: 'PENDING',
            professionalId: null
          }
        ]
      },
      include: {
        client: true,
        professional: true,
        category: true
      }
    });

    console.log(`📋 Trovate ${requestsToFix.length} richieste da poter assegnare\n`);

    // 4. Se non ci sono richieste da assegnare, cerca tutte le richieste
    if (requestsToFix.length === 0) {
      console.log('🔍 Non ci sono richieste non assegnate. Verifico tutte le richieste...\n');
      
      const allRequests = await prisma.assistanceRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          professional: true,
          category: true
        }
      });

      console.log(`📋 Ultime ${allRequests.length} richieste nel sistema:\n`);
      allRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.title}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Categoria: ${req.category?.name || 'N/D'}`);
        console.log(`   Cliente: ${req.client?.firstName} ${req.client?.lastName}`);
        console.log(`   Professionista: ${req.professionalId ? `${req.professional?.firstName} ${req.professional?.lastName}` : 'NON ASSEGNATO'}`);
        console.log(`   Data: ${req.createdAt.toLocaleDateString('it-IT')}\n`);
      });

      // Assegna alcune richieste non assegnate o pending a Mario Rossi
      const requestsToAssign = allRequests.filter(r => 
        !r.professionalId || r.professionalId === '' || r.status === 'PENDING'
      ).slice(0, 5);

      if (requestsToAssign.length > 0) {
        console.log(`\n🔧 ASSEGNAZIONE DI ${requestsToAssign.length} RICHIESTE A MARIO ROSSI\n`);
        
        for (const request of requestsToAssign) {
          try {
            const updated = await prisma.assistanceRequest.update({
              where: { id: request.id },
              data: {
                professionalId: marioRossi.id,
                status: 'ASSIGNED',
                assignedDate: new Date(),
                updatedAt: new Date()
              }
            });
            
            console.log(`✅ Assegnata: "${updated.title}"`);
          } catch (error) {
            console.log(`❌ Errore nell'assegnare richiesta ${request.id}: ${error.message}`);
          }
        }
      }
    } else {
      // Assegna le richieste trovate
      console.log('🔧 ASSEGNAZIONE RICHIESTE A MARIO ROSSI\n');
      
      const requestsToAssign = requestsToFix.slice(0, 5);
      
      for (const request of requestsToAssign) {
        try {
          const updated = await prisma.assistanceRequest.update({
            where: { id: request.id },
            data: {
              professionalId: marioRossi.id,
              status: 'ASSIGNED',
              assignedDate: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Assegnata: "${updated.title}"`);
        } catch (error) {
          console.log(`❌ Errore nell'assegnare richiesta ${request.id}: ${error.message}`);
        }
      }
    }

    // 5. Crea preventivi di esempio per le richieste assegnate
    console.log('\n💰 CREAZIONE PREVENTIVI DI ESEMPIO:\n');
    
    const assignedRequests = await prisma.assistanceRequest.findMany({
      where: { 
        professionalId: marioRossi.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      take: 3
    });

    for (const request of assignedRequests) {
      // Controlla se esiste già un preventivo
      const existingQuote = await prisma.quote.findFirst({
        where: {
          requestId: request.id,
          professionalId: marioRossi.id
        }
      });

      if (!existingQuote) {
        try {
          const quote = await prisma.quote.create({
            data: {
              requestId: request.id,
              professionalId: marioRossi.id,
              amount: Math.floor(Math.random() * 500) + 100, // Importo casuale tra 100 e 600
              description: `Preventivo per: ${request.title}
              
Dettagli intervento:
- Sopralluogo e valutazione del problema
- Fornitura materiali necessari
- Manodopera specializzata
- Garanzia 12 mesi sul lavoro svolto`,
              status: 'PENDING',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valido per 30 giorni
            }
          });
          
          console.log(`✅ Creato preventivo di €${quote.amount} per "${request.title}"`);
        } catch (error) {
          console.log(`❌ Errore nel creare preventivo: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Preventivo già esistente per "${request.title}"`);
      }
    }

    // 6. Simula qualche lavoro completato per le statistiche
    console.log('\n✅ SIMULAZIONE LAVORI COMPLETATI:\n');
    
    const requestsToComplete = await prisma.assistanceRequest.findMany({
      where: { 
        professionalId: marioRossi.id,
        status: 'ASSIGNED'
      },
      take: 2
    });

    for (const request of requestsToComplete) {
      try {
        await prisma.assistanceRequest.update({
          where: { id: request.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            actualHours: Math.floor(Math.random() * 5) + 1,
            updatedAt: new Date()
          }
        });
        
        // Accetta anche il preventivo associato
        await prisma.quote.updateMany({
          where: {
            requestId: request.id,
            professionalId: marioRossi.id
          },
          data: {
            status: 'ACCEPTED'
          }
        });
        
        console.log(`✅ Completato lavoro: "${request.title}"`);
      } catch (error) {
        console.log(`❌ Errore nel completare lavoro: ${error.message}`);
      }
    }

    // 7. Mostra le statistiche finali per la dashboard
    const [
      totalRequests,
      completedJobs,
      inProgressRequests,
      totalQuotes,
      acceptedQuotes,
      totalEarnedData
    ] = await Promise.all([
      prisma.assistanceRequest.count({ where: { professionalId: marioRossi.id } }),
      prisma.assistanceRequest.count({ 
        where: { 
          professionalId: marioRossi.id,
          status: 'COMPLETED'
        } 
      }),
      prisma.assistanceRequest.count({ 
        where: { 
          professionalId: marioRossi.id,
          status: 'IN_PROGRESS'
        } 
      }),
      prisma.quote.count({ where: { professionalId: marioRossi.id } }),
      prisma.quote.count({ 
        where: { 
          professionalId: marioRossi.id,
          status: 'ACCEPTED'
        } 
      }),
      prisma.quote.aggregate({
        where: {
          professionalId: marioRossi.id,
          status: 'ACCEPTED'
        },
        _sum: {
          amount: true
        }
      })
    ]);

    const totalEarned = totalEarnedData._sum.amount ? Number(totalEarnedData._sum.amount) : 0;

    console.log('\n📊 STATISTICHE DASHBOARD MARIO ROSSI:');
    console.log('═══════════════════════════════════════');
    console.log(`   Richieste totali: ${totalRequests}`);
    console.log(`   Lavori completati: ${completedJobs}`);
    console.log(`   Lavori in corso: ${inProgressRequests}`);
    console.log(`   Preventivi totali: ${totalQuotes}`);
    console.log(`   Preventivi accettati: ${acceptedQuotes}`);
    console.log(`   Guadagni totali: €${totalEarned}`);

    console.log('\n✅ FIX COMPLETATO!');
    console.log('═══════════════════════════════════════');
    console.log('🔄 Ricarica la dashboard per vedere i dati aggiornati.');
    console.log('📱 Vai su http://localhost:5193 e fai refresh della pagina.\n');

  } catch (error) {
    console.error('❌ Errore durante il fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il fix
fixProfessionalAssignments();
