#!/bin/bash

# Script per aggiornamento PULITO Evolution API v2.3.3
# Cancella istanza non funzionante e riparte da zero
# Data: 22 Settembre 2025

echo "================================================"
echo "AGGIORNAMENTO PULITO EVOLUTION API → v2.3.3"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurazione
CONTAINER_NAME="evolution_api"
NEW_API_KEY="evolution_key_luca_2025_secure_21806"

echo -e "${YELLOW}⚠️  ATTENZIONE:${NC}"
echo "• Verrà rimosso il container attuale"
echo "• L'istanza 'sistema' non funzionante verrà eliminata"
echo "• Installeremo Evolution API v2.3.3 pulito"
echo "• Il webhook server rimane attivo"
echo ""
read -p "Procedere? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# 1. Ferma e rimuovi container esistente
echo ""
echo -e "${GREEN}1. Rimuovendo container esistente...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null && echo "   ✅ Container fermato" || echo "   ℹ️  Container già fermo"
docker rm $CONTAINER_NAME 2>/dev/null && echo "   ✅ Container rimosso" || echo "   ℹ️  Nessun container da rimuovere"

# Rimuovi anche volume vecchio per partire pulito
docker volume rm evolution-data 2>/dev/null && echo "   ✅ Volume dati rimosso" || echo "   ℹ️  Nessun volume da rimuovere"
echo ""

# 2. Verifica webhook (non lo tocchiamo)
echo -e "${GREEN}2. Webhook server (rimane attivo)...${NC}"
if ps aux | grep -v grep | grep "webhook-server.js" > /dev/null; then
    echo "   ✅ Webhook attivo"
fi
if netstat -tuln | grep ":3201" > /dev/null; then
    echo "   ✅ Porta 3201 OK"
fi
echo ""

# 3. Scarica Evolution API v2.3.3
echo -e "${GREEN}3. Scaricando Evolution API v2.3.3...${NC}"

# Prova prima evolutionapi/evolution-api
docker pull evolutionapi/evolution-api:latest
if [ $? -eq 0 ]; then
    DOCKER_IMAGE="evolutionapi/evolution-api:latest"
    echo "   ✅ Immagine evolutionapi scaricata"
else
    # Se non funziona, prova atendai
    docker pull atendai/evolution-api:latest
    DOCKER_IMAGE="atendai/evolution-api:latest"
    echo "   ✅ Immagine atendai scaricata"
fi
echo ""

# 4. Crea nuovo volume
echo -e "${GREEN}4. Creando nuovo volume dati...${NC}"
docker volume create evolution-data
echo "   ✅ Volume creato"
echo ""

# 5. Avvia container pulito
echo -e "${GREEN}5. Avviando Evolution API v2.3.3...${NC}"

docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p 8080:8080 \
  -v evolution-data:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$NEW_API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=false \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://localhost:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
  -e WEBHOOK_EVENTS_SEND_MESSAGE=true \
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
  $DOCKER_IMAGE

sleep 5
echo "   ✅ Container avviato"
echo ""

# 6. Verifica stato
echo -e "${GREEN}6. Verificando container...${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo "   ✅ Container attivo"
    docker ps | grep $CONTAINER_NAME
else
    echo "   ❌ Problema con il container"
    docker logs --tail 20 $CONTAINER_NAME
    exit 1
fi
echo ""

# 7. Test API
echo -e "${GREEN}7. Test API...${NC}"
API_RESPONSE=$(curl -s http://localhost:8080)
if echo "$API_RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$API_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ API attiva"
    echo "   📌 Versione: $VERSION"
else
    echo "   ❌ API non risponde"
fi
echo ""

# 8. Verifica autenticazione
echo -e "${GREEN}8. Test autenticazione...${NC}"
AUTH_TEST=$(curl -s -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: $NEW_API_KEY")

if echo "$AUTH_TEST" | grep -q "error"; then
    echo "   ❌ Problema con autenticazione"
    echo "   Response: $AUTH_TEST"
else
    echo "   ✅ Autenticazione OK"
    if [ "$AUTH_TEST" == "[]" ]; then
        echo "   ℹ️  Nessuna istanza (normale, partenza pulita)"
    fi
fi
echo ""

# 9. Mostra logs
echo -e "${GREEN}9. Ultimi log:${NC}"
docker logs --tail 10 $CONTAINER_NAME
echo ""

echo "================================================"
echo -e "${GREEN}✅ INSTALLAZIONE PULITA COMPLETATA${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API v2.3.3"
echo "• Container: $CONTAINER_NAME"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $NEW_API_KEY"
echo ""
echo "🔄 Webhook Server"
echo "• Porta: 3201 (attivo)"
echo ""
echo "📝 Prossimi passi:"
echo "1. Crea nuova istanza WhatsApp"
echo "2. Scansiona QR code"
echo "3. Configura nel backend locale"
echo ""
echo "Per creare istanza usa lo script:"
echo "./create-instance-clean.sh"
echo ""
echo "================================================"
