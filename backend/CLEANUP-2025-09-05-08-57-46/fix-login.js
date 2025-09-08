const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixLoginAccounts() {
  console.log('🔧 FIX LOGIN - SISTEMA RICHIESTA ASSISTENZA\n');
  console.log('=====================================\n');
  
  try {
    // 1. SBLOCCA TUTTI GLI ACCOUNT
    console.log('1️⃣ Sblocco tutti gli account...');
    
    const updateResult = await prisma.user.updateMany({
      data: {
        status: 'active',  // Usa status invece di isActive
        emailVerifiedAt: new Date(),  // Usa emailVerifiedAt con una data
        loginAttempts: 0,  // Resetta i tentativi di login
        lockedUntil: null  // Rimuovi eventuali blocchi
      }
    });
    
    console.log(`✅ ${updateResult.count} account sbloccati\n`);
    
    // 2. VERIFICA/CREA UTENTI PRINCIPALI
    console.log('2️⃣ Verifico/Creo utenti principali...\n');
    
    const users = [
      {
        email: 'admin@assistenza.it',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'STAFF',
        phone: '0000000000'
      },
      {
        email: 'luigi.bianchi@email.com',
        password: 'password123',
        firstName: 'Luigi',
        lastName: 'Bianchi',
        role: 'CLIENT',
        phone: '1111111111'
      },
      {
        email: 'mario.rossi@elettricisti.it',
        password: 'password123',
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'PROFESSIONAL',
        phone: '2222222222'
      },
      {
        email: 'staff@assistenza.it',
        password: 'password123',
        firstName: 'Staff',
        lastName: 'Assistenza',
        role: 'STAFF',
        phone: '3333333333'
      }
    ];
    
    for (const userData of users) {
      console.log(`Controllo utente: ${userData.email}`);
      
      // Cerca l'utente
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (user) {
        // Aggiorna la password e sblocca l'account
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        user = await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            status: 'active',
            emailVerifiedAt: new Date(),
            loginAttempts: 0,
            lockedUntil: null
          }
        });
        console.log(`✅ Password aggiornata e account sbloccato per: ${userData.email}`);
      } else {
        // Crea l'utente
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Per il sistema di richiesta assistenza
        user = await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.email.split('@')[0],
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            phone: userData.phone,
            address: 'Via Demo 1',
            city: 'Roma',
            province: 'RM',
            postalCode: '00100',
            country: 'IT',
            status: 'active',
            emailVerifiedAt: new Date(),
            loginAttempts: 0
          }
        });
        console.log(`✅ Utente creato: ${userData.email}`);
      }
    }
    
    // 3. PULISCI SESSIONI
    console.log('\n3️⃣ Pulizia sessioni...');
    try {
      // Nel sistema richiesta assistenza la tabella si chiama Session con la S maiuscola
      await prisma.$executeRaw`DELETE FROM "Session" WHERE 1=1`;
      console.log('✅ Sessioni cancellate');
    } catch (e) {
      console.log('ℹ️ Nessuna sessione da cancellare o tabella non esistente');
    }
    
    // 4. MOSTRA CREDENZIALI
    console.log('\n=====================================');
    console.log('📋 CREDENZIALI DI ACCESSO FUNZIONANTI');
    console.log('=====================================\n');
    
    console.log('🔴 SUPER ADMIN (STAFF):');
    console.log('   Email: admin@assistenza.it');
    console.log('   Password: password123\n');
    
    console.log('🟢 CLIENTE:');
    console.log('   Email: luigi.bianchi@email.com');
    console.log('   Password: password123\n');
    
    console.log('🔧 PROFESSIONISTA:');
    console.log('   Email: mario.rossi@elettricisti.it');
    console.log('   Password: password123\n');
    
    console.log('⚙️ STAFF:');
    console.log('   Email: staff@assistenza.it');
    console.log('   Password: password123\n');
    
    console.log('=====================================');
    console.log('✅ TUTTI GLI ACCOUNT SONO STATI SBLOCCATI!');
    console.log('');
    console.log('Il campo loginAttempts è stato azzerato e');
    console.log('il campo lockedUntil è stato rimosso.');
    console.log('');
    console.log('Ora puoi fare login con le credenziali sopra.');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    console.error('\nDettaglio errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
fixLoginAccounts();
