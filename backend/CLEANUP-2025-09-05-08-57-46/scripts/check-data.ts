import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check requests
    const requests = await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        category: true,
        subcategory: true
      }
    });
    
    console.log('\n📋 RICHIESTE ESISTENTI:');
    console.log('Totale richieste:', requests.length);
    requests.forEach(req => {
      console.log(`- ID: ${req.id} | Titolo: ${req.title} | Stato: ${req.status} | Cliente: ${req.client?.fullName}`);
    });

    // Check quotes
    const quotes = await prisma.quote.findMany({
      include: {
        request: true,
        professional: true,
        items: true
      }
    });
    
    console.log('\n💰 PREVENTIVI ESISTENTI:');
    console.log('Totale preventivi:', quotes.length);
    quotes.forEach(quote => {
      console.log(`- ID: ${quote.id} | Titolo: ${quote.title} | Stato: ${quote.status} | Totale: €${quote.totalAmount}`);
    });

    // Check professionals
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' }
    });
    
    console.log('\n👷 PROFESSIONISTI:');
    console.log('Totale professionisti:', professionals.length);
    professionals.forEach(prof => {
      console.log(`- ${prof.fullName} (${prof.email})`);
    });

    // Check categories
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true
      }
    });
    
    console.log('\n📂 CATEGORIE:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.subcategories.length} sottocategorie)`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
