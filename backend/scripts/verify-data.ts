import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verificando dati nel database...\n');

    // Count all entities
    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count()
    };

    console.log('📊 CONTEGGI:');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });

    // Get quotes with details
    const quotes = await prisma.quote.findMany({
      include: {
        request: {
          include: {
            client: true,
            category: true
          }
        },
        professional: true,
        items: true
      }
    });

    if (quotes.length > 0) {
      console.log('\n💰 PREVENTIVI TROVATI:');
      quotes.forEach(q => {
        console.log(`\nPreventivo ID: ${q.id}`);
        console.log(`- Titolo: ${q.title}`);
        console.log(`- Stato: ${q.status}`);
        console.log(`- Totale: €${q.totalAmount / 100}`);
        console.log(`- Richiesta: ${q.request.title}`);
        console.log(`- Cliente: ${q.request.client?.fullName}`);
        console.log(`- Professionista: ${q.professional?.fullName}`);
        console.log(`- Voci: ${q.items.length}`);
      });
    } else {
      console.log('\n⚠️ Nessun preventivo trovato nel database');
    }

    // Get requests without quotes
    const requestsWithoutQuotes = await prisma.assistanceRequest.findMany({
      where: {
        quotes: {
          none: {}
        }
      },
      include: {
        client: true,
        category: true
      }
    });

    if (requestsWithoutQuotes.length > 0) {
      console.log('\n📋 RICHIESTE SENZA PREVENTIVI:');
      requestsWithoutQuotes.forEach(r => {
        console.log(`- ${r.id}: ${r.title} (${r.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
