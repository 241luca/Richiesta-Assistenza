// Script per connettere nuovo telefono WhatsApp
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as qrcode from 'qrcode-terminal';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Configurazione SendApp API - IMPORTANTE: Aggiorna con i tuoi dati reali
const SENDAPP_BASE_URL = 'https://app.sendapp.cloud/api';
const ACCESS_TOKEN = '64833dfa0xxxx'; // SOSTITUISCI con il tuo token reale!

// Configurazione ngrok (se già in esecuzione)
const NGROK_URL = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io';
const WEBHOOK_ENDPOINT = '/api/whatsapp/webhook';

async function connectNewPhone() {
  try {
    console.log('===========================================');
    console.log('   CONNESSIONE NUOVO TELEFONO WHATSAPP');
    console.log('===========================================\n');

    // 1. Verifica token
    if (ACCESS_TOKEN === '64833dfa0xxxx') {
      console.log('⚠️  ATTENZIONE: Devi inserire il tuo ACCESS_TOKEN reale!');
      console.log('   Modifica lo script e sostituisci ACCESS_TOKEN con il valore corretto.\n');
      return;
    }

    console.log('📱 Configurazione:');
    console.log(`   Access Token: ${ACCESS_TOKEN.substring(0, 10)}...`);
    console.log(`   Webhook URL: ${NGROK_URL}${WEBHOOK_ENDPOINT}\n`);

    // 2. Crea nuova istanza
    console.log('🔄 Creazione nuova istanza...');
    
    const createInstanceUrl = `${SENDAPP_BASE_URL}/create_instance`;
    const createResponse = await axios.get(createInstanceUrl, {
      params: { access_token: ACCESS_TOKEN }
    });

    const instanceId = createResponse.data.instance_id || createResponse.data.data?.instance_id;
    
    if (!instanceId) {
      console.error('❌ Impossibile ottenere Instance ID dalla risposta:', createResponse.data);
      return;
    }

    console.log(`✅ Nuova istanza creata: ${instanceId}\n`);

    // 3. Genera QR Code
    console.log('📲 Generazione QR Code...');
    
    const qrCodeUrl = `${SENDAPP_BASE_URL}/get_qrcode`;
    const qrResponse = await axios.get(qrCodeUrl, {
      params: {
        instance_id: instanceId,
        access_token: ACCESS_TOKEN
      }
    });

    const qrCodeData = qrResponse.data.qrcode || qrResponse.data.data?.qrcode || qrResponse.data;
    
    if (typeof qrCodeData === 'string' && qrCodeData.includes('base64')) {
      // Se è un'immagine base64, estraiamo solo il codice
      console.log('\n📱 QR Code ricevuto come immagine.');
      console.log('   Apri il seguente link in un browser per vedere il QR:\n');
      console.log(`   ${qrCodeUrl}?instance_id=${instanceId}&access_token=${ACCESS_TOKEN}\n`);
    } else if (typeof qrCodeData === 'string') {
      // Se è una stringa QR, mostrala nel terminale
      console.log('\n📱 SCANSIONA QUESTO QR CODE CON WHATSAPP:\n');
      qrcode.generate(qrCodeData, { small: true });
    } else {
      console.log('\n📱 QR Code response:', qrCodeData);
      console.log(`\n   Apri questo link nel browser per vedere il QR:\n`);
      console.log(`   ${qrCodeUrl}?instance_id=${instanceId}&access_token=${ACCESS_TOKEN}\n`);
    }

    // 4. Configura webhook
    console.log('\n🔗 Configurazione webhook...');
    
    const webhookUrl = `${NGROK_URL}${WEBHOOK_ENDPOINT}`;
    const setWebhookUrl = `${SENDAPP_BASE_URL}/set_webhook`;
    
    try {
      const webhookResponse = await axios.get(setWebhookUrl, {
        params: {
          webhook_url: webhookUrl,
          enable: true,
          instance_id: instanceId,
          access_token: ACCESS_TOKEN
        }
      });
      
      console.log('✅ Webhook configurato:', webhookUrl);
      console.log('   Risposta:', webhookResponse.data);
    } catch (webhookError: any) {
      console.log('⚠️  Configurazione webhook fallita:', webhookError.response?.data || webhookError.message);
      console.log('   Puoi configurarlo manualmente più tardi');
    }

    // 5. Salva configurazione nel database
    console.log('\n💾 Salvataggio configurazione nel database...');

    // Trova o crea utente admin per associare la configurazione
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });

    if (!adminUser) {
      console.error('❌ Nessun utente admin trovato nel database!');
      return;
    }

    // Disattiva eventuali configurazioni precedenti
    await prisma.apiKey.updateMany({
      where: {
        service: 'WHATSAPP',
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Crea nuova configurazione
    const newConfig = await prisma.apiKey.create({
      data: {
        id: uuidv4(),
        userId: adminUser.id,
        name: `WhatsApp - ${new Date().toLocaleDateString('it-IT')}`,
        service: 'WHATSAPP',
        apiKey: ACCESS_TOKEN,
        instanceId: instanceId,
        webhookUrl: webhookUrl,
        isActive: true,
        permissions: ['send_messages', 'receive_messages', 'manage_groups'],
        metadata: {
          connectedAt: new Date().toISOString(),
          phoneNumber: null, // Verrà aggiornato dopo la connessione
          status: 'QR_CODE_PENDING'
        }
      }
    });

    console.log('✅ Configurazione salvata con ID:', newConfig.id);

    // 6. Istruzioni finali
    console.log('\n===========================================');
    console.log('   ISTRUZIONI PER COMPLETARE');
    console.log('===========================================\n');
    console.log('1. ✅ Istanza creata');
    console.log('2. ⏳ Scansiona il QR code con WhatsApp');
    console.log('3. ✅ Webhook configurato (se ngrok è attivo)');
    console.log('4. ✅ Configurazione salvata nel database\n');
    console.log('📌 IMPORTANTE:');
    console.log('   - Assicurati che ngrok sia in esecuzione');
    console.log('   - Il backend deve essere attivo per ricevere webhook');
    console.log('   - Verifica la connessione dalla dashboard admin\n');
    
    console.log('📊 Dettagli configurazione:');
    console.log(`   Instance ID: ${instanceId}`);
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log(`   Config ID: ${newConfig.id}\n`);

  } catch (error: any) {
    console.error('❌ Errore durante la connessione:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Avvia lo script
console.log('📱 CONNESSIONE NUOVO TELEFONO WHATSAPP\n');
console.log('⚠️  Assicurati di:');
console.log('   1. Aver aggiornato ACCESS_TOKEN nello script');
console.log('   2. Avere ngrok in esecuzione (opzionale)');
console.log('   3. Avere il telefono pronto per scansionare il QR\n');
console.log('Premi INVIO per continuare o CTRL+C per annullare...');

process.stdin.once('data', () => {
  connectNewPhone();
});
