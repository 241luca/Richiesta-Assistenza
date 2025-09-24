#!/bin/bash

# Test Evolution API v2.3.3
# Da eseguire sul VPS per verificare l'installazione
# Data: 22 Settembre 2025

echo "================================================"
echo "TEST EVOLUTION API v2.3.3"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Verifica container
echo -e "${BLUE}1. Verifica Docker container...${NC}"
if docker ps | grep -q evolution-api; then
    echo -e "   ${GREEN}✅ Container evolution-api attivo${NC}"
    docker ps | grep evolution-api
else
    echo -e "   ${RED}❌ Container non attivo${NC}"
    echo "   Tentativo di avvio..."
    docker start evolution-api 2>/dev/null || echo "   Impossibile avviare"
fi
echo ""

# 2. Test API base
echo -e "${BLUE}2. Test API base...${NC}"
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    echo -e "   ${GREEN}✅ API risponde correttamente${NC}"
    echo "$RESPONSE" | head -3
else
    echo -e "   ${RED}❌ API non risponde${NC}"
fi
echo ""

# 3. Test autenticazione
echo -e "${BLUE}3. Test autenticazione API...${NC}"
AUTH_TEST=$(curl -s -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: ${API_KEY}")

if echo "$AUTH_TEST" | grep -q "error"; then
    if echo "$AUTH_TEST" | grep -q "Unauthorized"; then
        echo -e "   ${RED}❌ Errore autenticazione - API key non valida${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Altro errore: $AUTH_TEST${NC}"
    fi
else
    echo -e "   ${GREEN}✅ Autenticazione OK${NC}"
fi
echo ""

# 4. Lista istanze
echo -e "${BLUE}4. Istanze WhatsApp presenti...${NC}"
INSTANCES=$(curl -s -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: ${API_KEY}")

if [ -z "$INSTANCES" ] || echo "$INSTANCES" | grep -q "\[\]"; then
    echo -e "   ${YELLOW}ℹ️  Nessuna istanza trovata${NC}"
    echo "   Per creare un'istanza usa: ./create-instance.sh"
else
    echo -e "   ${GREEN}✅ Istanze trovate:${NC}"
    echo "$INSTANCES" | python3 -m json.tool 2>/dev/null || echo "$INSTANCES"
fi
echo ""

# 5. Verifica webhook server
echo -e "${BLUE}5. Verifica webhook server...${NC}"
if ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" > /dev/null; then
    echo -e "   ${GREEN}✅ Processo webhook attivo${NC}"
    ps aux | grep -v grep | grep "webhook-server.js\|vps-webhook-server.js" | head -1
fi

if netstat -tuln | grep ":3201" > /dev/null; then
    echo -e "   ${GREEN}✅ Porta 3201 in ascolto${NC}"
else
    echo -e "   ${YELLOW}⚠️  Porta 3201 non in ascolto${NC}"
fi

# Test endpoint webhook
if curl -s http://localhost:3201/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3201/health)
    echo -e "   ${GREEN}✅ Webhook health OK: $HEALTH${NC}"
else
    echo -e "   ${YELLOW}⚠️  Webhook non risponde su /health${NC}"
fi
echo ""

# 6. Verifica logs
echo -e "${BLUE}6. Ultimi log Evolution API...${NC}"
docker logs --tail 10 evolution-api 2>&1 | head -20
echo ""

# 7. Stato sistema
echo -e "${BLUE}7. Stato sistema...${NC}"
echo "   Memoria libera: $(free -h | grep Mem | awk '{print $4}')"
echo "   Disco libero: $(df -h / | tail -1 | awk '{print $4}')"
echo "   Docker images:"
docker images | grep evolution
echo ""

echo "================================================"
echo -e "${GREEN}📊 RIEPILOGO${NC}"
echo "================================================"

# Conta successi
SUCCESS=0
TOTAL=5

docker ps | grep -q evolution-api && ((SUCCESS++))
curl -s http://localhost:8080 | grep -q "Evolution" && ((SUCCESS++))
curl -s -X GET http://localhost:8080/instance/fetchInstances -H "apikey: ${API_KEY}" | grep -qv "error" && ((SUCCESS++))
ps aux | grep -v grep | grep -q "webhook-server" && ((SUCCESS++))
netstat -tuln | grep -q ":3201" && ((SUCCESS++))

echo "Test superati: $SUCCESS/$TOTAL"
echo ""

if [ $SUCCESS -eq $TOTAL ]; then
    echo -e "${GREEN}✅ SISTEMA COMPLETAMENTE OPERATIVO${NC}"
else
    echo -e "${YELLOW}⚠️  Alcuni componenti necessitano attenzione${NC}"
fi

echo ""
echo "📱 Evolution API: http://localhost:8080"
echo "🔑 API Key: ${API_KEY}"
echo "🔄 Webhook: http://localhost:3201"
echo ""
