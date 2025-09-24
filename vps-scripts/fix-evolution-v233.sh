#!/bin/bash

# Fix per Evolution API v2.3.3 - Configurazione corretta
# Data: 22 Settembre 2025

echo "================================================"
echo "FIX EVOLUTION API v2.3.3"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Ferma container con errore
echo "1. Fermando container con errore..."
docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
echo "   ✅ Container rimosso"
echo ""

# 2. Riavvia con configurazione CORRETTA
echo "2. Avviando con configurazione corretta..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_PORT=8080 \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=false \
  -e DATABASE_PROVIDER=none \
  -e DATABASE_CONNECTION_URI="" \
  -e DATABASE_CONNECTION_CLIENT_NAME="" \
  -e REDIS_ENABLED=false \
  -e REDIS_URI="" \
  -e REDIS_PREFIX_KEY="" \
  -e RABBITMQ_ENABLED=false \
  -e RABBITMQ_URI="" \
  -e WEBSOCKET_ENABLED=true \
  -e WEBSOCKET_GLOBAL_EVENTS=true \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
  -e WEBHOOK_EVENTS_APPLICATION_STARTUP=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_SET=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
  -e WEBHOOK_EVENTS_MESSAGES_DELETE=false \
  -e WEBHOOK_EVENTS_SEND_MESSAGE=true \
  -e WEBHOOK_EVENTS_CONTACTS_SET=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPSERT=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPDATE=true \
  -e WEBHOOK_EVENTS_PRESENCE_UPDATE=false \
  -e WEBHOOK_EVENTS_CHATS_SET=true \
  -e WEBHOOK_EVENTS_CHATS_UPSERT=true \
  -e WEBHOOK_EVENTS_CHATS_UPDATE=true \
  -e WEBHOOK_EVENTS_CHATS_DELETE=false \
  -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPDATE=true \
  -e WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e WEBHOOK_EVENTS_LABELS_EDIT=false \
  -e WEBHOOK_EVENTS_LABELS_ASSOCIATION=false \
  -e WEBHOOK_EVENTS_CALL=false \
  -e WEBHOOK_EVENTS_TYPEBOT_START=false \
  -e WEBHOOK_EVENTS_TYPEBOT_CHANGE_STATUS=false \
  -e WEBHOOK_EVENTS_ERRORS=false \
  -e WEBHOOK_EVENTS_ERRORS_WEBHOOK=true \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR="#198754" \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS,PATCH" \
  -e CORS_CREDENTIALS=true \
  -e CACHE_REDIS_ENABLED=false \
  -e CACHE_REDIS_URI="" \
  -e CACHE_REDIS_PREFIX_KEY="" \
  -e CACHE_REDIS_TTL=604800 \
  -e CACHE_LOCAL_ENABLED=true \
  -e LOG_LEVEL=info \
  -e LOG_COLOR=true \
  -e LOG_BAILEYS=error \
  -e DEL_INSTANCE=false \
  -e DEL_TEMP_INSTANCES=false \
  -e STORE_MESSAGES=true \
  -e STORE_MESSAGE_UP=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  -e CLEAN_STORE_CLEANING_INTERVAL=7200 \
  -e CLEAN_STORE_MESSAGES=true \
  -e CLEAN_STORE_MESSAGE_UP=true \
  -e CLEAN_STORE_CONTACTS=true \
  -e CLEAN_STORE_CHATS=true \
  -e AUTHENTICATION_GLOBAL_AUTH_TOKEN="" \
  -e LANGUAGE=pt-BR \
  -e INSTANCE_EXPIRATION_TIME=false \
  -e INSTANCE_EXPIRATION_CHECK_INTERVAL=3600 \
  evolution-api:custom-v233

echo "   ✅ Container avviato"
echo ""

# 3. Aspetta avvio
echo "3. Attendendo avvio (30 secondi)..."
sleep 10
echo "   10 secondi..."
sleep 10
echo "   20 secondi..."
sleep 10
echo "   30 secondi..."
echo ""

# 4. Verifica logs
echo "4. Verificando logs..."
docker logs --tail 20 $CONTAINER_NAME
echo ""

# 5. Test API
echo "5. Test API..."
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ API attiva - Versione: $VERSION"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -10
else
    echo "   ⚠️ API ancora in avvio o problema"
    echo "   Response: $RESPONSE"
fi
echo ""

# 6. Verifica container
echo "6. Stato container:"
docker ps | grep $CONTAINER_NAME
echo ""

echo "================================================"
echo "FIX APPLICATO"
echo "================================================"
echo ""
echo "Se ancora non funziona, prova:"
echo "1. docker logs $CONTAINER_NAME -f"
echo "2. docker exec -it $CONTAINER_NAME sh"
echo "   poi: cat .env"
echo ""
echo "Se funziona:"
echo "./create-whatsapp-instance.sh"
echo ""
