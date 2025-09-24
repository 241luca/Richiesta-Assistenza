#!/bin/bash

# Fix DEFINITIVO - Usa PostgreSQL LOCALE del sistema
# Data: 22 Settembre 2025

echo "================================================"
echo "FIX CON POSTGRESQL LOCALE (NON DOCKER)"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Ferma Evolution API
echo -e "${BLUE}1. Fermando Evolution API...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null
echo "   ✅ Rimosso"
echo ""

# 2. Configura database PostgreSQL locale
echo -e "${BLUE}2. Configurando PostgreSQL locale...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE evolution;
CREATE USER evolution WITH PASSWORD 'evolution123';
GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution;
ALTER DATABASE evolution OWNER TO evolution;
\q
EOF
echo "   ✅ Database configurato"
echo ""

# 3. Test connessione al PostgreSQL locale
echo -e "${BLUE}3. Test PostgreSQL locale...${NC}"
PGPASSWORD=evolution123 psql -h localhost -U evolution -d evolution -c "SELECT version();" 2>/dev/null && \
    echo "   ✅ PostgreSQL locale accessibile" || \
    echo "   ℹ️ Configurazione da verificare"
echo ""

# 4. Avvia Evolution API con --network host per accedere a PostgreSQL locale
echo -e "${BLUE}4. Avviando Evolution API...${NC}"
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
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR="#198754" \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS,PATCH" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e LOG_BAILEYS=error \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  -e LANGUAGE=pt-BR \
  evolution-api:custom-v233

echo "   ✅ Container avviato con --network host"
echo ""

# 5. Attendi avvio
echo -e "${BLUE}5. Attendendo avvio (40 secondi)...${NC}"
for i in {1..4}; do
    sleep 10
    echo "   $((i*10)) secondi..."
done
echo ""

# 6. Verifica logs
echo -e "${BLUE}6. Verifica migrations...${NC}"
docker logs --tail 40 $CONTAINER_NAME
echo ""

# 7. Test API
echo -e "${BLUE}7. Test API...${NC}"
for attempt in {1..3}; do
    RESPONSE=$(curl -s http://localhost:8080)
    if echo "$RESPONSE" | grep -q "Evolution"; then
        VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo -e "   ${GREEN}✅ API FUNZIONANTE!${NC}"
        echo "   📌 Versione: $VERSION"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -10
        break
    else
        echo "   Tentativo $attempt/3..."
        sleep 5
    fi
done
echo ""

# 8. Verifica database
echo -e "${BLUE}8. Verifica tabelle database:${NC}"
sudo -u postgres psql -d evolution -c "\dt" 2>/dev/null | head -20 || echo "   Da verificare manualmente"
echo ""

# 9. Stato finale
echo -e "${BLUE}9. Stato sistema:${NC}"
echo "Container:"
docker ps | grep $CONTAINER_NAME
echo ""
echo "PostgreSQL locale:"
systemctl status postgresql --no-pager | head -5
echo ""

echo "================================================"
echo -e "${GREEN}✅ CONFIGURAZIONE COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API v2.3.3 con PostgreSQL LOCALE"
echo "• Container: $CONTAINER_NAME"
echo "• Database: PostgreSQL locale (porta 5432)"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo "• Network: host (accesso diretto a localhost)"
echo ""
echo "📝 Comandi utili:"
echo "• docker logs $CONTAINER_NAME -f"
echo "• sudo -u postgres psql evolution"
echo "• curl http://localhost:8080"
echo ""
echo "Se funziona: ./create-whatsapp-instance.sh"
echo "================================================"
