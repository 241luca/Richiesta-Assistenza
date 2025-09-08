import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuotes() {
  try {
    // 1. Conta quanti preventivi ci sono
    const count = await prisma.quote.count();
    console.log(`\n📊 Totale preventivi nel database: ${count}`);
    
    // 2. Mostra i primi 5 preventivi
    const quotes = await prisma.quote.findMany({
      take: 5,
      include: {
        request: true,
        professional: true,
        items: true
      }
    });
    
    console.log('\n📋 Dettagli preventivi:');
    quotes.forEach(quote => {
      console.log(`\n- ID: ${quote.id}`);
      console.log(`  Titolo: ${quote.title}`);
      console.log(`  Stato: ${quote.status}`);
      console.log(`  Professionista ID: ${quote.professionalId}`);
      console.log(`  Request ID: ${quote.requestId}`);
      console.log(`  Numero items: ${quote.items.length}`);
    });
    
    // 3. Verifica se ci sono richieste
    const requestCount = await prisma.assistanceRequest.count();
    console.log(`\n📋 Totale richieste: ${requestCount}`);
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuotes();
