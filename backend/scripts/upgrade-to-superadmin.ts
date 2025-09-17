// Script per aggiornare admin a SUPER_ADMIN
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeTpSuperAdmin() {
  try {
    console.log('Aggiornamento utente admin a SUPER_ADMIN...');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@assistenza.it' },
      data: { 
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('✅ Utente aggiornato con successo!');
    console.log('- Email:', updatedUser.email);
    console.log('- Nome:', updatedUser.fullName);
    console.log('- Ruolo:', updatedUser.role);
    console.log('\nOra hai accesso completo a tutti i menu!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeTpSuperAdmin();
