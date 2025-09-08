import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRealDatabase() {
  console.log('\n============================================');
  console.log('   VERIFICA UTENTI REALI NEL DATABASE');
  console.log('============================================\n');
  
  try {
    // Recupera TUTTI gli utenti dal database con solo i campi esistenti
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        phone: true,
        city: true,
        province: true,
        profession: true,
        address: true,
        postalCode: true,
        codiceFiscale: true,
        partitaIva: true,
        ragioneSociale: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    if (users.length === 0) {
      console.log('⚠️  NESSUN UTENTE NEL DATABASE!\n');
      console.log('Il database è vuoto. Esegui: cd backend && npx prisma db seed');
    } else {
      console.log(`📊 TROVATI ${users.length} UTENTI NEL DATABASE:\n`);
      
      // Crea una tabella formattata
      console.log('┌────┬──────────────────────────────┬─────────────┬──────────────────────┬─────────────────┬───────────┐');
      console.log('│ #  │ Email                        │ Ruolo       │ Nome Completo        │ Telefono        │ Verificato│');
      console.log('├────┼──────────────────────────────┼─────────────┼──────────────────────┼─────────────────┼───────────┤');
      
      users.forEach((user, index) => {
        const email = user.email.padEnd(28).substring(0, 28);
        const role = (user.role || 'N/A').padEnd(11).substring(0, 11);
        const name = (user.fullName || `${user.firstName} ${user.lastName}`).padEnd(20).substring(0, 20);
        const phone = (user.phone || 'N/A').padEnd(15).substring(0, 15);
        const verified = user.emailVerified ? '✅' : '❌';
        
        console.log(`│ ${(index + 1).toString().padEnd(2)} │ ${email} │ ${role} │ ${name} │ ${phone} │     ${verified}     │`);
      });
      
      console.log('└────┴──────────────────────────────┴─────────────┴──────────────────────┴─────────────────┴───────────┘');
      
      // Dettagli completi
      console.log('\n📋 DETTAGLI COMPLETI:');
      console.log('═══════════════════════════════════════════════════════════════');
      
      users.forEach((user, index) => {
        console.log(`\n👤 UTENTE #${index + 1}`);
        console.log('───────────────────────────────────────────────────────────────');
        console.log(`  📧 Email: ${user.email}`);
        console.log(`  👤 Username: ${user.username || 'Non impostato'}`);
        console.log(`  📝 Nome: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
        console.log(`  📋 Nome Completo: ${user.fullName || 'N/A'}`);
        console.log(`  🔑 Ruolo: ${user.role}`);
        console.log(`  📱 Telefono: ${user.phone || 'Non impostato'}`);
        console.log(`  🏠 Indirizzo: ${user.address || 'Non impostato'}`);
        console.log(`  🏙️ Città: ${user.city || 'N/A'} (${user.province || 'N/A'}) - CAP: ${user.postalCode || 'N/A'}`);
        console.log(`  💼 Professione: ${user.profession || 'Non specificata'}`);
        console.log(`  🆔 Codice Fiscale: ${user.codiceFiscale || 'Non impostato'}`);
        console.log(`  🏢 P.IVA: ${user.partitaIva || 'Non impostato'}`);
        console.log(`  🏢 Ragione Sociale: ${user.ragioneSociale || 'Non impostato'}`);
        console.log(`  ✉️ Email Verificata: ${user.emailVerified ? '✅ Sì' : '❌ No'}`);
        console.log(`  📅 Creato: ${user.createdAt.toLocaleString('it-IT')}`);
        console.log(`  🕐 Ultimo Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString('it-IT') : 'Mai effettuato'}`);
      });
      
      console.log('\n═══════════════════════════════════════════════════════════════');
    }
    
    // Conta per ruolo
    console.log('\n📈 RIEPILOGO PER RUOLO:');
    console.log('───────────────────────────────────────────────────────────────');
    const roleCounts = await Promise.all([
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
      prisma.user.count({ where: { role: 'CLIENT' } })
    ]);
    
    console.log(`  🔴 SUPER_ADMIN:  ${roleCounts[0]}`);
    console.log(`  🟡 ADMIN:        ${roleCounts[1]}`);
    console.log(`  🟢 PROFESSIONAL: ${roleCounts[2]}`);
    console.log(`  🔵 CLIENT:       ${roleCounts[3]}`);
    console.log(`  ─────────────────`);
    console.log(`  📊 TOTALE:       ${roleCounts.reduce((a, b) => a + b, 0)}`);
    
    // Verifica corrispondenza con LoginPage
    console.log('\n🔍 VERIFICA CORRISPONDENZA CON LOGIN PAGE:');
    console.log('───────────────────────────────────────────────────────────────');
    
    const loginPageUsers = [
      { email: 'admin@assistenza.it', expectedRole: 'SUPER_ADMIN', name: 'Super Admin' },
      { email: 'luigi.bianchi@gmail.com', expectedRole: 'CLIENT', name: 'Luigi Bianchi' },
      { email: 'mario.rossi@assistenza.it', expectedRole: 'PROFESSIONAL', name: 'Mario Rossi' },
      { email: 'staff@assistenza.it', expectedRole: 'ADMIN', name: 'Staff Assistenza' }
    ];
    
    for (const loginUser of loginPageUsers) {
      const dbUser = users.find(u => u.email === loginUser.email);
      if (dbUser) {
        console.log(`  ✅ ${loginUser.email} - TROVATO (Ruolo: ${dbUser.role})`);
      } else {
        console.log(`  ❌ ${loginUser.email} - NON TROVATO nel database`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Errore durante la lettura del database:', error.message);
    console.log('\n💡 Suggerimenti:');
    console.log('  1. Verifica che il database sia configurato');
    console.log('  2. Esegui: cd backend && npx prisma migrate dev');
    console.log('  3. Esegui: cd backend && npx prisma db seed');
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la verifica
checkRealDatabase();
