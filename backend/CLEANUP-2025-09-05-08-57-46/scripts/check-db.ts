import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n');

  try {
    // Check Organizations
    const organizations = await prisma.organization.findMany();
    console.log(`📁 Organizations: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`   - ${org.name} (ID: ${org.id})`);
    });

    // Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        organizationId: true,
      }
    });
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Org: ${user.organizationId}`);
    });

    // Check Requests
    const requests = await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        category: true,
      }
    });
    console.log(`\n📋 Requests: ${requests.length}`);
    requests.forEach(req => {
      console.log(`   - ${req.title} (Status: ${req.status}) - Org: ${req.organizationId}`);
      console.log(`     Client: ${req.client?.email}, Category: ${req.category?.name}`);
    });

    // Check Quotes
    const quotes = await prisma.quote.findMany({
      include: {
        request: true,
        professional: true,
      }
    });
    console.log(`\n💰 Quotes: ${quotes.length}`);
    quotes.forEach(quote => {
      console.log(`   - ${quote.title} (Status: ${quote.status}) - Org: ${quote.organizationId}`);
      console.log(`     Request: ${quote.request?.title}, Professional: ${quote.professional?.email}`);
    });

    // Check Categories
    const categories = await prisma.category.findMany();
    console.log(`\n🏷️ Categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    // Check a specific user's organization context
    console.log('\n🔐 Checking Super Admin context:');
    const superAdmin = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    if (superAdmin) {
      console.log(`   Super Admin Organization ID: ${superAdmin.organizationId}`);
      
      // Check requests for this organization
      const orgRequests = await prisma.assistanceRequest.findMany({
        where: { organizationId: superAdmin.organizationId }
      });
      console.log(`   Requests in Super Admin's org: ${orgRequests.length}`);
      
      const orgQuotes = await prisma.quote.findMany({
        where: { organizationId: superAdmin.organizationId }
      });
      console.log(`   Quotes in Super Admin's org: ${orgQuotes.length}`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();