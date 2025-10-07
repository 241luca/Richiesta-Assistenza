#!/usr/bin/env ts-node

/**
 * Setup Evolution API per sviluppo locale
 * Configura webhook con ngrok o altre soluzioni
 */

import axios from 'axios';
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

async function setupEvolutionAPI() {
  console.log('\n🚀 SETUP EVOLUTION API PER LOCALHOST');
  console.log('=====================================\n');
  
  // Configuration
  const EVOLUTION_URL = 'http://localhost:8080';
  const EVOLUTION_API_KEY = 'your-evolution-api-key'; // Cambia con la tua
  
  console.log('📌 Opzioni per ricevere webhook su localhost:\n');
  console.log('1. NGROK (già in uso)');
  console.log('   - Pro: Già configurato');
  console.log('   - Contro: URL cambia\n');
  
  console.log('2. LOCALTUNNEL');
  console.log('   - Pro: URL fisso');
  console.log('   - Contro: A volte lento\n');
  
  console.log('3. CLOUDFLARE TUNNEL');
  console.log('   - Pro: Professionale, veloce');
  console.log('   - Contro: Serve account\n');
  
  console.log('4. DOCKER NETWORK (migliore)');
  console.log('   - Pro: Nessun tunnel!');
  console.log('   - Contro: Serve Docker\n');
  
  const choice = await question('Quale opzione vuoi usare? (1-4): ');
  
  let webhookUrl = '';
  
  switch(choice) {
    case '1':
      // NGROK
      console.log('\n📡 Configurazione con NGROK:');
      console.log('1. Assicurati che ngrok sia attivo: ngrok http 3200');
      console.log('2. Vai su http://localhost:4040');
      const ngrokUrl = await question('3. Inserisci l\'URL ngrok (es: https://abc123.ngrok-free.app): ');
      webhookUrl = `${ngrokUrl}/api/whatsapp/webhook`;
      break;
      
    case '2':
      // LOCALTUNNEL
      console.log('\n📡 Configurazione con LOCALTUNNEL:');
      console.log('Esegui in un nuovo terminale:');
      console.log('> npm install -g localtunnel');
      console.log('> lt --port 3200 --subdomain richiesta-assistenza');
      webhookUrl = 'https://richiesta-assistenza.loca.lt/api/whatsapp/webhook';
      break;
      
    case '3':
      // CLOUDFLARE
      console.log('\n📡 Configurazione con CLOUDFLARE:');
      console.log('Segui: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/');
      const cfUrl = await question('Inserisci il tuo URL Cloudflare: ');
      webhookUrl = `${cfUrl}/api/whatsapp/webhook`;
      break;
      
    case '4':
      // DOCKER
      console.log('\n📡 Configurazione con DOCKER NETWORK:');
      console.log('Webhook interno: http://backend:3200/api/whatsapp/webhook');
      webhookUrl = 'http://backend:3200/api/whatsapp/webhook';
      break;
  }
  
  console.log('\n✅ Webhook URL:', webhookUrl);
  
  // Step 1: Crea Instance
  console.log('\n📱 Creazione instance Evolution API...');
  
  try {
    const createResponse = await axios.post(
      `${EVOLUTION_URL}/instance/create`,
      {
        instanceName: 'richiesta-assistenza',
        qrcode: true,
        webhook: webhookUrl,
        webhook_by_events: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_SET',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      },
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Instance creata!');
    console.log('Instance data:', createResponse.data);
    
    // Step 2: Get QR Code
    console.log('\n📱 Generazione QR Code...');
    
    const qrResponse = await axios.get(
      `${EVOLUTION_URL}/instance/connect/richiesta-assistenza`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      }
    );
    
    console.log('\n📱 SCANSIONA QUESTO QR CODE CON WHATSAPP:');
    console.log(qrResponse.data.qr?.code || qrResponse.data.qrcode);
    
  } catch (error: any) {
    console.error('❌ Errore:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 L\'instance potrebbe già esistere.');
      console.log('Prova a connetterti direttamente.');
    }
  }
  
  // Step 3: Salva configurazione
  console.log('\n💾 Salvataggio configurazione nel database...');
  
  await prisma.apiKey.upsert({
    where: { service: 'whatsapp' },
    update: {
      key: EVOLUTION_API_KEY,
      name: 'Evolution API',
      permissions: {
        provider: 'evolution',
        instanceId: 'richiesta-assistenza',
        webhookUrl: webhookUrl,
        baseURL: EVOLUTION_URL
      },
      isActive: true,
      updatedAt: new Date()
    },
    create: {
      service: 'whatsapp',
      key: EVOLUTION_API_KEY,
      name: 'Evolution API',
      permissions: {
        provider: 'evolution',
        instanceId: 'richiesta-assistenza',
        webhookUrl: webhookUrl,
        baseURL: EVOLUTION_URL
      },
      isActive: true
    }
  });
  
  console.log('✅ Configurazione salvata!');
  
  // Step 4: Test
  console.log('\n🧪 TEST INVIO MESSAGGIO:');
  console.log('1. Invia un messaggio WhatsApp al numero connesso');
  console.log('2. Controlla i log del backend');
  console.log('3. Dovresti vedere "📨 Webhook WhatsApp ricevuto"');
  
  console.log('\n✅ Setup completato!');
  console.log('\n📌 PROSSIMI PASSI:');
  console.log('1. Scansiona il QR code se non l\'hai fatto');
  console.log('2. Il webhook è configurato su:', webhookUrl);
  console.log('3. I messaggi dovrebbero arrivare automaticamente');
  
  if (choice === '1') {
    console.log('\n⚠️  IMPORTANTE con NGROK:');
    console.log('Ogni volta che riavvii ngrok dovrai aggiornare il webhook!');
  }
  
  rl.close();
}

// Run
setupEvolutionAPI().catch(console.error);
