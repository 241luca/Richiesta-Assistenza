#!/usr/bin/env ts-node

/**
 * Controllo DIRETTO database senza passare da API
 */

import { prisma } from '../src/config/database';

async function checkDirect() {
  try {
    console.log('\n🔍 CONTROLLO DIRETTO DATABASE');
    console.log('================================\n');
    
    // Conta messaggi
    const total = await prisma.whatsAppMessage.count();
    console.log(`📊 Totale messaggi nel database: ${total}`);
    
    if (total === 0) {
      console.log('\n❌ DATABASE VUOTO!');
      console.log('   I webhook arrivano ma non vengono salvati.');
      console.log('\n📌 Dopo le correzioni fatte:');
      console.log('   1. HAI RIAVVIATO il backend?');
      console.log('   2. HAI INVIATO un nuovo messaggio WhatsApp?');
      
    } else {
      // Mostra tutti i messaggi
      const messages = await prisma.whatsAppMessage.findMany({
        orderBy: { timestamp: 'desc' }
      });
      
      console.log(`\n✅ TROVATI ${messages.length} MESSAGGI:\n`);
      
      for (const msg of messages) {
        const time = new Date(msg.timestamp);
        const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
        
        console.log(`📱 [${time.toLocaleString()}] - ${minutesAgo} minuti fa`);
        console.log(`   Numero: ${msg.phoneNumber}`);
        console.log(`   Testo: ${msg.message}`);
        console.log(`   Direzione: ${msg.direction}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   ID: ${msg.id}`);
        console.log('   ---');
      }
      
      // Verifica se ci sono messaggi recenti (ultimi 10 minuti)
      const recentCount = messages.filter(m => {
        const age = Date.now() - new Date(m.timestamp).getTime();
        return age < 600000; // 10 minuti
      }).length;
      
      if (recentCount > 0) {
        console.log(`\n🆕 ${recentCount} messaggi negli ultimi 10 minuti!`);
        console.log('✅ Il sistema sta ricevendo e salvando messaggi!');
      } else {
        console.log('\n⚠️  Nessun messaggio recente.');
        console.log('   I messaggi nel DB sono vecchi.');
        console.log('   Invia un nuovo messaggio per testare.');
      }
    }
    
    // Info su ultimo messaggio ricevuto
    const lastMessage = await prisma.whatsAppMessage.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    if (lastMessage) {
      const age = Date.now() - new Date(lastMessage.timestamp).getTime();
      const ageMinutes = Math.floor(age / 60000);
      const ageHours = Math.floor(ageMinutes / 60);
      
      console.log('\n📅 ULTIMO MESSAGGIO:');
      console.log(`   Ricevuto: ${ageHours > 0 ? ageHours + ' ore fa' : ageMinutes + ' minuti fa'}`);
      console.log(`   Da: ${lastMessage.phoneNumber}`);
    }
    
    console.log('\n🌐 DASHBOARD:');
    console.log('   URL: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('   Se i messaggi sono nel DB dovrebbero apparire lì!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

checkDirect().catch(console.error);
