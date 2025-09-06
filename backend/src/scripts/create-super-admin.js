// Script per creare un utente SUPER_ADMIN di test

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Hash della password usando argon2
    const hashedPassword = await argon2.hash('admin123');
    
    // Crea o aggiorna l'utente SUPER_ADMIN
    const user = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        role: 'SUPER_ADMIN',
        password: hashedPassword
      },
      create: {
        email: 'admin@test.com',
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '1234567890',
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true
      }
    });
    
    console.log('\n✅ SUPER ADMIN CREATO CON SUCCESSO!');
    console.log('=====================================');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Ruolo: SUPER_ADMIN');
    console.log('=====================================\n');
    console.log('Usa queste credenziali per accedere!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
