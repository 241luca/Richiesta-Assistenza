#!/usr/bin/env ts-node

/**
 * Verifica se i messaggi ricevuti sono stati salvati nel database
 * Versione corretta con i campi giusti
 */

import { prisma } from '../src/config/database';

async function checkSavedMessages() {
  try {
    console.log('\n🔍 VERIFICA MESSAGGI NEL DATABASE');
    console.log('===================================\n');
    
    // Cerca messaggi da Andrea usando solo phoneNumber
    const andreaMessages = await prisma.whatsAppMessage.findMany({
      where: {
        phoneNumber: {
          contains: '393402647714'
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    if (andreaMessages.length > 0) {
      console.log('✅ MESSAGGI DA ANDREA TROVATI!');
      console.log(`   Totale: ${andreaMessages.length}`);
      
      for (const msg of andreaMessages) {
        console.log(`\n[${new Date(msg.timestamp).toLocaleString()}]`);
        console.log(`   📱 Numero: ${msg.phoneNumber}`);
        console.log(`   💬 Messaggio: ${msg.message}`);
        console.log(`   🔄 Direzione: ${msg.direction}`);
        console.log(`   📌 ID: ${msg.id}`);
        console.log(`   📊 Status: ${msg.status || 'N/A'}`);
      }
    } else {
      console.log('❌ Nessun messaggio da Andrea (393402647714) trovato nel database');
    }
    
    // Ultimi messaggi in generale
    console.log('\n📊 ULTIMI 10 MESSAGGI NEL DATABASE:');
    console.log('=====================================');
    
    const recentMessages = await prisma.whatsAppMessage.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });
    
    if (recentMessages.length === 0) {
      console.log('❌ DATABASE COMPLETAMENTE VUOTO!');
      console.log('   Il webhook riceve i messaggi ma non li sta salvando.');
      console.log('\n🔍 POSSIBILI CAUSE:');
      console.log('   1. Il webhook sta filtrando i messaggi con fromMe=false');
      console.log('   2. C\'è un errore nel codice di salvataggio');
      console.log('   3. Il database ha problemi di scrittura');
      
    } else {
      console.log(`Trovati ${recentMessages.length} messaggi totali:\n`);
      
      for (const msg of recentMessages) {
        const time = new Date(msg.timestamp);
        const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
        const isRecent = minutesAgo < 60;
        
        console.log(`${isRecent ? '🆕' : '📧'} [${time.toLocaleString()}] (${minutesAgo} minuti fa)`);
        console.log(`   📱 Numero: ${msg.phoneNumber}`);
        console.log(`   💬 Testo: ${msg.message?.substring(0, 100)}`);
        console.log(`   🔄 Direzione: ${msg.direction}`);
        console.log(`   📊 Status: ${msg.status || 'N/A'}`);
        console.log('   ---');
      }
    }
    
    // Statistiche dettagliate
    console.log('\n📊 STATISTICHE DETTAGLIATE:');
    console.log('============================');
    
    const total = await prisma.whatsAppMessage.count();
    const incoming = await prisma.whatsAppMessage.count({
      where: { direction: 'incoming' }
    });
    const inbound = await prisma.whatsAppMessage.count({
      where: { direction: 'inbound' }
    });
    const outgoing = await prisma.whatsAppMessage.count({
      where: { direction: 'outgoing' }
    });
    const outbound = await prisma.whatsAppMessage.count({
      where: { direction: 'outbound' }
    });
    
    const lastHour = await prisma.whatsAppMessage.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 3600000)
        }
      }
    });
    
    const last24Hours = await prisma.whatsAppMessage.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 86400000)
        }
      }
    });
    
    console.log(`📱 Totale messaggi: ${total}`);
    console.log(`   - Incoming: ${incoming}`);
    console.log(`   - Inbound: ${inbound}`);
    console.log(`   - Outgoing: ${outgoing}`);
    console.log(`   - Outbound: ${outbound}`);
    console.log(`   - Ultima ora: ${lastHour}`);
    console.log(`   - Ultime 24 ore: ${last24Hours}`);
    
    // Verifica problemi
    if (total === 0) {
      console.log('\n❌ PROBLEMA CRITICO: NESSUN MESSAGGIO NEL DATABASE!');
      console.log('\n🔧 SOLUZIONE:');
      console.log('1. Controlla i log del backend per errori');
      console.log('2. Verifica il file: backend/src/routes/whatsapp-webhook.routes.ts');
      console.log('3. Cerca errori quando processa i messaggi');
      console.log('4. Il messaggio potrebbe essere scartato dal filtro fromMe');
      
    } else if (lastHour === 0 && last24Hours === 0) {
      console.log('\n⚠️  Nessun messaggio recente (ultime 24 ore)');
      console.log('   Ma ngrok mostra che arrivano!');
      console.log('   I messaggi vecchi potrebbero essere di test');
      
    } else if (lastHour > 0) {
      console.log('\n✅ SISTEMA FUNZIONANTE!');
      console.log(`   Ricevuti ${lastHour} messaggi nell'ultima ora`);
    }
    
    // Test API per dashboard
    console.log('\n🌐 TEST API DASHBOARD:');
    console.log('=======================');
    
    const axios = require('axios');
    try {
      const response = await axios.get('http://localhost:3200/api/whatsapp/messages', {
        params: { limit: 20 }
      });
      
      const data = response.data;
      const messages = data?.data?.messages || data?.messages || [];
      
      console.log(`✅ API funzionante`);
      console.log(`   Messaggi restituiti: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('\n   Primi 3 messaggi dall\'API:');
        messages.slice(0, 3).forEach((msg: any, i: number) => {
          console.log(`   ${i+1}. ${msg.phoneNumber}: ${msg.message?.substring(0, 50)}...`);
        });
        console.log('\n   ✅ La dashboard dovrebbe mostrare questi messaggi!');
      } else if (total > 0) {
        console.log('   ⚠️  Database ha messaggi ma API non li restituisce');
        console.log('   Potrebbe essere un problema di permessi o formato');
      }
      
    } catch (error: any) {
      console.log('   ❌ Errore chiamata API:', error.message);
      console.log('   Il backend potrebbe non essere attivo');
    }
    
    // Istruzioni finali
    console.log('\n📌 VERIFICA FINALE:');
    console.log('===================');
    console.log('1. Vai su: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('2. Se i messaggi NON appaiono ma l\'API funziona:');
    console.log('   - Ricarica la pagina (F5)');
    console.log('   - Controlla la console del browser (F12)');
    console.log('   - Verifica di essere loggato come admin');
    console.log('3. Se l\'API non restituisce messaggi:');
    console.log('   - Controlla i permessi utente');
    console.log('   - Verifica ResponseFormatter nelle routes');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui
checkSavedMessages().catch(console.error);
