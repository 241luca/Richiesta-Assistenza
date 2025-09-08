import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrganizationIds() {
  console.log('🔧 Fixing organization IDs...\n');

  try {
    // 1. Trova o crea l'organizzazione principale
    let mainOrg = await prisma.organization.findFirst();
    
    if (!mainOrg) {
      console.log('📁 Creating main organization...');
      mainOrg = await prisma.organization.create({
        data: {
          name: 'Main Organization',
          slug: 'main-org',
        }
      });
    }
    
    console.log(`✅ Main Organization: ${mainOrg.name} (ID: ${mainOrg.id})\n`);

    // 2. Aggiorna tutti gli utenti per usare questa organizzazione
    console.log('👥 Checking and updating users...');
    
    // Prima otteniamo tutti gli utenti
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        organizationId: true
      }
    });
    
    console.log(`   Found ${allUsers.length} users`);
    
    let updatedUsers = 0;
    for (const user of allUsers) {
      if (user.organizationId !== mainOrg.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: mainOrg.id }
        });
        updatedUsers++;
        console.log(`   Updated user: ${user.email}`);
      }
    }
    console.log(`   Total updated: ${updatedUsers} users`);

    // 3. Aggiorna tutte le richieste
    console.log('\n📋 Checking and updating requests...');
    
    const allRequests = await prisma.assistanceRequest.findMany({
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    console.log(`   Found ${allRequests.length} requests`);
    
    let updatedRequests = 0;
    for (const request of allRequests) {
      if (request.organizationId !== mainOrg.id) {
        await prisma.assistanceRequest.update({
          where: { id: request.id },
          data: { organizationId: mainOrg.id }
        });
        updatedRequests++;
        console.log(`   Updated request: ${request.title}`);
      }
    }
    console.log(`   Total updated: ${updatedRequests} requests`);

    // 4. Aggiorna tutti i preventivi
    console.log('\n💰 Checking and updating quotes...');
    
    const allQuotes = await prisma.quote.findMany({
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    console.log(`   Found ${allQuotes.length} quotes`);
    
    let updatedQuotes = 0;
    for (const quote of allQuotes) {
      if (quote.organizationId !== mainOrg.id) {
        await prisma.quote.update({
          where: { id: quote.id },
          data: { organizationId: mainOrg.id }
        });
        updatedQuotes++;
        console.log(`   Updated quote: ${quote.title}`);
      }
    }
    console.log(`   Total updated: ${updatedQuotes} quotes`);

    // 5. Verifica finale
    console.log('\n📊 Final verification:');
    
    const totalUsers = await prisma.user.count({ where: { organizationId: mainOrg.id } });
    const totalRequests = await prisma.assistanceRequest.count({ where: { organizationId: mainOrg.id } });
    const totalQuotes = await prisma.quote.count({ where: { organizationId: mainOrg.id } });
    
    console.log(`   Users in main org: ${totalUsers}`);
    console.log(`   Requests in main org: ${totalRequests}`);
    console.log(`   Quotes in main org: ${totalQuotes}`);
    
    // 6. Mostra alcuni dati di esempio
    console.log('\n📝 Sample data:');
    
    const sampleRequests = await prisma.assistanceRequest.findMany({
      where: { organizationId: mainOrg.id },
      take: 3,
      include: {
        client: true,
        category: true
      }
    });
    
    if (sampleRequests.length > 0) {
      console.log('\n   Sample Requests:');
      sampleRequests.forEach(req => {
        console.log(`   - "${req.title}" by ${req.client?.email || 'Unknown'} (Status: ${req.status})`);
      });
    } else {
      console.log('   No requests found in the organization');
    }
    
    const sampleQuotes = await prisma.quote.findMany({
      where: { organizationId: mainOrg.id },
      take: 3,
      include: {
        request: true,
        professional: true
      }
    });
    
    if (sampleQuotes.length > 0) {
      console.log('\n   Sample Quotes:');
      sampleQuotes.forEach(quote => {
        console.log(`   - "${quote.title}" by ${quote.professional?.email || 'Unknown'} (Status: ${quote.status})`);
      });
    } else {
      console.log('   No quotes found in the organization');
    }

    console.log('\n✅ Organization ID check complete!');
    console.log('🔄 Please refresh your browser to see the data.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrganizationIds();