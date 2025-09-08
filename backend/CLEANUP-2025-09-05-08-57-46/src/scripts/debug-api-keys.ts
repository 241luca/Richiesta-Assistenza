/**
 * Script di debug completo per API Keys e Organizations
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Funzione per decrittare
function decryptKey(encryptedKey: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    // Se non contiene ':', probabilmente non è criptata
    if (!encryptedKey.includes(':')) {
      return encryptedKey;
    }
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.log('   ⚠️ Chiave non criptata o errore decrittazione');
    return encryptedKey;
  }
}

async function debugSystem() {
  try {
    console.log('\n🔍 DEBUG COMPLETO SISTEMA API KEYS\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Organizations
    console.log('📁 ORGANIZATIONS:\n');
    const organizations = await prisma.organization.findMany();
    
    if (organizations.length === 0) {
      console.log('   ❌ Nessuna organization trovata!\n');
    } else {
      organizations.forEach(org => {
        console.log(`   • ${org.name}`);
        console.log(`     ID: ${org.id}`);
        console.log(`     Slug: ${org.slug}\n`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 2. Utenti e loro organizations
    console.log('👥 UTENTI SUPER_ADMIN:\n');
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { organization: true }
    });
    
    if (admins.length === 0) {
      console.log('   ❌ Nessun SUPER_ADMIN trovato!\n');
    } else {
      admins.forEach(admin => {
        console.log(`   • ${admin.email}`);
        console.log(`     ID: ${admin.id}`);
        console.log(`     Organization: ${admin.organization.name} (${admin.organizationId})\n`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 3. API Keys nel database
    console.log('🔑 API KEYS NEL DATABASE:\n');
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        organization: true,
        updatedBy: true
      }
    });
    
    if (apiKeys.length === 0) {
      console.log('   ❌ Nessuna API key trovata!\n');
    } else {
      apiKeys.forEach(key => {
        console.log(`   Service: ${key.service}`);
        console.log(`   Organization: ${key.organization.name} (${key.organizationId})`);
        console.log(`   Active: ${key.isActive ? '✅ SI' : '❌ NO'}`);
        console.log(`   Updated by: ${key.updatedBy?.email || 'N/A'}`);
        
        if (key.service === 'GOOGLE_MAPS') {
          const decrypted = decryptKey(key.key);
          console.log(`   Key value: ${decrypted.substring(0, 20)}...`);
          
          if (decrypted.includes('FAKE') || decrypted.includes('your_')) {
            console.log('   ⚠️ CHIAVE FAKE/PLACEHOLDER');
          } else if (decrypted.startsWith('AIza')) {
            console.log('   ✅ FORMATO CHIAVE GOOGLE VALIDO');
          }
        }
        console.log('   ---\n');
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 4. Test query diretta come farebbe il servizio
    console.log('🧪 TEST QUERY COME SERVIZIO:\n');
    
    if (admins.length > 0) {
      const testOrg = admins[0].organizationId;
      console.log(`   Testing con Organization ID: ${testOrg}\n`);
      
      const testKey = await prisma.apiKey.findFirst({
        where: {
          service: 'GOOGLE_MAPS',
          organizationId: testOrg,
          isActive: true
        }
      });
      
      if (testKey) {
        console.log('   ✅ Chiave trovata con query del servizio!');
        const decrypted = decryptKey(testKey.key);
        console.log(`   Valore: ${decrypted.substring(0, 30)}...`);
      } else {
        console.log('   ❌ Nessuna chiave trovata con la query del servizio');
        console.log('   Possibili cause:');
        console.log('   - La chiave non è attiva (isActive: false)');
        console.log('   - La chiave è per un\'altra organization');
        console.log('   - Non esiste una chiave GOOGLE_MAPS');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    // 5. Suggerimenti
    console.log('💡 SUGGERIMENTI:\n');
    
    const googleMapsKey = apiKeys.find(k => k.service === 'GOOGLE_MAPS');
    
    if (!googleMapsKey) {
      console.log('   1. Non c\'è nessuna chiave Google Maps nel database');
      console.log('   2. Esegui: npx tsx src/scripts/setup-google-maps.ts');
    } else if (!googleMapsKey.isActive) {
      console.log('   1. La chiave Google Maps esiste ma NON è attiva');
      console.log('   2. Attivala nel database o dall\'admin panel');
    } else {
      const decrypted = decryptKey(googleMapsKey.key);
      if (decrypted.includes('FAKE')) {
        console.log('   1. La chiave è FAKE, sostituiscila con una reale');
        console.log('   2. Aggiorna il file .env con: GOOGLE_MAPS_API_KEY=tua_chiave_reale');
        console.log('   3. Poi esegui: npx tsx src/scripts/setup-google-maps.ts');
      } else {
        console.log('   ✅ La chiave sembra configurata correttamente!');
        console.log('   Se non funziona ancora, verifica:');
        console.log('   1. Che l\'utente loggato appartenga all\'organization: ' + googleMapsKey.organizationId);
        console.log('   2. Che la chiave sia valida su Google Cloud Console');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
debugSystem();
