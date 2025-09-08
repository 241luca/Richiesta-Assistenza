// VERIFICA DEFINITIVA - Esegui query RAW al database
// cd backend && npx ts-node src/scripts/raw-check.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rawCheck() {
  console.log('\n=== QUERY RAW AL DATABASE ===\n');
  
  // 1. Query RAW per vedere TUTTI gli utenti con role PROFESSIONAL
  const professionals = await prisma.$queryRaw`
    SELECT id, email, "firstName", "lastName", "fullName", role 
    FROM "User" 
    WHERE role = 'PROFESSIONAL'
  `;
  
  console.log('PROFESSIONISTI NEL DATABASE:');
  console.log(professionals);
  
  // 2. Query RAW per vedere TUTTE le richieste
  const requests = await prisma.$queryRaw`
    SELECT id, title, status, "professionalId", "clientId"
    FROM "AssistanceRequest"
    LIMIT 10
  `;
  
  console.log('\nRICHIESTE NEL DATABASE:');
  console.log(requests);
  
  // 3. Per ogni professionista, conta direttamente
  for (const prof of professionals as any[]) {
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM "AssistanceRequest"
      WHERE "professionalId" = ${prof.id}
    `;
    
    console.log(`\n${prof.email}: ${(count as any)[0].total} richieste assegnate`);
  }
  
  await prisma.$disconnect();
}

rawCheck().catch(console.error);
