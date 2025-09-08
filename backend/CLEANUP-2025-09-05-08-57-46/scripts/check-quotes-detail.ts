import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuotesDetail() {
  console.log('🔍 Checking Quotes Details...\n');

  try {
    // Get all quotes with full details
    const quotes = await prisma.quote.findMany({
      include: {
        request: {
          include: {
            client: true,
            professional: true,
            category: true
          }
        },
        professional: true,
        items: true
      }
    });

    console.log(`📊 Found ${quotes.length} quotes:\n`);

    quotes.forEach((quote, index) => {
      console.log(`${index + 1}. Quote: "${quote.title}"`);
      console.log(`   ID: ${quote.id}`);
      console.log(`   Status: ${quote.status}`);
      console.log(`   Amount: €${(Number(quote.totalAmount) / 100).toFixed(2)}`);
      console.log(`   Organization: ${quote.organizationId}`);
      console.log(`   Professional ID: ${quote.professionalId}`);
      console.log(`   Professional Email: ${quote.professional?.email}`);
      console.log(`   Request ID: ${quote.requestId}`);
      console.log(`   Request Title: ${quote.request?.title}`);
      console.log(`   Request Status: ${quote.request?.status}`);
      console.log(`   Request Client: ${quote.request?.client?.email}`);
      console.log(`   Items: ${quote.items.length}`);
      console.log('---\n');
    });

    // Check if quotes have missing relations
    console.log('⚠️  Checking for missing relations:\n');
    
    for (const quote of quotes) {
      const issues = [];
      
      // Check if request exists
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: quote.requestId }
      });
      if (!request) {
        issues.push(`Request ${quote.requestId} NOT FOUND`);
      }
      
      // Check if professional exists
      const professional = await prisma.user.findUnique({
        where: { id: quote.professionalId }
      });
      if (!professional) {
        issues.push(`Professional ${quote.professionalId} NOT FOUND`);
      }
      
      if (issues.length > 0) {
        console.log(`❌ Quote "${quote.title}": ${issues.join(', ')}`);
      } else {
        console.log(`✅ Quote "${quote.title}": All relations OK`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuotesDetail();