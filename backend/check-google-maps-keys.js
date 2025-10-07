// Test per vedere tutte le chiavi API GOOGLE_MAPS nel database
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Funzione per decriptare la chiave (copiata dal service)
function decryptKey(encryptedKey) {
  try {
    // Se non contiene ':', probabilmente non è criptata
    if (!encryptedKey.includes(':')) {
      return encryptedKey; // Fallback per chiavi non criptate
    }

    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    
    // Verifica che l'IV sia valido (32 caratteri hex = 16 bytes)
    if (!ivHex || ivHex.length !== 32) {
      console.log('⚠️ Invalid IV format, returning key as-is');
      return encryptedKey; // Fallback
    }

    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.log('⚠️ Error decrypting key:', error.message);
    return encryptedKey; // Fallback per chiavi non criptate (development)
  }
}

async function checkAllGoogleMapsKeys() {
  try {
    console.log('\n🗺️ CONTROLLO CHIAVI GOOGLE MAPS NEL DATABASE\n');
    console.log('='.repeat(60));
    
    // Trova TUTTE le chiavi GOOGLE_MAPS (anche non attive)
    const allKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { service: 'GOOGLE_MAPS' },
          { service: 'google_maps' },
          { name: { contains: 'Google Maps', mode: 'insensitive' } },
          { name: { contains: 'GOOGLE_MAPS', mode: 'insensitive' } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (allKeys.length === 0) {
      console.log('❌ NESSUNA chiave Google Maps trovata nel database!');
      console.log('\n📝 Questo spiega perché le mappe non funzionano.');
      console.log('   La chiave deve essere configurata nel database.');
      return;
    }

    console.log(`\n✅ Trovate ${allKeys.length} chiavi Google Maps nel database:\n`);
    
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const decryptedKey = decryptKey(key.key);
      
      console.log(`--- Chiave #${i + 1} ---`);
      console.log('ID:', key.id);
      console.log('Nome:', key.name || 'Non specificato');
      console.log('Service:', key.service);
      console.log('Attiva:', key.isActive ? '✅ SI' : '❌ NO');
      console.log('Chiave criptata:', key.key?.substring(0, 20) + '...');
      console.log('Chiave decriptata:', decryptedKey?.substring(0, 20) + '...');
      console.log('Lunghezza chiave:', decryptedKey?.length);
      console.log('Formato Google (AIza):', decryptedKey?.startsWith('AIza') ? '✅ SI' : '❌ NO');
      console.log('Creata:', key.createdAt?.toISOString().split('T')[0]);
      console.log('Aggiornata:', key.updatedAt?.toISOString().split('T')[0]);
      console.log('Ultimo uso:', key.lastUsedAt?.toISOString().split('T')[0] || 'Mai usata');
      console.log('');
    }

    // Mostra quale dovrebbe essere usata
    const activeKey = allKeys.find(k => k.isActive);
    if (activeKey) {
      const decryptedActive = decryptKey(activeKey.key);
      console.log('🎯 CHIAVE ATTIVA:');
      console.log('   Nome:', activeKey.name);
      console.log('   Service:', activeKey.service);
      console.log('   Formato:', decryptedActive?.startsWith('AIza') ? 'CORRETTO ✅' : 'ERRATO ❌');
      console.log('   Chiave completa:', decryptedActive);
      
      if (decryptedActive?.startsWith('AIza')) {
        console.log('\n✅ HAI UNA CHIAVE GOOGLE MAPS VALIDA NEL DATABASE!');
        console.log('   Questa dovrebbe essere usata dal sistema.');
      }
    } else {
      console.log('⚠️  Nessuna chiave ATTIVA trovata!');
      console.log('   Tutte le chiavi sono disabilitate.');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllGoogleMapsKeys();
