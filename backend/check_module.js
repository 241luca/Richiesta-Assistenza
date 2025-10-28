const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModule() {
  try {
    const module = await prisma.systemModule.findUnique({
      where: { code: 'custom-forms' },
      select: { code: true, name: true, isEnabled: true }
    });
    
    if (module) {
      console.log('Modulo trovato:', JSON.stringify(module, null, 2));
    } else {
      console.log('Modulo custom-forms NON trovato nel database');
    }
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkModule();
