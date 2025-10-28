const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Prova a contare i custom forms
    const count = await prisma.customForm.count();
    console.log('Numero di custom forms nel database:', count);
    
    // Prova a recuperare i primi 3 custom forms
    const forms = await prisma.customForm.findMany({
      take: 3,
      select: { id: true, name: true, isEnabled: true, isPublished: true }
    });
    console.log('Primi 3 custom forms:', JSON.stringify(forms, null, 2));
    
  } catch (error) {
    console.error('Errore nel controllo tabelle:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
