#!/usr/bin/env node

/**
 * Script per configurare WhatsApp via Evolution API sul VPS
 * Esegui questo dal tuo Mac per configurare Evolution API sul server
 * 
 * Uso: node configure-evolution-vps.js
 */

const axios = require('axios');

// Configurazione Evolution API sul VPS
const VPS_CONFIG = {
  apiUrl: 'http://37.27.89.35:8080',
  apiKey: 'evolution_key_luca_2025_secure_21806',
  instanceName: 'assistenza',
  webhookUrl: 'http://37.27.89.35:3200/api/whatsapp/webhook'  // Per quando aggiornerai il VPS
};

console.log(`\n🔧 Configurazione WhatsApp su VPS da Mac locale`);
console.log(`📍 Evolution API VPS: ${VPS_CONFIG.apiUrl}`);
console.log(`🔑 Instance: ${VPS_CONFIG.instanceName}\n`);

// Client API per il VPS
const api = axios.create({
  baseURL: VPS_CONFIG.apiUrl,
  headers: {
    'apikey': VPS_CONFIG.apiKey,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * 1. Crea istanza WhatsApp
 */
async function createInstance() {
  console.log('📱 Creazione istanza WhatsApp sul VPS...');
  
  try {
    const response = await api.post('/instance/create', {
      instanceName: VPS_CONFIG.instanceName,
      token: VPS_CONFIG.apiKey,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    });

    console.log('✅ Istanza creata con successo!');
    
    // Se c'è un QR code, mostralo
    if (response.data?.qrcode?.base64) {
      console.log('\n📲 QR CODE DISPONIBILE!');
      await saveQRCode(response.data.qrcode.base64);
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 409) {
      console.log('ℹ️  Istanza già esistente - Recupero QR code...');
      await getQRCode();
      return { status: 'existing' };
    }
    console.error('❌ Errore creazione istanza:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 2. Configura webhook (per ora punta a se stesso, poi lo cambieremo)
 */
async function configureWebhook() {
  console.log('\n🔗 Configurazione webhook...');
  
  // Per ora configuriamo un webhook di test
  const webhookUrl = VPS_CONFIG.webhookUrl;
  
  try {
    const response = await api.post(`/webhook/set/${VPS_CONFIG.instanceName}`, {
      enabled: true,
      url: webhookUrl,
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
    console.log(`📍 URL: ${webhookUrl}`);
    console.log('ℹ️  Nota: Dovrai aggiornare il webhook quando il sistema sul VPS sarà pronto');
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
  console.log('\n📲 Recupero QR Code dal VPS...');
  
  try {
    const response = await api.get(`/instance/connect/${VPS_CONFIG.instanceName}`);
    
    if (response.data?.qrcode?.base64) {
      console.log('✅ QR Code ricevuto!');
      await saveQRCode(response.data.qrcode.base64);
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
 * Salva QR Code in file HTML
 */
async function saveQRCode(base64QR) {
  const fs = require('fs');
  const path = require('path');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code - Evolution API VPS</title>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
        }
        
        .server-info {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 30px;
            color: #0369a1;
        }
        
        .server-info strong {
            color: #0c4a6e;
        }
        
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .qr-code {
            max-width: 300px;
            height: auto;
            display: block;
        }
        
        .status {
            padding: 15px;
            border-radius: 8px;
            background: #fef3c7;
            color: #92400e;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .pulse {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #f59e0b;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
            }
        }
        
        .instructions {
            text-align: left;
            color: #555;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .instructions h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .instructions ol {
            margin-left: 20px;
        }
        
        .instructions li {
            margin: 10px 0;
            line-height: 1.5;
        }
        
        .instructions strong {
            color: #333;
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 14px;
        }
        
        .timestamp {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 10px;
        }
        
        .success-message {
            display: none;
            background: #d1fae5;
            color: #065f46;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Connetti WhatsApp</h1>
        <p class="subtitle">Sistema Richiesta Assistenza - Evolution API</p>
        
        <div class="server-info">
            <strong>🖥️ Server VPS:</strong> 37.27.89.35:8080<br>
            <strong>📦 Instance:</strong> ${VPS_CONFIG.instanceName}<br>
            <strong>🔌 API:</strong> Evolution v2.2.3
        </div>
        
        <div class="qr-container">
            <img src="${base64QR}" alt="QR Code WhatsApp" class="qr-code">
        </div>
        
        <div class="status">
            <span class="pulse"></span>
            In attesa di scansione...
        </div>
        
        <div class="instructions">
            <h3>📋 Come connettere WhatsApp:</h3>
            <ol>
                <li>Apri <strong>WhatsApp</strong> sul tuo telefono</li>
                <li>Vai su <strong>Impostazioni</strong> (⚙️ in alto a destra)</li>
                <li>Tocca <strong>Dispositivi collegati</strong></li>
                <li>Tocca <strong>Collega un dispositivo</strong></li>
                <li>Punta la fotocamera verso questo QR code</li>
                <li>Attendi che la connessione sia completata</li>
            </ol>
        </div>
        
        <div class="success-message" id="success">
            ✅ WhatsApp connesso con successo!
        </div>
        
        <div class="footer">
            <strong>Importante:</strong> Mantieni WhatsApp aperto sul telefono<br>
            La connessione richiede che il telefono sia online
            
            <div class="timestamp">
                Generato: ${new Date().toLocaleString('it-IT')}
            </div>
        </div>
    </div>
    
    <script>
        // Check connection every 5 seconds
        let checkCount = 0;
        const maxChecks = 60; // 5 minuti max
        
        async function checkConnection() {
            checkCount++;
            if (checkCount > maxChecks) {
                document.querySelector('.status').innerHTML = '❌ QR Code scaduto - Ricarica la pagina';
                return;
            }
            
            try {
                const response = await fetch('http://37.27.89.35:8080/instance/connectionState/assistenza', {
                    headers: {
                        'apikey': 'evolution_key_luca_2025_secure_21806'
                    }
                });
                
                const data = await response.json();
                
                if (data?.instance?.state === 'open') {
                    document.querySelector('.status').style.display = 'none';
                    document.getElementById('success').style.display = 'block';
                    document.querySelector('.qr-container').style.opacity = '0.3';
                } else {
                    setTimeout(checkConnection, 5000);
                }
            } catch (error) {
                setTimeout(checkConnection, 5000);
            }
        }
        
        // Start checking after 10 seconds
        setTimeout(checkConnection, 10000);
    </script>
</body>
</html>`;

  const filename = 'whatsapp-qr-vps.html';
  const filepath = path.join(process.cwd(), filename);
  
  fs.writeFileSync(filepath, html);
  console.log(`\n📄 QR Code salvato in: ${filename}`);
  console.log(`📂 Path completo: ${filepath}`);
  console.log('\n🌐 Apri questo file nel browser per scansionare il QR code!');
  console.log('   Puoi aprirlo con: open whatsapp-qr-vps.html');
}

/**
 * 4. Verifica stato connessione
 */
async function checkStatus() {
  console.log('\n🔍 Verifica stato connessione sul VPS...');
  
  try {
    const response = await api.get(`/instance/connectionState/${VPS_CONFIG.instanceName}`);
    
    const state = response.data?.instance?.state;
    console.log(`📊 Stato: ${state || 'sconosciuto'}`);
    
    if (state === 'open') {
      console.log('✅ WhatsApp CONNESSO e funzionante sul VPS!');
      return true;
    } else if (state === 'connecting') {
      console.log('⏳ WhatsApp in fase di connessione...');
      return false;
    } else {
      console.log('❌ WhatsApp non connesso');
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
async function testMessage() {
  console.log('\n📤 Test invio messaggio dal VPS...');
  
  // Chiedi il numero se non fornito
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Inserisci numero WhatsApp per test (es: 393123456789): ', async (number) => {
      readline.close();
      
      if (!number) {
        console.log('⚠️  Test annullato');
        resolve(null);
        return;
      }
      
      try {
        const response = await api.post(`/message/sendText/${VPS_CONFIG.instanceName}`, {
          number: number.replace(/\D/g, ''), // Rimuovi caratteri non numerici
          text: '🎉 *Test Evolution API dal VPS!*\n\n' +
                '✅ WhatsApp configurato correttamente\n' +
                '🖥️ Server: 37.27.89.35\n' +
                '📦 Instance: ' + VPS_CONFIG.instanceName + '\n' +
                '⚡ API: Evolution v2.2.3\n\n' +
                '_Messaggio di test inviato con successo!_'
        });

        console.log('✅ Messaggio di test inviato!');
        resolve(response.data);
      } catch (error) {
        console.error('❌ Errore invio messaggio:', error.response?.data || error.message);
        resolve(null);
      }
    });
  });
}

/**
 * Main - Esegui configurazione completa
 */
async function main() {
  try {
    console.log('═'.repeat(60));
    console.log('   CONFIGURAZIONE WHATSAPP VPS - EVOLUTION API v2.2.3');
    console.log('═'.repeat(60));

    // 1. Crea istanza
    await createInstance();

    // 2. Configura webhook
    await configureWebhook();

    // 3. Verifica stato
    let isConnected = await checkStatus();

    if (!isConnected) {
      console.log('\n⏳ In attesa della scansione del QR code...');
      console.log('📱 Apri il file whatsapp-qr-vps.html nel browser');
      
      // Controlla lo stato ogni 5 secondi per 2 minuti
      for (let i = 0; i < 24 && !isConnected; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        process.stdout.write('.');
        isConnected = await checkStatus();
        
        if (isConnected) {
          console.log('\n✅ WhatsApp connesso!');
          break;
        }
      }
    }

    if (isConnected) {
      // Test messaggio
      if (process.argv.includes('--test')) {
        await testMessage();
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✨ Configurazione VPS completata!');
    console.log('═'.repeat(60));

    console.log('\n📋 Stato finale:');
    console.log(`- Evolution API: ${VPS_CONFIG.apiUrl} ✅`);
    console.log(`- Instance: ${VPS_CONFIG.instanceName} ${isConnected ? '✅' : '❌'}`);
    console.log(`- WhatsApp: ${isConnected ? 'Connesso ✅' : 'Non connesso ❌'}`);
    
    console.log('\n📌 Prossimi passi:');
    if (!isConnected) {
      console.log('1. Apri whatsapp-qr-vps.html nel browser');
      console.log('2. Scansiona il QR code con WhatsApp');
    }
    console.log('3. Aggiorna il sistema sul VPS con la versione del Mac');
    console.log('4. Configura il webhook per puntare al sistema aggiornato');
    console.log('5. Testa l\'integrazione completa');

  } catch (error) {
    console.error('\n❌ Configurazione fallita:', error.message);
    process.exit(1);
  }
}

// Esegui
main();
