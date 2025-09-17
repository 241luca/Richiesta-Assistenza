#!/usr/bin/env ts-node

/**
 * Configura il NUOVO URL ngrok su SendApp
 * URL: https://6beb1a134e04.ngrok-free.app
 */

import { prisma } from '../src/config/database';
import axios from 'axios';

async function configureNewNgrokUrl() {
  try {
    console.log('\n🔧 CONFIGURAZIONE NUOVO URL NGROK');
    console.log('====================================\n');
    
    const NUOVO_NGROK_URL = 'https://6beb1a134e04.ngrok-free.app';
    const WEBHOOK_URL_COMPLETO = `${NUOVO_NGROK_URL}/api/whatsapp/webhook`;
    
    console.log('📡 Nuovo URL ngrok:', NUOVO_NGROK_URL);
    console.log('📡 Webhook completo:', WEBHOOK_URL_COMPLETO);
    console.log('');
    
    // Recupera configurazione
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione non trovata!');
      process.exit(1);
    }
    
    const config = apiKey.permissions as any;
    const token = apiKey.key;
    const instanceId = config?.instanceId;
    
    console.log('📱 Configurazione:');
    console.log('- Token:', token);
    console.log('- Instance ID:', instanceId);
    console.log('- Vecchio webhook:', config?.webhookUrl);
    console.log('');
    
    // 1. Aggiorna nel database locale
    console.log('💾 Aggiornamento database locale...');
    
    const updatedConfig = {
      ...config,
      webhookUrl: WEBHOOK_URL_COMPLETO,
      baseURL: 'https://app.sendapp.cloud/api'
    };
    
    await prisma.apiKey.update({
      where: { service: 'whatsapp' },
      data: {
        permissions: updatedConfig,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Database aggiornato');
    
    // 2. Configura su SendApp via API
    console.log('\n📡 Configurazione su SendApp...');
    
    try {
      const setWebhookUrl = 'https://app.sendapp.cloud/api/set_webhook';
      
      console.log('Chiamata:', setWebhookUrl);
      console.log('Parametri:');
      console.log('- webhook_url:', WEBHOOK_URL_COMPLETO);
      console.log('- enable: true');
      console.log('- instance_id:', instanceId);
      console.log('- access_token:', token);
      console.log('');
      
      const response = await axios.get(setWebhookUrl, {
        params: {
          webhook_url: WEBHOOK_URL_COMPLETO,
          enable: 'true',
          instance_id: instanceId,
          access_token: token
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log('📡 Risposta SendApp:');
      
      // Controlla se è HTML (errore) o JSON (successo)
      if (response.data && typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        console.log('❌ SendApp restituisce pagina HTML - Autenticazione fallita!');
        console.log('\n⚠️  DEVI CONFIGURARLO MANUALMENTE SU SENDAPP!');
      } else {
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n✅ Webhook probabilmente configurato!');
      }
      
    } catch (error: any) {
      console.error('❌ Errore chiamata API:', error.message);
    }
    
    // 3. Test immediato del webhook
    console.log('\n🧪 TEST WEBHOOK LOCALE...');
    
    try {
      const testPayload = {
        instance_id: instanceId,
        data: {
          event: 'test',
          timestamp: new Date().toISOString(),
          message: 'Test nuovo webhook ngrok'
        }
      };
      
      // Test locale
      const localResponse = await axios.post(
        'http://localhost:3200/api/whatsapp/webhook',
        testPayload
      );
      console.log('✅ Backend risponde correttamente:', localResponse.data);
      
      // Test via ngrok
      console.log('\n🌐 Test via ngrok...');
      const ngrokResponse = await axios.post(
        WEBHOOK_URL_COMPLETO,
        testPayload,
        { timeout: 5000 }
      );
      console.log('✅ Ngrok tunnel funziona:', ngrokResponse.data);
      
    } catch (error: any) {
      console.log('⚠️  Test webhook:', error.message);
    }
    
    // 4. Istruzioni finali
    console.log('\n' + '='.repeat(50));
    console.log('📌 CONFIGURAZIONE MANUALE SU SENDAPP');
    console.log('='.repeat(50));
    console.log('\nSE IL WEBHOOK NON FUNZIONA ANCORA:');
    console.log('');
    console.log('1. VAI SU: https://app.sendapp.cloud');
    console.log('2. FAI LOGIN');
    console.log('3. CERCA: Webhook Settings / API / Instance Settings');
    console.log('4. INSERISCI QUESTO URL ESATTO:');
    console.log('');
    console.log('   👉 ' + WEBHOOK_URL_COMPLETO);
    console.log('');
    console.log('5. ASSICURATI che sia:');
    console.log('   ✅ Enabled/Attivo');
    console.log('   ✅ Instance ID: ' + instanceId);
    console.log('6. SALVA');
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 COME VERIFICARE CHE FUNZIONA');
    console.log('='.repeat(50));
    console.log('');
    console.log('1. APRI: http://localhost:4040');
    console.log('   (Interfaccia web di ngrok)');
    console.log('');
    console.log('2. INVIA un messaggio WhatsApp al numero connesso');
    console.log('');
    console.log('3. DOVRESTI VEDERE:');
    console.log('   - Su ngrok: una richiesta POST a /api/whatsapp/webhook');
    console.log('   - Nel backend: "📨 Webhook WhatsApp ricevuto"');
    console.log('   - Nella dashboard: il messaggio apparire');
    
    console.log('\n✅ Script completato!');
    console.log('\n⏰ ADESSO:');
    console.log('1. Vai su http://localhost:4040 per monitorare');
    console.log('2. Invia un messaggio di test');
    console.log('3. Se non vedi nulla, configura MANUALMENTE su SendApp!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui subito
configureNewNgrokUrl().catch(console.error);
