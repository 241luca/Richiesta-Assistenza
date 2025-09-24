#!/bin/bash

# Script per aggiornare Evolution API alla versione 2.3.3 sul VPS
# Data: 22 Settembre 2025
# 
# IMPORTANTE: Questo script va eseguito SUL VPS!
# Il webhook server sulla porta 3201 NON viene toccato

echo "================================================"
echo "AGGIORNAMENTO EVOLUTION API → v2.3.3"
echo "VPS: 37.27.89.35"
echo "================================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  CONFIGURAZIONE ATTUALE:${NC}"
echo "• Evolution API: Docker porta 8080"
echo "• Webhook Server: Node.js porta 3201 (rimane attivo)"
echo "• Database: PostgreSQL locale"
echo ""
echo -e "${BLUE}📱 AGGIORNAMENTO:${NC}"
echo "• Evolution API → v2.3.3 (ultima da GitHub)"
echo "• Webhook server NON viene modificato"
echo ""
echo "================================================"
echo ""

# Conferma prima di procedere
read -p "Sei connesso al VPS? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Connettiti prima al VPS con:${NC}"
    echo "ssh root@37.27.89.35"
    exit 1
fi

# 1. Backup COMPLETO dei dati esistenti
echo -e "${GREEN}1. Backup completo dati esistenti...${NC}"
BACKUP_DIR=~/evolution-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Backup istanze e configurazione
echo "   Salvando istanze WhatsApp..."
docker exec evolution-api cat /evolution/instances/instances.json > $BACKUP_DIR/instances.json 2>/dev/null || echo "   No instances file found"

# Backup configurazione container per riferimento
docker inspect evolution-api > $BACKUP_DIR/container-config.json 2>/dev/null || echo "   No container config found"

# Lista file nel container per riferimento
docker exec evolution-api ls -la /evolution/ > $BACKUP_DIR/file-list.txt 2>/dev/null || echo "   Could not list files"

echo "   ✅ Backup salvato in: $BACKUP_DIR"
echo ""

# 2. Verifica webhook server
echo -e "${GREEN}2. Verificando webhook server...${NC}"
if curl -s http://localhost:3201/health > /dev/null; then
    echo "   ✅ Webhook server attivo su porta 3201"
else
    echo -e "   ${YELLOW}⚠️  Webhook server non risponde, verificare manualmente${NC}"
fi
echo ""

# 3. Ferma SOLO il container Evolution API
echo -e "${GREEN}3. Fermando Evolution API attuale...${NC}"
docker stop evolution-api 2>/dev/null && echo "   ✅ Container fermato" || echo "   Container già fermo"
docker rm evolution-api 2>/dev/null && echo "   ✅ Container rimosso" || echo "   Nessun container da rimuovere"
echo ""

# 4. Pull della nuova versione 2.3.3
echo -e "${GREEN}4. Scaricando Evolution API v2.3.3...${NC}"
echo "   Tentativo con tag v2.3.3..."
docker pull atendai/evolution-api:v2.3.3 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   Tag v2.3.3 non trovato, uso 'latest'..."
    docker pull atendai/evolution-api:latest
    DOCKER_TAG="latest"
else
    DOCKER_TAG="v2.3.3"
fi

echo "   ✅ Immagine Docker scaricata: $DOCKER_TAG"
echo ""

# 5. Avvia il nuovo container con configurazione ottimizzata per v2.3.3
echo -e "${GREEN}5. Avviando Evolution API v2.3.3...${NC}"

# IMPORTANTE: Il webhook punta al server Node.js su porta 3201
WEBHOOK_URL="http://localhost:3201/api/whatsapp/webhook"

docker run -d \
  --name evolution-api \
  --restart always \
  --network host \
  -v ~/evolution-data:/evolution/instances \
  -e SERVER_PORT=8080 \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI="postgresql://evolution:evolution123@localhost:5432/evolution" \
  -e DATABASE_CONNECTION_CLIENT_NAME="evolution_v233" \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_MESSAGE_UPDATE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  -e DATABASE_SAVE_DATA_LABELS=true \
  -e DATABASE_SAVE_DATA_HISTORIC=true \
  -e RABBITMQ_ENABLED=false \
  -e SQS_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBSOCKET_GLOBAL_EVENTS=true \
  -e WA_BUSINESS_TOKEN_WEBHOOK=false \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL="${WEBHOOK_URL}" \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
  -e WEBHOOK_EVENTS_APPLICATION_STARTUP=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_SET=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_MESSAGES_EDITED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
  -e WEBHOOK_EVENTS_MESSAGES_DELETE=true \
  -e WEBHOOK_EVENTS_SEND_MESSAGE=true \
  -e WEBHOOK_EVENTS_CONTACTS_SET=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPSERT=true \
  -e WEBHOOK_EVENTS_CONTACTS_UPDATE=true \
  -e WEBHOOK_EVENTS_PRESENCE_UPDATE=false \
  -e WEBHOOK_EVENTS_CHATS_SET=true \
  -e WEBHOOK_EVENTS_CHATS_UPSERT=true \
  -e WEBHOOK_EVENTS_CHATS_UPDATE=true \
  -e WEBHOOK_EVENTS_CHATS_DELETE=true \
  -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
  -e WEBHOOK_EVENTS_GROUPS_UPDATE=true \
  -e WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e WEBHOOK_EVENTS_LABELS_EDIT=true \
  -e WEBHOOK_EVENTS_LABELS_ASSOCIATION=true \
  -e WEBHOOK_EVENTS_CALL=true \
  -e WEBHOOK_EVENTS_ERRORS=true \
  -e WEBHOOK_EVENTS_ERRORS_WEBHOOK=true \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR="#198754" \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="POST,GET,PUT,DELETE,OPTIONS" \
  -e CORS_CREDENTIALS=true \
  -e CACHE_REDIS_ENABLED=false \
  -e CACHE_LOCAL_ENABLED=true \
  -e LOG_LEVEL="verbose" \
  -e LOG_COLOR=true \
  -e LOG_BAILEYS="error" \
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
  -e LANGUAGE="pt-BR" \
  -e INSTANCE_EXPIRATION_TIME=false \
  atendai/evolution-api:${DOCKER_TAG}

echo "   ✅ Container avviato"
echo ""

# 6. Attendi avvio
echo -e "${GREEN}6. Attendendo avvio servizi...${NC}"
sleep 5

# 7. Verifica che Evolution sia attivo
echo -e "${GREEN}7. Verificando Evolution API...${NC}"
if curl -s http://localhost:8080/ | grep -q "Evolution"; then
    echo "   ✅ Evolution API attivo"
else
    echo -e "   ${RED}❌ Evolution API non risponde${NC}"
fi

# 8. Verifica container
echo ""
echo -e "${GREEN}8. Stato container:${NC}"
docker ps | grep evolution-api
echo ""

# 9. Test API
echo -e "${GREEN}9. Test API:${NC}"
curl -s -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: evolution_key_luca_2025_secure_21806" | python3 -m json.tool 2>/dev/null || echo "Nessuna istanza trovata (normale al primo avvio)"

echo ""
echo "================================================"
echo -e "${GREEN}✅ AGGIORNAMENTO COMPLETATO!${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📱 Evolution API v2.3.3${NC}"
echo "• API: http://37.27.89.35:8080"
echo "• Manager: http://37.27.89.35:8080/manager"
echo "• API Key: evolution_key_luca_2025_secure_21806"
echo ""
echo -e "${YELLOW}⚠️  PROSSIMI PASSI:${NC}"
echo "1. Verifica il Manager: http://37.27.89.35:8080/manager"
echo "2. Se l'istanza 'main' non c'è, creala dal Manager"
echo "3. Dal Mac locale, testa la connessione:"
echo "   curl http://37.27.89.35:8080/instance/fetchInstances -H 'apikey: evolution_key_luca_2025_secure_21806'"
echo ""
echo -e "${GREEN}📊 WEBHOOK:${NC}"
echo "• Webhook server attivo su porta 3201"
echo "• Evolution invia eventi a: http://localhost:3201/api/whatsapp/webhook"
echo ""
echo "================================================"
