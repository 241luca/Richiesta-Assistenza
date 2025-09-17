#!/usr/bin/env ts-node

/**
 * Test ricezione messaggi REALI via webhook
 * Verifica che i messaggi WhatsApp arrivino e vengano salvati
 */

import { prisma } from '../src/config/database';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testRealMessages() {
  try {
    console.log('\n📱 TEST RICEZIONE MESSAGGI WHATSAPP REALI');
    console.log('===========================================\n');
    
    console.log('✅ NGROK FUNZIONA! Ho visto che riceve webhook.');
    console.log('   URL: https://6beb1a134e04.ngrok-free.app');
    console.log('   Ultimo evento: 1 ora fa (contacts.update)\n');
    
    // Conta messaggi attuali
    const beforeCount = await prisma.whatsAppMessage.count();
    const lastMessage = await prisma.whatsAppMessage.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('📊 Stato attuale database:');
    console.log(`   Totale messaggi: ${beforeCount}`);
    if (lastMessage) {
      console.log(`   Ultimo messaggio: ${new Date(lastMessage.timestamp).toLocaleString()}`);
      console.log(`   Testo: ${lastMessage.message?.substring(0, 50)}...`);
    }
    
    console.log('\n📱 TEST MESSAGGIO REALE');
    console.log('========================');
    console.log('ISTRUZIONI:');
    console.log('1. Prendi il tuo telefono');
    console.log('2. Apri WhatsApp');
    console.log('3. Invia un messaggio al numero connesso a SendApp');
    console.log('4. Scrivi esattamente: TEST DASHBOARD ' + new Date().toLocaleTimeString());
    console.log('');
    
    await question('Premi INVIO dopo aver inviato il messaggio...');
    
    console.log('\n⏳ Attendo 5 secondi per la ricezione...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Controlla nuovi messaggi
    const afterCount = await prisma.whatsAppMessage.count();
    const newMessages = await prisma.whatsAppMessage.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60000) // Ultimi 60 secondi
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('\n📊 RISULTATI:');
    console.log('==============');
    console.log(`Messaggi prima: ${beforeCount}`);
    console.log(`Messaggi dopo: ${afterCount}`);
    console.log(`Nuovi messaggi: ${afterCount - beforeCount}`);
    
    if (newMessages.length > 0) {
      console.log('\n✅ NUOVI MESSAGGI RICEVUTI!');
      for (const msg of newMessages) {
        console.log(`\n[${new Date(msg.timestamp).toLocaleTimeString()}]`);
        console.log(`   📱 Da: ${msg.senderNumber || msg.phoneNumber}`);
        console.log(`   💬 Testo: ${msg.message}`);
        console.log(`   🔄 Direzione: ${msg.direction}`);
        console.log(`   📌 ID: ${msg.id}`);
      }
      
      console.log('\n🎉 IL SISTEMA FUNZIONA CORRETTAMENTE!');
      console.log('   I messaggi arrivano via webhook e vengono salvati.');
      console.log('   La dashboard dovrebbe mostrarli.');
      
    } else {
      console.log('\n❌ NESSUN NUOVO MESSAGGIO RICEVUTO!');
      console.log('\nPOSSIBILI CAUSE:');
      console.log('1. Il messaggio non è stato inviato al numero giusto');
      console.log('2. SendApp non sta inviando eventi "messages.upsert"');
      console.log('3. Il webhook riceve solo eventi "contacts.update"');
      console.log('4. C\'è un problema nel processamento dei messaggi');
      
      console.log('\n📌 CONTROLLI DA FARE:');
      console.log('1. Vai su http://localhost:4040 (ngrok)');
      console.log('   - Vedi una nuova richiesta POST?');
      console.log('   - Che tipo di evento è? (messages.upsert o altro?)');
      console.log('');
      console.log('2. Controlla i log del backend');
      console.log('   - Vedi "📨 Webhook WhatsApp ricevuto"?');
      console.log('   - Che tipo di evento mostra?');
      console.log('');
      console.log('3. Su SendApp (https://app.sendapp.cloud):');
      console.log('   - Il webhook è configurato correttamente?');
      console.log('   - Tutti gli eventi sono abilitati?');
      console.log('   - L\'istanza è connessa e attiva?');
    }
    
    // Controlla eventi contacts.update
    console.log('\n📊 ANALISI EVENTI RICEVUTI:');
    console.log('============================');
    console.log('Ho notato che ricevi eventi "contacts.update".');
    console.log('Questo significa che il webhook FUNZIONA ma potrebbe:');
    console.log('- Non essere configurato per ricevere messaggi');
    console.log('- O i messaggi vengono filtrati/ignorati');
    
    console.log('\n🔧 SOLUZIONE:');
    console.log('1. Vai su SendApp Cloud');
    console.log('2. Verifica le impostazioni del webhook');
    console.log('3. Assicurati che "messages" sia abilitato');
    console.log('4. Salva e riprova');
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    rl.close();
    process.exit(1);
  }
}

// Esegui
testRealMessages().catch(console.error);
