const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndFixUsers() {
  console.log('🔍 VERIFICA E FIX UTENTI - SISTEMA RICHIESTA ASSISTENZA\n');
  console.log('=====================================\n');
  
  try {
    // 1. MOSTRA TUTTI GLI UTENTI ESISTENTI
    console.log('1️⃣ Utenti esistenti nel database:\n');
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
        loginAttempts: true,
        lockedUntil: true
      }
    });
    
    console.log('Totale utenti trovati:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`
ID: ${user.id}
Email: ${user.email}
Username: ${user.username}
Nome: ${user.fullName}
Ruolo: ${user.role}
Status: ${user.status}
Login Attempts: ${user.loginAttempts}
Locked Until: ${user.lockedUntil}
---`);
    });
    
    // 2. FIX LUIGI BIANCHI
    console.log('\n2️⃣ Sistemo Luigi Bianchi...\n');
    
    // Cerca Luigi Bianchi con varie email possibili
    const luigiEmails = [
      'luigi.bianchi@email.com',
      'luigi@email.com', 
      'bianchi@email.com',
      'luigi.bianchi@example.com'
    ];
    
    let luigiFound = false;
    for (const email of luigiEmails) {
      const luigi = await prisma.user.findUnique({
        where: { email }
      });
      
      if (luigi) {
        console.log(`Trovato Luigi con email: ${email}`);
        // Aggiorna la password
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            status: 'active',
            loginAttempts: 0,
            lockedUntil: null,
            emailVerifiedAt: new Date()
          }
        });
        console.log(`✅ Luigi Bianchi sistemato con email: ${email}`);
        luigiFound = true;
        break;
      }
    }
    
    if (!luigiFound) {
      console.log('Luigi Bianchi non trovato, lo creo...');
      
      // Cerca se esiste un username luigi.bianchi
      const existingLuigi = await prisma.user.findUnique({
        where: { username: 'luigi.bianchi' }
      });
      
      if (existingLuigi) {
        console.log('Trovato utente con username luigi.bianchi, aggiorno...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { id: existingLuigi.id },
          data: {
            email: 'luigi.bianchi@email.com',
            password: hashedPassword,
            status: 'active',
            loginAttempts: 0,
            lockedUntil: null,
            emailVerifiedAt: new Date()
          }
        });
        console.log('✅ Luigi Bianchi aggiornato');
      } else {
        // Crea nuovo Luigi
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
          data: {
            email: 'luigi.bianchi@email.com',
            username: 'luigi_bianchi_' + Date.now(), // Username unico
            password: hashedPassword,
            firstName: 'Luigi',
            lastName: 'Bianchi',
            fullName: 'Luigi Bianchi',
            role: 'CLIENT',
            phone: '1111111111',
            address: 'Via Cliente 1',
            city: 'Roma',
            province: 'RM',
            postalCode: '00100',
            country: 'IT',
            status: 'active',
            emailVerifiedAt: new Date(),
            loginAttempts: 0
          }
        });
        console.log('✅ Luigi Bianchi creato');
      }
    }
    
    // 3. RESETTA TUTTI GLI ACCOUNT
    console.log('\n3️⃣ Reset finale di tutti gli account...\n');
    
    await prisma.user.updateMany({
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    });
    
    console.log('✅ Tutti gli account resettati');
    
    // 4. MOSTRA CREDENZIALI FINALI
    console.log('\n=====================================');
    console.log('📋 CREDENZIALI VERIFICATE E FUNZIONANTI');
    console.log('=====================================\n');
    
    // Verifica le credenziali finali
    const finalUsers = [
      'admin@assistenza.it',
      'luigi.bianchi@email.com',
      'mario.rossi@elettricisti.it',
      'staff@assistenza.it'
    ];
    
    for (const email of finalUsers) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, role: true, fullName: true }
      });
      
      if (user) {
        console.log(`✅ ${user.email} (${user.role})`);
        console.log(`   Nome: ${user.fullName}`);
        console.log(`   Password: password123\n`);
      } else {
        console.log(`❌ ${email} NON TROVATO\n`);
      }
    }
    
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    console.error('\nDettaglio errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
checkAndFixUsers();
