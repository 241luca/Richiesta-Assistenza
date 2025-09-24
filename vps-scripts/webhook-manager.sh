#!/bin/bash

# Verifica e gestione webhook server
# Da eseguire sul VPS
# Data: 22 Settembre 2025

echo "================================================"
echo "GESTIONE WEBHOOK SERVER"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funzione per verificare se il webhook è attivo
check_webhook() {
    if ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" > /dev/null; then
        PID=$(ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" | awk '{print $2}')
        echo -e "${GREEN}✅ Webhook server attivo (PID: $PID)${NC}"
        return 0
    else
        echo -e "${RED}❌ Webhook server non attivo${NC}"
        return 1
    fi
}

# Funzione per avviare il webhook
start_webhook() {
    echo "Avviando webhook server..."
    
    # Cerca il file webhook
    if [ -f ~/webhook-server.js ]; then
        WEBHOOK_FILE=~/webhook-server.js
    elif [ -f ~/vps-webhook-server.js ]; then
        WEBHOOK_FILE=~/vps-webhook-server.js
    else
        echo -e "${RED}❌ File webhook non trovato${NC}"
        echo "Creando webhook server..."
        create_webhook_file
        WEBHOOK_FILE=~/webhook-server.js
    fi
    
    # Avvia con nohup
    nohup node $WEBHOOK_FILE > ~/webhook.log 2>&1 &
    sleep 2
    
    if check_webhook; then
        echo -e "${GREEN}✅ Webhook avviato con successo${NC}"
    else
        echo -e "${RED}❌ Errore nell'avvio del webhook${NC}"
        echo "Controlla ~/webhook.log per i dettagli"
    fi
}

# Funzione per fermare il webhook
stop_webhook() {
    echo "Fermando webhook server..."
    
    if ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" > /dev/null; then
        PID=$(ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" | awk '{print $2}')
        kill $PID
        echo -e "${GREEN}✅ Webhook fermato (PID: $PID)${NC}"
    else
        echo -e "${YELLOW}ℹ️  Webhook già fermato${NC}"
    fi
}

# Funzione per creare il file webhook se non esiste
create_webhook_file() {
    cat > ~/webhook-server.js <<'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3201;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const qrCodeStore = new Map();

// Webhook endpoint principale
app.post('/api/whatsapp/webhook/:instance', (req, res) => {
  const { instance } = req.params;
  const event = req.body;
  
  console.log(`[${new Date().toISOString()}] Webhook ${instance}: ${event.event}`);
  
  // Gestione eventi
  if (event.event === 'qrcode.updated' || event.event === 'QRCODE_UPDATED') {
    const qrData = event.base64 || event.qrcode?.base64 || event.qrcode;
    if (qrData) {
      qrCodeStore.set(instance, {
        qrcode: qrData,
        timestamp: new Date()
      });
      console.log(`QR salvato per ${instance}`);
    }
  }
  
  res.status(200).json({ success: true });
});

// Endpoint per recuperare QR
app.get('/api/whatsapp/qrcode/:instance', (req, res) => {
  const { instance } = req.params;
  const qrData = qrCodeStore.get(instance);
  
  if (!qrData) {
    return res.status(404).json({ error: 'QR not found' });
  }
  
  res.json({ qrcode: qrData.qrcode });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    qrCodes: qrCodeStore.size,
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server su http://0.0.0.0:${PORT}`);
});
EOF
    
    # Installa dipendenze se necessario
    if ! npm list express > /dev/null 2>&1; then
        echo "Installando dipendenze..."
        npm install express cors
    fi
}

# Menu principale
case "${1:-status}" in
    start)
        if check_webhook; then
            echo -e "${YELLOW}ℹ️  Webhook già attivo${NC}"
        else
            start_webhook
        fi
        ;;
    
    stop)
        stop_webhook
        ;;
    
    restart)
        stop_webhook
        sleep 1
        start_webhook
        ;;
    
    status)
        echo -e "${BLUE}Stato webhook server:${NC}"
        check_webhook
        
        echo ""
        echo -e "${BLUE}Porta 3201:${NC}"
        if netstat -tuln | grep ":3201" > /dev/null; then
            echo -e "${GREEN}✅ Porta 3201 in ascolto${NC}"
            netstat -tuln | grep ":3201"
        else
            echo -e "${RED}❌ Porta 3201 non in ascolto${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}Test endpoint:${NC}"
        if curl -s http://localhost:3201/health > /dev/null 2>&1; then
            HEALTH=$(curl -s http://localhost:3201/health)
            echo -e "${GREEN}✅ Health check OK${NC}"
            echo "   $HEALTH"
        else
            echo -e "${RED}❌ Endpoint non risponde${NC}"
        fi
        ;;
    
    logs)
        echo -e "${BLUE}Ultimi log webhook:${NC}"
        if [ -f ~/webhook.log ]; then
            tail -n 50 ~/webhook.log
        else
            echo "Nessun log trovato"
        fi
        ;;
    
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "  start   - Avvia webhook server"
        echo "  stop    - Ferma webhook server"
        echo "  restart - Riavvia webhook server"
        echo "  status  - Mostra stato (default)"
        echo "  logs    - Mostra ultimi log"
        exit 1
        ;;
esac

echo ""
