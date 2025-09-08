const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.notificationTemplate.count();
    console.log('
=================================');
    console.log('TEMPLATE NEL DATABASE:', count);
    console.log('=================================');
    
    if (count === 0) {
      console.log('
❌ NESSUN TEMPLATE TROVATO!');
      console.log('Esegui questo comando per caricarli:');
      console.log('npx ts-node src/scripts/seed-all-notification-templates.ts');
    } else {
      const templates = await prisma.notificationTemplate.findMany({ 
        take: 5,
        orderBy: { category: 'asc' }
      });
      console.log('
✅ Ecco i primi 5 template:');
      templates.forEach(t => {
        console.log(`   - [${t.category}] ${t.code}: ${t.name}`);
      });
    }
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
