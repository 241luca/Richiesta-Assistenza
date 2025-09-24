#!/bin/bash

# Build Docker image Evolution API v2.3.3 dal Dockerfile ufficiale
# Data: 22 Settembre 2025

echo "================================================"
echo "BUILD DOCKER IMAGE EVOLUTION API v2.3.3"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Ferma e rimuovi container esistente
echo -e "${GREEN}1. Pulizia container esistente...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null && echo "   Container fermato"
docker rm $CONTAINER_NAME 2>/dev/null && echo "   Container rimosso"
echo ""

# 2. Clona il repository se non esiste
echo -e "${GREEN}2. Preparando repository...${NC}"
if [ ! -d "/root/evolution-api-source" ]; then
    echo "   Clonando repository..."
    cd /root
    git clone https://github.com/EvolutionAPI/evolution-api.git evolution-api-source
else
    echo "   Repository già esistente, aggiornando..."
    cd /root/evolution-api-source
    git pull
fi

cd /root/evolution-api-source

# 3. Checkout ultima versione o tag specifico
echo ""
echo -e "${GREEN}3. Selezionando versione...${NC}"
git fetch --all --tags

# Trova l'ultimo tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
echo "   Ultimo tag disponibile: $LATEST_TAG"

# Usa l'ultimo tag o main
if [ ! -z "$LATEST_TAG" ]; then
    git checkout $LATEST_TAG
    VERSION=$LATEST_TAG
else
    git checkout main || git checkout master
    VERSION="main"
fi
echo "   ✅ Usando: $VERSION"
echo ""

# 4. Build dell'immagine Docker
echo -e "${GREEN}4. Building Docker image...${NC}"
echo "   Questo richiederà alcuni minuti..."

# Build con il Dockerfile ufficiale
docker build -t evolution-api:custom-v233 .

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Build completata con successo!${NC}"
else
    echo -e "   ${RED}❌ Build fallita${NC}"
    echo "   Verifica i log sopra per dettagli"
    exit 1
fi
echo ""

# 5. Crea volume per persistenza
echo -e "${GREEN}5. Preparando volume...${NC}"
docker volume create evolution-data 2>/dev/null
echo "   ✅ Volume pronto"
echo ""

# 6. Avvia container con l'immagine custom
echo -e "${GREEN}6. Avviando container...${NC}"
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
  -e WEBHOOK_EVENTS_CONTACTS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
  -e QRCODE_LIMIT=30 \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="*" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e LOG_BAILEYS=error \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  evolution-api:custom-v233

sleep 5

# 7. Verifica
echo ""
echo -e "${GREEN}7. Verificando...${NC}"

# Check container
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "   ${GREEN}✅ Container attivo${NC}"
    docker ps | grep $CONTAINER_NAME
else
    echo -e "   ${RED}❌ Container non attivo${NC}"
    echo "   Logs:"
    docker logs --tail 30 $CONTAINER_NAME
    exit 1
fi
echo ""

# Test API
echo "Test API..."
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ API attiva${NC}"
    echo "   📌 Versione: $VERSION"
else
    echo -e "   ${RED}❌ API non risponde${NC}"
fi
echo ""

# 8. Mostra informazioni
echo -e "${GREEN}8. Immagini Docker disponibili:${NC}"
docker images | grep evolution
echo ""

echo "================================================"
echo -e "${GREEN}✅ BUILD E INSTALLAZIONE COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API Custom Build"
echo "• Container: $CONTAINER_NAME"
echo "• Immagine: evolution-api:custom-v233"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo "• Webhook: http://localhost:3201"
echo ""
echo "📝 Comandi utili:"
echo "• docker logs $CONTAINER_NAME -f     # Visualizza log"
echo "• docker restart $CONTAINER_NAME     # Riavvia"
echo "• docker exec -it $CONTAINER_NAME sh # Accedi al container"
echo ""
echo "Prossimo passo: ./create-whatsapp-instance.sh"
echo "================================================"
