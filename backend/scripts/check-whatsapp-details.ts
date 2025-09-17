#!/usr/bin/env ts-node

/**
 * Verifica dettagliata istanza WhatsApp
 * Controlla quale numero è realmente connesso
 */

import { prisma } from '../src/config/database';
import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkWhatsAppDetails() {
  try {
    console.log('\n🔍 VERIFICA DETTAGLIATA WHATSAPP');
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
    const baseURL = config?.baseURL || 'https://app.sendapp.cloud/api';
    
    console.log('📱 CONFIGURAZIONE LOCALE:');
    console.log('- Instance ID:', instanceId);
    console.log('- Token:', token);
    console.log('- Base URL:', baseURL);
    console.log('- Webhook:', config?.webhookUrl);
    console.log('');
    
    // 1. Verifica stato connessione
    console.log('🔌 VERIFICA CONNESSIONE:');
    try {
      const statusUrl = `${baseURL}/get_connection_status`;
      const response = await axios.get(statusUrl, {
        params: {
          instance_id: instanceId,
          access_token: token
        }
      });
      
      console.log('Stato:', JSON.stringify(response.data, null, 2));
      
      // Estrai il numero se disponibile
      const phoneNumber = response.data?.jid?.split('@')[0] || 
                         response.data?.phone_number ||
                         response.data?.number ||
                         'Non trovato';
      
      console.log('\n📞 NUMERO CONNESSO:', phoneNumber);
      
      if (phoneNumber && phoneNumber !== 'Non trovato') {
        console.log('\n⚠️  VERIFICA:');
        console.log(`   Questo è il numero NUOVO che volevi? ${phoneNumber}`);
        console.log('   Se NO, c\'è un problema di sessione!');
      }
      
    } catch (error: any) {
      console.error('❌ Errore verifica stato:', error.response?.data || error.message);
    }
    
    // 2. Prova a ottenere info dispositivo
    console.log('\n📱 VERIFICA DISPOSITIVO:');
    try {
      const deviceUrl = `${baseURL}/get_device_info`;
      const response = await axios.get(deviceUrl, {
        params: {
          instance_id: instanceId,
          access_token: token
        }
      });
      
      console.log('Info dispositivo:', JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.log('⚠️  Info dispositivo non disponibile');
    }
    
    // 3. Verifica istanze su SendApp
    console.log('\n📋 VERIFICA ISTANZE ATTIVE:');
    try {
      // Prova a listare tutte le istanze (se l'API lo supporta)
      const listUrl = `${baseURL}/list_instances`;
      const response = await axios.get(listUrl, {
        params: {
          access_token: token
        }
      });
      
      console.log('Istanze trovate:', JSON.stringify(response.data, null, 2));
      
      // Controlla se ci sono istanze duplicate
      if (Array.isArray(response.data)) {
        const instances = response.data;
        if (instances.length > 1) {
          console.log('\n⚠️  ATTENZIONE: Trovate MULTIPLE istanze!');
          console.log('   Questo potrebbe causare conflitti.');
          console.log('   Considera di eliminare quelle non utilizzate.');
        }
      }
      
    } catch (error: any) {
      console.log('ℹ️  Lista istanze non disponibile (API potrebbe non supportarlo)');
    }
    
    // 4. Test invio messaggio di verifica
    console.log('\n📤 TEST INVIO MESSAGGIO:');
    console.log('Vuoi inviare un messaggio di test per verificare da quale numero parte?');
    
    rl.question('Inserisci un numero per il test (o premi INVIO per saltare): ', async (testNumber) => {
      if (testNumber && testNumber.trim() !== '') {
        try {
          console.log('\n📤 Invio messaggio di test...');
          
          const sendUrl = `${baseURL}/send`;
          const testMessage = `Test verifica numero - ${new Date().toLocaleTimeString()}`;
          
          const response = await axios.post(sendUrl, {
            instance_id: instanceId,
            access_token: token,
            number: testNumber.trim(),
            type: 'text',
            message: testMessage
          });
          
          console.log('✅ Messaggio inviato!');
          console.log('Risposta:', JSON.stringify(response.data, null, 2));
          
          console.log('\n📱 VERIFICA SUL TELEFONO DESTINATARIO:');
          console.log('   Da quale numero è arrivato il messaggio?');
          console.log('   - Se dal VECCHIO numero: problema di sessione!');
          console.log('   - Se dal NUOVO numero: tutto OK!');
          
        } catch (error: any) {
          console.error('❌ Errore invio test:', error.response?.data || error.message);
        }
      }
      
      // 5. Suggerimenti finali
      console.log('\n💡 ANALISI E SUGGERIMENTI:');
      console.log('=====================================');
      
      console.log('\nSe i messaggi partono ancora dal numero VECCHIO:');
      console.log('1. VAI SU SENDAPP CLOUD (https://app.sendapp.cloud)');
      console.log('2. Verifica quale numero è associato all\'Instance ID:', instanceId);
      console.log('3. Controlla se ci sono ALTRE istanze attive');
      console.log('4. Potrebbe essere necessario:');
      console.log('   - Eliminare TUTTE le istanze');
      console.log('   - Creare una NUOVA istanza pulita');
      console.log('   - Aggiornare Instance ID nel nostro sistema');
      
      console.log('\n📌 AZIONI CONSIGLIATE:');
      console.log('1. Accedi a SendApp Cloud');
      console.log('2. Vai nella sezione "Instances" o "Dispositivi"');
      console.log('3. Verifica quale numero è mostrato per l\'istanza:', instanceId);
      console.log('4. Se è il numero VECCHIO:');
      console.log('   - Clicca su "Logout" o "Disconnect"');
      console.log('   - Poi "Reconnect" o "Get QR Code"');
      console.log('   - Scansiona con il NUOVO telefono');
      
      console.log('\n✅ Script completato!');
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
    rl.close();
    process.exit(1);
  }
}

// Esegui
checkWhatsAppDetails().catch(console.error);
