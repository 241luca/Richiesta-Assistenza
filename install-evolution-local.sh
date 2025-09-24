#!/bin/bash

# Installazione EvolutionAPI SENZA Docker
# Alternativa per sistemi senza Docker

echo "🚀 INSTALLAZIONE EVOLUTIONAPI LOCALE (Senza Docker)"
echo "=================================================="
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato! Installalo prima."
    exit 1
fi

echo "✅ Node.js trovato: $(node -v)"

# Clona EvolutionAPI
echo ""
echo "📦 Download EvolutionAPI..."
if [ -d "evolution-api-local" ]; then
    echo "Directory già esistente, la rimuovo..."
    rm -rf evolution-api-local
fi

git clone https://github.com/EvolutionAPI/evolution-api.git evolution-api-local
cd evolution-api-local

echo ""
echo "📦 Installazione dipendenze..."
npm install

echo ""
echo "⚙️ Configurazione environment..."
cat > .env << EOF
# Server
SERVER_PORT=8080
SERVER_URL=http://localhost:8080

# Database - Usa PostgreSQL locale
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://lucamambelli@localhost:5432/evolution_db

# Auth
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=evolution_secure_key_2025_luca_mambelli

# Redis (opzionale, disabilitato se non c'è)
REDIS_ENABLED=false

# Instance
INSTANCE_LIMIT=10
QRCODE_LIMIT=30

# Webhook
WEBHOOK_GLOBAL_ENABLED=false

# Log
LOG_LEVEL=info
LOG_COLOR=true

# Storage
STORE_MESSAGES=true
STORE_MESSAGE_UP=true
STORE_CONTACTS=true
STORE_CHATS=true

# Clean
CLEAN_STORE_CLEANING_INTERVAL=7200
CLEAN_STORE_MESSAGES=true
CLEAN_STORE_MESSAGE_UP=true
CLEAN_STORE_CONTACTS=true
CLEAN_STORE_CHATS=true
EOF

echo ""
echo "🗄️ Creazione database..."
createdb evolution_db 2>/dev/null || echo "Database già esistente"

echo ""
echo "🏗️ Build del progetto..."
npm run build

echo ""
echo "✅ INSTALLAZIONE COMPLETATA!"
echo ""
echo "Per avviare EvolutionAPI:"
echo "  cd evolution-api-local"
echo "  npm start"
echo ""
echo "URL: http://localhost:8080"
echo "API Key: evolution_secure_key_2025_luca_mambelli"
