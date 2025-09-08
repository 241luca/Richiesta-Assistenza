import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizations() {
  console.log('🔍 Checking Organizations and Data Distribution...\n');

  try {
    // 1. Get all organizations
    const orgs = await prisma.organization.findMany();
    console.log(`📁 Found ${orgs.length} organizations:\n`);
    
    for (const org of orgs) {
      console.log(`Organization: "${org.name}" (${org.id})`);
      console.log(`  Slug: ${org.slug}`);
      console.log(`  Plan: ${org.plan}`);
      console.log(`  Active: ${org.isActive}`);
      
      // Count data in each organization
      const userCount = await prisma.user.count({ where: { organizationId: org.id } });
      const requestCount = await prisma.assistanceRequest.count({ where: { organizationId: org.id } });
      const quoteCount = await prisma.quote.count({ where: { organizationId: org.id } });
      
      console.log(`  📊 Data:`);
      console.log(`     Users: ${userCount}`);
      console.log(`     Requests: ${requestCount}`);
      console.log(`     Quotes: ${quoteCount}`);
      console.log('---');
    }
    
    // 2. Check quotes details
    console.log('\n💰 All Quotes in Database:');
    const allQuotes = await prisma.quote.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        organizationId: true,
        requestId: true,
        professionalId: true,
        totalAmount: true,
        professional: {
          select: {
            email: true,
            organizationId: true
          }
        },
        request: {
          select: {
            title: true,
            organizationId: true
          }
        }
      }
    });
    
    if (allQuotes.length === 0) {
      console.log('  No quotes found in database');
    } else {
      allQuotes.forEach(quote => {
        console.log(`\nQuote: "${quote.title}"`);
        console.log(`  ID: ${quote.id}`);
        console.log(`  Status: ${quote.status}`);
        console.log(`  Amount: €${(Number(quote.totalAmount) / 100).toFixed(2)}`);
        console.log(`  Quote Org: ${quote.organizationId}`);
        console.log(`  Request: "${quote.request?.title}" (Org: ${quote.request?.organizationId})`);
        console.log(`  Professional: ${quote.professional?.email} (Org: ${quote.professional?.organizationId})`);
      });
    }
    
    // 3. Check requests with their quotes
    console.log('\n📋 Requests and their Quotes:');
    const requestsWithQuotes = await prisma.assistanceRequest.findMany({
      include: {
        _count: {
          select: { quotes: true }
        },
        quotes: {
          select: {
            id: true,
            title: true,
            organizationId: true
          }
        }
      }
    });
    
    requestsWithQuotes.forEach(req => {
      console.log(`\nRequest: "${req.title}"`);
      console.log(`  Org: ${req.organizationId}`);
      console.log(`  Quotes: ${req._count.quotes}`);
      if (req.quotes.length > 0) {
        req.quotes.forEach(q => {
          console.log(`    - "${q.title}" (Org: ${q.organizationId})`);
        });
      }
    });
    
    // 4. Check if there are org mismatches
    console.log('\n⚠️  Checking for Organization Mismatches:');
    
    // Check users with different org than Demo Organization
    const mainOrgId = '2ee571bf-0aab-4fde-98ba-2fe3e17b9d60';
    const usersWrongOrg = await prisma.user.count({
      where: { organizationId: { not: mainOrgId } }
    });
    const requestsWrongOrg = await prisma.assistanceRequest.count({
      where: { organizationId: { not: mainOrgId } }
    });
    const quotesWrongOrg = await prisma.quote.count({
      where: { organizationId: { not: mainOrgId } }
    });
    
    if (usersWrongOrg > 0) console.log(`  ❌ ${usersWrongOrg} users in wrong organization`);
    if (requestsWrongOrg > 0) console.log(`  ❌ ${requestsWrongOrg} requests in wrong organization`);
    if (quotesWrongOrg > 0) console.log(`  ❌ ${quotesWrongOrg} quotes in wrong organization`);
    
    if (usersWrongOrg === 0 && requestsWrongOrg === 0 && quotesWrongOrg === 0) {
      console.log('  ✅ All data is in the main organization');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations();