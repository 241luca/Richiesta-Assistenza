#!/bin/bash

# Fix SEMPLICE Evolution API v2.3.3 - Usa PostgreSQL esistente
# Data: 22 Settembre 2025

echo "================================================"
echo "FIX SEMPLICE - USA POSTGRESQL ESISTENTE"
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

# 2. Ottieni IP del PostgreSQL container
echo -e "${BLUE}2. Trovando PostgreSQL...${NC}"
PG_CONTAINER_IP=$(docker inspect evolution_postgres | grep -m1 '"IPAddress"' | cut -d'"' -f4)
echo "   PostgreSQL IP: $PG_CONTAINER_IP"
echo ""

# 3. Crea database nel PostgreSQL esistente
echo -e "${BLUE}3. Configurando database...${NC}"
docker exec evolution_postgres psql -U postgres -c "CREATE DATABASE evolution;" 2>/dev/null || echo "   Database già esistente"
docker exec evolution_postgres psql -U postgres -c "CREATE USER evolution WITH PASSWORD 'evolution123';" 2>/dev/null || echo "   Utente già esistente"
docker exec evolution_postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution;" 2>/dev/null
echo "   ✅ Database configurato"
echo ""

# 4. Avvia Evolution API con link diretto al PostgreSQL
echo -e "${BLUE}4. Avviando Evolution API...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  --link evolution_postgres:postgres \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_PORT=8080 \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI="postgresql://evolution:evolution123@postgres:5432/evolution?schema=public" \
  -e DATABASE_CONNECTION_CLIENT_NAME="evolution_v233" \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_MESSAGE_UPDATE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://172.17.0.1:3201/api/whatsapp/webhook \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e QRCODE_LIMIT=30 \
  -e CORS_ORIGIN="*" \
  -e LOG_LEVEL=info \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  evolution-api:custom-v233

echo "   ✅ Container avviato"
echo ""

# 5. Attendi avvio
echo -e "${BLUE}5. Attendendo avvio (30 secondi)...${NC}"
sleep 10
echo "   10 secondi..."
sleep 10
echo "   20 secondi..."
sleep 10
echo "   30 secondi..."
echo ""

# 6. Verifica logs
echo -e "${BLUE}6. Ultimi log:${NC}"
docker logs --tail 30 $CONTAINER_NAME
echo ""

# 7. Test API
echo -e "${BLUE}7. Test API...${NC}"
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ API ATTIVA - Versione: $VERSION${NC}"
else
    echo "   ⚠️ API non risponde ancora"
    echo "   Controlla con: docker logs $CONTAINER_NAME -f"
fi
echo ""

# 8. Stato finale
echo -e "${BLUE}8. Stato sistema:${NC}"
docker ps | grep -E "evolution|postgres"
echo ""

echo "================================================"
echo "CONFIGURAZIONE COMPLETATA"
echo "================================================"
echo ""
echo "📱 Evolution API v2.3.3"
echo "• Container: $CONTAINER_NAME"
echo "• PostgreSQL: evolution_postgres"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo ""
echo "Se funziona: ./create-whatsapp-instance.sh"
echo "Se non funziona: docker logs $CONTAINER_NAME -f"
echo ""
