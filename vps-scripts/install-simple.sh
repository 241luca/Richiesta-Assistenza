#!/bin/bash

# Installazione DIRETTA con atendai/evolution-api:latest
# Data: 22 Settembre 2025

echo "================================================"
echo "INSTALLAZIONE EVOLUTION API (METODO SEMPLICE)"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Ferma e rimuovi vecchio container
echo "1. Pulizia container esistente..."
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null
echo "   ✅ Pulito"

# 2. Pull immagine atendai
echo ""
echo "2. Scaricando atendai/evolution-api:latest..."
docker pull atendai/evolution-api:latest
echo "   ✅ Immagine scaricata"

# 3. Crea volume se non esiste
echo ""
echo "3. Preparando volume..."
docker volume create evolution-data 2>/dev/null
echo "   ✅ Volume pronto"

# 4. Avvia container
echo ""
echo "4. Avviando Evolution API..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
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
  -e CORS_METHODS="*" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  atendai/evolution-api:latest

sleep 3

# 5. Verifica
echo ""
echo "5. Verificando..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo "   ✅ Container attivo"
else
    echo "   ❌ Container non attivo"
    docker logs --tail 20 $CONTAINER_NAME
fi

# 6. Test API
echo ""
echo "6. Test API..."
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ API attiva - Versione: $VERSION"
else
    echo "   ❌ API non risponde"
fi

echo ""
echo "================================================"
echo "✅ INSTALLAZIONE COMPLETATA"
echo "================================================"
echo ""
echo "Container: $CONTAINER_NAME"
echo "API: http://37.27.89.35:8080"
echo "API Key: $API_KEY"
echo "Webhook: http://localhost:3201"
echo ""
echo "Prossimo passo: ./create-whatsapp-instance.sh"
echo "================================================"
