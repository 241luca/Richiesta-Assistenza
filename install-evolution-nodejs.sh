#!/bin/bash

# ================================================
# EVOLUTIONAPI LOCALE - SENZA DOCKER
# Installazione diretta con Node.js
# ================================================

echo "🚀 INSTALLAZIONE EVOLUTIONAPI LOCALE (No Docker)"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vai nella directory del progetto
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Clona Evolution API
echo "📥 Download EvolutionAPI..."
if [ ! -d "evolution-local" ]; then
    git clone https://github.com/EvolutionAPI/evolution-api.git evolution-local
fi

cd evolution-local

# Installa dipendenze
echo ""
echo "📦 Installazione pacchetti..."
npm install

# Crea file di configurazione
echo ""
echo "⚙️ Configurazione..."
cat > .env << 'EOF'
# Server
NODE_ENV=production
SERVER_URL=http://localhost:8080

# Database - SQLite (semplice, senza installazioni)
DATABASE_PROVIDER=sqlite
DATABASE_CONNECTION_STRING=./evolution.db

# Auth
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=evolution_secure_key_2025_luca_mambelli

# Instance
INSTANCE_LIMIT=10
QRCODE_LIMIT=30

# Logs
LOG_LEVEL=info

# Storage
STORE_MESSAGES=true
STORE_CONTACTS=true
STORE_CHATS=true

# Webhook per il tuo backend
WEBHOOK_GLOBAL_URL=http://localhost:3200/api/whatsapp/webhook
WEBHOOK_GLOBAL_ENABLED=true
EOF

# Build
echo ""
echo "🔨 Build del progetto..."
npm run build

# Crea script di avvio
cat > start-evolution.sh << 'EOF'
#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/evolution-local
npm start
EOF
chmod +x start-evolution.sh

echo ""
echo -e "${GREEN}✅ INSTALLAZIONE COMPLETATA!${NC}"
echo ""
echo "Per avviare EvolutionAPI:"
echo "  cd evolution-local"
echo "  npm start"
echo ""
echo "Oppure usa:"
echo "  ./evolution-local/start-evolution.sh"
echo ""
echo "URL: http://localhost:8080"
echo "API Key: evolution_secure_key_2025_luca_mambelli"