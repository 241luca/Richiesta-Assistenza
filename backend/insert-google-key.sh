#!/bin/bash

# Script per inserire Google Maps API Key nella tabella ApiKey
# Uso: ./insert-google-key.sh

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📝 Inserimento Google Maps API Key nel database..."
echo ""
echo "⚠️  IMPORTANTE: Devi avere una chiave API valida da Google Cloud Console"
echo "    https://console.cloud.google.com/apis/credentials"
echo ""
read -p "Inserisci la tua Google Maps API Key: " API_KEY

if [ -z "$API_KEY" ]; then
  echo "❌ Nessuna chiave inserita. Operazione annullata."
  exit 1
fi

# Usa node per inserire nel database
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Genera un ID univoco
    const { randomBytes } = require('crypto');
    const id = randomBytes(16).toString('hex');
    
    await prisma.apiKey.upsert({
      where: { service: 'GOOGLE_MAPS' },
      update: { 
        key: '$API_KEY',
        isActive: true,
        updatedAt: new Date()
      },
      create: { 
        id: id,
        service: 'GOOGLE_MAPS',
        key: '$API_KEY',
        name: 'Google Maps API Key',
        isActive: true,
        rateLimit: 10000,
        createdAt: new Date()
      }
    });
    console.log('✅ Chiave API Google Maps salvata con successo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
"

echo ""
echo "🔄 Riavvia il backend per applicare le modifiche"
