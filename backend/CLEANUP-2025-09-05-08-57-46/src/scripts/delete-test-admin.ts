// Script per eliminare l'utente admin@test.com creato per errore
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestAdmin() {
  try {
    // Elimina l'utente admin@test.com se esiste
    const deleted = await prisma.user.deleteMany({
      where: { email: 'admin@test.com' }
    });
    
    if (deleted.count > 0) {
      console.log('✅ Utente admin@test.com eliminato con successo');
    } else {
      console.log('ℹ️ Utente admin@test.com non trovato');
    }
    
    // Mostra gli utenti SUPER_ADMIN esistenti
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n📋 SUPER_ADMIN esistenti nel sistema:');
    console.log('=====================================');
    superAdmins.forEach(admin => {
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Nome: ${admin.firstName} ${admin.lastName}`);
      console.log('-------------------------------------');
    });
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestAdmin();
