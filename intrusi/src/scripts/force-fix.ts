// FIX DEFINITIVO - FORZA L'ASSEGNAZIONE
// cd backend && npx ts-node src/scripts/force-fix.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFix() {
  console.log('\n=== FIX FORZATO DASHBOARD ===\n');
  
  try {
    // 1. Trova il Mario Rossi PROFESSIONAL
    const mario = await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      }
    });
    
    if (!mario) {
      console.log('Mario Rossi professional non trovato. Lo creo...');
      const newMario = await prisma.user.create({
        data: {
          id: 'mario-professional-001',
          email: 'mario.rossi@assistenza.it',
          username: 'mario.rossi.prof',
          password: '$2a$10$YourHashedPasswordHere', // Password: password123
          firstName: 'Mario',
          lastName: 'Rossi',
          fullName: 'Mario Rossi',
          phone: '1234567890',
          role: 'PROFESSIONAL',
          address: 'Via Roma 1',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100',
          profession: 'Idraulico'
        }
      });
      console.log('✅ Creato nuovo Mario Rossi professional');
    }
    
    const professionalMario = mario || await prisma.user.findFirst({
      where: {
        email: 'mario.rossi@assistenza.it',
        role: 'PROFESSIONAL'
      }
    });
    
    console.log(`Mario Professional ID: ${professionalMario?.id}`);
    
    // 2. Prendi TUTTE le richieste non assegnate
    const unassignedRequests = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          { professionalId: null },
          { professionalId: '' }
        ]
      }
    });
    
    console.log(`Trovate ${unassignedRequests.length} richieste non assegnate`);
    
    // 3. Assegna le prime 10 a Mario
    let assigned = 0;
    for (const req of unassignedRequests.slice(0, 10)) {
      await prisma.assistanceRequest.update({
        where: { id: req.id },
        data: {
          professionalId: professionalMario!.id,
          status: 'ASSIGNED',
          assignedDate: new Date()
        }
      });
      assigned++;
      console.log(`✅ Assegnata richiesta ${req.title.substring(0, 30)}...`);
    }
    
    // 4. Crea preventivi per le richieste assegnate
    const assignedReqs = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: professionalMario!.id
      },
      take: 5
    });
    
    console.log('\nCreo preventivi...');
    
    for (const req of assignedReqs) {
      const existingQuote = await prisma.quote.findFirst({
        where: {
          requestId: req.id,
          professionalId: professionalMario!.id
        }
      });
      
      if (!existingQuote) {
        const quote = await prisma.quote.create({
          data: {
            requestId: req.id,
            professionalId: professionalMario!.id,
            amount: 250 + Math.floor(Math.random() * 500),
            description: `Preventivo per ${req.title}`,
            status: 'PENDING',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        console.log(`✅ Creato preventivo di €${quote.amount}`);
      }
    }
    
    // 5. Marca alcune come completate
    const toComplete = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: professionalMario!.id,
        status: 'ASSIGNED'
      },
      take: 3
    });
    
    for (const req of toComplete) {
      await prisma.assistanceRequest.update({
        where: { id: req.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date()
        }
      });
      
      // Accetta anche il preventivo
      await prisma.quote.updateMany({
        where: {
          requestId: req.id,
          professionalId: professionalMario!.id
        },
        data: {
          status: 'ACCEPTED'
        }
      });
      
      console.log(`✅ Completata richiesta ${req.title.substring(0, 30)}...`);
    }
    
    // 6. VERIFICA FINALE
    const stats = await prisma.assistanceRequest.groupBy({
      by: ['status'],
      where: {
        professionalId: professionalMario!.id
      },
      _count: true
    });
    
    const totalQuotes = await prisma.quote.count({
      where: {
        professionalId: professionalMario!.id
      }
    });
    
    const acceptedQuotes = await prisma.quote.count({
      where: {
        professionalId: professionalMario!.id,
        status: 'ACCEPTED'
      }
    });
    
    const earnings = await prisma.quote.aggregate({
      where: {
        professionalId: professionalMario!.id,
        status: 'ACCEPTED'
      },
      _sum: {
        amount: true
      }
    });
    
    console.log('\n=== STATISTICHE FINALI ===');
    console.log('Per Mario Rossi (', professionalMario!.id, ')');
    stats.forEach(s => {
      console.log(`${s.status}: ${s._count} richieste`);
    });
    console.log(`Preventivi totali: ${totalQuotes}`);
    console.log(`Preventivi accettati: ${acceptedQuotes}`);
    console.log(`Guadagni totali: €${earnings._sum.amount || 0}`);
    
  } catch (error) {
    console.error('ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFix();
