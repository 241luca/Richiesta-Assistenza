#!/bin/bash

# SETUP COMPLETO DOCKER - Evolution API 2.3.3 + PostgreSQL + Webhook
# TUTTO IN DOCKER, NIENTE LOCALE!
# Data: 22 Settembre 2025

echo "================================================"
echo "SETUP COMPLETO DOCKER - EVOLUTION API 2.3.3"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_KEY="evolution_key_luca_2025_secure_21806"

# 1. PULIZIA TOTALE
echo -e "${RED}1. PULIZIA TOTALE DEL SISTEMA...${NC}"
docker stop evolution_api evolution_postgres 2>/dev/null
docker rm evolution_api evolution_postgres 2>/dev/null
docker network rm evolution-net 2>/dev/null
echo "   ✅ Sistema pulito"
echo ""

# 2. CREA RETE DOCKER
echo -e "${BLUE}2. Creando rete Docker...${NC}"
docker network create evolution-net
echo "   ✅ Rete creata"
echo ""

# 3. AVVIA POSTGRESQL IN DOCKER
echo -e "${BLUE}3. Avviando PostgreSQL in Docker...${NC}"
docker run -d \
  --name evolution_postgres \
  --network evolution-net \
  -e POSTGRES_DB=evolution \
  -e POSTGRES_USER=evolution \
  -e POSTGRES_PASSWORD=evolution123 \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -v postgres_evolution_data:/var/lib/postgresql/data \
  postgres:14-alpine

echo "   ✅ PostgreSQL avviato"
echo "   Attendendo che sia pronto..."
sleep 10

# Verifica PostgreSQL
docker exec evolution_postgres psql -U evolution -d evolution -c "SELECT version();"
if [ $? -eq 0 ]; then
    echo "   ✅ PostgreSQL funzionante!"
else
    echo "   ❌ Problema con PostgreSQL"
fi
echo ""

# 4. AVVIA EVOLUTION API 2.3.3
echo -e "${BLUE}4. Avviando Evolution API 2.3.3...${NC}"
docker run -d \
  --name evolution_api \
  --network evolution-net \
  -p 8080:8080 \
  -v evolution_instances:/evolution/instances \
  -e NODE_ENV=production \
  -e SERVER_PORT=8080 \
  -e SERVER_URL=http://37.27.89.35:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY="$API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI="postgresql://evolution:evolution123@evolution_postgres:5432/evolution?schema=public" \
  -e DATABASE_CONNECTION_CLIENT_NAME="evolution" \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_MESSAGE_UPDATE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  -e REDIS_ENABLED=false \
  -e RABBITMQ_ENABLED=false \
  -e WEBSOCKET_ENABLED=true \
  -e WEBSOCKET_GLOBAL_EVENTS=true \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_URL=http://172.17.0.1:3201/api/whatsapp/webhook \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e QRCODE_LIMIT=30 \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS="*" \
  -e CORS_CREDENTIALS=true \
  -e LOG_LEVEL=info \
  -e LOG_BAILEYS=error \
  -e STORE_MESSAGES=true \
  -e STORE_CONTACTS=true \
  -e STORE_CHATS=true \
  evolution-api:custom-v233

echo "   ✅ Evolution API avviato"
echo ""

# 5. ATTENDI CHE SI AVVII
echo -e "${BLUE}5. Attendendo avvio completo (60 secondi)...${NC}"
echo "   Le migrations di Prisma richiedono tempo..."
for i in {1..6}; do
    sleep 10
    echo "   $((i*10)) secondi..."
    
    # Ogni 20 secondi controlla se risponde
    if [ $i -eq 2 ] || [ $i -eq 4 ] || [ $i -eq 6 ]; then
        if curl -s http://localhost:8080 | grep -q "Evolution"; then
            echo -e "   ${GREEN}✅ API ATTIVA!${NC}"
            break
        fi
    fi
done
echo ""

# 6. VERIFICA LOGS
echo -e "${BLUE}6. Ultimi log Evolution API:${NC}"
docker logs --tail 30 evolution_api
echo ""

# 7. TEST API
echo -e "${BLUE}7. Test API finale...${NC}"
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    VERSION=$(echo "$RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ SUCCESSO! API FUNZIONANTE${NC}"
    echo "   📌 Versione: $VERSION"
else
    echo -e "   ${YELLOW}⚠️ API non risponde ancora${NC}"
    echo "   Potrebbe servire più tempo per le migrations"
    echo "   Usa: docker logs evolution_api -f"
fi
echo ""

# 8. STATO FINALE
echo -e "${BLUE}8. Stato containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 9. VERIFICA WEBHOOK
echo -e "${BLUE}9. Webhook server:${NC}"
if ps aux | grep -v grep | grep webhook-server > /dev/null; then
    echo "   ✅ Webhook attivo su porta 3201"
else
    echo "   ⚠️ Webhook non attivo - avvialo se necessario"
fi
echo ""

echo "================================================"
echo -e "${GREEN}✅ SETUP COMPLETATO${NC}"
echo "================================================"
echo ""
echo "📱 Evolution API 2.3.3"
echo "• API: http://37.27.89.35:8080"
echo "• API Key: $API_KEY"
echo ""
echo "🐘 PostgreSQL Docker"
echo "• Container: evolution_postgres"
echo "• Database: evolution"
echo "• User: evolution"
echo "• Password: evolution123"
echo ""
echo "🔄 Rete Docker"
echo "• Network: evolution-net"
echo "• Containers connessi tra loro"
echo ""
echo "📝 Comandi utili:"
echo "• docker logs evolution_api -f"
echo "• docker logs evolution_postgres -f"
echo "• docker exec -it evolution_api sh"
echo "• docker exec -it evolution_postgres psql -U evolution"
echo "• docker ps"
echo "• docker network inspect evolution-net"
echo ""
echo "⚠️ Se l'API non risponde ancora:"
echo "Attendi altri 30 secondi, le migrations possono essere lente"
echo "Poi riprova: curl http://localhost:8080"
echo ""
echo "Prossimo passo: ./create-whatsapp-instance.sh"
echo "================================================"
