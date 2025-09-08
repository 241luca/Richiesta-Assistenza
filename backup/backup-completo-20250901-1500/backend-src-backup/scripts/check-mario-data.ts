// Script di verifica DIRETTA del database
// Esegui con: cd backend && npx ts-node src/scripts/check-mario-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMarioData() {
  console.log('\n=== VERIFICA DATI MARIO ROSSI ===\n');
  
  // 1. Trova TUTTI gli utenti Mario Rossi
  const allMarios = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: 'Mario', lastName: 'Rossi' },
        { fullName: { contains: 'Mario Rossi' } },
        { email: { contains: 'mario.rossi' } }
      ]
    }
  });

  console.log(`Trovati ${allMarios.length} utenti "Mario Rossi":\n`);
  allMarios.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Ruolo: ${user.role}`);
    console.log(`---`);
  });

  // 2. Per ogni Mario, conta le richieste
  for (const mario of allMarios) {
    const requestCount = await prisma.assistanceRequest.count({
      where: { professionalId: mario.id }
    });
    const quoteCount = await prisma.quote.count({
      where: { professionalId: mario.id }
    });
    
    console.log(`\n📊 Statistiche per ${mario.email} (${mario.role}):`);
    console.log(`   Richieste assegnate: ${requestCount}`);
    console.log(`   Preventivi creati: ${quoteCount}`);
  }

  // 3. Mostra TUTTE le richieste con i loro professionalId
  const allRequests = await prisma.assistanceRequest.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      professionalId: true,
      clientId: true
    }
  });

  console.log(`\n📋 TUTTE LE RICHIESTE (${allRequests.length} totali):\n`);
  allRequests.forEach((req, i) => {
    console.log(`${i+1}. ${req.title.substring(0, 50)}...`);
    console.log(`   ID: ${req.id}`);
    console.log(`   Status: ${req.status}`);
    console.log(`   ProfessionalId: ${req.professionalId || 'NULL'}`);
    console.log(`   ClientId: ${req.clientId}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkMarioData();
