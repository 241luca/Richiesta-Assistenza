// Script per verificare il ripristino del database
// check-database-restore.ts

import { prisma } from './src/config/database';

async function checkRestore() {
  try {
    console.log('🔍 Verifica ripristino database...\n');
    
    // Conta record in tabelle principali
    const users = await prisma.user.count();
    const requests = await prisma.assistanceRequest.count();
    const categories = await prisma.category.count();
    const quotes = await prisma.quote.count();
    const notifications = await prisma.notification.count();
    
    console.log('📊 CONTEGGIO RECORD:');
    console.log(`- Utenti: ${users}`);
    console.log(`- Richieste: ${requests}`);
    console.log(`- Categorie: ${categories}`);
    console.log(`- Preventivi: ${quotes}`);
    console.log(`- Notifiche: ${notifications}`);
    
    if (users > 0) {
      console.log('\n✅ DATABASE RIPRISTINATO CON SUCCESSO!');
    } else {
      console.log('\n⚠️ Il database sembra ancora vuoto');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRestore();
