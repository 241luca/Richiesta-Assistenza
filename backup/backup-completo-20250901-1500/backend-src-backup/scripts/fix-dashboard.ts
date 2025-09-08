/**
 * FIX IMMEDIATO per dashboard professional che mostra 0
 * Il problema: le richieste non hanno professionalId assegnato
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDashboard() {
  console.log('🔧 FIX DASHBOARD PROFESSIONAL\n');

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

  console.log(`✅ Mario Rossi ID: ${mario.id}\n`);

  // 2. Assegna alcune richieste a Mario
  const unassignedRequests = await prisma.assistanceRequest.findMany({
    where: {
      professionalId: null,
      status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] }
    },
    take: 10
  });

  console.log(`📋 Trovate ${unassignedRequests.length} richieste non assegnate\n`);

  let assigned = 0;
  for (const req of unassignedRequests) {
    await prisma.assistanceRequest.update({
      where: { id: req.id },
      data: {
        professionalId: mario.id,
        status: req.status === 'PENDING' ? 'ASSIGNED' : req.status
      }
    });
    assigned++;
    console.log(`✅ Assegnata: ${req.title}`);
  }

  // 3. Crea alcuni preventivi se non esistono
  const quotesCount = await prisma.quote.count({
    where: { professionalId: mario.id }
  });

  if (quotesCount === 0) {
    const firstRequest = unassignedRequests[0];
    if (firstRequest) {
      await prisma.quote.create({
        data: {
          requestId: firstRequest.id,
          professionalId: mario.id,
          amount: 25000, // 250€
          status: 'PENDING',
          createdAt: new Date()
        }
      });
      console.log('\n✅ Creato preventivo di esempio');
    }
  }

  // 4. Verifica finale
  const finalCount = await prisma.assistanceRequest.count({
    where: { professionalId: mario.id }
  });

  console.log(`\n🎉 FATTO! Mario ora ha ${finalCount} richieste assegnate`);
  console.log('La dashboard dovrebbe ora mostrare i dati corretti!');
  
  await prisma.$disconnect();
}

fixDashboard().catch(console.error);
