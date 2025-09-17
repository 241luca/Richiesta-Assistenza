#!/usr/bin/env ts-node

/**
 * Script di diagnostica WhatsApp - Trova il vero problema
 * Data: 16 Settembre 2025
 * Problema: Messaggi inviati appaiono come ricevuti
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

async function diagnoseWhatsApp() {
  try {
    console.log('\n🔍 DIAGNOSTICA COMPLETA WHATSAPP');
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
    
    console.log('📱 CONFIGURAZIONE ATTUALE:');
    console.log('- Token:', apiKey.key);
    console.log('- Instance ID:', config?.instanceId);
    console.log('- Webhook URL:', config?.webhookUrl);
    console.log('- Base URL:', config?.baseURL);
    console.log('');
    
    // 2. Controlla ultimi messaggi nel database
    console.log('📨 ULTIMI 5 MESSAGGI NEL DATABASE:');
    console.log('=====================================');
    const messages = await prisma.whatsAppMessage.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (messages.length === 0) {
      console.log('Nessun messaggio trovato nel database');
    } else {
      for (const msg of messages) {
        console.log(`\n[${msg.createdAt.toLocaleString()}]`);
        console.log(`📱 Da: ${msg.senderNumber} → A: ${msg.recipientNumber}`);
        console.log(`🔄 Direzione: ${msg.direction === 'inbound' ? '📥 RICEVUTO' : '📤 INVIATO'}`);
        console.log(`📊 Stato: ${msg.status}`);
        console.log(`💬 Testo: "${msg.content?.substring(0, 100)}..."`);
        console.log(`🆔 Message ID: ${msg.messageId}`);
        console.log('---');
      }
    }
    
    // 3. Test connessione SendApp
    console.log('\n\n🌐 TEST CONNESSIONE SENDAPP:');
    console.log('=====================================');
    try {
      const testUrl = `${config.baseURL}/get_connection_status`;
      console.log('Chiamando:', testUrl);
      
      const response = await axios.get(testUrl, {
        params: {
          instance_id: config.instanceId,
          access_token: apiKey.key
        },
        timeout: 10000
      });
      
      console.log('✅ Risposta ricevuta da SendApp!');
      
      // Analizza la risposta
      const status = response.data;
      if (status?.status === 'connected' || status?.connected === true) {
        console.log('✅ WhatsApp CONNESSO!');
      } else {
        console.log('⚠️  WhatsApp NON connesso o stato incerto');
      }
      
      console.log('\nDettagli connessione:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error('❌ Errore test connessione:', error.message);
      if (error.response) {
        console.log('Risposta errore:', error.response.data);
      }
    }
    
    // 4. Test invio messaggio
    console.log('\n\n📤 TEST INVIO MESSAGGIO:');
    console.log('=====================================');
    
    const testSend = await question('Vuoi fare un test di invio? (s/n): ');
    
    if (testSend.toLowerCase() === 's') {
      const testNumber = await question('Inserisci numero destinatario (con prefisso, es: 393331234567): ');
      
      if (testNumber) {
        try {
          console.log('\n📤 Invio messaggio di test...');
          
          const sendUrl = `${config.baseURL}/send`;
          const payload = {
            instance_id: config.instanceId,
            access_token: apiKey.key,
            number: testNumber,
            type: 'text',
            message: `Test diagnostica WhatsApp - ${new Date().toLocaleTimeString()}`
          };
          
          console.log('Payload invio:', JSON.stringify(payload, null, 2));
          
          const response = await axios.post(sendUrl, payload);
          
          console.log('✅ Risposta invio:', JSON.stringify(response.data, null, 2));
          
          // Salva nel database come OUTBOUND
          await prisma.whatsAppMessage.create({
            data: {
              messageId: response.data?.message_id || `test_${Date.now()}`,
              senderNumber: 'SISTEMA',
              recipientNumber: testNumber,
              content: payload.message,
              direction: 'outbound',  // IMPORTANTE: deve essere outbound!
              status: 'sent',
              rawData: response.data
            }
          });
          
          console.log('✅ Messaggio salvato nel database come OUTBOUND');
          
        } catch (error: any) {
          console.error('❌ Errore invio:', error.message);
          if (error.response) {
            console.log('Dettagli errore:', error.response.data);
          }
        }
      }
    }
    
    // 5. Analisi problema
    console.log('\n\n🔍 ANALISI DEL PROBLEMA:');
    console.log('=====================================');
    
    // Conta messaggi per direzione
    const inboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'inbound' }
    });
    
    const outboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'outbound' }
    });
    
    console.log(`📥 Messaggi RICEVUTI (inbound): ${inboundCount}`);
    console.log(`📤 Messaggi INVIATI (outbound): ${outboundCount}`);
    
    if (outboundCount === 0 && inboundCount > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICATO:');
      console.log('Tutti i messaggi sono salvati come "inbound" (ricevuti)!');
      console.log('Probabilmente il webhook sta processando male i messaggi inviati.');
      
      console.log('\n💡 SOLUZIONI CONSIGLIATE:');
      console.log('1. Verifica che il webhook su SendApp punti a:', config?.webhookUrl);
      console.log('2. Controlla che ngrok sia attivo e funzionante');
      console.log('3. Verifica nel codice del webhook (whatsapp.service.ts) la logica di processIncomingMessage()');
      console.log('4. Potrebbe esserci un problema nel determinare la direzione del messaggio');
    }
    
    // 6. Controllo webhook
    console.log('\n\n🔗 VERIFICA WEBHOOK:');
    console.log('=====================================');
    console.log('URL configurato:', config?.webhookUrl);
    
    if (config?.webhookUrl?.includes('ngrok')) {
      console.log('✅ Stai usando ngrok');
      console.log('\n📌 Assicurati che:');
      console.log('1. ngrok sia in esecuzione: ngrok http 3200');
      console.log('2. L\'URL ngrok non sia cambiato');
      console.log('3. Il webhook sia registrato su SendApp con questo URL');
    }
    
    console.log('\n\n✅ Diagnostica completata!');
    
    // 7. Suggerimenti finali
    console.log('\n📚 PROSSIMI PASSI CONSIGLIATI:');
    console.log('1. Se tutti i messaggi appaiono come "inbound", controlla il codice del webhook');
    console.log('2. Verifica su SendApp che il webhook sia configurato correttamente');
    console.log('3. Prova a disabilitare e riabilitare il webhook');
    console.log('4. Controlla i log del backend quando invii un messaggio');
    
  } catch (error) {
    console.error('❌ Errore diagnostica:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
diagnoseWhatsApp().catch(console.error);
