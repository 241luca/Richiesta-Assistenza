#!/usr/bin/env ts-node

/**
 * Mostra la stringa esatta per configurare webhook su SendApp
 */

import { prisma } from '../src/config/database';

async function showWebhookConfig() {
  console.log('\n📡 CONFIGURAZIONE WEBHOOK PER SENDAPP');
  console.log('=====================================\n');
  
  // Recupera configurazione
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: 'whatsapp' }
  });
  
  const config = apiKey?.permissions as any;
  const token = apiKey?.key || '68c575f3c2ff1';
  const instanceId = config?.instanceId || '68C9C1849B2CE';
  
  const NGROK_URL = 'https://6beb1a134e04.ngrok-free.app';
  const WEBHOOK_URL = `${NGROK_URL}/api/whatsapp/webhook`;
  
  console.log('📌 COPIA QUESTO URL ESATTO:');
  console.log('============================');
  console.log('');
  console.log(`   ${WEBHOOK_URL}`);
  console.log('');
  console.log('============================\n');
  
  console.log('🔧 METODO 1: VIA API SENDAPP');
  console.log('-----------------------------');
  console.log('URL da chiamare (GET):');
  console.log('');
  console.log(`https://app.sendapp.cloud/api/set_webhook?webhook_url=${encodeURIComponent(WEBHOOK_URL)}&enable=true&instance_id=${instanceId}&access_token=${token}`);
  console.log('');
  console.log('Oppure con parametri separati:');
  console.log('- Base URL: https://app.sendapp.cloud/api/set_webhook');
  console.log(`- webhook_url: ${WEBHOOK_URL}`);
  console.log('- enable: true');
  console.log(`- instance_id: ${instanceId}`);
  console.log(`- access_token: ${token}`);
  
  console.log('\n🖱️ METODO 2: CONFIGURAZIONE MANUALE SU SENDAPP');
  console.log('------------------------------------------------');
  console.log('1. Vai su: https://app.sendapp.cloud');
  console.log('2. Fai login');
  console.log('3. Cerca: "Webhook" o "API Settings" o "Instance Settings"');
  console.log('4. Inserisci questi dati:');
  console.log('');
  console.log(`   📌 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`   ✅ Enable: SI / TRUE / ATTIVO`);
  console.log(`   🆔 Instance ID: ${instanceId}`);
  console.log('   📋 Eventi da abilitare:');
  console.log('      ✅ messages');
  console.log('      ✅ messages.upsert');
  console.log('      ✅ message_status');
  console.log('      ✅ connection');
  console.log('');
  console.log('5. SALVA le modifiche');
  
  console.log('\n🧪 METODO 3: CURL DIRETTO');
  console.log('--------------------------');
  console.log('Copia e incolla questo comando nel terminale:');
  console.log('');
  console.log(`curl "https://app.sendapp.cloud/api/set_webhook?webhook_url=${encodeURIComponent(WEBHOOK_URL)}&enable=true&instance_id=${instanceId}&access_token=${token}"`);
  
  console.log('\n📋 RIEPILOGO DATI');
  console.log('------------------');
  console.log('Token:', token);
  console.log('Instance ID:', instanceId);
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('Ngrok URL:', NGROK_URL);
  
  console.log('\n✅ VERIFICA CHE FUNZIONI:');
  console.log('-------------------------');
  console.log('1. Dopo aver configurato, invia un messaggio WhatsApp');
  console.log('2. Vai su http://localhost:4040');
  console.log('3. Dovresti vedere una richiesta POST con:');
  console.log('   - event: "messages.upsert"');
  console.log('   - data.messages: [array di messaggi]');
  console.log('');
  console.log('Se vedi solo "contacts.update", gli eventi messaggi non sono abilitati!');
  
  process.exit(0);
}

// Esegui
showWebhookConfig().catch(console.error);
