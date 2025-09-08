
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    // Prendiamo tutte le categorie uniche dai template
    const templates = await prisma.notificationTemplate.findMany({
      select: { category: true }
    });
    
    const categories = [...new Set(templates.map(t => t.category))];
    
    console.log('
=================================');
    console.log('CATEGORIE NEI TEMPLATE:');
    console.log('=================================');
    categories.forEach(cat => {
      console.log('  - ' + cat);
    });
    
    // Contiamo per categoria
    console.log('
=================================');
    console.log('CONTEGGIO PER CATEGORIA:');
    console.log('=================================');
    
    for (const cat of categories) {
      const count = await prisma.notificationTemplate.count({
        where: { category: cat }
      });
      console.log(`  ${cat}: ${count} template`);
    }
    
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
