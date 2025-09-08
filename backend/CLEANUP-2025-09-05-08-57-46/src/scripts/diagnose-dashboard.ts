/**
 * Script per diagnosticare e risolvere il problema della dashboard professionista
 * che mostra tutti i valori a zero
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Colori per output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function diagnoseDashboard() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     DIAGNOSI PROBLEMA DASHBOARD PROFESSIONISTA            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. Trova un professionista di test (Mario Rossi)
    console.log(`${colors.blue}1. Cerco il professionista Mario Rossi...${colors.reset}`);
    
    const professional = await prisma.user.findFirst({
      where: {
        role: 'PROFESSIONAL',
        fullName: 'Mario Rossi'
      }
    });

    if (!professional) {
      console.log(`${colors.red}❌ Mario Rossi non trovato. Cerco un altro professionista...${colors.reset}`);
      
      const anyProfessional = await prisma.user.findFirst({
        where: { role: 'PROFESSIONAL' }
      });

      if (!anyProfessional) {
        console.log(`${colors.red}❌ Nessun professionista trovato nel database${colors.reset}`);
        return;
      }
      
      console.log(`${colors.green}✅ Trovato professionista: ${anyProfessional.fullName} (ID: ${anyProfessional.id})${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ Trovato: ${professional.fullName} (ID: ${professional.id})${colors.reset}\n`);
    }

    const userId = professional?.id || (await prisma.user.findFirst({ where: { role: 'PROFESSIONAL' }}))?.id;
    
    if (!userId) {
      console.log(`${colors.red}❌ Impossibile trovare un professionista${colors.reset}`);
      return;
    }

    // 2. Verifica il tipo di dato
    console.log(`${colors.blue}2. Verifico il tipo di dato dell'ID...${colors.reset}`);
    console.log(`   • Tipo userId: ${typeof userId}`);
    console.log(`   • Valore userId: ${userId}\n`);

    // 3. Conta le richieste totali nel database
    console.log(`${colors.blue}3. Verifico le richieste nel database...${colors.reset}`);
    
    const totalRequestsInDb = await prisma.assistanceRequest.count();
    console.log(`   • Richieste totali nel DB: ${totalRequestsInDb}`);

    // 4. Verifica se ci sono richieste con questo professionalId
    console.log(`\n${colors.blue}4. Verifico richieste assegnate al professionista...${colors.reset}`);
    
    // Prova query con stringa
    const requestsAsString = await prisma.assistanceRequest.count({
      where: { professionalId: userId }
    });
    console.log(`   • Con professionalId = "${userId}" (stringa): ${requestsAsString} richieste`);

    // Verifica se ci sono richieste con professionalId non null
    const requestsWithProfessional = await prisma.assistanceRequest.count({
      where: { 
        professionalId: { not: null }
      }
    });
    console.log(`   • Richieste con un professionista assegnato (qualsiasi): ${requestsWithProfessional}`);

    // 5. Mostra un esempio di richiesta
    console.log(`\n${colors.blue}5. Esempio di richiesta nel database...${colors.reset}`);
    
    const sampleRequest = await prisma.assistanceRequest.findFirst({
      where: {
        professionalId: { not: null }
      }
    });

    if (sampleRequest) {
      console.log(`   • ID Richiesta: ${sampleRequest.id}`);
      console.log(`   • Professional ID: ${sampleRequest.professionalId}`);
      console.log(`   • Tipo Professional ID: ${typeof sampleRequest.professionalId}`);
      console.log(`   • Status: ${sampleRequest.status}`);
    } else {
      console.log(`   ${colors.yellow}⚠️  Nessuna richiesta ha un professionista assegnato${colors.reset}`);
    }

    // 6. Verifica preventivi
    console.log(`\n${colors.blue}6. Verifico i preventivi...${colors.reset}`);
    
    const totalQuotes = await prisma.quote.count({
      where: { professionalId: userId }
    });
    console.log(`   • Preventivi del professionista: ${totalQuotes}`);

    const anyQuotes = await prisma.quote.count();
    console.log(`   • Preventivi totali nel DB: ${anyQuotes}`);

    // 7. Diagnostica problema
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║                        DIAGNOSI                           ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    if (requestsAsString === 0 && requestsWithProfessional === 0) {
      console.log(`${colors.red}🔴 PROBLEMA: Nessuna richiesta è assegnata a nessun professionista${colors.reset}`);
      console.log(`   Questo spiega perché la dashboard mostra tutto a zero.`);
      console.log(`\n${colors.yellow}💡 SOLUZIONE:${colors.reset}`);
      console.log(`   1. Creare nuove richieste di test`);
      console.log(`   2. Assegnarle a un professionista`);
      console.log(`   3. Creare preventivi di test`);
      
      // Offri di creare dati di test
      console.log(`\n${colors.green}Vuoi che crei dei dati di test? (esegui con --create-test-data)${colors.reset}`);
    } else if (requestsAsString === 0 && requestsWithProfessional > 0) {
      console.log(`${colors.red}🔴 PROBLEMA: Tipo di dato incompatibile${colors.reset}`);
      console.log(`   Il professionalId nel database potrebbe essere di tipo diverso`);
      console.log(`   dall'ID utente che stiamo usando nelle query.`);
      console.log(`\n${colors.yellow}💡 SOLUZIONE:${colors.reset}`);
      console.log(`   Verificare lo schema Prisma e correggere i tipi di dato`);
    } else {
      console.log(`${colors.green}✅ I dati sembrano corretti${colors.reset}`);
      console.log(`   Il professionista ha ${requestsAsString} richieste assegnate`);
      console.log(`   Verificare che il frontend stia chiamando l'endpoint corretto`);
    }

    // 8. Se richiesto, crea dati di test
    if (process.argv.includes('--create-test-data')) {
      console.log(`\n${colors.blue}8. Creazione dati di test...${colors.reset}`);
      
      // Trova un cliente
      const client = await prisma.user.findFirst({
        where: { role: 'CLIENT' }
      });

      if (!client) {
        console.log(`${colors.red}❌ Nessun cliente trovato per creare richieste di test${colors.reset}`);
        return;
      }

      // Crea una richiesta di test
      const testRequest = await prisma.assistanceRequest.create({
        data: {
          clientId: client.id,
          professionalId: userId,
          title: 'Richiesta di Test Dashboard',
          description: 'Questa è una richiesta di test per verificare la dashboard',
          category: 'Elettricista',
          status: 'ASSIGNED',
          priority: 'MEDIUM',
          address: 'Via Test 1',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100',
          requestedDate: new Date()
        }
      });

      console.log(`${colors.green}✅ Creata richiesta di test: ${testRequest.id}${colors.reset}`);

      // Crea un preventivo di test
      const testQuote = await prisma.quote.create({
        data: {
          requestId: testRequest.id,
          professionalId: userId,
          title: 'Preventivo di Test',
          description: 'Preventivo di test per la dashboard',
          totalAmount: 15000, // 150€ in centesimi
          status: 'PENDING',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
        }
      });

      console.log(`${colors.green}✅ Creato preventivo di test: ${testQuote.id}${colors.reset}`);
      
      // Crea una richiesta completata
      const completedRequest = await prisma.assistanceRequest.create({
        data: {
          clientId: client.id,
          professionalId: userId,
          title: 'Richiesta Completata di Test',
          description: 'Richiesta completata per test statistiche',
          category: 'Elettricista',
          status: 'COMPLETED',
          priority: 'HIGH',
          address: 'Via Test 2',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100',
          requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completionDate: new Date()
        }
      });

      console.log(`${colors.green}✅ Creata richiesta completata: ${completedRequest.id}${colors.reset}`);

      console.log(`\n${colors.green}🎉 Dati di test creati con successo!${colors.reset}`);
      console.log(`   Ora la dashboard dovrebbe mostrare:`);
      console.log(`   • 2 richieste totali`);
      console.log(`   • 1 richiesta assegnata`);
      console.log(`   • 1 richiesta completata`);
      console.log(`   • 1 preventivo`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Errore durante la diagnosi:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la diagnosi
console.log(`${colors.blue}🔧 Avvio diagnosi dashboard...${colors.reset}\n`);

diagnoseDashboard()
  .then(() => {
    console.log(`\n${colors.green}✨ Diagnosi completata!${colors.reset}`);
    if (!process.argv.includes('--create-test-data')) {
      console.log(`${colors.yellow}Suggerimento: Esegui con --create-test-data per creare dati di test${colors.reset}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}❌ Errore critico:${colors.reset}`, error);
    process.exit(1);
  });
