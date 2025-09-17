// RESET COMPLETO CONFIGURAZIONE WHATSAPP
// Questo script sistema tutto da zero

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function resetWhatsAppConfig() {
  console.log('🔧 RESET COMPLETO SISTEMA WHATSAPP\n');
  console.log('========================================\n');
  
  try {
    // 1. PULISCI TUTTO IL VECCHIO
    console.log('1️⃣ Pulizia configurazione vecchia...');
    await prisma.apiKey.deleteMany({
      where: { service: 'whatsapp' }
    });
    console.log('   ✅ Vecchia config eliminata\n');
    
    // 2. CREA NUOVA ISTANZA SENDAPP
    console.log('2️⃣ Creazione nuova istanza SendApp...');
    const createResponse = await axios.get('https://app.sendapp.cloud/api/create_instance', {
      params: { access_token: '68c575f3c2ff1' }
    });
    
    const newInstanceId = createResponse.data.instance_id;
    console.log(`   ✅ Nuova istanza creata: ${newInstanceId}\n`);
    
    // 3. OTTIENI IL QR CODE
    console.log('3️⃣ Recupero QR Code...');
    const qrResponse = await axios.get('https://app.sendapp.cloud/api/get_qrcode', {
      params: {
        instance_id: newInstanceId,
        access_token: '68c575f3c2ff1'
      }
    });
    
    const qrCode = qrResponse.data.base64;
    console.log('   ✅ QR Code ottenuto\n');
    
    // 4. SALVA NEL DATABASE
    console.log('4️⃣ Salvataggio configurazione nel database...');
    const newConfig = await prisma.apiKey.create({
      data: {
        id: `whatsapp_${Date.now()}`,
        service: 'whatsapp',
        key: '68c575f3c2ff1',
        permissions: {
          baseURL: 'https://app.sendapp.cloud/api',
          instanceId: newInstanceId,
          webhookUrl: 'http://localhost:3200/api/whatsapp/webhook'
        },
        isActive: true
      }
    });
    console.log('   ✅ Configurazione salvata\n');
    
    // 5. CREA PAGINA HTML CON QR CODE FUNZIONANTE
    console.log('5️⃣ Creazione pagina QR Code...');
    const fs = require('fs');
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code - NUOVO</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #25D366;
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: #25D366;
            margin-bottom: 20px;
        }
        .qr-container {
            border: 4px solid #25D366;
            padding: 20px;
            border-radius: 15px;
            display: inline-block;
            background: white;
        }
        img {
            display: block;
            width: 350px;
            height: 350px;
        }
        .info {
            margin-top: 20px;
            padding: 20px;
            background: #f0f0f0;
            border-radius: 10px;
        }
        .instance {
            font-family: monospace;
            font-size: 18px;
            color: #333;
            margin: 10px 0;
        }
        .instructions {
            text-align: left;
            margin: 20px 0;
            padding: 20px;
            background: #e8f5e9;
            border-radius: 10px;
        }
        .instructions li {
            margin: 10px 0;
        }
        .status {
            padding: 15px;
            background: #ffc107;
            color: #333;
            border-radius: 10px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 NUOVO QR CODE WHATSAPP</h1>
        
        <div class="status">
            ⚠️ SCANSIONA QUESTO QR PER ATTIVARE
        </div>
        
        <div class="qr-container">
            <img src="${qrCode}" alt="WhatsApp QR Code">
        </div>
        
        <div class="info">
            <div class="instance">Instance ID: ${newInstanceId}</div>
            <div class="instance">Token: 68c575f3c2ff1</div>
        </div>
        
        <div class="instructions">
            <h3>📱 Come attivare:</h3>
            <ol>
                <li>Apri <strong>WhatsApp</strong> sul telefono</li>
                <li>Vai su <strong>Impostazioni</strong></li>
                <li>Tocca <strong>Dispositivi collegati</strong></li>
                <li>Tocca <strong>Collega un dispositivo</strong></li>
                <li><strong>SCANSIONA QUESTO QR CODE</strong></li>
            </ol>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #d4edda; border-radius: 10px;">
            <h3>✅ Dopo la scansione:</h3>
            <p>1. Vedrai "SendApp" nei dispositivi collegati</p>
            <p>2. Torna al sistema e ricarica la pagina</p>
            <p>3. Ora potrai inviare messaggi!</p>
        </div>
    </div>
</body>
</html>
    `;
    
    fs.writeFileSync('/Users/lucamambelli/Desktop/Richiesta-Assistenza/WHATSAPP-QR-NUOVO.html', htmlContent);
    console.log('   ✅ Pagina QR salvata: WHATSAPP-QR-NUOVO.html\n');
    
    // 6. MOSTRA RISULTATI
    console.log('========================================');
    console.log('✅ RESET COMPLETATO CON SUCCESSO!\n');
    console.log('📋 NUOVA CONFIGURAZIONE:');
    console.log(`   Instance ID: ${newInstanceId}`);
    console.log(`   Token: 68c575f3c2ff1`);
    console.log(`   Status: PRONTO PER SCANSIONE QR\n`);
    console.log('📱 PROSSIMI PASSI:');
    console.log('   1. Apri WHATSAPP-QR-NUOVO.html nel browser');
    console.log('   2. Scansiona il QR con WhatsApp');
    console.log('   3. Il sistema sarà pronto!\n');
    
  } catch (error: any) {
    console.error('❌ ERRORE:', error.message);
    if (error.response) {
      console.error('Dettagli:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetWhatsAppConfig();
