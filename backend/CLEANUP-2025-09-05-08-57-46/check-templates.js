
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.notificationTemplate.count();
  console.log('Template nel database:', count);
  
  if (count > 0) {
    const templates = await prisma.notificationTemplate.findMany({ take: 3 });
    console.log('
Primi 3 template:');
    templates.forEach(t => console.log(`- ${t.code}: ${t.name}`));
  }
  
  await prisma.$disconnect();
}

check();
