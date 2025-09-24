#!/bin/bash

# Script per aggiungere Evolution API al database
# Da eseguire in locale sul Mac

echo "🔧 Configurazione Evolution API nel database..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Crea uno script TypeScript per aggiungere l'API key
cat > src/scripts/add-evolution-api-key.ts << 'EOF'
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
        isActive: true
      }
    });
    
    console.log('✅ Evolution API aggiunta con successo!');
    console.log('\n📋 Configurazione salvata:');
    console.log('   Provider: Evolution API (Self-Hosted)');
    console.log('   URL: http://37.27.89.35:8080');
    console.log('   Features: Messaggi illimitati, Gruppi, Broadcast');
    console.log('   Status: ✅ Attiva');
    
    console.log('\n🎯 Prossimi passi:');
    console.log('1. Avvia il backend: npm run dev');
    console.log('2. Avvia il frontend: npm run dev');
    console.log('3. Vai su: http://localhost:5193/admin/whatsapp');
    console.log('4. Crea istanza e scansiona QR code');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
addEvolutionApiKey();
EOF

# Esegui lo script TypeScript
echo "Esecuzione script..."
npx tsx src/scripts/add-evolution-api-key.ts

echo ""
echo "✅ Configurazione completata!"
echo ""
echo "📱 Ora puoi:"
echo "1. Avviare il backend locale: cd backend && npm run dev"
echo "2. Avviare il frontend locale: npm run dev" 
echo "3. Andare su: http://localhost:5193/admin/api-keys"
echo "4. Vedere 'Evolution API' configurata"
echo "5. Andare su WhatsApp nel menu admin"
