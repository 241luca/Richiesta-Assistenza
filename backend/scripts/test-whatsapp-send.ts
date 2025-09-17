// Script per testare invio messaggio WhatsApp
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const SENDAPP_BASE_URL = 'https://app.sendapp.cloud/api';

async function testSendMessage() {
  try {
    console.log('===========================================');
    console.log('   TEST INVIO MESSAGGIO WHATSAPP');
    console.log('===========================================\n');

    // 1. Trova configurazione attiva
    const activeConfig = await prisma.apiKey.findFirst({
      where: {
        service: 'WHATSAPP',
        isActive: true
      }
    });

    if (!activeConfig) {
      console.log('❌ Nessuna configurazione WhatsApp attiva trovata!');
      console.log('   Esegui prima connect-new-whatsapp.ts\n');
      return;
    }

    console.log('✅ Configurazione attiva trovata:');
    console.log(`   Instance ID: ${activeConfig.instanceId}`);
    console.log(`   API Key: ${activeConfig.apiKey?.substring(0, 10)}...\n`);

    // 2. Richiedi numero di telefono
    console.log('📱 Inserisci il numero di telefono destinatario');
    console.log('   (formato internazionale, es: 393331234567):');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const phoneNumber = await new Promise<string>((resolve) => {
      readline.question('Numero: ', (answer) => {
        readline.close();
        resolve(answer.replace(/\D/g, '')); // Rimuove tutto tranne i numeri
      });
    });

    if (!phoneNumber) {
      console.log('❌ Numero non valido!');
      return;
    }

    // 3. Messaggio di test
    const testMessage = `🤖 Test WhatsApp Integration

Questo è un messaggio di test inviato dal sistema Richiesta Assistenza.

Data/Ora: ${new Date().toLocaleString('it-IT')}
Instance: ${activeConfig.instanceId}

Se ricevi questo messaggio, l'integrazione funziona correttamente! ✅`;

    console.log('\n📤 Invio messaggio di test...');
    console.log(`   Destinatario: ${phoneNumber}`);
    console.log(`   Messaggio: ${testMessage.substring(0, 50)}...\n`);

    // 4. Invia messaggio
    const sendUrl = `${SENDAPP_BASE_URL}/send`;
    
    try {
      const response = await axios.get(sendUrl, {
        params: {
          number: phoneNumber,
          type: 'text',
          message: testMessage,
          instance_id: activeConfig.instanceId,
          access_token: activeConfig.apiKey
        }
      });

      console.log('✅ MESSAGGIO INVIATO CON SUCCESSO!');
      console.log('   Risposta API:', response.data);
      
      // 5. Log nel database (opzionale)
      if (activeConfig.metadata && typeof activeConfig.metadata === 'object') {
        await prisma.apiKey.update({
          where: { id: activeConfig.id },
          data: {
            metadata: {
              ...activeConfig.metadata,
              lastTestAt: new Date().toISOString(),
              lastTestNumber: phoneNumber,
              lastTestStatus: 'success'
            }
          }
        });
      }

    } catch (error: any) {
      console.error('❌ ERRORE INVIO MESSAGGIO:');
      console.error('   ', error.response?.data || error.message);
      
      // Log errore nel database
      if (activeConfig.metadata && typeof activeConfig.metadata === 'object') {
        await prisma.apiKey.update({
          where: { id: activeConfig.id },
          data: {
            metadata: {
              ...activeConfig.metadata,
              lastTestAt: new Date().toISOString(),
              lastTestError: error.response?.data || error.message
            }
          }
        });
      }
    }

    console.log('\n===========================================');
    console.log('   TEST COMPLETATO');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Avvia il test
testSendMessage();
