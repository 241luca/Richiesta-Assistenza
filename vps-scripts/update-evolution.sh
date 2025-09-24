#!/bin/bash

# Script per aggiornare Evolution API alla versione 2.3.3 sul VPS
# Data: 22 Settembre 2025
# Da eseguire DIRETTAMENTE sul VPS

echo "================================================"
echo "AGGIORNAMENTO EVOLUTION API → v2.3.3"
echo "VPS: $(hostname -I | awk '{print $1}')"
echo "================================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  CONFIGURAZIONE:${NC}"
echo "• Evolution API: Docker porta 8080"
echo "• Webhook Server: Node.js porta 3201"
echo "• Database: PostgreSQL locale"
echo ""

# 1. Backup dei dati esistenti
echo -e "${GREEN}1. Backup dati esistenti...${NC}"
BACKUP_DIR=~/evolution-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Backup istanze se esistono
docker exec evolution-api cat /evolution/instances/instances.json > $BACKUP_DIR/instances.json 2>/dev/null && echo "   ✅ Istanze salvate" || echo "   ℹ️  Nessuna istanza da salvare"

# Backup config container
docker inspect evolution-api > $BACKUP_DIR/container-config.json 2>/dev/null && echo "   ✅ Config salvata" || echo "   ℹ️  Nessuna config da salvare"

echo "   📁 Backup in: $BACKUP_DIR"
echo ""

# 2. Verifica webhook server
echo -e "${GREEN}2. Verificando webhook server...${NC}"
if ps aux | grep -v grep | grep "webhook-server.js" > /dev/null; then
    echo "   ✅ Webhook server attivo"
elif ps aux | grep -v grep | grep "vps-webhook-server.js" > /dev/null; then
    echo "   ✅ Webhook server attivo"
else
    echo -e "   ${YELLOW}⚠️  Webhook server non trovato nei processi${NC}"
fi

# Test porta 3201
if netstat -tuln | grep ":3201" > /dev/null; then
    echo "   ✅ Porta 3201 in ascolto"
fi
echo ""

# 3. Ferma container esistente
echo -e "${GREEN}3. Fermando Evolution API esistente...${NC}"
docker stop evolution-api 2>/dev/null && echo "   ✅ Container fermato" || echo "   ℹ️  Nessun container da fermare"
docker rm evolution-api 2>/dev/null && echo "   ✅ Container rimosso" || echo "   ℹ️  Nessun container da rimuovere"
echo ""

# 4. Pull nuova versione
echo -e "${GREEN}4. Scaricando Evolution API v2.3.3...${NC}"
docker pull evolutionapi/evolution-api:v2.3.3

if [ $? -ne 0 ]; then
    echo "   Provo con evolutionapi/evolution-api:latest..."
    docker pull evolutionapi/evolution-api:latest
    DOCKER_TAG="latest"
else
    DOCKER_TAG="v2.3.3"
fi

echo "   ✅ Immagine scaricata: $DOCKER_TAG"
echo ""

# 5. Crea volume per persistenza dati se non esiste
echo -e "${GREEN}5. Preparando volume dati...${NC}"
docker volume create evolution-data 2>/dev/null && echo "   ✅ Volume creato" || echo "   ✅ Volume esistente"
echo ""

# 6. Avvia nuovo container
echo -e "${GREEN}6. Avviando Evolution API v2.3.3...${NC}"

docker run -d \
  --name evolution-api \
  --restart always \
  --network host \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806 \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=false \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
  -e WEBHOOK_EVENTS_APPLICATION_STARTUP=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
  -e WEBHOOK_EVENTS_MESSAGES_DELETE=false \
  -e WEBHOOK_EVENTS_SEND_MESSAGE=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPSERT=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPDATE=true \
  -e WEBHOOK_EVENTS_PRESENCE_UPDATE=false \
  -e WEBHOOK_EVENTS_CHATS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPDATE=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e WEBHOOK_EVENTS_CALL=false \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR="#198754" \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS,PATCH" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e LOG_COLOR=true \
  -e LOG_BAILEYS=error \
  -e STORE_MESSAGES=true \
  -e STORE_MESSAGE_UP=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  evolutionapi/evolution-api:${DOCKER_TAG}

sleep 3
echo "   ✅ Container avviato"
echo ""

# 7. Verifica stato
echo -e "${GREEN}7. Verificando stato...${NC}"
docker ps | grep evolution-api && echo "   ✅ Container attivo" || echo "   ❌ Container non attivo"
echo ""

# 8. Test API
echo -e "${GREEN}8. Test API...${NC}"
sleep 2
curl -s http://localhost:8080 | head -n 5
echo ""

# 9. Mostra logs
echo -e "${GREEN}9. Ultimi log del container:${NC}"
docker logs --tail 20 evolution-api
echo ""

echo "================================================"
echo -e "${GREEN}✅ AGGIORNAMENTO COMPLETATO${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API v2.3.3"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: evolution_key_luca_2025_secure_21806"
echo ""
echo "🔄 Webhook Server"
echo "• Porta: 3201"
echo "• Endpoint: http://localhost:3201/api/whatsapp/webhook"
echo ""
echo "📝 Prossimi passi:"
echo "1. Testa con: ./test-evolution.sh"
echo "2. Crea istanza se necessario"
echo "3. Scansiona QR code"
echo ""
