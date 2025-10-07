#!/usr/bin/env ts-node

/**
 * Test completo webhook - Debug dettagliato
 * Verifica se i webhook arrivano e come vengono processati
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

async function testWebhookComplete() {
  try {
    console.log('\n🔍 TEST COMPLETO WEBHOOK WHATSAPP');
    console.log('====================================\n');
    
    // 1. Recupera configurazione
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione WhatsApp non trovata!');
      process.exit(1);
    }
    
    const config = apiKey.permissions as any;
    const token = apiKey.key;
    const instanceId = config?.instanceId;
    const webhookUrl = config?.webhookUrl;
    
    console.log('📱 CONFIGURAZIONE ATTUALE:');
    console.log('- Token:', token);
    console.log('- Instance ID:', instanceId);
    console.log('- Webhook URL:', webhookUrl);
    console.log('');
    
    // 2. Test connettività webhook locale
    console.log('🌐 TEST 1: WEBHOOK LOCALE');
    console.log('==========================');
    
    if (!webhookUrl) {
      console.error('❌ Webhook URL non configurato!');
    } else {
      // Estrai URL base (rimuovi ngrok parte)
      const localWebhook = webhookUrl.replace(/https:\/\/[^\/]+/, 'http://localhost:3200');
      console.log('Testing local webhook:', localWebhook);
      
      try {
        // Invia un webhook di test locale
        const testPayload = {
          instance_id: instanceId,
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
                  conversation: 'TEST WEBHOOK LOCALE - ' + new Date().toLocaleTimeString()
                },
                pushName: 'Test User'
              }]
            }
          }
        };
        
        console.log('📤 Invio webhook di test al backend locale...');
        const response = await axios.post(localWebhook, testPayload);
        console.log('✅ Risposta backend:', response.data);
        
        // Verifica se è stato salvato
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aspetta 1 secondo
        
        const savedMessage = await prisma.whatsAppMessage.findFirst({
          where: {
            content: {
              contains: 'TEST WEBHOOK LOCALE'
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });
        
        if (savedMessage) {
          console.log('✅ Messaggio di test salvato nel database!');
          console.log('   ID:', savedMessage.id);
          console.log('   Direzione:', savedMessage.direction);
        } else {
          console.log('❌ Messaggio di test NON trovato nel database');
          console.log('   Il webhook potrebbe non essere processato correttamente');
        }
        
      } catch (error: any) {
        console.error('❌ Errore test webhook locale:', error.message);
        console.log('   Il backend potrebbe non essere in esecuzione');
      }
    }
    
    // 3. Test ngrok tunnel
    console.log('\n🌐 TEST 2: NGROK TUNNEL');
    console.log('========================');
    
    try {
      // Controlla se ngrok risponde
      const ngrokUrl = webhookUrl?.split('/api/')[0];
      if (ngrokUrl && ngrokUrl.includes('ngrok')) {
        console.log('Testing ngrok URL:', ngrokUrl);
        
        const ngrokTest = await axios.get(ngrokUrl, { 
          timeout: 5000,
          validateStatus: () => true // Accetta qualsiasi status
        });
        
        if (ngrokTest.status === 200 || ngrokTest.status === 404) {
          console.log('✅ Ngrok tunnel ATTIVO e raggiungibile');
        } else {
          console.log('⚠️  Ngrok risponde con status:', ngrokTest.status);
        }
      } else {
        console.log('❌ URL ngrok non configurato o non valido');
      }
    } catch (error: any) {
      console.error('❌ Ngrok NON raggiungibile:', error.message);
      console.log('   Verifica che ngrok sia in esecuzione: ngrok http 3200');
    }
    
    // 4. Verifica configurazione SendApp
    console.log('\n🌐 TEST 3: CONFIGURAZIONE SENDAPP');
    console.log('===================================');
    
    try {
      // Ottieni info webhook da SendApp (se disponibile)
      console.log('Verifico stato connessione su SendApp...');
      
      const statusUrl = 'https://app.sendapp.cloud/api/get_connection_status';
      const statusResponse = await axios.get(statusUrl, {
        params: {
          instance_id: instanceId,
          access_token: token
        }
      });
      
      console.log('✅ Connessione SendApp OK');
      console.log('Stato:', JSON.stringify(statusResponse.data, null, 2));
      
    } catch (error: any) {
      console.error('❌ Errore verifica SendApp:', error.response?.data || error.message);
    }
    
    // 5. Test invio messaggio reale
    console.log('\n📱 TEST 4: MESSAGGIO REALE');
    console.log('===========================');
    
    const testReal = await question('Vuoi fare un test con un messaggio WhatsApp reale? (s/n): ');
    
    if (testReal.toLowerCase() === 's') {
      console.log('\n📱 ISTRUZIONI:');
      console.log('1. Prendi il tuo telefono');
      console.log('2. Invia un messaggio WhatsApp al numero collegato');
      console.log('3. Il messaggio dovrebbe essere: "TEST ' + new Date().toLocaleTimeString() + '"');
      console.log('4. Aspetta qualche secondo...');
      
      await question('\nPremi INVIO dopo aver inviato il messaggio...');
      
      // Controlla ultimi messaggi
      const recentMessages = await prisma.whatsAppMessage.findMany({
        take: 5,
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      console.log('\n📨 ULTIMI MESSAGGI NEL DATABASE:');
      if (recentMessages.length === 0) {
        console.log('❌ Nessun messaggio trovato!');
      } else {
        for (const msg of recentMessages) {
          const age = Date.now() - msg.timestamp.getTime();
          const isRecent = age < 60000; // Meno di 1 minuto
          
          console.log(`\n${isRecent ? '🆕' : '📧'} [${msg.timestamp.toLocaleTimeString()}]`);
          console.log(`   Da: ${msg.senderNumber}`);
          console.log(`   Direzione: ${msg.direction}`);
          console.log(`   Testo: ${msg.content?.substring(0, 50)}`);
          
          if (isRecent && msg.content?.includes('TEST')) {
            console.log('   ✅ QUESTO È IL TUO MESSAGGIO DI TEST!');
          }
        }
      }
    }
    
    // 6. Analisi problemi
    console.log('\n🔍 ANALISI PROBLEMI:');
    console.log('====================');
    
    // Conta messaggi
    const inboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'inbound' }
    });
    const outboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'outbound' }
    });
    
    console.log(`📊 Statistiche database:`);
    console.log(`   - Messaggi ricevuti (inbound): ${inboundCount}`);
    console.log(`   - Messaggi inviati (outbound): ${outboundCount}`);
    
    if (inboundCount === 0) {
      console.log('\n❌ PROBLEMA: Nessun messaggio ricevuto nel database!');
      console.log('\n📌 POSSIBILI CAUSE:');
      console.log('1. ❌ Webhook non configurato su SendApp');
      console.log('   → Soluzione: Esegui configure-sendapp-webhook.ts');
      console.log('');
      console.log('2. ❌ Ngrok non funzionante');
      console.log('   → Soluzione: Riavvia ngrok e aggiorna URL');
      console.log('');
      console.log('3. ❌ Backend non processa correttamente i webhook');
      console.log('   → Soluzione: Controlla i log del backend');
      console.log('');
      console.log('4. ❌ Instance ID non corrisponde');
      console.log('   → Soluzione: Verifica su SendApp quale instance è attiva');
    }
    
    // 7. Check logs
    console.log('\n📋 CONTROLLO LOG BACKEND:');
    console.log('=========================');
    console.log('Guarda nel terminale del backend per vedere se ci sono:');
    console.log('- 📨 "Webhook WhatsApp ricevuto"');
    console.log('- 📌 "Tipo evento: messages.upsert"');
    console.log('- ✅ "Messaggio salvato"');
    console.log('');
    console.log('Se NON vedi questi log quando ricevi un messaggio,');
    console.log('il webhook NON sta arrivando al tuo server!');
    
    // 8. Soluzioni
    console.log('\n💡 SOLUZIONI CONSIGLIATE:');
    console.log('=========================');
    console.log('1. RIAVVIA TUTTO:');
    console.log('   - Ferma e riavvia ngrok: ngrok http 3200');
    console.log('   - Prendi il nuovo URL da http://localhost:4040');
    console.log('   - Esegui: configure-sendapp-webhook.ts con il nuovo URL');
    console.log('');
    console.log('2. VERIFICA SU SENDAPP:');
    console.log('   - Vai su https://app.sendapp.cloud');
    console.log('   - Controlla che il webhook sia configurato');
    console.log('   - Verifica che sia "enabled"');
    console.log('');
    console.log('3. TEST MANUALE:');
    console.log('   - Usa webhook.site per testare');
    console.log('   - Configura temporaneamente SendApp su webhook.site');
    console.log('   - Vedi se i webhook arrivano lì');
    
    console.log('\n✅ Test completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
testWebhookComplete().catch(console.error);
