/**
 * Script per verificare le API Keys WhatsApp nel database
 */

import { prisma } from '../config/database';
import crypto from 'crypto';

function decryptKey(encryptedKey: string): string {
  try {
    if (!encryptedKey.includes(':')) {
      return encryptedKey;
    }
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return encryptedKey;
  }
}

async function checkWhatsAppKeys() {
  try {
    console.log('\n📱 Verifica configurazione WhatsApp nel database:\n');
    
    const whatsappKeys = await prisma.apiKey.findMany({
      where: { service: 'whatsapp' }
    });
    
    if (whatsappKeys.length === 0) {
      console.log('❌ Nessuna configurazione WhatsApp trovata!');
    } else {
      whatsappKeys.forEach(key => {
        console.log('✅ Trovata configurazione:');
        console.log('   Nome:', key.name);
        console.log('   Service:', key.service);
        console.log('   Attiva:', key.isActive);
        
        const config = decryptKey(key.key);
        try {
          const parsed = JSON.parse(config);
          console.log('   Provider: Evolution API');
          console.log('   URL:', parsed.apiUrl);
          console.log('   Webhook:', parsed.webhookUrl);
        } catch {
          console.log('   Dati:', config.substring(0, 50) + '...');
        }
      });
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsAppKeys();
