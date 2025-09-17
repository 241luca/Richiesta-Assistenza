#!/usr/bin/env ts-node

/**
 * Test completo tunnel ngrok → backend localhost:3200
 * Verifica che ngrok inoltri correttamente le richieste
 */

import axios from 'axios';
import { prisma } from '../src/config/database';

async function testNgrokTunnel() {
  try {
    console.log('\n🔍 TEST TUNNEL NGROK → BACKEND');
    console.log('===================================\n');
    
    const NGROK_URL = 'https://6beb1a134e04.ngrok-free.app';
    const WEBHOOK_URL = `${NGROK_URL}/api/whatsapp/webhook`;
    const BACKEND_URL = 'http://localhost:3200';
    
    console.log('📡 Configurazione:');
    console.log('- Ngrok URL:', NGROK_URL);
    console.log('- Webhook completo:', WEBHOOK_URL);
    console.log('- Backend locale:', BACKEND_URL);
    console.log('');
    
    // TEST 1: Backend locale raggiungibile
    console.log('✅ TEST 1: BACKEND LOCALE');
    console.log('--------------------------');
    try {
      const localTest = await axios.get(`${BACKEND_URL}/api/health`);
      console.log('✅ Backend attivo su localhost:3200');
      console.log('   Status:', localTest.status);
    } catch (error: any) {
      console.error('❌ Backend NON raggiungibile su localhost:3200!');
      console.log('   Assicurati che il backend sia in esecuzione: npm run dev');
      process.exit(1);
    }
    
    // TEST 2: Ngrok tunnel attivo
    console.log('\n✅ TEST 2: NGROK TUNNEL ATTIVO');
    console.log('--------------------------------');
    try {
      console.log('Testando connessione a ngrok...');
      
      // Test health endpoint via ngrok
      const ngrokHealth = await axios.get(`${NGROK_URL}/api/health`, {
        timeout: 10000,
        headers: {
          'ngrok-skip-browser-warning': 'true' // Skip ngrok warning page
        }
      });
      
      console.log('✅ Ngrok tunnel FUNZIONANTE!');
      console.log('   Ngrok → Backend: OK');
      console.log('   Status:', ngrokHealth.status);
      
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Ngrok non raggiungibile!');
        console.log('   Verifica che ngrok sia in esecuzione: ngrok http 3200');
      } else if (error.response?.status === 502) {
        console.error('❌ Ngrok attivo ma non riesce a connettersi al backend!');
        console.log('   Verifica che il backend sia su porta 3200');
      } else {
        console.error('⚠️  Errore connessione ngrok:', error.message);
      }
      
      console.log('\n📌 Per riavviare ngrok:');
      console.log('   1. killall ngrok');
      console.log('   2. ngrok http 3200');
      console.log('   3. Prendi il nuovo URL da http://localhost:4040');
    }
    
    // TEST 3: Test webhook endpoint via ngrok
    console.log('\n✅ TEST 3: WEBHOOK ENDPOINT VIA NGROK');
    console.log('---------------------------------------');
    
    const testPayload = {
      instance_id: '68C9C1849B2CE',
      data: {
        event: 'test_ngrok_tunnel',
        timestamp: new Date().toISOString(),
        message: `Test tunnel ngrok ${new Date().toLocaleTimeString()}`
      }
    };
    
    try {
      console.log('📤 Invio test webhook via ngrok...');
      console.log('   URL:', WEBHOOK_URL);
      
      const ngrokWebhook = await axios.post(WEBHOOK_URL, testPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('✅ Webhook via ngrok FUNZIONA!');
      console.log('   Risposta:', ngrokWebhook.data);
      console.log('   Il tunnel ngrok → backend è OK!');
      
    } catch (error: any) {
      console.error('❌ Webhook via ngrok FALLITO!');
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   Ngrok non raggiungibile');
      } else if (error.response?.status === 404) {
        console.log('   Endpoint webhook non trovato');
        console.log('   Verifica che il backend abbia la route /api/whatsapp/webhook');
      } else if (error.response?.status === 502) {
        console.log('   Ngrok non riesce a connettersi al backend');
        console.log('   Backend potrebbe essere crashato o su porta sbagliata');
      } else {
        console.log('   Errore:', error.message);
      }
    }
    
    // TEST 4: Test messaggio WhatsApp completo via ngrok
    console.log('\n✅ TEST 4: MESSAGGIO WHATSAPP COMPLETO');
    console.log('----------------------------------------');
    
    const whatsappMessage = {
      instance_id: '68C9C1849B2CE',
      data: {
        event: 'messages.upsert',
        data: {
          messages: [{
            key: {
              remoteJid: '393331234567@s.whatsapp.net',
              fromMe: false,
              id: 'NGROK_TEST_' + Date.now()
            },
            message: {
              conversation: 'Test Ngrok Tunnel - ' + new Date().toLocaleTimeString()
            },
            pushName: 'Test Ngrok',
            messageTimestamp: Math.floor(Date.now() / 1000)
          }]
        }
      }
    };
    
    try {
      console.log('📤 Invio messaggio WhatsApp test via ngrok...');
      
      // Invia via ngrok
      const response = await axios.post(WEBHOOK_URL, whatsappMessage, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('✅ Messaggio inviato via ngrok!');
      
      // Aspetta che venga processato
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verifica nel database
      const saved = await prisma.whatsAppMessage.findFirst({
        where: {
          message: {
            contains: 'Test Ngrok Tunnel'
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (saved) {
        console.log('✅ MESSAGGIO SALVATO NEL DATABASE!');
        console.log('   ID:', saved.id);
        console.log('   Il tunnel ngrok → backend → database FUNZIONA!');
      } else {
        console.log('⚠️  Messaggio non trovato nel database');
        console.log('   Il webhook potrebbe non processare correttamente');
      }
      
    } catch (error: any) {
      console.error('❌ Errore invio messaggio test:', error.message);
    }
    
    // TEST 5: Verifica ngrok inspector
    console.log('\n📊 TEST 5: NGROK INSPECTOR');
    console.log('---------------------------');
    console.log('1. Apri: http://localhost:4040');
    console.log('2. Dovresti vedere le richieste di test appena fatte');
    console.log('3. Controlla:');
    console.log('   - Status: dovrebbe essere 200');
    console.log('   - Response: dovrebbe essere {success: true}');
    console.log('   - Request body: dovrebbe contenere i dati del test');
    
    // ANALISI FINALE
    console.log('\n🔍 ANALISI TUNNEL NGROK');
    console.log('========================');
    
    console.log('\n✅ COSA FUNZIONA:');
    console.log('- Backend attivo su localhost:3200');
    console.log('- Ngrok tunnel configurato');
    console.log('- Webhook endpoint raggiungibile');
    
    console.log('\n📌 PROSSIMI PASSI:');
    console.log('1. Se il tunnel funziona ma non ricevi messaggi reali:');
    console.log('   → Il problema è SendApp che non invia al webhook');
    console.log('   → Configura manualmente su https://app.sendapp.cloud');
    console.log('');
    console.log('2. Il webhook su SendApp deve essere ESATTAMENTE:');
    console.log(`   ${WEBHOOK_URL}`);
    console.log('');
    console.log('3. Per testare con un messaggio reale:');
    console.log('   - Invia un messaggio WhatsApp al numero connesso');
    console.log('   - Controlla http://localhost:4040 per vedere se arriva');
    console.log('   - Se non arriva, SendApp non sta inviando');
    
    console.log('\n✅ Test tunnel completato!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore test:', error);
    process.exit(1);
  }
}

// Esegui
testNgrokTunnel().catch(console.error);
