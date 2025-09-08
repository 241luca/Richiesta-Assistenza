// Script di debug per verificare la dashboard dei professionisti
// Esegui con: cd backend && npx ts-node src/scripts/debug-professional-dashboard.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugProfessionalDashboard() {
  try {
    console.log('\n=== DEBUG DASHBOARD PROFESSIONISTA ===\n');
    
    // 1. Trova l'utente Mario Rossi
    const marioRossi = await prisma.user.findFirst({
      where: {
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'PROFESSIONAL'
      }
    });

    if (!marioRossi) {
      console.log('❌ Mario Rossi non trovato nel database!');
      return;
    }

    console.log(`✅ Mario Rossi trovato: ID = ${marioRossi.id}, Email = ${marioRossi.email}`);

    // 2. Conta le richieste totali nel sistema
    const totalRequestsInSystem = await prisma.assistanceRequest.count();
    console.log(`\n📊 Richieste totali nel sistema: ${totalRequestsInSystem}`);

    // 3. Verifica le richieste assegnate a Mario Rossi
    const requestsForMario = await prisma.assistanceRequest.count({
      where: { professionalId: marioRossi.id }
    });
    console.log(`📊 Richieste assegnate a Mario Rossi (professionalId = ${marioRossi.id}): ${requestsForMario}`);

    // 4. Mostra alcune richieste di esempio
    const sampleRequests = await prisma.assistanceRequest.findMany({
      take: 5,
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('\n📋 Prime 5 richieste nel sistema:');
    sampleRequests.forEach((req, index) => {
      console.log(`\n${index + 1}. ${req.title}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Client ID: ${req.clientId} - ${req.client?.firstName} ${req.client?.lastName}`);
      console.log(`   Professional ID: ${req.professionalId} - ${req.professional ? 
        `${req.professional.firstName} ${req.professional.lastName}` : 'NON ASSEGNATO'}`);
    });

    // 5. Verifica se ci sono richieste con clientId che corrisponde a Mario Rossi
    const requestsAsClient = await prisma.assistanceRequest.count({
      where: { clientId: marioRossi.id }
    });
    console.log(`\n📊 Richieste create da Mario Rossi come CLIENTE: ${requestsAsClient}`);

    // 6. Verifica i preventivi
    const quotesForMario = await prisma.quote.count({
      where: { professionalId: marioRossi.id }
    });
    console.log(`📊 Preventivi creati da Mario Rossi: ${quotesForMario}`);

    // 7. Verifica se ci sono richieste senza professionista assegnato
    const unassignedRequests = await prisma.assistanceRequest.count({
      where: { 
        OR: [
          { professionalId: null },
          { professionalId: '' }
        ]
      }
    });
    console.log(`\n📊 Richieste non assegnate: ${unassignedRequests}`);

    // 8. Mostra gli ID dei professionisti nelle richieste
    const requestsWithProfessionals = await prisma.assistanceRequest.findMany({
      where: {
        NOT: {
          professionalId: null
        }
      },
      select: {
        professionalId: true
      },
      distinct: ['professionalId']
    });

    console.log(`\n📋 ID professionisti unici nelle richieste:`);
    requestsWithProfessionals.forEach(req => {
      console.log(`   - ${req.professionalId}`);
    });

    // 9. Verifica tutti i professionisti nel sistema
    const allProfessionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    console.log(`\n👷 Professionisti nel sistema:`);
    allProfessionals.forEach(prof => {
      console.log(`   - ID: ${prof.id}, Nome: ${prof.firstName} ${prof.lastName}, Email: ${prof.email}`);
    });

    console.log('\n=== FINE DEBUG ===\n');

  } catch (error) {
    console.error('Errore durante il debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProfessionalDashboard();
