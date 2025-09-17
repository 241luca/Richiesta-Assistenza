#!/usr/bin/env ts-node

/**
 * Test completo flusso messaggi: Webhook → Database → Dashboard
 */

import { prisma } from '../src/config/database';
import axios from 'axios';
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

async function testFlussoDashboard() {
  try {
    console.log('\n🔍 TEST FLUSSO COMPLETO: WEBHOOK → DATABASE → DASHBOARD');
    console.log('==========================================================\n');
    
    // 1. Verifica configurazione
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    const config = apiKey?.permissions as any;
    const WEBHOOK_URL = 'https://6beb1a134e04.ngrok-free.app/api/whatsapp/webhook';
    
    console.log('📡 Configurazione attuale:');
    console.log('- Webhook URL:', config?.webhookUrl);
    console.log('- Nuovo ngrok URL:', WEBHOOK_URL);
    
    if (config?.webhookUrl !== WEBHOOK_URL) {
      console.log('⚠️  URL non corrispondono! Aggiornamento...');
      
      const updatedConfig = {
        ...config,
        webhookUrl: WEBHOOK_URL
      };
      
      await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          permissions: updatedConfig,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Webhook URL aggiornato nel database');
    } else {
      console.log('✅ Webhook URL già configurato correttamente');
    }
    
    // 2. Test invio messaggio fake al webhook
    console.log('\n📤 TEST 1: INVIO MESSAGGIO FAKE AL WEBHOOK');
    console.log('==========================================');
    
    const testMessage = {
      instance_id: config?.instanceId || '68C9C1849B2CE',
      data: {
        event: 'messages.upsert',
        data: {
          messages: [{
            key: {
              remoteJid: '393331234567@s.whatsapp.net',
              fromMe: false,
              id: 'TEST_' + Date.now()
            },
            message: {
              conversation: 'Test Dashboard - ' + new Date().toLocaleTimeString()
            },
            pushName: 'Test User',
            messageTimestamp: Math.floor(Date.now() / 1000)
          }]
        }
      }
    };
    
    console.log('Invio messaggio di test al webhook locale...');
    
    try {
      const response = await axios.post(
        'http://localhost:3200/api/whatsapp/webhook',
        testMessage
      );
      
      console.log('✅ Webhook ha risposto:', response.data);
      
      // Aspetta che venga salvato
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verifica nel database
      const savedMsg = await prisma.whatsAppMessage.findFirst({
        where: {
          message: {
            contains: 'Test Dashboard'
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (savedMsg) {
        console.log('✅ Messaggio salvato nel database!');
        console.log('   ID:', savedMsg.id);
        console.log('   Numero:', savedMsg.phoneNumber || savedMsg.senderNumber);
        console.log('   Testo:', savedMsg.message);
        console.log('   Direzione:', savedMsg.direction);
      } else {
        console.log('❌ Messaggio NON trovato nel database!');
        console.log('   Il webhook potrebbe non processare correttamente');
      }
      
    } catch (error: any) {
      console.error('❌ Errore test webhook:', error.message);
    }
    
    // 3. Verifica endpoint API per la dashboard
    console.log('\n🌐 TEST 2: ENDPOINT API DASHBOARD');
    console.log('===================================');
    
    try {
      console.log('Chiamata API: GET /api/whatsapp/messages');
      
      const apiResponse = await axios.get('http://localhost:3200/api/whatsapp/messages', {
        params: {
          limit: 10
        }
      });
      
      console.log('✅ API risponde correttamente');
      console.log(`   Messaggi trovati: ${apiResponse.data.data?.messages?.length || 0}`);
      
      if (apiResponse.data.data?.messages?.length > 0) {
        const lastMsg = apiResponse.data.data.messages[0];
        console.log('\n📨 Ultimo messaggio:');
        console.log(`   Da: ${lastMsg.phoneNumber || lastMsg.senderNumber}`);
        console.log(`   Testo: ${lastMsg.message?.substring(0, 50)}...`);
        console.log(`   Direzione: ${lastMsg.direction}`);
        console.log(`   Data: ${lastMsg.timestamp || lastMsg.createdAt}`);
      }
      
    } catch (error: any) {
      console.error('❌ Errore chiamata API:', error.message);
    }
    
    // 4. Verifica messaggi nel database
    console.log('\n📊 TEST 3: MESSAGGI NEL DATABASE');
    console.log('==================================');
    
    const totalMessages = await prisma.whatsAppMessage.count();
    const inboundMessages = await prisma.whatsAppMessage.count({
      where: { direction: 'inbound' }
    });
    const outboundMessages = await prisma.whatsAppMessage.count({
      where: { direction: 'outbound' }
    });
    
    console.log(`Totale messaggi: ${totalMessages}`);
    console.log(`- Ricevuti (inbound): ${inboundMessages}`);
    console.log(`- Inviati (outbound): ${outboundMessages}`);
    
    // Ultimi 5 messaggi
    const recentMessages = await prisma.whatsAppMessage.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (recentMessages.length > 0) {
      console.log('\n📱 Ultimi 5 messaggi:');
      for (const msg of recentMessages) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        console.log(`\n[${time}] ${msg.direction === 'inbound' ? '📥' : '📤'}`);
        console.log(`   Da: ${msg.senderNumber || msg.phoneNumber}`);
        console.log(`   Testo: ${msg.message?.substring(0, 60)}...`);
      }
    }
    
    // 5. Test messaggio reale
    console.log('\n📱 TEST 4: MESSAGGIO WHATSAPP REALE');
    console.log('=====================================');
    
    const doRealTest = await question('Vuoi fare un test con un messaggio WhatsApp reale? (s/n): ');
    
    if (doRealTest.toLowerCase() === 's') {
      console.log('\n📌 ISTRUZIONI:');
      console.log('1. Apri WhatsApp sul tuo telefono');
      console.log('2. Invia un messaggio al numero connesso');
      console.log('3. Scrivi: "TEST DASHBOARD ' + new Date().toLocaleTimeString() + '"');
      
      await question('\nPremi INVIO dopo aver inviato il messaggio...');
      
      // Aspetta un po'
      console.log('⏳ Attendo 3 secondi per l\'arrivo del webhook...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Controlla se è arrivato
      const testMsg = await prisma.whatsAppMessage.findFirst({
        where: {
          message: {
            contains: 'TEST DASHBOARD'
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (testMsg) {
        console.log('\n✅ MESSAGGIO RICEVUTO E SALVATO!');
        console.log('   ID:', testMsg.id);
        console.log('   Da:', testMsg.senderNumber || testMsg.phoneNumber);
        console.log('   Testo:', testMsg.message);
        console.log('   Timestamp:', testMsg.timestamp);
        console.log('\n🎉 IL WEBHOOK FUNZIONA CORRETTAMENTE!');
      } else {
        console.log('\n❌ Messaggio NON trovato nel database');
        console.log('   Possibili cause:');
        console.log('   1. Webhook non configurato su SendApp');
        console.log('   2. ngrok non raggiungibile');
        console.log('   3. Backend non sta processando correttamente');
      }
    }
    
    // 6. Verifica dashboard
    console.log('\n🖥️ VERIFICA DASHBOARD');
    console.log('======================');
    console.log('1. Vai su: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('2. Dovresti vedere:');
    console.log('   - I messaggi di test');
    console.log('   - I messaggi reali se hai fatto il test');
    console.log('3. Se NON vedi i messaggi:');
    console.log('   - Ricarica la pagina (F5)');
    console.log('   - Controlla la console del browser (F12)');
    console.log('   - Verifica che il backend sia attivo');
    
    // 7. Istruzioni finali
    console.log('\n✅ RIEPILOGO STATO SISTEMA');
    console.log('============================');
    
    if (totalMessages > 0) {
      console.log('✅ Database contiene messaggi');
    } else {
      console.log('⚠️  Database vuoto - nessun messaggio');
    }
    
    console.log('✅ Webhook URL configurato:', WEBHOOK_URL);
    console.log('✅ Backend attivo su porta 3200');
    console.log('✅ Frontend attivo su porta 5193');
    
    console.log('\n📌 SE I MESSAGGI NON APPAIONO NELLA DASHBOARD:');
    console.log('================================================');
    console.log('1. Verifica su http://localhost:4040 se arrivano webhook');
    console.log('2. Controlla i log del backend per errori');
    console.log('3. Assicurati che SendApp abbia il webhook configurato');
    console.log('4. Prova a riavviare frontend e backend');
    
    console.log('\n✅ Test completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
testFlussoDashboard().catch(console.error);
