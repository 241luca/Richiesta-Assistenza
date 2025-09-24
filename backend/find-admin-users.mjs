/**
 * Script per trovare gli utenti admin nel database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdminUsers() {
  console.log('🔍 RICERCA UTENTI ADMIN NEL DATABASE\n');
  console.log('=' .repeat(50));
  
  try {
    // Cerca tutti gli utenti admin
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (admins.length > 0) {
      console.log(`\n✅ Trovati ${admins.length} utenti admin:\n`);
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.fullName || 'Nome non impostato'}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Ruolo: ${admin.role}`);
        console.log(`   Attivo: ${admin.isActive ? 'Sì' : 'No'}`);
        console.log(`   Creato: ${admin.createdAt.toLocaleDateString()}\n`);
      });
      
      console.log('📝 NOTA: Le password sono criptate, non posso mostrarle.');
      console.log('    Se non ricordi la password, possiamo resettarla.\n');
      
    } else {
      console.log('\n⚠️ Nessun utente admin trovato nel database!');
      console.log('   Dobbiamo creare un nuovo admin.\n');
    }
    
    // Conta tutti gli utenti
    const totalUsers = await prisma.user.count();
    console.log(`📊 Totale utenti nel sistema: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('\n🆕 Il database è vuoto. Creiamo un utente admin di default.');
    }
    
  } catch (error) {
    console.error('❌ Errore accesso database:', error.message);
    console.log('\nAssicurati che:');
    console.log('1. Il database PostgreSQL sia attivo');
    console.log('2. Il backend sia nella cartella corretta');
    console.log('3. Le variabili DATABASE_URL siano corrette');
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Esegui
findAdminUsers();
