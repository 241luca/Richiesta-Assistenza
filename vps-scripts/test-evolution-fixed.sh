#!/bin/bash

# Script CORRETTO per test Evolution API
# Adattato alla configurazione reale del VPS
# Data: 22 Settembre 2025

echo "================================================"
echo "TEST EVOLUTION API - CONFIGURAZIONE REALE"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# NOTA: L'API key reale è nel token dell'istanza
API_KEY="evolution_key_luca_2025_secure_21806"
CONTAINER_NAME="evolution_api"  # Nome reale con underscore

# 1. Verifica container
echo -e "${BLUE}1. Verifica Docker container...${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "   ${GREEN}✅ Container $CONTAINER_NAME attivo${NC}"
    docker ps | grep "$CONTAINER_NAME"
else
    echo -e "   ${RED}❌ Container non attivo${NC}"
fi
echo ""

# 2. Test API base
echo -e "${BLUE}2. Test API base...${NC}"
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -q "Evolution"; then
    echo -e "   ${GREEN}✅ API risponde correttamente${NC}"
    echo "$RESPONSE" | python3 -m json.tool | head -5
else
    echo -e "   ${RED}❌ API non risponde${NC}"
fi
echo ""

# 3. Ottieni istanze senza autenticazione (sembra funzionare)
echo -e "${BLUE}3. Istanze WhatsApp presenti...${NC}"
INSTANCES=$(curl -s http://localhost:8080/instance/fetchInstances)
if [ ! -z "$INSTANCES" ] && [ "$INSTANCES" != "[]" ]; then
    echo -e "   ${GREEN}✅ Istanze trovate:${NC}"
    echo "$INSTANCES" | python3 -m json.tool | grep -E '"name"|"connectionStatus"|"profileName"'
    
    # Estrai il token dalla prima istanza
    ACTUAL_TOKEN=$(echo "$INSTANCES" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0].get('token', '') if data else '')" 2>/dev/null)
    if [ ! -z "$ACTUAL_TOKEN" ]; then
        echo ""
        echo -e "   ${YELLOW}ℹ️  API Key reale: $ACTUAL_TOKEN${NC}"
    fi
else
    echo -e "   ${YELLOW}ℹ️  Nessuna istanza trovata${NC}"
fi
echo ""

# 4. Verifica webhook server
echo -e "${BLUE}4. Verifica webhook server...${NC}"
if ps aux | grep -v grep | grep "webhook-server.js" > /dev/null; then
    echo -e "   ${GREEN}✅ Processo webhook attivo${NC}"
fi

if netstat -tuln | grep ":3201" > /dev/null; then
    echo -e "   ${GREEN}✅ Porta 3201 in ascolto${NC}"
fi

if curl -s http://localhost:3201/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3201/health)
    echo -e "   ${GREEN}✅ Webhook health OK: $HEALTH${NC}"
fi
echo ""

# 5. Verifica logs del container corretto
echo -e "${BLUE}5. Ultimi log Evolution API...${NC}"
docker logs --tail 10 "$CONTAINER_NAME" 2>&1 | head -20
echo ""

# 6. Info istanza "sistema"
echo -e "${BLUE}6. Dettagli istanza 'sistema'...${NC}"
SISTEMA_STATUS=$(curl -s http://localhost:8080/instance/connectionState/sistema)
if echo "$SISTEMA_STATUS" | grep -q "state"; then
    echo -e "   ${GREEN}✅ Istanza 'sistema' trovata${NC}"
    echo "   Stato: $SISTEMA_STATUS"
else
    echo "   Testando con API key..."
    curl -s http://localhost:8080/instance/connectionState/sistema \
      -H "apikey: $ACTUAL_TOKEN" | python3 -m json.tool 2>/dev/null || echo "   Non accessibile"
fi
echo ""

# 7. Stato sistema
echo -e "${BLUE}7. Stato sistema...${NC}"
echo "   Container: $CONTAINER_NAME"
echo "   Versione: $(curl -s http://localhost:8080 | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
echo "   Memoria libera: $(free -h | grep Mem | awk '{print $4}')"
echo "   Disco libero: $(df -h / | tail -1 | awk '{print $4}')"
echo ""

echo "================================================"
echo -e "${GREEN}📊 CONFIGURAZIONE ATTUALE${NC}"
echo "================================================"
echo "• Container: $CONTAINER_NAME (underscore, non trattino)"
echo "• Versione: 2.2.3 (da aggiornare a 2.3.3)"
echo "• Istanza: 'sistema' (Medicina Ravenna)"
echo "• Stato WhatsApp: Connesso"
echo "• Webhook: Attivo su porta 3201"
echo ""
echo -e "${YELLOW}⚠️  NOTA:${NC}"
echo "Il container usa un nome diverso (evolution_api)"
echo "L'API key nel database è: $ACTUAL_TOKEN"
echo ""
echo "Per aggiornare alla v2.3.3 usa: ./update-evolution-fixed.sh"
echo "================================================"
