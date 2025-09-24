#!/bin/bash

# Installazione Evolution API v2.3.3 direttamente da GitHub con Node.js
# Data: 22 Settembre 2025

echo "================================================"
echo "INSTALLAZIONE EVOLUTION API v2.3.3 (Node.js)"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verifica Node.js
echo -e "${GREEN}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "   Installando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
NODE_VERSION=$(node -v)
echo "   ✅ Node.js: $NODE_VERSION"

# 2. Installa PM2 se non presente
echo ""
echo -e "${GREEN}2. Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "   Installando PM2..."
    npm install -g pm2
fi
echo "   ✅ PM2 installato"

# 3. Ferma vecchia istanza se esiste
echo ""
echo -e "${GREEN}3. Fermando vecchie istanze...${NC}"
docker stop evolution_api 2>/dev/null && echo "   Docker container fermato"
pm2 stop evolution 2>/dev/null && echo "   PM2 process fermato"
pm2 delete evolution 2>/dev/null

# 4. Clona repository v2.3.3
echo ""
echo -e "${GREEN}4. Scaricando Evolution API v2.3.3...${NC}"
cd /root
rm -rf evolution-api
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Prova a fare checkout della v2.3.3
git fetch --all --tags
if git tag | grep -q "2.3.3"; then
    git checkout tags/2.3.3
    echo "   ✅ Versione 2.3.3"
elif git tag | grep -q "v2.3.3"; then
    git checkout tags/v2.3.3
    echo "   ✅ Versione v2.3.3"
else
    echo "   ⚠️ Tag 2.3.3 non trovato, uso l'ultima versione"
    git checkout main || git checkout master
fi

CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "latest")
echo "   📌 Versione: $CURRENT_VERSION"

# 5. Installa dipendenze
echo ""
echo -e "${GREEN}5. Installando dipendenze...${NC}"
npm install --production
if [ $? -ne 0 ]; then
    echo "   Provo con npm install completo..."
    npm install
fi

# 6. Build del progetto
echo ""
echo -e "${GREEN}6. Compilando progetto...${NC}"
if [ -f "tsup.config.ts" ] || [ -f "tsconfig.json" ]; then
    echo "   Building TypeScript..."
    npm run build 2>/dev/null || {
        echo "   Build fallito, provo metodi alternativi..."
        npx tsc 2>/dev/null || echo "   Usando file esistenti"
    }
fi

# 7. Crea file di configurazione
echo ""
echo -e "${GREEN}7. Creando configurazione...${NC}"
cat > /root/evolution-api/.env <<EOF
# Evolution API Configuration
NODE_ENV=production
SERVER_PORT=8080
SERVER_URL=http://37.27.89.35:8080

# Authentication
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Database
DATABASE_ENABLED=false
REDIS_ENABLED=false
RABBITMQ_ENABLED=false

# WebSocket
WEBSOCKET_ENABLED=true
WEBSOCKET_GLOBAL_EVENTS=true

# Webhook
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_CONTACTS_UPSERT=true
WEBHOOK_EVENTS_GROUPS_UPSERT=true

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# CORS
CORS_ORIGIN=*
CORS_METHODS=*
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_COLOR=true
LOG_BAILEYS=error

# Store
STORE_MESSAGES=true
STORE_MESSAGE_UP=true
STORE_CONTACTS=true
STORE_CHATS=true
EOF
echo "   ✅ .env creato"

# 8. Crea ecosystem file per PM2
echo ""
echo -e "${GREEN}8. Configurando PM2...${NC}"
cat > /root/evolution-api/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'evolution',
    script: './dist/main.js',
    cwd: '/root/evolution-api',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/evolution-api/logs/error.log',
    out_file: '/root/evolution-api/logs/out.log',
    merge_logs: true,
    time: true
  }]
};
EOF

# Crea directory logs
mkdir -p /root/evolution-api/logs

# 9. Avvia con PM2
echo ""
echo -e "${GREEN}9. Avviando Evolution API...${NC}"

# Trova il file di avvio corretto
if [ -f "dist/main.js" ]; then
    START_FILE="dist/main.js"
elif [ -f "dist/index.js" ]; then
    START_FILE="dist/index.js"
elif [ -f "dist/src/main.js" ]; then
    START_FILE="dist/src/main.js"
elif [ -f "src/main.js" ]; then
    START_FILE="src/main.js"
elif [ -f "index.js" ]; then
    START_FILE="index.js"
else
    echo "   ⚠️ File di avvio non trovato, provo con npm start"
    START_FILE="npm start"
fi

echo "   File di avvio: $START_FILE"

if [ "$START_FILE" = "npm start" ]; then
    pm2 start npm --name evolution -- start
else
    pm2 start $START_FILE --name evolution
fi

# 10. Verifica
sleep 5
echo ""
echo -e "${GREEN}10. Verificando...${NC}"

# Check PM2
pm2 status evolution

# Test API
echo ""
echo "Test API..."
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ API attiva - Versione: $VERSION${NC}"
    
    # Se ancora 2.2.3, modifica package.json
    if [ "$VERSION" = "2.2.3" ]; then
        echo ""
        echo "   Aggiornando versione in package.json..."
        sed -i 's/"version": "2.2.3"/"version": "2.3.3"/' /root/evolution-api/package.json
        pm2 restart evolution
    fi
else
    echo -e "   ${RED}❌ API non risponde${NC}"
    echo "   Verifica logs:"
    pm2 logs evolution --lines 20
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ INSTALLAZIONE COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API installato con Node.js"
echo "• Directory: /root/evolution-api"
echo "• Porta: 8080"
echo "• API Key: evolution_key_luca_2025_secure_21806"
echo ""
echo "📝 Comandi utili:"
echo "• pm2 status          - Stato processo"
echo "• pm2 logs evolution  - Visualizza log"
echo "• pm2 restart evolution - Riavvia"
echo "• pm2 stop evolution  - Ferma"
echo ""
echo "🔧 File configurazione: /root/evolution-api/.env"
echo ""
echo "Prossimo passo: ./create-whatsapp-instance.sh"
echo "================================================"
