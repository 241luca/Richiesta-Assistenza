// Script per verificare e resettare l'utente admin
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function checkAndResetAdmin() {
  try {
    console.log('Cercando utente admin...');
    
    // Cerca l'utente admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@assistenza.it' }
    });

    if (!adminUser) {
      console.log('Utente admin non trovato! Creazione in corso...');
      
      // Crea l'utente admin con solo i campi essenziali
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userId = randomBytes(12).toString('hex');
      const now = new Date();
      
      const newAdmin = await prisma.user.create({
        data: {
          id: userId,
          username: 'admin_assistenza',
          email: 'admin@assistenza.it',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Sistema',
          fullName: 'Amministratore Sistema',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          // Campi opzionali con valori di default
          country: 'IT',
          currency: 'EUR',
          privacyAccepted: true,
          termsAccepted: true,
          marketingAccepted: false,
          twoFactorEnabled: false,
          loginAttempts: 0,
          canSelfAssign: false,
          isWhatsAppUser: false
        }
      });
      
      console.log('✅ Utente admin creato con successo!');
      console.log('Email: admin@assistenza.it');
      console.log('Password: password123');
    } else {
      console.log('Utente admin trovato. Reset password in corso...');
      
      // Resetta la password
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          password: hashedPassword,
          status: 'ACTIVE',
          loginAttempts: 0,
          lockedUntil: null
        }
      });
      
      console.log('✅ Password resettata con successo!');
      console.log('Email: admin@assistenza.it');
      console.log('Password: password123');
      console.log('Account sbloccato e attivo');
    }
    
    // Mostra info utente
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'admin@assistenza.it' }
    });
    
    console.log('\n📊 Stato utente:');
    console.log('- ID:', updatedUser?.id);
    console.log('- Email:', updatedUser?.email);
    console.log('- Nome:', updatedUser?.fullName);
    console.log('- Ruolo:', updatedUser?.role);
    console.log('- Status:', updatedUser?.status);
    console.log('- Tentativi login:', updatedUser?.loginAttempts);
    console.log('- Bloccato fino a:', updatedUser?.lockedUntil || 'Non bloccato');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndResetAdmin();
