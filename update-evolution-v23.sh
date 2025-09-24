#!/bin/bash

# Script per aggiornare Evolution API sul VPS
# ATTENZIONE: Esegui questo script SUL VPS, non localmente!

echo "================================================"
echo "AGGIORNAMENTO EVOLUTION API v2.2.3 → v2.3.0"
echo "================================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  ATTENZIONE:${NC}"
echo "Questo script deve essere eseguito SUL VPS (37.27.89.35)"
echo "NON eseguirlo localmente!"
echo ""
echo "Per eseguirlo sul VPS:"
echo "1. Connettiti via SSH: ssh root@37.27.89.35"
echo "2. Copia questo script sul VPS"
echo "3. Esegui: bash update-evolution.sh"
echo ""
echo "================================================"
echo ""

# Se sei sul VPS, decomment le righe sotto:

# # 1. Backup dei dati esistenti
# echo -e "${GREEN}1. Backup dati esistenti...${NC}"
# mkdir -p ~/evolution-backup-$(date +%Y%m%d)
# docker exec evolution-api cat /evolution/instances/instances.json > ~/evolution-backup-$(date +%Y%m%d)/instances.json 2>/dev/null || echo "No instances file found"
# echo "   Backup salvato in ~/evolution-backup-$(date +%Y%m%d)"

# # 2. Ferma il container esistente
# echo -e "${GREEN}2. Fermando Evolution API attuale...${NC}"
# docker stop evolution-api 2>/dev/null || echo "Container not running"
# docker rm evolution-api 2>/dev/null || echo "Container not found"

# # 3. Pull della nuova versione
# echo -e "${GREEN}3. Scaricando Evolution API v2.3.0...${NC}"
# docker pull atendai/evolution-api:v2.3.0

# # 4. Avvia il nuovo container con Evolution v2.3.0
# echo -e "${GREEN}4. Avviando Evolution API v2.3.0...${NC}"
# docker run -d \
#   --name evolution-api \
#   --restart always \
#   -p 8080:8080 \
#   -e AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806 \
#   -e AUTHENTICATION_TYPE=apikey \
#   -e DATABASE_ENABLED=true \
#   -e DATABASE_PROVIDER=postgresql \
#   -e DATABASE_CONNECTION_URI="postgresql://evolution:evolution123@localhost:5432/evolution" \
#   -e DATABASE_SAVE_DATA_INSTANCE=true \
#   -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
#   -e DATABASE_SAVE_MESSAGE_UPDATE=true \
#   -e DATABASE_SAVE_DATA_CONTACTS=true \
#   -e DATABASE_SAVE_DATA_CHATS=true \
#   -e RABBITMQ_ENABLED=false \
#   -e WEBSOCKET_ENABLED=true \
#   -e WEBSOCKET_GLOBAL_EVENTS=true \
#   -e WA_BUSINESS_TOKEN_WEBHOOK=false \
#   -e WA_BUSINESS_URL="" \
#   -e WA_BUSINESS_VERSION="v20.0" \
#   -e WEBHOOK_GLOBAL_ENABLED=false \
#   -e WEBHOOK_GLOBAL_URL="" \
#   -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
#   -e WEBHOOK_EVENTS_APPLICATION_STARTUP=false \
#   -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
#   -e WEBHOOK_EVENTS_MESSAGES_SET=false \
#   -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
#   -e WEBHOOK_EVENTS_MESSAGES_EDITED=true \
#   -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
#   -e WEBHOOK_EVENTS_MESSAGES_DELETE=false \
#   -e WEBHOOK_EVENTS_SEND_MESSAGE=false \
#   -e WEBHOOK_EVENTS_CONTACTS_SET=false \
#   -e WEBHOOK_EVENTS_CONTACTS_UPSERT=false \
#   -e WEBHOOK_EVENTS_CONTACTS_UPDATE=false \
#   -e WEBHOOK_EVENTS_PRESENCE_UPDATE=false \
#   -e WEBHOOK_EVENTS_CHATS_SET=false \
#   -e WEBHOOK_EVENTS_CHATS_UPSERT=false \
#   -e WEBHOOK_EVENTS_CHATS_UPDATE=false \
#   -e WEBHOOK_EVENTS_CHATS_DELETE=false \
#   -e WEBHOOK_EVENTS_GROUPS_UPSERT=true \
#   -e WEBHOOK_EVENTS_GROUPS_UPDATE=true \
#   -e WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=true \
#   -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
#   -e WEBHOOK_EVENTS_LABELS_EDIT=false \
#   -e WEBHOOK_EVENTS_LABELS_ASSOCIATION=false \
#   -e WEBHOOK_EVENTS_CALL=false \
#   -e WEBHOOK_EVENTS_TYPEBOT_START=false \
#   -e WEBHOOK_EVENTS_TYPEBOT_CHANGE_STATUS=false \
#   -e WEBHOOK_EVENTS_ERRORS=false \
#   -e WEBHOOK_EVENTS_ERRORS_WEBHOOK=true \
#   -e QRCODE_LIMIT=10 \
#   -e QRCODE_COLOR="#000000" \
#   -e CORS_ORIGIN="*" \
#   -e CORS_METHODS="POST,GET,PUT,DELETE" \
#   -e CORS_CREDENTIALS=true \
#   -e LOG_LEVEL="verbose" \
#   -e LOG_COLOR=true \
#   -e LOG_BAILEYS=false \
#   -e DEL_INSTANCE=false \
#   -e DEL_TEMP_INSTANCES=false \
#   -e STORE_MESSAGES=true \
#   -e STORE_MESSAGE_UP=true \
#   -e STORE_CONTACTS=true \
#   -e STORE_CHATS=true \
#   -e CLEAN_STORE_CLEANING_INTERVAL=7200 \
#   -e CLEAN_STORE_MESSAGES=true \
#   -e CLEAN_STORE_MESSAGE_UP=true \
#   -e CLEAN_STORE_CONTACTS=true \
#   -e CLEAN_STORE_CHATS=true \
#   -e AUTHENTICATION_GLOBAL_AUTH_TOKEN="" \
#   -e LANGUAGE="en" \
#   atendai/evolution-api:v2.3.0

# # 5. Verifica che sia partito
# echo -e "${GREEN}5. Verificando stato...${NC}"
# sleep 5
# docker ps | grep evolution-api

# # 6. Test API
# echo -e "${GREEN}6. Test API...${NC}"
# curl -s http://localhost:8080/ | jq .

# echo ""
# echo -e "${GREEN}✅ AGGIORNAMENTO COMPLETATO!${NC}"
# echo ""
# echo "Evolution API v2.3.0 è ora attivo su:"
# echo "- Manager: http://37.27.89.35:8080/manager"
# echo "- API: http://37.27.89.35:8080"
# echo ""
# echo "API Key: evolution_key_luca_2025_secure_21806"
# echo ""
# echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
# echo "1. Verifica che l'istanza 'main' sia ancora presente"
# echo "2. Se necessario, ricrea l'istanza tramite il Manager"
# echo "3. Il QR code dovrebbe ora funzionare correttamente via API"
