#!/usr/bin/env ts-node

/**
 * Verifica se i messaggi ricevuti sono stati salvati nel database
 */

import { prisma } from '../src/config/database';

async function checkSavedMessages() {
  try {
    console.log('\n🔍 VERIFICA MESSAGGI NEL DATABASE');
    console.log('===================================\n');
    
    // Cerca messaggi da Andrea
    const andreaMessages = await prisma.whatsAppMessage.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: '393402647714' } },
          { senderNumber: { contains: '393402647714' } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    if (andreaMessages.length > 0) {
      console.log('✅ MESSAGGI DA ANDREA TROVATI!');
      console.log(`   Totale: ${andreaMessages.length}`);
      
      for (const msg of andreaMessages) {
        console.log(`\n[${new Date(msg.timestamp).toLocaleString()}]`);
        console.log(`   📱 Numero: ${msg.senderNumber || msg.phoneNumber}`);
        console.log(`   💬 Messaggio: ${msg.message}`);
        console.log(`   🔄 Direzione: ${msg.direction}`);
        console.log(`   📌 ID: ${msg.id}`);
      }
    } else {
      console.log('❌ Nessun messaggio da Andrea trovato nel database');
    }
    
    // Ultimi messaggi in generale
    console.log('\n📊 ULTIMI 10 MESSAGGI NEL DATABASE:');
    console.log('=====================================');
    
    const recentMessages = await prisma.whatsAppMessage.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });
    
    if (recentMessages.length === 0) {
      console.log('❌ Database vuoto!');
    } else {
      for (const msg of recentMessages) {
        const time = new Date(msg.timestamp);
        const isRecent = (Date.now() - time.getTime()) < 3600000; // Ultima ora
        
        console.log(`\n${isRecent ? '🆕' : '📧'} [${time.toLocaleString()}]`);
        console.log(`   Da: ${msg.senderNumber || msg.phoneNumber}`);
        console.log(`   Testo: ${msg.message?.substring(0, 100)}`);
        console.log(`   Direzione: ${msg.direction}`);
      }
    }
    
    // Statistiche
    const total = await prisma.whatsAppMessage.count();
    const lastHour = await prisma.whatsAppMessage.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 3600000)
        }
      }
    });
    
    console.log('\n📊 STATISTICHE:');
    console.log(`   Totale messaggi: ${total}`);
    console.log(`   Ultima ora: ${lastHour}`);
    
    // Verifica se il webhook sta processando correttamente
    if (total === 0) {
      console.log('\n❌ PROBLEMA: Il webhook riceve ma non salva!');
      console.log('   Possibili cause:');
      console.log('   1. Errore nel codice di processamento webhook');
      console.log('   2. Campo "fromMe" non gestito correttamente');
      console.log('   3. Errore di parsing del messaggio');
      
      console.log('\n🔧 Controlla i log del backend per errori!');
    } else if (lastHour === 0) {
      console.log('\n⚠️  Nessun messaggio nell\'ultima ora');
      console.log('   Ma ngrok mostra che arrivano!');
      console.log('   Potrebbe essere un problema di timezone o timestamp');
    } else {
      console.log('\n✅ IL SISTEMA FUNZIONA!');
      console.log('   I messaggi arrivano e vengono salvati');
    }
    
    // Test API per dashboard
    console.log('\n🌐 TEST API DASHBOARD:');
    const axios = require('axios');
    try {
      const response = await axios.get('http://localhost:3200/api/whatsapp/messages');
      const apiMessages = response.data?.data?.messages || [];
      console.log(`   API restituisce ${apiMessages.length} messaggi`);
      
      if (apiMessages.length > 0) {
        console.log('   ✅ La dashboard dovrebbe mostrare i messaggi!');
      }
    } catch (error) {
      console.log('   ❌ Errore chiamata API');
    }
    
    console.log('\n📌 VERIFICA DASHBOARD:');
    console.log('   1. Vai su: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('   2. Dovresti vedere i messaggi');
    console.log('   3. Se non li vedi, ricarica con F5');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui
checkSavedMessages().catch(console.error);
