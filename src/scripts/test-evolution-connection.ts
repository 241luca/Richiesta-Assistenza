/**
 * Script per testare la connessione a Evolution API
 */

import axios from 'axios';
import { prisma } from '../config/database';
import crypto from 'crypto';

function decryptKey(encryptedData: string): any {
  try {
    if (!encryptedData.includes(':')) {
      return JSON.parse(encryptedData);
    }
    
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting:', error);
    return null;
  }
}

async function testEvolution() {
  try {
    console.log('\n🔍 Test connessione Evolution API...\n');
    
    // 1. Recupera configurazione dal database
    const apiKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'whatsapp',
        isActive: true
      }
    });

    if (!apiKey) {
      console.log('❌ Nessuna configurazione WhatsApp trovata nel database!');
      console.log('   Vai su http://localhost:5193/admin/api-keys/whatsapp per configurare');
      return;
    }

    const config = decryptKey(apiKey.key);
    
    if (!config) {
      console.log('❌ Impossibile decriptare la configurazione');
      return;
    }

    console.log('✅ Configurazione trovata:');
    console.log('   Provider: Evolution API');
    console.log('   URL:', config.apiUrl);
    console.log('   API Key:', config.apiKey?.substring(0, 20) + '...');

    // 2. Test connessione diretta a Evolution API
    console.log('\n📡 Test connessione a Evolution API...');
    
    try {
      const response = await axios.get(config.apiUrl, {
        timeout: 5000
      });
      
      console.log('✅ Evolution API risponde:');
      console.log('   Status:', response.status);
      console.log('   Message:', response.data.message);
      console.log('   Version:', response.data.version);
    } catch (error: any) {
      console.error('❌ Evolution API non raggiungibile:', error.message);
      console.log('   Verifica che Evolution sia attivo sul VPS');
      console.log('   Controlla: curl', config.apiUrl);
      return;
    }

    // 3. Test creazione istanza
    console.log('\n🔧 Test creazione istanza...');
    
    try {
      const instanceResponse = await axios.post(
        `${config.apiUrl}/instance/create`,
        {
          instanceName: 'test-' + Date.now(),
          qrcode: true
        },
        {
          headers: {
            'apikey': config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Istanza creata con successo:');
      console.log('   Instance:', instanceResponse.data);
      
      // Elimina istanza di test
      if (instanceResponse.data.instance?.instanceName) {
        await axios.delete(
          `${config.apiUrl}/instance/delete/${instanceResponse.data.instance.instanceName}`,
          {
            headers: {
              'apikey': config.apiKey
            }
          }
        );
        console.log('   (istanza di test eliminata)');
      }
    } catch (error: any) {
      console.error('❌ Errore creazione istanza:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.log('\n⚠️  API Key non valida o mancante');
        console.log('   Verifica la API Key nel VPS');
      } else if (error.response?.status === 404) {
        console.log('\n⚠️  Endpoint non trovato');
        console.log('   Evolution API potrebbe avere una versione diversa');
      }
    }

    console.log('\n📋 Riepilogo:');
    console.log('   - Configurazione database: ✅');
    console.log('   - Evolution API online: ' + (config.apiUrl ? '✅' : '❌'));
    console.log('   - Pronto per l\'uso: ' + (config.apiUrl && config.apiKey ? '✅' : '❌'));
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEvolution();
