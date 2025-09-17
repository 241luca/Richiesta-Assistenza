#!/usr/bin/env ts-node

/**
 * CONFIGURAZIONE WEBHOOK SENDAPP - VERSIONE DEFINITIVA
 * Risolve il problema del webhook che non arriva a ngrok
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

async function setupWebhookDefinitivo() {
  try {
    console.log('\n🔧 CONFIGURAZIONE DEFINITIVA WEBHOOK SENDAPP');
    console.log('=============================================\n');
    console.log('⚠️  PROBLEMA: Ngrok non riceve webhook da 14 ore!');
    console.log('   Dobbiamo configurare correttamente il webhook su SendApp.\n');
    
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
    
    console.log('📱 DATI ATTUALI:');
    console.log('- Token:', token);
    console.log('- Instance ID:', instanceId);
    console.log('- Webhook salvato:', config?.webhookUrl || 'NON CONFIGURATO');
    console.log('');
    
    // Step 1: Verifica ngrok
    console.log('📡 STEP 1: VERIFICA NGROK');
    console.log('==========================');
    console.log('1. Apri un NUOVO terminale');
    console.log('2. Esegui: ngrok http 3200');
    console.log('3. Vai su: http://localhost:4040');
    console.log('4. Copia l\'URL HTTPS (esempio: https://abc123.ngrok-free.app)');
    console.log('');
    
    const ngrokUrl = await question('📌 Incolla qui l\'URL ngrok ATTUALE (senza /api/...): ');
    
    if (!ngrokUrl || !ngrokUrl.includes('ngrok')) {
      console.error('❌ URL ngrok non valido!');
      process.exit(1);
    }
    
    const webhookUrl = `${ngrokUrl.trim()}/api/whatsapp/webhook`;
    
    console.log('\n✅ Webhook URL completo:', webhookUrl);
    
    // Step 2: Salva nel database
    console.log('\n📡 STEP 2: SALVATAGGIO CONFIGURAZIONE');
    console.log('======================================');
    
    const updatedConfig = {
      ...config,
      webhookUrl: webhookUrl,
      instanceId: instanceId,
      baseURL: 'https://app.sendapp.cloud/api'
    };
    
    await prisma.apiKey.update({
      where: { service: 'whatsapp' },
      data: {
        permissions: updatedConfig,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Salvato nel database locale');
    
    // Step 3: Configura su SendApp via API
    console.log('\n📡 STEP 3: CONFIGURAZIONE SU SENDAPP VIA API');
    console.log('=============================================');
    
    const setWebhookUrl = 'https://app.sendapp.cloud/api/set_webhook';
    
    console.log('Chiamata API SendApp...');
    console.log('URL:', setWebhookUrl);
    console.log('Parametri:');
    console.log('- webhook_url:', webhookUrl);
    console.log('- enable: true');
    console.log('- instance_id:', instanceId);
    console.log('- access_token:', token);
    
    try {
      const response = await axios.get(setWebhookUrl, {
        params: {
          webhook_url: webhookUrl,
          enable: 'true',  // DEVE essere stringa 'true'
          instance_id: instanceId,
          access_token: token
        },
        timeout: 10000
      });
      
      console.log('\n📡 Risposta SendApp:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data?.success || response.data?.status === 'success' || response.status === 200) {
        console.log('\n✅ WEBHOOK CONFIGURATO CON SUCCESSO SU SENDAPP!');
      } else {
        console.log('\n⚠️  Risposta incerta, verifica manualmente su SendApp');
      }
      
    } catch (error: any) {
      console.error('\n❌ Errore configurazione webhook:', error.message);
      
      if (error.response?.data) {
        console.log('Dettagli errore:', error.response.data);
      }
      
      console.log('\n⚠️  Se l\'API non funziona, configura MANUALMENTE su SendApp!');
    }
    
    // Step 4: Test immediato
    console.log('\n🧪 STEP 4: TEST IMMEDIATO');
    console.log('==========================');
    
    // Test webhook locale
    console.log('Test webhook locale...');
    try {
      const testPayload = {
        instance_id: instanceId,
        data: {
          event: 'test',
          message: 'Test webhook ' + new Date().toISOString()
        }
      };
      
      const localUrl = `http://localhost:3200/api/whatsapp/webhook`;
      await axios.post(localUrl, testPayload);
      console.log('✅ Backend risponde correttamente');
    } catch (error) {
      console.log('⚠️  Backend potrebbe non essere in esecuzione');
    }
    
    // Step 5: Configurazione manuale
    console.log('\n📌 STEP 5: CONFIGURAZIONE MANUALE SU SENDAPP');
    console.log('==============================================');
    console.log('SE IL WEBHOOK ANCORA NON FUNZIONA, FAI QUESTO:');
    console.log('');
    console.log('1. VAI SU: https://app.sendapp.cloud');
    console.log('2. FAI LOGIN con le tue credenziali');
    console.log('3. CERCA: "Webhook" o "API Settings" o "Integrations"');
    console.log('4. INSERISCI questo URL esatto:');
    console.log('   👉 ' + webhookUrl);
    console.log('5. ASSICURATI che sia:');
    console.log('   ✅ Enabled/Attivo');
    console.log('   ✅ Tutti gli eventi selezionati');
    console.log('6. SALVA le modifiche');
    
    // Step 6: Verifica finale
    console.log('\n🔍 STEP 6: VERIFICA FINALE');
    console.log('===========================');
    console.log('Per verificare che funzioni:');
    console.log('');
    console.log('1. CONTROLLA NGROK:');
    console.log('   - Vai su: http://localhost:4040');
    console.log('   - Guarda la sezione "HTTP Requests"');
    console.log('');
    console.log('2. INVIA UN MESSAGGIO:');
    console.log('   - Dal tuo telefono, invia un messaggio WhatsApp al numero connesso');
    console.log('   - Scrivi: "TEST WEBHOOK ' + new Date().toLocaleTimeString() + '"');
    console.log('');
    console.log('3. VERIFICA:');
    console.log('   - Su ngrok (localhost:4040) dovresti vedere una richiesta POST');
    console.log('   - Nel terminal del backend dovresti vedere "📨 Webhook WhatsApp ricevuto"');
    console.log('   - Nella dashboard dovrebbe apparire il messaggio');
    
    // Step 7: Alternative
    console.log('\n💡 ALTERNATIVA CON WEBHOOK.SITE');
    console.log('==================================');
    console.log('Se ancora non funziona:');
    console.log('1. Vai su: https://webhook.site');
    console.log('2. Copia l\'URL che ti dà');
    console.log('3. Configuralo su SendApp');
    console.log('4. Invia un messaggio WhatsApp');
    console.log('5. Se appare su webhook.site, il problema è ngrok');
    console.log('6. Se NON appare, il problema è SendApp');
    
    console.log('\n✅ Configurazione completata!');
    console.log('\n⏰ ORA ASPETTA 30 SECONDI e poi:');
    console.log('   1. Invia un messaggio di test');
    console.log('   2. Controlla ngrok (http://localhost:4040)');
    console.log('   3. Se non vedi nulla, configura MANUALMENTE su SendApp!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
setupWebhookDefinitivo().catch(console.error);
