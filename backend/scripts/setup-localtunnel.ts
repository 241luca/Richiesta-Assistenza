#!/usr/bin/env ts-node

/**
 * Configura webhook con LocalTunnel invece di ngrok
 * URL FISSO che non cambia!
 */

import { prisma } from '../src/config/database';
import axios from 'axios';

async function setupLocalTunnel() {
  console.log('\n🚀 SETUP LOCALTUNNEL - Addio ngrok!');
  console.log('====================================\n');
  
  const LOCALTUNNEL_URL = 'https://richiesta-assistenza.loca.lt';
  const WEBHOOK_URL = `${LOCALTUNNEL_URL}/api/whatsapp/webhook`;
  
  console.log('📡 LocalTunnel vs ngrok:');
  console.log('------------------------');
  console.log('❌ ngrok FREE:');
  console.log('   - URL cambia sempre');
  console.log('   - Limiti richieste');
  console.log('   - Sessioni che scadono');
  console.log('');
  console.log('✅ LocalTunnel:');
  console.log('   - URL FISSO sempre uguale');
  console.log('   - Nessun limite');
  console.log('   - Gratuito al 100%');
  console.log('   - URL:', LOCALTUNNEL_URL);
  console.log('');
  
  // 1. Aggiorna configurazione database
  console.log('💾 Aggiornamento configurazione...');
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: 'whatsapp' }
  });
  
  if (apiKey) {
    const config = apiKey.permissions as any;
    
    await prisma.apiKey.update({
      where: { service: 'whatsapp' },
      data: {
        permissions: {
          ...config,
          webhookUrl: WEBHOOK_URL,
          tunnelType: 'localtunnel'
        },
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Database aggiornato con nuovo URL');
  }
  
  // 2. Configura su SendApp
  console.log('\n📱 Configurazione SendApp...');
  
  const token = apiKey?.key || '68c575f3c2ff1';
  const instanceId = (apiKey?.permissions as any)?.instanceId || '68C9C1849B2CE';
  
  try {
    const response = await axios.get('https://app.sendapp.cloud/api/set_webhook', {
      params: {
        webhook_url: WEBHOOK_URL,
        enable: 'true',
        instance_id: instanceId,
        access_token: token
      },
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ Webhook configurato su SendApp!');
    } else {
      console.log('⚠️  Configurazione API fallita, configura manualmente');
    }
  } catch (error) {
    console.log('⚠️  Errore configurazione automatica');
  }
  
  // 3. Istruzioni
  console.log('\n📌 ISTRUZIONI COMPLETE:');
  console.log('=======================\n');
  
  console.log('1️⃣  AVVIA LOCALTUNNEL (nuovo terminale):');
  console.log('   chmod +x scripts/start-localtunnel.sh');
  console.log('   ./scripts/start-localtunnel.sh');
  console.log('');
  
  console.log('2️⃣  PRIMA VOLTA:');
  console.log('   - Ti chiederà di aprire un link');
  console.log('   - Inserisci la password mostrata');
  console.log('   - Poi funzionerà sempre!');
  console.log('');
  
  console.log('3️⃣  CONFIGURA SENDAPP MANUALMENTE:');
  console.log('   - Vai su: https://app.sendapp.cloud');
  console.log('   - Webhook URL: ' + WEBHOOK_URL);
  console.log('   - Enable: YES');
  console.log('   - Save');
  console.log('');
  
  console.log('4️⃣  TEST:');
  console.log('   - Invia un messaggio WhatsApp');
  console.log('   - Controlla i log del backend');
  console.log('   - I messaggi dovrebbero arrivare!');
  console.log('');
  
  console.log('✅ VANTAGGI LOCALTUNNEL:');
  console.log('   • URL sempre uguale: ' + LOCALTUNNEL_URL);
  console.log('   • Non devi più riconfigurare ogni volta!');
  console.log('   • Nessun limite di tempo o richieste');
  console.log('   • Completamente gratuito');
  console.log('');
  
  console.log('🎉 Addio problemi di ngrok!');
  
  process.exit(0);
}

setupLocalTunnel().catch(console.error);
