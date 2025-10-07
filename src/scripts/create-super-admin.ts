// Script per creare un utente SUPER_ADMIN di test
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Hash della password con argon2
    const hashedPassword = await argon2.hash('admin123');
    
    // Prima verifica se l'utente esiste
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });
    
    if (existingUser) {
      // Aggiorna l'utente esistente
      const user = await prisma.user.update({
        where: { email: 'admin@test.com' },
        data: {
          role: 'SUPER_ADMIN',
          password: hashedPassword,
          emailVerified: true,
          updatedAt: new Date()
        }
      });
      
      console.log('\n✅ UTENTE ESISTENTE AGGIORNATO A SUPER ADMIN!');
    } else {
      // Crea nuovo utente con solo i campi che esistono nello schema
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'admin@test.com',
          username: 'superadmin',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          fullName: 'Super Admin',
          phone: '1234567890',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('\n✅ SUPER ADMIN CREATO CON SUCCESSO!');
    }
    
    console.log('=====================================');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('=====================================');
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
