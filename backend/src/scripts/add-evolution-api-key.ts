/**
 * Script per aggiungere Evolution API key nel database
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Funzione per criptare la chiave
function encryptKey(key: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

async function addEvolutionApiKey() {
  try {
    console.log('\n🚀 Aggiunta Evolution API nel database...\n');
    
    // Configurazione Evolution API
    const evolutionConfig = {
      apiUrl: 'http://37.27.89.35:8080',
      apiKey: 'evolution_key_luca_2025_secure_21806',
      webhookUrl: 'http://37.27.89.35:3200/api/whatsapp/webhook'
    };
    
    // Prima rimuovi eventuali configurazioni esistenti
    await prisma.apiKey.deleteMany({
      where: { service: 'whatsapp' }
    });
    
    console.log('✅ Rimosse configurazioni WhatsApp precedenti (SendApp)');
    
    // Cripta le informazioni sensibili
    const encryptedData = encryptKey(JSON.stringify(evolutionConfig));
    
    // Crea la nuova API key per Evolution
    const apiKey = await prisma.apiKey.create({
      data: {
        id: crypto.randomUUID(),
        service: 'whatsapp',
        name: 'Evolution API (Self-Hosted)',
        key: encryptedData,
        permissions: {
          provider: 'evolution',
          features: ['send', 'receive', 'groups', 'broadcast', 'media', 'status'],
          unlimited: true,
          multiInstance: true
        },
        rateLimit: 999999, // Nessun limite reale
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Evolution API aggiunta con successo!');
    console.log('\n📋 Configurazione salvata:');
    console.log('   Provider: Evolution API (Self-Hosted)');
    console.log('   URL: http://37.27.89.35:8080');
    console.log('   Features: Messaggi illimitati, Gruppi, Broadcast');
    console.log('   Status: ✅ Attiva');
    
    console.log('\n🎯 Prossimi passi:');
    console.log('1. Backend già avviato');
    console.log('2. Frontend già avviato');
    console.log('3. Vai su: http://localhost:5193/admin');
    console.log('4. Vai su API Keys → vedrai Evolution API');
    console.log('5. Vai su WhatsApp → crea istanza e scansiona QR');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
addEvolutionApiKey();
