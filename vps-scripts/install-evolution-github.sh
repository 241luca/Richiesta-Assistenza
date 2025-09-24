#!/bin/bash

# Script per installare Evolution API v2.3.3 da GitHub o Docker
# Data: 22 Settembre 2025

echo "================================================"
echo "INSTALLAZIONE EVOLUTION API v2.3.3"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurazione
CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

echo -e "${BLUE}Opzioni disponibili:${NC}"
echo "1. Usa atendai/evolution-api:latest (più semplice)"
echo "2. Compila da GitHub v2.3.3 (più aggiornato)"
echo ""
read -p "Quale opzione scegli? (1/2): " -n 1 -r CHOICE
echo ""

if [[ $CHOICE == "2" ]]; then
    # ============= OPZIONE 2: COMPILA DA GITHUB =============
    echo ""
    echo -e "${GREEN}Compilando da GitHub v2.3.3...${NC}"
    
    # 1. Installa dipendenze se necessario
    echo "1. Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    echo "   Node.js: $(node -v)"
    
    # 2. Clona repository
    echo ""
    echo "2. Clonando Evolution API v2.3.3..."
    cd /root
    rm -rf evolution-api-source
    git clone https://github.com/EvolutionAPI/evolution-api.git evolution-api-source
    cd evolution-api-source
    
    # Checkout versione 2.3.3
    git checkout v2.3.3 2>/dev/null || git checkout 2.3.3 2>/dev/null || {
        echo "   Tag v2.3.3 non trovato, usando main/master"
        git checkout main 2>/dev/null || git checkout master
    }
    
    CURRENT_BRANCH=$(git branch --show-current)
    echo "   Branch/Tag: $CURRENT_BRANCH"
    
    # 3. Build Docker image locale
    echo ""
    echo "3. Building Docker image..."
    docker build -t evolution-api:v2.3.3-local .
    
    if [ $? -ne 0 ]; then
        echo -e "   ${RED}❌ Build fallito${NC}"
        echo "   Proviamo con npm diretto..."
        
        # Alternativa: esegui con Node.js diretto
        npm install
        
        # Crea script di avvio
        cat > /root/start-evolution.sh <<'EOF'
#!/bin/bash
cd /root/evolution-api-source
export NODE_ENV=production
export SERVER_PORT=8080
export AUTHENTICATION_TYPE=apikey
export AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806
export WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook
export WEBHOOK_GLOBAL_ENABLED=true
export CORS_ORIGIN="*"
npm start
EOF
        chmod +x /root/start-evolution.sh
        
        echo "   Avvia con: /root/start-evolution.sh"
        exit 0
    fi
    
    DOCKER_IMAGE="evolution-api:v2.3.3-local"
    
else
    # ============= OPZIONE 1: USA ATENDAI LATEST =============
    echo ""
    echo -e "${GREEN}Usando atendai/evolution-api:latest...${NC}"
    
    # Ferma container esistente
    docker stop $CONTAINER_NAME 2>/dev/null
    docker rm $CONTAINER_NAME 2>/dev/null
    
    # Pull ultima versione
    docker pull atendai/evolution-api:latest
    DOCKER_IMAGE="atendai/evolution-api:latest"
fi

# Ferma vecchio container se esiste
echo ""
echo -e "${GREEN}Rimuovendo vecchio container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null && echo "   Container fermato"
docker rm $CONTAINER_NAME 2>/dev/null && echo "   Container rimosso"

# Crea volume se non esiste
docker volume create evolution-data 2>/dev/null

# Avvia nuovo container
echo ""
echo -e "${GREEN}Avviando Evolution API...${NC}"

docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=false \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e QRCODE_LIMIT=30 \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS,PATCH" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e LOG_BAILEYS=error \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  $DOCKER_IMAGE

sleep 5

# Verifica
echo ""
echo -e "${GREEN}Verificando...${NC}"

if docker ps | grep -q $CONTAINER_NAME; then
    echo "   ✅ Container attivo"
    
    # Test API
    API_RESPONSE=$(curl -s http://localhost:8080)
    if echo "$API_RESPONSE" | grep -q "Evolution"; then
        VERSION=$(echo "$API_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ API attiva - Versione: $VERSION"
    fi
else
    echo "   ❌ Container non attivo"
    docker logs --tail 20 $CONTAINER_NAME
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ COMPLETATO${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API"
echo "• Container: $CONTAINER_NAME"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo ""
echo "Per creare istanza WhatsApp:"
echo "./create-whatsapp-instance.sh"
echo ""
