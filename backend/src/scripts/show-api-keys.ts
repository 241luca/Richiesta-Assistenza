/**
 * Script per decrittare e mostrare le API keys esistenti
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Funzione per decrittare la chiave (deve corrispondere a quella nel servizio)
function decryptKey(encryptedKey: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: unknown) {
    console.error('Error decrypting:', error);
    return encryptedKey; // Fallback per chiavi non criptate
  }
}

async function showApiKeys() {
  try {
    console.log('\n🔍 API Keys nel database:\n');
    
    // Recupera tutte le API keys
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        organization: true
      }
    });
    
    if (apiKeys.length === 0) {
      console.log('❌ Nessuna API key trovata nel database!\n');
      return;
    }
    
    apiKeys.forEach(key => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Service: ${key.service}`);
      console.log(`Organization: ${key.organization.name} (ID: ${key.organizationId})`);
      console.log(`Active: ${key.isActive ? '✅' : '❌'}`);
      
      const decryptedKey = decryptKey(key.key);
      
      // Mostra la chiave mascherata per sicurezza
      if (key.service === 'GOOGLE_MAPS') {
        console.log(`Key (decrypted): ${decryptedKey.substring(0, 15)}...${decryptedKey.slice(-10)}`);
        
        // Se è una chiave fake, avvisa
        if (decryptedKey.includes('FAKE') || decryptedKey === 'your_google_maps_api_key_here') {
          console.log('⚠️  ATTENZIONE: Questa è una chiave FAKE/placeholder!');
        } else {
          console.log('✅ Sembra essere una chiave reale');
          
          // Mostra come configurarla nel .env
          console.log('\n📝 Per usare questa chiave, aggiorna il file .env:');
          console.log(`   GOOGLE_MAPS_API_KEY=${decryptedKey}`);
        }
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    
  } catch (error: unknown) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
showApiKeys();
