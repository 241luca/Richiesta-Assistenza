const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        role: true
      }
    });
    console.log('Utenti nel database:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
