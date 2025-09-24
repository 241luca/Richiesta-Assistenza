#!/bin/bash

# ================================================
# INSTALLAZIONE EVOLUTION API SU VPS PRODUZIONE
# Non interferisce con Richiesta Assistenza
# ================================================

set -e  # Esci se ci sono errori

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║   EVOLUTION API - INSTALLAZIONE PRODUZIONE   ║"
echo "║         Senza interferire con l'app          ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. VERIFICA DOCKER
echo ""
echo -e "${BLUE}1️⃣ Verifica Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker non trovato. Installazione...${NC}"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installato${NC}"
else
    echo -e "${GREEN}✓ Docker già presente${NC}"
fi

# 2. DOCKER COMPOSE
echo ""
echo -e "${BLUE}2️⃣ Verifica Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installazione Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installato${NC}"
else
    echo -e "${GREEN}✓ Docker Compose già presente${NC}"
fi

# 3. CREA DIRECTORY EVOLUTION (separata da /var/www)
echo ""
echo -e "${BLUE}3️⃣ Creazione directory Evolution...${NC}"
mkdir -p /opt/evolution-api
cd /opt/evolution-api

# 4. OTTIENI IP PUBBLICO
PUBLIC_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}✓ IP Pubblico rilevato: $PUBLIC_IP${NC}"

# 5. CREA DOCKER-COMPOSE PER EVOLUTION
echo ""
echo -e "${BLUE}5️⃣ Creazione configurazione Evolution...${NC}"
cat > docker-compose.yml << EOF
version: '3.9'

services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"  # Porta diversa da 3200 e 5193!
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://${PUBLIC_IP}:8080
      
      # Database SQLite (semplice, no config)
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_STRING=./evolution.db
      
      # Sicurezza
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_${RANDOM}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      
      # Limiti
      - INSTANCE_LIMIT=10
      - QRCODE_LIMIT=30
      
      # Webhook per il tuo backend
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://${PUBLIC_IP}:3200/api/whatsapp/webhook
      
      # Log
      - LOG_LEVEL=info
      
      # Pulizia automatica
      - CLEAN_STORE_CLEANING_INTERVAL=7200
      - CLEAN_STORE_MESSAGES=true
      - CLEAN_STORE_CONTACTS=true
      - CLEAN_STORE_CHATS=true
      
      # CORS (permetti tutto)
      - CORS_ORIGIN=["*"]
      - CORS_CREDENTIALS=true
      
    volumes:
      - evolution_data:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution_network

volumes:
  evolution_data:
  evolution_store:

networks:
  evolution_network:
    driver: bridge
EOF

# 6. CREA SCRIPT DI GESTIONE
echo ""
echo -e "${BLUE}6️⃣ Creazione script di gestione...${NC}"

# Start
cat > start-evolution.sh << 'SCRIPT'
#!/bin/bash
cd /opt/evolution-api
docker-compose up -d
echo "✅ Evolution API avviato su porta 8080"
SCRIPT

# Stop
cat > stop-evolution.sh << 'SCRIPT'
#!/bin/bash
cd /opt/evolution-api
docker-compose down
echo "⏹️ Evolution API fermato"
SCRIPT

# Restart
cat > restart-evolution.sh << 'SCRIPT'
#!/bin/bash
cd /opt/evolution-api
docker-compose restart
echo "🔄 Evolution API riavviato"
SCRIPT

# Logs
cat > logs-evolution.sh << 'SCRIPT'
#!/bin/bash
cd /opt/evolution-api
docker-compose logs -f evolution-api
SCRIPT

# Status
cat > status-evolution.sh << 'SCRIPT'
#!/bin/bash
cd /opt/evolution-api
docker-compose ps
SCRIPT

chmod +x *.sh

# 7. AGGIORNA FIREWALL
echo ""
echo -e "${BLUE}7️⃣ Aggiornamento firewall...${NC}"
ufw allow 8080/tcp
echo -e "${GREEN}✓ Porta 8080 aperta${NC}"

# 8. AVVIA EVOLUTION
echo ""
echo -e "${BLUE}8️⃣ Avvio Evolution API...${NC}"
docker-compose up -d

# 9. SALVA CONFIGURAZIONE
echo ""
echo -e "${BLUE}9️⃣ Salvataggio configurazione...${NC}"

# Salva API key in un file
API_KEY=$(grep AUTHENTICATION_API_KEY docker-compose.yml | cut -d'=' -f2 | xargs)
cat > evolution-config.txt << EOF
EVOLUTION API - CONFIGURAZIONE PRODUZIONE
==========================================

URL Evolution: http://${PUBLIC_IP}:8080
API Key: ${API_KEY}
Webhook URL: http://${PUBLIC_IP}:3200/api/whatsapp/webhook

Directory: /opt/evolution-api

Comandi:
- ./start-evolution.sh   - Avvia
- ./stop-evolution.sh    - Ferma
- ./restart-evolution.sh - Riavvia
- ./logs-evolution.sh    - Vedi log
- ./status-evolution.sh  - Controlla stato
EOF

# 10. AGGIORNA BACKEND
echo ""
echo -e "${BLUE}🔟 Configurazione backend...${NC}"

# Crea file di configurazione per il backend
cat > /var/www/Richiesta-Assistenza/backend/.env.evolution << EOF
# Aggiungi queste righe al tuo .env principale
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=${API_KEY}
EOF

echo -e "${YELLOW}📝 File creato: /var/www/Richiesta-Assistenza/backend/.env.evolution${NC}"
echo -e "${YELLOW}   Copia manualmente queste variabili nel .env principale${NC}"

# VERIFICA
echo ""
echo -e "${BLUE}Verifica installazione...${NC}"
sleep 5

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Evolution API risponde correttamente!${NC}"
else
    echo -e "${YELLOW}⏳ Evolution sta ancora avviando, attendi 30 secondi...${NC}"
fi

# RISULTATO FINALE
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║        ✅ INSTALLAZIONE COMPLETATA!          ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}📋 RIEPILOGO:${NC}"
echo ""
echo "✅ Evolution API: http://${PUBLIC_IP}:8080"
echo "✅ API Key: ${API_KEY}"
echo "✅ Directory: /opt/evolution-api"
echo ""
echo -e "${YELLOW}🔧 PROSSIMI PASSI:${NC}"
echo ""
echo "1. Aggiungi al file .env del backend:"
echo "   cat /var/www/Richiesta-Assistenza/backend/.env.evolution"
echo ""
echo "2. Riavvia il backend:"
echo "   pm2 restart backend"
echo ""
echo "3. Vai nel pannello admin:"
echo "   http://${PUBLIC_IP}/admin/whatsapp"
echo ""
echo "4. Crea istanza e scansiona QR code"
echo ""
echo -e "${GREEN}🎉 Fatto! Evolution è pronto all'uso!${NC}"
