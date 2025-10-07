const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const templates = await prisma.notificationTemplate.findMany({
    take: 3
  });
  
  console.log('PRIMI 3 TEMPLATE:');
  templates.forEach(t => {
    console.log(`- [${t.category}] ${t.code}: ${t.name} (active: ${t.isActive})`);
  });
  
  await prisma.$disconnect();
}

test();
