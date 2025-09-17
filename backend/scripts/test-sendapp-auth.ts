#!/usr/bin/env ts-node

/**
 * Test e Fix configurazione SendApp
 * Corregge problemi di autenticazione
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

async function testSendAppAuth() {
  try {
    console.log('\n🔍 TEST AUTENTICAZIONE SENDAPP');
    console.log('====================================\n');
    
    // Recupera configurazione
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
    
    console.log('📱 CONFIGURAZIONE ATTUALE:');
    console.log('- Token:', token);
    console.log('- Instance ID:', instanceId);
    console.log('');
    
    // Test 1: Verifica token con create_instance (non crea, solo verifica)
    console.log('🔑 TEST 1: VERIFICA TOKEN');
    console.log('=========================');
    try {
      const testUrl = `https://app.sendapp.cloud/api/create_instance`;
      console.log('Chiamando:', testUrl);
      console.log('Con token:', token);
      
      const response = await axios.get(testUrl, {
        params: {
          access_token: token
        },
        validateStatus: () => true // Accetta tutti gli status
      });
      
      if (response.status === 200) {
        console.log('✅ Token VALIDO!');
        
        // Se riceve dati JSON
        if (response.data && typeof response.data === 'object') {
          console.log('Risposta:', JSON.stringify(response.data, null, 2));
          
          // Potrebbe restituire un nuovo instance ID
          if (response.data.instance_id) {
            console.log('\n⚠️  ATTENZIONE: SendApp ha creato/restituito un Instance ID!');
            console.log('   Nuovo Instance ID:', response.data.instance_id);
            console.log('   Vuoi usare questo? Dovrai rifare il QR code!');
          }
        }
      } else if (response.data?.includes('<!DOCTYPE html>')) {
        console.log('❌ Token NON VALIDO o SCADUTO!');
        console.log('   SendApp restituisce la pagina di login');
        console.log('   Devi ottenere un nuovo token!');
      } else {
        console.log('⚠️  Risposta inaspettata:', response.status);
        console.log('Data:', response.data);
      }
      
    } catch (error: any) {
      console.error('❌ Errore test token:', error.message);
    }
    
    // Test 2: Test con parametri corretti per get_connection_status
    console.log('\n🔌 TEST 2: CONNECTION STATUS');
    console.log('=============================');
    
    // Prova con GET (come da documentazione)
    try {
      const statusUrl = `https://app.sendapp.cloud/api/get_connection_status`;
      console.log('Metodo: GET');
      console.log('URL:', statusUrl);
      console.log('Params: instance_id=' + instanceId + ', access_token=' + token);
      
      const response = await axios.get(statusUrl, {
        params: {
          instance_id: instanceId,
          access_token: token
        },
        validateStatus: () => true
      });
      
      if (response.status === 200 && !response.data?.includes('<!DOCTYPE html>')) {
        console.log('✅ API risponde correttamente!');
        console.log('Stato:', JSON.stringify(response.data, null, 2));
      } else if (response.data?.includes('<!DOCTYPE html>')) {
        console.log('❌ Autenticazione fallita - ricevo pagina login');
      } else {
        console.log('⚠️  Status:', response.status);
        console.log('Response:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Errore:', error.message);
    }
    
    // Test 3: Verifica webhook configurato
    console.log('\n📡 TEST 3: VERIFICA WEBHOOK');
    console.log('============================');
    
    console.log('Webhook configurato nel nostro sistema:', config?.webhookUrl);
    
    // Configura webhook via API
    const setupWebhook = await question('\nVuoi (ri)configurare il webhook su SendApp? (s/n): ');
    
    if (setupWebhook.toLowerCase() === 's') {
      const ngrokUrl = await question('Inserisci URL ngrok attuale (es: https://abc123.ngrok-free.app): ');
      
      if (ngrokUrl) {
        const webhookUrl = `${ngrokUrl.trim()}/api/whatsapp/webhook`;
        
        try {
          console.log('\n📡 Configurazione webhook su SendApp...');
          const setWebhookUrl = `https://app.sendapp.cloud/api/set_webhook`;
          
          const response = await axios.get(setWebhookUrl, {
            params: {
              webhook_url: webhookUrl,
              enable: 'true',
              instance_id: instanceId,
              access_token: token
            },
            validateStatus: () => true
          });
          
          if (response.status === 200 && !response.data?.includes('<!DOCTYPE html>')) {
            console.log('✅ Webhook configurato con successo!');
            console.log('Risposta:', JSON.stringify(response.data, null, 2));
            
            // Aggiorna anche nel database
            const updatedConfig = {
              ...config,
              webhookUrl: webhookUrl
            };
            
            await prisma.apiKey.update({
              where: { service: 'whatsapp' },
              data: {
                permissions: updatedConfig,
                updatedAt: new Date()
              }
            });
            
            console.log('✅ Salvato anche nel database locale');
          } else {
            console.log('❌ Configurazione webhook fallita');
            if (response.data?.includes('<!DOCTYPE html>')) {
              console.log('   Problema di autenticazione');
            }
          }
        } catch (error: any) {
          console.error('❌ Errore configurazione webhook:', error.message);
        }
      }
    }
    
    // Test finale: invia messaggio di test
    console.log('\n📤 TEST FINALE: INVIO MESSAGGIO');
    console.log('================================');
    
    const testSend = await question('Vuoi inviare un messaggio di test? (s/n): ');
    
    if (testSend.toLowerCase() === 's') {
      const testNumber = await question('Numero destinatario (con prefisso, es: 393331234567): ');
      
      if (testNumber) {
        try {
          const sendUrl = `https://app.sendapp.cloud/api/send`;
          const params = {
            number: testNumber.trim(),
            type: 'text',
            message: `Test SendApp Auth - ${new Date().toLocaleTimeString()}`,
            instance_id: instanceId,
            access_token: token
          };
          
          console.log('\n📤 Invio con GET (come da doc)...');
          const response = await axios.get(sendUrl, { 
            params,
            validateStatus: () => true 
          });
          
          if (response.status === 200 && !response.data?.includes('<!DOCTYPE html>')) {
            console.log('✅ Messaggio inviato!');
            console.log('Risposta:', JSON.stringify(response.data, null, 2));
          } else {
            console.log('❌ Invio fallito');
            console.log('Status:', response.status);
            if (response.data?.includes('<!DOCTYPE html>')) {
              console.log('Problema di autenticazione');
            }
          }
        } catch (error: any) {
          console.error('❌ Errore invio:', error.message);
        }
      }
    }
    
    // Analisi finale
    console.log('\n📊 ANALISI FINALE');
    console.log('==================');
    
    // Controlla messaggi nel database
    const messageCount = await prisma.whatsAppMessage.count();
    const inbound = await prisma.whatsAppMessage.count({ where: { direction: 'inbound' }});
    const outbound = await prisma.whatsAppMessage.count({ where: { direction: 'outbound' }});
    
    console.log(`Totale messaggi nel DB: ${messageCount}`);
    console.log(`- Ricevuti (inbound): ${inbound}`);
    console.log(`- Inviati (outbound): ${outbound}`);
    
    if (inbound === 0) {
      console.log('\n❌ NESSUN messaggio ricevuto!');
      console.log('   Il webhook probabilmente non funziona.');
    }
    
    console.log('\n💡 SUGGERIMENTI:');
    console.log('=================');
    console.log('1. Se ricevi pagine HTML invece di JSON:');
    console.log('   → Il token potrebbe essere scaduto');
    console.log('   → Vai su SendApp e genera un nuovo token');
    console.log('');
    console.log('2. Se il webhook non funziona:');
    console.log('   → Verifica che ngrok sia attivo');
    console.log('   → Controlla i log del backend');
    console.log('   → Prova webhook.site per testare');
    console.log('');
    console.log('3. Se tutto sembra OK ma non ricevi messaggi:');
    console.log('   → Potrebbe essere un problema di Instance ID');
    console.log('   → Prova a rifare il QR code');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
testSendAppAuth().catch(console.error);
