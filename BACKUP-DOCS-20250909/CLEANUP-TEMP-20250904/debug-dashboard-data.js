const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDashboardData() {
  console.log('🔍 DEBUG DASHBOARD DATA');
  console.log('========================');

  try {
    // Test 1: Total requests
    const totalRequests = await prisma.assistanceRequest.count();
    console.log('📊 Total Requests:', totalRequests);

    // Test 2: Requests by status
    const statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    for (const status of statuses) {
      const count = await prisma.assistanceRequest.count({
        where: { status: status }
      });
      console.log(`   ${status}: ${count}`);
    }

    // Test 3: Check actual statuses in database
    console.log('\n🔍 ACTUAL STATUS VALUES IN DATABASE:');
    const actualStatuses = await prisma.assistanceRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    actualStatuses.forEach(item => {
      console.log(`   "${item.status}": ${item._count.status}`);
    });

    // Test 4: Recent requests
    console.log('\n📋 RECENT REQUESTS:');
    const recentRequests = await prisma.assistanceRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });
    
    recentRequests.forEach(req => {
      console.log(`   ID: ${req.id}, Status: "${req.status}", Title: ${req.title.substring(0, 30)}...`);
    });

    // Test 5: Total quotes
    const totalQuotes = await prisma.quote.count();
    console.log('\n💰 Total Quotes:', totalQuotes);

    // Test 6: Users by role
    console.log('\n👥 USERS BY ROLE:');
    const roles = ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];
    
    for (const role of roles) {
      const count = await prisma.user.count({
        where: { role: role }
      });
      console.log(`   ${role}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardData();
