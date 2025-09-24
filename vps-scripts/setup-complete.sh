#!/bin/bash

# Setup completo Evolution API + Webhook
# Da usare SOLO per installazione pulita
# Data: 22 Settembre 2025

echo "================================================"
echo "SETUP COMPLETO EVOLUTION API + WEBHOOK"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  ATTENZIONE:${NC}"
echo "Questo script installerà da zero Evolution API e Webhook"
echo "Usalo SOLO se non hai nulla installato!"
echo ""
read -p "Continuare? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# 1. Installazione Node.js se necessario
echo ""
echo -e "${GREEN}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "   Installando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "   ✅ Node.js già installato: $(node -v)"
fi

# 2. Installazione Docker se necessario
echo ""
echo -e "${GREEN}2. Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "   Installando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
else
    echo "   ✅ Docker già installato: $(docker -v)"
fi

# 3. Setup webhook server
echo ""
echo -e "${GREEN}3. Configurando webhook server...${NC}"

mkdir -p ~/evolution-setup
cd ~/evolution-setup

# Crea webhook server
cat > webhook-server.js <<'EOF'
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 3201;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Store per QR codes e messaggi
const qrCodeStore = new Map();
const messageStore = new Map();
const logFile = 'webhook-events.log';

// Funzione di logging
function logEvent(event, instance, data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        instance,
        data: data ? JSON.stringify(data).substring(0, 200) : null
    };
    
    console.log(`[${logEntry.timestamp}] ${instance}: ${event}`);
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Webhook endpoint
app.post('/api/whatsapp/webhook/:instance', (req, res) => {
    const { instance } = req.params;
    const event = req.body;
    
    logEvent(event.event || 'unknown', instance, event);
    
    // Gestione eventi specifici
    switch(event.event) {
        case 'qrcode.updated':
        case 'QRCODE_UPDATED':
            const qrData = event.base64 || event.qrcode?.base64 || event.qrcode;
            if (qrData) {
                qrCodeStore.set(instance, {
                    qrcode: qrData,
                    timestamp: new Date()
                });
                console.log(`✅ QR Code salvato per ${instance}`);
            }
            break;
            
        case 'connection.update':
        case 'CONNECTION_UPDATE':
            console.log(`🔄 Connessione ${instance}: ${event.state || event.data?.state}`);
            break;
            
        case 'messages.upsert':
        case 'MESSAGES_UPSERT':
            console.log(`💬 Nuovo messaggio in ${instance}`);
            if (!messageStore.has(instance)) {
                messageStore.set(instance, []);
            }
            messageStore.get(instance).push({
                timestamp: new Date(),
                message: event.data
            });
            break;
    }
    
    res.status(200).json({ success: true, received: event.event });
});

// Endpoint per recuperare QR
app.get('/api/whatsapp/qrcode/:instance', (req, res) => {
    const { instance } = req.params;
    const qrData = qrCodeStore.get(instance);
    
    if (!qrData) {
        return res.status(404).json({ error: 'QR not found' });
    }
    
    // QR valido per 5 minuti
    const age = Date.now() - qrData.timestamp.getTime();
    if (age > 5 * 60 * 1000) {
        qrCodeStore.delete(instance);
        return res.status(404).json({ error: 'QR expired' });
    }
    
    res.json({ 
        qrcode: qrData.qrcode,
        age: Math.floor(age / 1000)
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        uptime: process.uptime(),
        qrCodes: qrCodeStore.size,
        messages: Array.from(messageStore.values()).reduce((a, b) => a + b.length, 0),
        timestamp: new Date().toISOString()
    });
});

// Stats endpoint
app.get('/stats', (req, res) => {
    const stats = {
        instances: [],
        totalMessages: 0
    };
    
    for (const [instance, messages] of messageStore.entries()) {
        stats.instances.push({
            name: instance,
            messages: messages.length,
            lastMessage: messages[messages.length - 1]?.timestamp
        });
        stats.totalMessages += messages.length;
    }
    
    res.json(stats);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
========================================
Webhook Server Attivo
========================================
Porta: ${PORT}
Health: http://localhost:${PORT}/health
Stats: http://localhost:${PORT}/stats
Webhook: http://localhost:${PORT}/api/whatsapp/webhook/:instance
========================================
    `);
});
EOF

# Installa dipendenze
echo "   Installando dipendenze Node.js..."
npm init -y > /dev/null 2>&1
npm install express cors

# 4. Avvia webhook con PM2
echo ""
echo -e "${GREEN}4. Configurando PM2 per webhook...${NC}"
npm install -g pm2
pm2 start webhook-server.js --name webhook-evolution
pm2 save
pm2 startup

# 5. Installa Evolution API
echo ""
echo -e "${GREEN}5. Installando Evolution API v2.3.3...${NC}"

docker pull evolutionapi/evolution-api:latest

docker run -d \
  --name evolution-api \
  --restart always \
  --network host \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806 \
  -e DATABASE_ENABLED=false \
  -e REDIS_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e QRCODE_LIMIT=30 \
  -e CORS_ORIGIN="*" \
  -e LOG_LEVEL=info \
  evolutionapi/evolution-api:latest

sleep 5

# 6. Verifica installazione
echo ""
echo -e "${GREEN}6. Verificando installazione...${NC}"

# Check Docker
if docker ps | grep -q evolution-api; then
    echo "   ✅ Evolution API attivo"
else
    echo "   ❌ Evolution API non attivo"
fi

# Check Webhook
if pm2 list | grep -q webhook-evolution; then
    echo "   ✅ Webhook server attivo"
else
    echo "   ❌ Webhook server non attivo"
fi

# Check API
if curl -s http://localhost:8080 | grep -q "Evolution"; then
    echo "   ✅ API risponde"
else
    echo "   ❌ API non risponde"
fi

# 7. Crea scripts di gestione
echo ""
echo -e "${GREEN}7. Creando scripts di gestione...${NC}"

# Link agli script già creati
ln -sf ~/evolution-setup/update-evolution.sh ~/update-evolution.sh
ln -sf ~/evolution-setup/test-evolution.sh ~/test-evolution.sh
ln -sf ~/evolution-setup/create-instance.sh ~/create-instance.sh
ln -sf ~/evolution-setup/webhook-manager.sh ~/webhook-manager.sh

echo "   ✅ Scripts pronti nella home directory"

echo ""
echo "================================================"
echo -e "${GREEN}✅ INSTALLAZIONE COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API: http://37.27.89.35:8080"
echo "🔑 API Key: evolution_key_luca_2025_secure_21806"
echo "🔄 Webhook: http://localhost:3201"
echo ""
echo "📝 Comandi utili:"
echo "  ./test-evolution.sh     - Test sistema"
echo "  ./create-instance.sh    - Crea istanza WhatsApp"
echo "  ./webhook-manager.sh    - Gestisci webhook"
echo "  pm2 status             - Stato servizi"
echo "  pm2 logs webhook       - Log webhook"
echo "  docker logs evolution  - Log Evolution"
echo ""
echo "🚀 Prossimo passo: ./create-instance.sh"
echo ""
