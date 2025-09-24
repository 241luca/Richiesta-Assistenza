#!/bin/bash

# Script per verificare Evolution API dopo installazione
# Data: 22 Settembre 2025

echo "================================================"
echo "VERIFICA EVOLUTION API"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="evolution_api"
API_KEY="evolution_key_luca_2025_secure_21806"

# 1. Container status
echo -e "${BLUE}1. Docker Container:${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "   ${GREEN}✅ Container attivo${NC}"
    docker ps | grep $CONTAINER_NAME | awk '{print "   ID: "$1" | Image: "$2}'
else
    echo -e "   ${RED}❌ Container non attivo${NC}"
    echo "   Verificando logs..."
    docker logs --tail 10 $CONTAINER_NAME 2>&1
fi
echo ""

# 2. API status
echo -e "${BLUE}2. API Status:${NC}"
API_RESPONSE=$(curl -s http://localhost:8080)
if [ ! -z "$API_RESPONSE" ]; then
    echo -e "   ${GREEN}✅ API risponde${NC}"
    
    # Estrai versione
    VERSION=$(echo "$API_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    CLIENT=$(echo "$API_RESPONSE" | grep -o '"clientName":"[^"]*"' | cut -d'"' -f4)
    
    echo "   📌 Versione: ${VERSION:-unknown}"
    echo "   📌 Client: ${CLIENT:-unknown}"
    
    # Se è 2.3.x è ok
    if echo "$VERSION" | grep -q "2\.3"; then
        echo -e "   ${GREEN}✅ Versione 2.3.x confermata!${NC}"
    fi
else
    echo -e "   ${RED}❌ API non risponde${NC}"
fi
echo ""

# 3. Webhook
echo -e "${BLUE}3. Webhook Server:${NC}"
if ps aux | grep -v grep | grep "webhook-server.js" > /dev/null; then
    echo -e "   ${GREEN}✅ Processo attivo${NC}"
fi
if netstat -tuln | grep ":3201" > /dev/null; then
    echo -e "   ${GREEN}✅ Porta 3201 OK${NC}"
fi
echo ""

# 4. Test autenticazione
echo -e "${BLUE}4. Test API Key:${NC}"
AUTH_TEST=$(curl -s -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: ${API_KEY}" 2>&1)

if echo "$AUTH_TEST" | grep -q "Unauthorized"; then
    echo -e "   ${RED}❌ API Key non valida${NC}"
    echo "   Prova senza API key..."
    
    # Prova senza header
    NO_AUTH=$(curl -s http://localhost:8080/instance/fetchInstances 2>&1)
    if [ "$NO_AUTH" == "[]" ] || echo "$NO_AUTH" | grep -q "instance"; then
        echo -e "   ${YELLOW}ℹ️  API funziona senza autenticazione${NC}"
    fi
elif [ "$AUTH_TEST" == "[]" ]; then
    echo -e "   ${GREEN}✅ Auth OK - Nessuna istanza${NC}"
elif echo "$AUTH_TEST" | grep -q "instance"; then
    echo -e "   ${GREEN}✅ Auth OK - Istanze presenti${NC}"
    echo "$AUTH_TEST" | python3 -m json.tool 2>/dev/null | head -20
else
    echo -e "   ${YELLOW}⚠️  Response: $AUTH_TEST${NC}"
fi
echo ""

# 5. Docker images
echo -e "${BLUE}5. Docker Images:${NC}"
docker images | grep -E "evolution|atendai" | head -5
echo ""

# 6. Suggerimenti
echo "================================================"
echo -e "${GREEN}📋 RIEPILOGO${NC}"
echo "================================================"

# Conta successi
SUCCESS=0
docker ps | grep -q $CONTAINER_NAME && ((SUCCESS++))
curl -s http://localhost:8080 | grep -q "Evolution" && ((SUCCESS++))
ps aux | grep -v grep | grep -q "webhook-server" && ((SUCCESS++))

echo "Componenti attivi: $SUCCESS/3"
echo ""

if [ $SUCCESS -eq 3 ]; then
    echo -e "${GREEN}✅ SISTEMA PRONTO${NC}"
    echo ""
    echo "Prossimo passo:"
    echo "• Crea istanza: ./create-whatsapp-instance.sh"
else
    echo -e "${YELLOW}⚠️  Alcuni componenti mancanti${NC}"
    echo ""
    echo "Suggerimenti:"
    
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo "• Avvia container: docker start $CONTAINER_NAME"
    fi
    
    if ! curl -s http://localhost:8080 | grep -q "Evolution"; then
        echo "• Verifica logs: docker logs $CONTAINER_NAME"
    fi
    
    if ! ps aux | grep -v grep | grep -q "webhook-server"; then
        echo "• Avvia webhook: nohup node ~/webhook-server.js > ~/webhook.log 2>&1 &"
    fi
fi

echo ""
echo "API URL: http://37.27.89.35:8080"
echo "API Key: ${API_KEY}"
echo ""
