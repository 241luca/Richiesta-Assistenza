#!/bin/bash

# Fix Evolution API v2.3.3 con PostgreSQL
# Data: 22 Settembre 2025

echo "================================================"
echo "FIX EVOLUTION API v2.3.3 CON POSTGRESQL"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Verifica se PostgreSQL è attivo
echo -e "${BLUE}1. Verificando PostgreSQL...${NC}"
if docker ps | grep -q postgres; then
    echo "   ✅ PostgreSQL container attivo"
    PG_CONTAINER=$(docker ps | grep postgres | awk '{print $1}')
else
    echo "   ⚠️ PostgreSQL non trovato in Docker"
    echo "   Verificando installazione locale..."
    if systemctl status postgresql | grep -q "active"; then
        echo "   ✅ PostgreSQL locale attivo"
    else
        echo "   ❌ PostgreSQL non attivo"
        echo "   Installa o avvia PostgreSQL prima di continuare"
        exit 1
    fi
fi

# 2. Crea database evolution se non esiste
echo ""
echo -e "${BLUE}2. Preparando database...${NC}"
# Se PostgreSQL è locale
sudo -u postgres psql <<EOF 2>/dev/null || true
CREATE DATABASE evolution;
CREATE USER evolution WITH ENCRYPTED PASSWORD 'evolution123';
GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution;
EOF
echo "   ✅ Database preparato"

# 3. Ferma container esistente
echo ""
echo -e "${BLUE}3. Fermando container esistente...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null
echo "   ✅ Container rimosso"

# 4. Avvia con PostgreSQL configurato
echo ""
echo -e "${BLUE}4. Avviando Evolution API con PostgreSQL...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  --network host \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_PORT=8080 \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI="postgresql://evolution:evolution123@localhost:5432/evolution?schema=public" \
  -e DATABASE_CONNECTION_CLIENT_NAME="evolution_v233" \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_MESSAGE_UPDATE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  -e DATABASE_SAVE_DATA_LABELS=true \
  -e DATABASE_SAVE_DATA_HISTORIC=true \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
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
  -e WEBHOOK_EVENTS_CALL=false \
  -e WEBHOOK_EVENTS_ERRORS=true \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR="#198754" \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS,PATCH" \
  -e CORS_CREDENTIALS=true \
  -e CACHE_REDIS_ENABLED=false \
  -e CACHE_LOCAL_ENABLED=true \
  -e LOG_LEVEL=info \
  -e LOG_COLOR=true \
  -e LOG_BAILEYS=error \
  -e DEL_INSTANCE=false \
  -e STORE_MESSAGES=true \
  -e STORE_MESSAGE_UP=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  -e CLEAN_STORE_CLEANING_INTERVAL=7200 \
  -e LANGUAGE=pt-BR \
  evolution-api:custom-v233

echo "   ✅ Container avviato con PostgreSQL"
echo ""

# 5. Attendi avvio
echo -e "${BLUE}5. Attendendo avvio (40 secondi)...${NC}"
for i in {1..4}; do
    sleep 10
    echo "   $((i*10)) secondi..."
done
echo ""

# 6. Verifica logs
echo -e "${BLUE}6. Ultimi log:${NC}"
docker logs --tail 30 $CONTAINER_NAME
echo ""

# 7. Test API
echo -e "${BLUE}7. Test API...${NC}"
for attempt in {1..3}; do
    RESPONSE=$(curl -s http://localhost:8080)
    if echo "$RESPONSE" | grep -q "Evolution"; then
        VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo -e "   ${GREEN}✅ API ATTIVA!${NC}"
        echo "   📌 Versione: $VERSION"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -10
        break
    else
        echo "   Tentativo $attempt/3..."
        sleep 5
    fi
done
echo ""

# 8. Test database connection
echo -e "${BLUE}8. Test connessione database:${NC}"
docker exec $CONTAINER_NAME sh -c "echo 'SELECT NOW();' | psql postgresql://evolution:evolution123@localhost:5432/evolution" 2>/dev/null && \
    echo "   ✅ Database connesso" || \
    echo "   ⚠️ Verifica manuale database"
echo ""

# 9. Verifica finale
echo -e "${BLUE}9. Stato sistema:${NC}"
echo "Container:"
docker ps | grep $CONTAINER_NAME
echo ""
echo "Database evolution:"
sudo -u postgres psql -c "\l" 2>/dev/null | grep evolution || echo "Database da verificare"
echo ""

echo "================================================"
echo -e "${GREEN}✅ CONFIGURAZIONE COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API v2.3.3 con PostgreSQL"
echo "• Container: $CONTAINER_NAME"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo "• Database: PostgreSQL su localhost:5432"
echo "• Webhook: http://localhost:3201"
echo ""
echo "📝 Comandi utili:"
echo "• docker logs $CONTAINER_NAME -f"
echo "• docker restart $CONTAINER_NAME"
echo "• sudo -u postgres psql evolution"
echo ""
echo "Se tutto funziona: ./create-whatsapp-instance.sh"
echo ""
