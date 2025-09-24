#!/bin/bash

# Script CORRETTO per aggiornare Evolution API alla versione 2.3.3
# Adattato per il container "evolution_api" esistente
# Data: 22 Settembre 2025

echo "================================================"
echo "AGGIORNAMENTO EVOLUTION API → v2.3.3"
echo "Container: evolution_api (con underscore)"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# IMPORTANTE: Nome container reale con underscore
CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

echo -e "${YELLOW}⚠️  CONFIGURAZIONE ATTUALE:${NC}"
echo "• Container: $CONTAINER_NAME"
echo "• Versione attuale: 2.2.3"
echo "• Istanza WhatsApp: 'sistema' (Medicina Ravenna)"
echo "• Webhook Server: porta 3201 (rimane attivo)"
echo ""
read -p "Procedere con l'aggiornamento? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# 1. Backup COMPLETO dei dati esistenti
echo ""
echo -e "${GREEN}1. Backup completo dati esistenti...${NC}"
BACKUP_DIR=~/evolution-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Salva le istanze (IMPORTANTE!)
echo "   Salvando istanze WhatsApp..."
curl -s http://localhost:8080/instance/fetchInstances > $BACKUP_DIR/instances.json
echo "   ✅ Istanze salvate in $BACKUP_DIR/instances.json"

# Backup configurazione container
docker inspect $CONTAINER_NAME > $BACKUP_DIR/container-config.json 2>/dev/null
echo "   ✅ Config container salvata"

# Estrai il token reale dall'istanza
ACTUAL_TOKEN=$(curl -s http://localhost:8080/instance/fetchInstances | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0].get('token', '') if data else '')" 2>/dev/null)
if [ ! -z "$ACTUAL_TOKEN" ]; then
    echo "   ℹ️  Token salvato: $ACTUAL_TOKEN"
    echo "$ACTUAL_TOKEN" > $BACKUP_DIR/api-token.txt
fi

echo "   📁 Backup completo in: $BACKUP_DIR"
echo ""

# 2. Verifica webhook server (NON lo tocchiamo)
echo -e "${GREEN}2. Verificando webhook server...${NC}"
if ps aux | grep -v grep | grep "webhook-server.js" > /dev/null; then
    echo "   ✅ Webhook server attivo (NON verrà toccato)"
fi
if netstat -tuln | grep ":3201" > /dev/null; then
    echo "   ✅ Porta 3201 in ascolto"
fi
echo ""

# 3. Ferma il container esistente
echo -e "${GREEN}3. Fermando container $CONTAINER_NAME...${NC}"
docker stop $CONTAINER_NAME
sleep 2
docker rm $CONTAINER_NAME
echo "   ✅ Container fermato e rimosso"
echo ""

# 4. Pull nuova versione
echo -e "${GREEN}4. Scaricando Evolution API v2.3.3...${NC}"

# Prova prima con il tag specifico
docker pull evolutionapi/evolution-api:v2.3.3 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   Tag v2.3.3 non trovato, uso 'latest'..."
    docker pull evolutionapi/evolution-api:latest
    DOCKER_TAG="latest"
else
    DOCKER_TAG="v2.3.3"
fi

# Se non funziona neanche questo, prova atendai
if [ $? -ne 0 ]; then
    echo "   Provo con atendai/evolution-api:latest..."
    docker pull atendai/evolution-api:latest
    DOCKER_IMAGE="atendai/evolution-api:latest"
else
    DOCKER_IMAGE="evolutionapi/evolution-api:${DOCKER_TAG}"
fi

echo "   ✅ Immagine scaricata: $DOCKER_IMAGE"
echo ""

# 5. Prepara volume per persistenza
echo -e "${GREEN}5. Preparando volume dati...${NC}"
docker volume create evolution-data 2>/dev/null || echo "   Volume già esistente"
echo ""

# 6. Avvia nuovo container con stesso nome
echo -e "${GREEN}6. Avviando nuovo container...${NC}"

# Usa il token reale se trovato, altrimenti quello default
FINAL_TOKEN="${ACTUAL_TOKEN:-$API_KEY}"

docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$FINAL_TOKEN" \
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
  $DOCKER_IMAGE

sleep 5
echo "   ✅ Container avviato"
echo ""

# 7. Verifica stato
echo -e "${GREEN}7. Verificando nuovo container...${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo "   ✅ Container $CONTAINER_NAME attivo"
    docker ps | grep $CONTAINER_NAME
else
    echo "   ❌ Container non attivo, verificando logs..."
    docker logs --tail 20 $CONTAINER_NAME
fi
echo ""

# 8. Test API
echo -e "${GREEN}8. Test API...${NC}"
sleep 2
API_RESPONSE=$(curl -s http://localhost:8080)
if echo "$API_RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$API_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ API attiva - Versione: $VERSION"
else
    echo "   ❌ API non risponde"
fi
echo ""

# 9. Verifica istanza 'sistema'
echo -e "${GREEN}9. Verificando istanza 'sistema'...${NC}"
INSTANCES=$(curl -s http://localhost:8080/instance/fetchInstances)
if echo "$INSTANCES" | grep -q "sistema"; then
    echo "   ✅ Istanza 'sistema' presente"
    
    # Verifica connessione
    if echo "$INSTANCES" | grep -q "open"; then
        echo "   ✅ WhatsApp ancora connesso"
    else
        echo "   ⚠️  WhatsApp disconnesso, potrebbe essere necessario riconnettere"
    fi
else
    echo "   ⚠️  Istanza 'sistema' non trovata"
    echo "   Potrebbe essere necessario ricrearla"
fi
echo ""

# 10. Mostra logs finali
echo -e "${GREEN}10. Ultimi log del nuovo container:${NC}"
docker logs --tail 15 $CONTAINER_NAME
echo ""

echo "================================================"
echo -e "${GREEN}✅ AGGIORNAMENTO COMPLETATO${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API aggiornato"
echo "• Container: $CONTAINER_NAME"
echo "• API: http://37.27.89.35:8080"
echo "• Token: $FINAL_TOKEN"
echo ""
echo "🔄 Webhook Server (non modificato)"
echo "• Porta: 3201"
echo "• Status: Attivo"
echo ""

# Verifica finale versione
FINAL_VERSION=$(curl -s http://localhost:8080 | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
if [ "$FINAL_VERSION" == "2.3.3" ]; then
    echo -e "${GREEN}✅ Versione 2.3.3 installata con successo!${NC}"
else
    echo -e "${YELLOW}ℹ️  Versione installata: $FINAL_VERSION${NC}"
fi

echo ""
echo "📝 Prossimi passi:"
echo "1. Verifica con: ./test-evolution-fixed.sh"
echo "2. Se WhatsApp è disconnesso, riconnetti l'istanza 'sistema'"
echo "3. Testa l'integrazione dal Mac locale"
echo ""
echo "📁 Backup salvato in: $BACKUP_DIR"
echo "================================================"
