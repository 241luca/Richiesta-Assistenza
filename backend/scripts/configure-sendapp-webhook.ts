#!/usr/bin/env ts-node

/**
 * Configura Webhook su SendApp usando l'API ufficiale
 * Documentazione SendApp API
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

async function configureSendAppWebhook() {
  try {
    console.log('\n🔧 CONFIGURAZIONE WEBHOOK SU SENDAPP');
    console.log('======================================\n');
    
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
    
    console.log('📱 Configurazione attuale:');
    console.log('- Token:', token);
    console.log('- Instance ID:', instanceId);
    console.log('- Webhook salvato:', config?.webhookUrl || 'NON CONFIGURATO');
    console.log('');
    
    // Verifica ngrok
    console.log('🌐 VERIFICA NGROK:');
    console.log('1. Assicurati che ngrok sia in esecuzione');
    console.log('2. Vai su http://localhost:4040 per vedere l\'URL');
    console.log('3. L\'URL dovrebbe essere tipo: https://abc123.ngrok-free.app');
    console.log('');
    
    const ngrokUrl = await question('📡 Inserisci l\'URL di ngrok (senza /api/whatsapp/webhook): ');
    
    if (!ngrokUrl || ngrokUrl.trim() === '') {
      console.error('❌ URL ngrok richiesto!');
      process.exit(1);
    }
    
    // Costruisci webhook URL completo
    const webhookUrl = `${ngrokUrl.trim()}/api/whatsapp/webhook`;
    
    console.log('\n📡 Webhook URL completo:', webhookUrl);
    
    // Chiedi conferma
    const conferma = await question('\n✅ Vuoi configurare questo webhook su SendApp? (s/n): ');
    
    if (conferma.toLowerCase() !== 's' && conferma.toLowerCase() !== 'si') {
      console.log('❌ Operazione annullata');
      process.exit(0);
    }
    
    // 1. Salva nel nostro database
    console.log('\n💾 Salvataggio nel database locale...');
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
    console.log('✅ Salvato nel database');
    
    // 2. Configura su SendApp usando l'API
    console.log('\n🌐 Configurazione webhook su SendApp...');
    
    try {
      // Usa l'API set_webhook di SendApp
      const sendAppUrl = 'https://app.sendapp.cloud/api/set_webhook';
      
      // Parametri secondo la documentazione
      const params = {
        webhook_url: webhookUrl,
        enable: 'true',  // IMPORTANTE: deve essere stringa 'true'
        instance_id: instanceId,
        access_token: token
      };
      
      console.log('Chiamata API con parametri:', params);
      
      // Fai la chiamata GET (come da documentazione)
      const response = await axios.get(sendAppUrl, { params });
      
      console.log('\n✅ WEBHOOK CONFIGURATO SU SENDAPP!');
      console.log('Risposta:', JSON.stringify(response.data, null, 2));
      
      // 3. Test di verifica
      console.log('\n🔍 VERIFICA CONFIGURAZIONE:');
      
      // Prova a ottenere lo stato
      const statusUrl = 'https://app.sendapp.cloud/api/get_connection_status';
      const statusResponse = await axios.get(statusUrl, {
        params: {
          instance_id: instanceId,
          access_token: token
        }
      });
      
      console.log('Stato connessione:', JSON.stringify(statusResponse.data, null, 2));
      
    } catch (error: any) {
      console.error('\n❌ Errore configurazione webhook su SendApp:');
      console.error('Dettagli:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        console.log('\n⚠️  Possibili cause:');
        console.log('1. Instance ID non valido o non trovato');
        console.log('2. Token non corretto');
        console.log('3. L\'istanza potrebbe essere disconnessa');
      }
    }
    
    console.log('\n📱 TEST FINALE:');
    console.log('=====================================');
    console.log('1. Invia un messaggio al tuo numero WhatsApp dal telefono');
    console.log('2. Controlla nel terminale del backend se arriva il webhook');
    console.log('3. Verifica nella dashboard se appare il messaggio');
    console.log('');
    console.log('📌 Se i messaggi NON arrivano:');
    console.log('- Verifica che ngrok sia attivo');
    console.log('- Controlla i log del backend');
    console.log('- Assicurati che il telefono sia connesso');
    console.log('');
    console.log('✅ Configurazione completata!');
    
    // 4. Mostra riepilogo
    console.log('\n📊 RIEPILOGO CONFIGURAZIONE:');
    console.log('=====================================');
    console.log('🔑 Token:', token);
    console.log('🆔 Instance ID:', instanceId);
    console.log('📡 Webhook URL:', webhookUrl);
    console.log('✅ Webhook abilitato: SI');
    console.log('');
    console.log('🎯 Ora dovresti ricevere:');
    console.log('- Messaggi in arrivo (inbound)');
    console.log('- Conferme di invio (status updates)');
    console.log('- Stati connessione');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
configureSendAppWebhook().catch(console.error);
