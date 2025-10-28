const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'test@test.com',
        username: 'test',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        updatedAt: new Date()
      }
    });
    
    console.log('Utente test creato:', user.email);
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
