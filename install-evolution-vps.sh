#!/bin/bash

# ================================================
# INSTALLAZIONE EVOLUTIONAPI SU VPS
# Script universale per Linux
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
echo "║     EVOLUTIONAPI VPS INSTALLER v2.0         ║"
echo "║     Per Luca Mambelli - 21 Set 2025         ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Funzione per rilevare il sistema
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        echo -e "${RED}Sistema operativo non supportato${NC}"
        exit 1
    fi
}

# Rileva sistema
detect_os
echo -e "${GREEN}✓ Sistema rilevato: $OS $VER${NC}"

# 1. AGGIORNAMENTO SISTEMA
echo ""
echo -e "${BLUE}1️⃣ Aggiornamento sistema...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -y
    apt-get upgrade -y
    apt-get install -y curl git wget nano ufw fail2ban
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y
    yum install -y curl git wget nano firewalld fail2ban
fi

# 2. INSTALLAZIONE DOCKER
echo ""
echo -e "${BLUE}2️⃣ Installazione Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installato${NC}"
else
    echo -e "${GREEN}✓ Docker già presente${NC}"
fi

# 3. INSTALLAZIONE DOCKER COMPOSE
echo ""
echo -e "${BLUE}3️⃣ Installazione Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installato${NC}"
else
    echo -e "${GREEN}✓ Docker Compose già presente${NC}"
fi

# 4. CREAZIONE DIRECTORY
echo ""
echo -e "${BLUE}4️⃣ Creazione struttura directory...${NC}"
mkdir -p /opt/evolution-api
cd /opt/evolution-api

# 5. CREAZIONE DOCKER-COMPOSE
echo ""
echo -e "${BLUE}5️⃣ Creazione configurazione Docker...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://CHANGE_TO_YOUR_DOMAIN_OR_IP:8080
      
      # Database
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_STRING=./evolution.db
      
      # Auth
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=evolution_secure_key_2025_luca_mambelli
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      
      # Instance
      - INSTANCE_LIMIT=10
      - QRCODE_LIMIT=30
      
      # Webhook
      - WEBHOOK_GLOBAL_ENABLED=false
      
      # Logging
      - LOG_LEVEL=info
      
      # Storage
      - CLEAN_STORE_CLEANING_INTERVAL=7200
      - CLEAN_STORE_MESSAGES=true
      - CLEAN_STORE_CONTACTS=true
      - CLEAN_STORE_CHATS=true
      
      # CORS
      - CORS_ORIGIN=["*"]
      - CORS_CREDENTIALS=true
      
    volumes:
      - evolution_data:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution_network

  # Nginx Reverse Proxy (opzionale ma consigliato)
  nginx:
    image: nginx:alpine
    container_name: evolution_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - evolution-api
    networks:
      - evolution_network

volumes:
  evolution_data:
  evolution_store:

networks:
  evolution_network:
    driver: bridge
EOF

# 6. CONFIGURAZIONE NGINX
echo ""
echo -e "${BLUE}6️⃣ Configurazione Nginx...${NC}"
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://evolution-api:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 7. CONFIGURAZIONE FIREWALL
echo ""
echo -e "${BLUE}7️⃣ Configurazione Firewall...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp
    ufw allow 3200/tcp
    echo "y" | ufw enable
    echo -e "${GREEN}✓ UFW configurato${NC}"
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --permanent --add-port=3200/tcp
    firewall-cmd --reload
    echo -e "${GREEN}✓ Firewall configurato${NC}"
fi

# 8. AVVIO SERVIZI
echo ""
echo -e "${BLUE}8️⃣ Avvio EvolutionAPI...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# 9. SCRIPT DI GESTIONE
echo ""
echo -e "${BLUE}9️⃣ Creazione script di gestione...${NC}"

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/evolution-api
docker-compose up -d
echo "✓ EvolutionAPI avviato"
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
cd /opt/evolution-api
docker-compose down
echo "✓ EvolutionAPI fermato"
EOF

# Restart script
cat > restart.sh << 'EOF'
#!/bin/bash
cd /opt/evolution-api
docker-compose restart
echo "✓ EvolutionAPI riavviato"
EOF

# Logs script
cat > logs.sh << 'EOF'
#!/bin/bash
cd /opt/evolution-api
docker-compose logs -f evolution-api
EOF

# Status script
cat > status.sh << 'EOF'
#!/bin/bash
cd /opt/evolution-api
docker-compose ps
EOF

chmod +x *.sh

# 10. SYSTEMD SERVICE
echo ""
echo -e "${BLUE}🔟 Creazione servizio systemd...${NC}"
cat > /etc/systemd/system/evolution-api.service << 'EOF'
[Unit]
Description=Evolution API
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/evolution-api
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable evolution-api

# 11. INFORMAZIONI FINALI
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     ✅ INSTALLAZIONE COMPLETATA!             ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Ottieni IP pubblico
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo -e "${YELLOW}📋 INFORMAZIONI IMPORTANTI:${NC}"
echo ""
echo "🌐 URL EvolutionAPI: http://$PUBLIC_IP:8080"
echo "🔑 API Key: evolution_secure_key_2025_luca_mambelli"
echo "📁 Directory: /opt/evolution-api"
echo ""
echo -e "${YELLOW}🛠️ COMANDI UTILI:${NC}"
echo "  ./start.sh   - Avvia EvolutionAPI"
echo "  ./stop.sh    - Ferma EvolutionAPI"
echo "  ./restart.sh - Riavvia EvolutionAPI"
echo "  ./logs.sh    - Mostra i log"
echo "  ./status.sh  - Mostra lo stato"
echo ""
echo -e "${YELLOW}⚙️ PROSSIMI PASSI:${NC}"
echo "1. Modifica docker-compose.yml e sostituisci CHANGE_TO_YOUR_DOMAIN_OR_IP con: $PUBLIC_IP"
echo "2. Riavvia con: ./restart.sh"
echo "3. Configura il tuo backend per usare: http://$PUBLIC_IP:8080"
echo "4. Nel file .env del backend, imposta:"
echo "   EVOLUTION_API_URL=http://$PUBLIC_IP:8080"
echo ""
echo -e "${GREEN}🎉 Tutto pronto! EvolutionAPI è online su: http://$PUBLIC_IP:8080${NC}"
echo ""

# Test connessione
echo -e "${BLUE}Test connessione...${NC}"
sleep 5
curl -s http://localhost:8080 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ EvolutionAPI risponde correttamente!${NC}"
else
    echo -e "${YELLOW}⚠️ EvolutionAPI sta ancora avviando, attendi 30 secondi...${NC}"
fi
