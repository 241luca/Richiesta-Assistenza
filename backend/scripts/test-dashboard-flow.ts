#!/usr/bin/env ts-node

/**
 * Verifica che la dashboard riceva i messaggi correttamente
 * Test del flusso: Ngrok → Backend → Database → API → Dashboard
 */

import { prisma } from '../src/config/database';
import axios from 'axios';

async function testDashboardFlow() {
  try {
    console.log('\n🔍 TEST DASHBOARD - RICEZIONE MESSAGGI');
    console.log('========================================\n');
    
    // 1. Verifica che il backend sia attivo
    console.log('📡 TEST 1: BACKEND ATTIVO');
    console.log('-------------------------');
    try {
      const health = await axios.get('http://localhost:3200/api/health');
      console.log('✅ Backend attivo e funzionante');
    } catch (error) {
      console.error('❌ Backend non raggiungibile! Assicurati che giri su porta 3200');
      process.exit(1);
    }
    
    // 2. Test endpoint messaggi che usa la dashboard
    console.log('\n📊 TEST 2: API MESSAGGI DASHBOARD');
    console.log('----------------------------------');
    try {
      const response = await axios.get('http://localhost:3200/api/whatsapp/messages', {
        params: { limit: 10 }
      });
      
      console.log('✅ API messaggi funzionante');
      
      const messages = response.data?.data?.messages || response.data?.messages || [];
      console.log(`📨 Messaggi trovati: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('\nUltimi messaggi:');
        messages.slice(0, 3).forEach((msg: any) => {
          console.log(`\n[${new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}]`);
          console.log(`  📱 Numero: ${msg.phoneNumber || msg.senderNumber}`);
          console.log(`  💬 Testo: ${msg.message?.substring(0, 50)}...`);
          console.log(`  🔄 Direzione: ${msg.direction}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Errore API messaggi:', error.response?.data || error.message);
    }
    
    // 3. Simula arrivo messaggio dal nuovo webhook ngrok
    console.log('\n🌐 TEST 3: SIMULAZIONE WEBHOOK DA NGROK');
    console.log('----------------------------------------');
    
    const NEW_NGROK_URL = 'https://6beb1a134e04.ngrok-free.app';
    console.log('Nuovo URL ngrok:', NEW_NGROK_URL);
    
    // Crea un messaggio di test univoco
    const testId = Date.now().toString();
    const testMessage = {
      instance_id: '68C9C1849B2CE',
      data: {
        event: 'messages.upsert',
        data: {
          messages: [{
            key: {
              remoteJid: '393987654321@s.whatsapp.net',
              fromMe: false,
              id: `TEST_DASHBOARD_${testId}`
            },
            message: {
              conversation: `Test Dashboard Ngrok - ${new Date().toLocaleTimeString()} [${testId}]`
            },
            pushName: 'Test Ngrok User',
            messageTimestamp: Math.floor(Date.now() / 1000)
          }]
        }
      }
    };
    
    console.log('📤 Invio messaggio test al webhook locale...');
    
    try {
      // Invia al webhook locale (come se arrivasse da ngrok)
      await axios.post('http://localhost:3200/api/whatsapp/webhook', testMessage);
      console.log('✅ Webhook processato');
      
      // Aspetta che venga salvato
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verifica che sia nel database
      const saved = await prisma.whatsAppMessage.findFirst({
        where: {
          message: {
            contains: testId
          }
        }
      });
      
      if (saved) {
        console.log('✅ Messaggio salvato nel database');
        console.log('   ID:', saved.id);
        
        // Ora verifica che l'API lo restituisca
        const apiCheck = await axios.get('http://localhost:3200/api/whatsapp/messages', {
          params: { limit: 5 }
        });
        
        const messages = apiCheck.data?.data?.messages || apiCheck.data?.messages || [];
        const found = messages.find((m: any) => 
          m.message?.includes(testId) || m.id === saved.id
        );
        
        if (found) {
          console.log('✅ Messaggio disponibile via API!');
          console.log('   La dashboard dovrebbe mostrarlo');
        } else {
          console.log('⚠️  Messaggio nel DB ma non nell\'API');
        }
      } else {
        console.log('❌ Messaggio non salvato nel database');
      }
      
    } catch (error: any) {
      console.error('❌ Errore test webhook:', error.message);
    }
    
    // 4. Verifica configurazione webhook
    console.log('\n⚙️ TEST 4: CONFIGURAZIONE WEBHOOK');
    console.log('----------------------------------');
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    const config = apiKey?.permissions as any;
    const currentWebhook = config?.webhookUrl;
    const expectedWebhook = `${NEW_NGROK_URL}/api/whatsapp/webhook`;
    
    console.log('Webhook configurato:', currentWebhook);
    console.log('Webhook atteso:', expectedWebhook);
    
    if (currentWebhook === expectedWebhook) {
      console.log('✅ Webhook configurato correttamente');
    } else {
      console.log('⚠️  Webhook non aggiornato! Aggiornamento...');
      
      const updatedConfig = {
        ...config,
        webhookUrl: expectedWebhook
      };
      
      await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          permissions: updatedConfig,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Webhook aggiornato nel database');
    }
    
    // 5. Statistiche database
    console.log('\n📊 STATISTICHE DATABASE');
    console.log('-----------------------');
    
    const total = await prisma.whatsAppMessage.count();
    const inbound = await prisma.whatsAppMessage.count({ where: { direction: 'inbound' }});
    const outbound = await prisma.whatsAppMessage.count({ where: { direction: 'outbound' }});
    const last24h = await prisma.whatsAppMessage.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log(`Totale messaggi: ${total}`);
    console.log(`- Ricevuti: ${inbound}`);
    console.log(`- Inviati: ${outbound}`);
    console.log(`- Ultime 24h: ${last24h}`);
    
    // 6. Istruzioni finali
    console.log('\n✅ VERIFICA DASHBOARD');
    console.log('=====================');
    console.log('1. Vai su: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('2. Dovresti vedere i messaggi, incluso il test');
    console.log('3. Se NON li vedi:');
    console.log('   - Premi F5 per ricaricare');
    console.log('   - Apri console (F12) e cerca errori');
    console.log('   - Verifica che il token JWT sia valido');
    
    console.log('\n🔍 MONITORAGGIO NGROK');
    console.log('======================');
    console.log('1. Apri: http://localhost:4040');
    console.log('2. Quando invii un messaggio WhatsApp dovresti vedere:');
    console.log('   - Una richiesta POST a /api/whatsapp/webhook');
    console.log('3. Se non vedi nulla:');
    console.log('   - SendApp non sta inviando al webhook');
    console.log('   - Configura manualmente su https://app.sendapp.cloud');
    
    console.log('\n✅ Test completato!');
    console.log('\nRICORDA: La dashboard NON si connette a ngrok direttamente!');
    console.log('Il flusso è: WhatsApp → SendApp → Ngrok → Backend → Database → Dashboard');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui
testDashboardFlow().catch(console.error);
