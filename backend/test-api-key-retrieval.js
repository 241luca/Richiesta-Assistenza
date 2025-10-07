// Test per verificare se il backend recupera correttamente la chiave Google Maps
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Copia della funzione decryptKey dal servizio
function decryptKey(encryptedKey) {
  try {
    if (!encryptedKey.includes(':')) {
      return encryptedKey;
    }

    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    
    if (!ivHex || ivHex.length !== 32) {
      console.log('Invalid IV format, returning key as-is');
      return encryptedKey;
    }

    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.log('Error decrypting key:', error.message);
    return encryptedKey;
  }
}

async function testApiKeyRetrieval() {
  console.log('\n🔧 TEST RECUPERO CHIAVE GOOGLE MAPS DAL SERVIZIO\n');
  console.log('='.repeat(60));

  try {
    // 1. Test diretto database (come fa getApiKey)
    console.log('1️⃣ Test recupero diretto dal database...');
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { 
        service: 'GOOGLE_MAPS',
        isActive: true
      }
    });

    if (!apiKeyRecord) {
      console.log('❌ ERRORE: Nessuna chiave attiva trovata');
      return;
    }

    console.log('✅ Chiave trovata nel database:');
    console.log('   ID:', apiKeyRecord.id);
    console.log('   Service:', apiKeyRecord.service);
    console.log('   Active:', apiKeyRecord.isActive);
    
    // 2. Test decriptazione
    console.log('\n2️⃣ Test decriptazione...');
    const decryptedKey = decryptKey(apiKeyRecord.key);
    console.log('✅ Chiave decriptata:', decryptedKey);
    
    // 3. Test chiamata Google Maps API
    console.log('\n3️⃣ Test chiamata Google Maps API...');
    
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Roma,Italia&key=${decryptedKey}`;
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('API Response status:', data.status);
      
      if (data.status === 'OK') {
        console.log('✅ SUCCESSO: La chiave funziona perfettamente!');
        console.log('   Coordinate Roma:', data.results[0]?.geometry?.location);
      } else {
        console.log('❌ ERRORE API Google:', data.status);
        if (data.error_message) {
          console.log('   Messaggio:', data.error_message);
        }
      }
    } catch (fetchError) {
      console.log('❌ ERRORE nella chiamata HTTP:', fetchError.message);
    }

    // 4. Test endpoint del sistema
    console.log('\n4️⃣ Test endpoint interno /api/maps/config...');
    
    try {
      const configResponse = await fetch('http://localhost:3200/api/maps/config');
      console.log('Status endpoint config:', configResponse.status);
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ Endpoint config funziona:');
        console.log('   Risposta:', JSON.stringify(configData, null, 2));
      } else {
        console.log('❌ Endpoint config non risponde:', configResponse.statusText);
      }
    } catch (endpointError) {
      console.log('❌ ERRORE endpoint config:', endpointError.message);
      console.log('   Probabilmente il backend non è avviato su :3200');
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKeyRetrieval();
