#!/usr/bin/env node

/**
 * Script per configurare WhatsApp via Evolution API
 * Versione per VPS con Evolution API 2.2.3
 * 
 * Uso: node configure-whatsapp-api.js
 */

const axios = require('axios');

// Configurazione Evolution API sul VPS
const EVOLUTION_CONFIG = {
  apiUrl: 'http://37.27.89.35:8080',
  apiKey: 'evolution_key_luca_2025_secure_21806',
  instanceName: 'assistenza',
  webhookUrl: 'http://37.27.89.35:3200/api/whatsapp/webhook'
};

// Configurazione Backend locale (per development)
const LOCAL_CONFIG = {
  backendUrl: 'http://localhost:3200',
  apiUrl: 'http://localhost:8080',
  apiKey: 'evolution_secure_key_2025_luca_mambelli'
};

// Usa VPS in produzione, locale in dev
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const config = isProduction ? EVOLUTION_CONFIG : LOCAL_CONFIG;

console.log(`\n🔧 Configurazione WhatsApp via Evolution API`);
console.log(`📍 Ambiente: ${isProduction ? 'PRODUZIONE (VPS)' : 'SVILUPPO (Locale)'}`);
console.log(`🌐 Evolution API: ${config.apiUrl}`);
console.log(`🔑 Instance: ${config.instanceName || 'main'}\n`);

// Client API
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'apikey': config.apiKey,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * 1. Crea istanza WhatsApp
 */
async function createInstance() {
  console.log('📱 Creazione istanza WhatsApp...');
  
  try {
    const response = await api.post('/instance/create', {
      instanceName: config.instanceName,
      token: config.apiKey,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    });

    console.log('✅ Istanza creata con successo!');
    console.log('📊 Dettagli:', response.data?.instance);
    
    // Se c'è un QR code, mostralo
    if (response.data?.qrcode) {
      console.log('\n📲 QR CODE DISPONIBILE!');
      console.log('Per visualizzarlo meglio, usa: node get-qr-code.js');
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 409) {
      console.log('ℹ️  Istanza già esistente - OK!');
      return { status: 'existing' };
    }
    console.error('❌ Errore creazione istanza:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 2. Configura webhook
 */
async function configureWebhook() {
  console.log('\n🔗 Configurazione webhook...');
  
  try {
    const response = await api.post(`/webhook/set/${config.instanceName}`, {
      enabled: true,
      url: config.webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events: [
        'APPLICATION_STARTUP',
        'QRCODE_UPDATED', 
        'MESSAGES_SET',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE', 
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
        'CALL'
      ]
    });

    console.log('✅ Webhook configurato!');
    console.log(`📍 URL: ${config.webhookUrl}`);
    return response.data;
  } catch (error) {
    console.error('❌ Errore configurazione webhook:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 3. Ottieni QR Code
 */
async function getQRCode() {
  console.log('\n📲 Recupero QR Code...');
  
  try {
    const response = await api.get(`/instance/connect/${config.instanceName}`);
    
    if (response.data?.qrcode?.base64) {
      console.log('✅ QR Code disponibile!');
      
      // Salva QR in un file HTML per visualizzazione facile
      const fs = require('fs');
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code - Richiesta Assistenza</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .qr-code {
            max-width: 300px;
            height: auto;
        }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            background: #f0f9ff;
            color: #0369a1;
        }
        .instructions {
            margin-top: 30px;
            text-align: left;
            color: #555;
        }
        .instructions li {
            margin: 10px 0;
        }
        .instance-info {
            margin-top: 20px;
            padding: 10px;
            background: #f8f8f8;
            border-radius: 5px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Connetti WhatsApp</h1>
        <p class="subtitle">Sistema Richiesta Assistenza</p>
        
        <div class="qr-container">
            <img src="${response.data.qrcode.base64}" alt="QR Code" class="qr-code">
        </div>
        
        <div class="status">
            ⏳ In attesa di scansione...
        </div>
        
        <ol class="instructions">
            <li>Apri WhatsApp sul tuo telefono</li>
            <li>Vai su <strong>Impostazioni → Dispositivi collegati</strong></li>
            <li>Tocca <strong>Collega un dispositivo</strong></li>
            <li>Scansiona questo QR code</li>
        </ol>
        
        <div class="instance-info">
            Instance: ${config.instanceName}<br>
            Server: ${config.apiUrl}
        </div>
    </div>
    
    <script>
        // Auto refresh ogni 20 secondi
        setTimeout(() => location.reload(), 20000);
    </script>
</body>
</html>`;
      
      fs.writeFileSync('whatsapp-qr.html', html);
      console.log('📄 QR Code salvato in: whatsapp-qr.html');
      console.log('🌐 Apri il file nel browser per scansionare il QR!');
      
      return response.data;
    } else {
      console.log('ℹ️  Nessun QR code disponibile (forse già connesso?)');
      return null;
    }
  } catch (error) {
    console.error('❌ Errore recupero QR:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. Verifica stato connessione
 */
async function checkStatus() {
  console.log('\n🔍 Verifica stato connessione...');
  
  try {
    const response = await api.get(`/instance/connectionState/${config.instanceName}`);
    
    const state = response.data?.instance?.state;
    console.log(`📊 Stato: ${state || 'sconosciuto'}`);
    
    if (state === 'open') {
      console.log('✅ WhatsApp CONNESSO e funzionante!');
      return true;
    } else {
      console.log('⏳ WhatsApp non ancora connesso');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore verifica stato:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 5. Test invio messaggio
 */
async function testMessage(number) {
  console.log('\n📤 Test invio messaggio...');
  
  const testNumber = number || '393123456789'; // Numero di test
  
  try {
    const response = await api.post(`/message/sendText/${config.instanceName}`, {
      number: testNumber,
      text: '🎉 Test messaggio dal Sistema Richiesta Assistenza!\n\n' +
            'Se ricevi questo messaggio, WhatsApp è configurato correttamente.',
      delay: 1000
    });

    console.log('✅ Messaggio di test inviato!');
    return response.data;
  } catch (error) {
    console.error('❌ Errore invio messaggio:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main - Esegui configurazione completa
 */
async function main() {
  try {
    console.log('═'.repeat(60));
    console.log('   CONFIGURAZIONE WHATSAPP - EVOLUTION API v2.2.3');
    console.log('═'.repeat(60));

    // 1. Crea istanza
    await createInstance();

    // 2. Configura webhook
    await configureWebhook();

    // 3. Ottieni QR Code
    await getQRCode();

    // 4. Verifica stato
    const isConnected = await checkStatus();

    if (isConnected) {
      // 5. Test messaggio (opzionale)
      if (process.argv.includes('--test')) {
        const testNumber = process.argv[process.argv.indexOf('--test') + 1];
        await testMessage(testNumber);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✨ Configurazione completata!');
    console.log('═'.repeat(60));

    console.log('\n📋 Prossimi passi:');
    console.log('1. Apri whatsapp-qr.html nel browser');
    console.log('2. Scansiona il QR code con WhatsApp');
    console.log('3. Verifica la connessione con: node check-whatsapp.js');
    console.log('4. Testa l\'invio: node test-whatsapp.js +393123456789');

  } catch (error) {
    console.error('\n❌ Configurazione fallita:', error.message);
    process.exit(1);
  }
}

// Esegui
main();
