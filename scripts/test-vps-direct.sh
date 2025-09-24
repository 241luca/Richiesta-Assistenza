#!/bin/bash

# Script per testare invio messaggi direttamente dal VPS
# Da eseguire SUL VPS, non dal Mac

echo "📱 TEST INVIO MESSAGGIO DAL VPS"
echo "================================"

# Configurazione
API_URL="http://localhost:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
YOUR_NUMBER="393403803728"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Configurazione:${NC}"
echo "  API URL: $API_URL"
echo "  Instance: $INSTANCE"
echo "  Destinatario: $YOUR_NUMBER"
echo ""

# 1. Verifica stato istanza
echo -e "${YELLOW}1️⃣ Verifica stato istanza...${NC}"
STATE=$(curl -s -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" | python3 -c "import sys, json; print(json.load(sys.stdin)['instance']['state'])" 2>/dev/null)

if [ "$STATE" == "open" ]; then
    echo -e "${GREEN}✅ Istanza connessa (state: $STATE)${NC}"
else
    echo -e "${RED}❌ Istanza NON connessa (state: $STATE)${NC}"
    echo "Provo a riavviare l'istanza..."
    
    # Riavvia istanza
    curl -s -X PUT "$API_URL/instance/restart/$INSTANCE" \
      -H "apikey: $API_KEY" > /dev/null 2>&1
    
    echo "Aspetto 10 secondi..."
    sleep 10
    
    # Ricontrolla
    STATE=$(curl -s -X GET "$API_URL/instance/connectionState/$INSTANCE" \
      -H "apikey: $API_KEY" | python3 -c "import sys, json; print(json.load(sys.stdin)['instance']['state'])" 2>/dev/null)
    
    if [ "$STATE" != "open" ]; then
        echo -e "${RED}L'istanza non è ancora connessa. Genera un QR code dal pannello.${NC}"
        exit 1
    fi
fi

# 2. Test invio messaggio semplice
echo -e "\n${YELLOW}2️⃣ Invio messaggio di test...${NC}"

MESSAGE="Test dal VPS - $(date '+%Y-%m-%d %H:%M:%S')"
echo "Messaggio: $MESSAGE"

# Prepara il JSON
JSON_DATA=$(cat <<EOF
{
  "number": "$YOUR_NUMBER",
  "text": "$MESSAGE"
}
EOF
)

echo -e "\n${YELLOW}JSON inviato:${NC}"
echo "$JSON_DATA" | python3 -m json.tool

# Invio con timeout ridotto
echo -e "\n${YELLOW}Invio in corso...${NC}"
START_TIME=$(date +%s)

RESPONSE=$(curl -s -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA" \
  --max-time 10 \
  -w "\nHTTP_CODE:%{http_code}" 2>&1)

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Estrai HTTP code
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo -e "\n${YELLOW}Risposta:${NC}"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"

echo -e "\n${YELLOW}Statistiche:${NC}"
echo "  HTTP Status: $HTTP_CODE"
echo "  Tempo: ${DURATION} secondi"

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    echo -e "\n${GREEN}✅ MESSAGGIO INVIATO CON SUCCESSO!${NC}"
else
    echo -e "\n${RED}❌ ERRORE NELL'INVIO${NC}"
fi

# 3. Test velocità API
echo -e "\n${YELLOW}3️⃣ Test velocità API Evolution...${NC}"

# Test 1: Info API
START=$(date +%s%N)
curl -s "$API_URL/" -H "apikey: $API_KEY" > /dev/null
END=$(date +%s%N)
DIFF=$((($END - $START) / 1000000))
echo "  GET /                    : ${DIFF}ms"

# Test 2: Connection State
START=$(date +%s%N)
curl -s "$API_URL/instance/connectionState/$INSTANCE" -H "apikey: $API_KEY" > /dev/null
END=$(date +%s%N)
DIFF=$((($END - $START) / 1000000))
echo "  GET /connectionState     : ${DIFF}ms"

# Test 3: Fetch Instances
START=$(date +%s%N)
curl -s "$API_URL/instance/fetchInstances" -H "apikey: $API_KEY" > /dev/null
END=$(date +%s%N)
DIFF=$((($END - $START) / 1000000))
echo "  GET /fetchInstances      : ${DIFF}ms"

# 4. Controlla i log di Evolution
echo -e "\n${YELLOW}4️⃣ Ultimi log di Evolution API:${NC}"
docker logs evolution_api --tail 10 2>&1 | grep -v "verify\|filteredNumbers" | head -5

# 5. Controlla risorse sistema
echo -e "\n${YELLOW}5️⃣ Risorse sistema:${NC}"
echo -n "  CPU: "
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo -n "  RAM libera: "
free -h | grep "^Mem" | awk '{print $7}'
echo -n "  Docker containers: "
docker ps -q | wc -l

echo -e "\n${GREEN}✅ Test completato!${NC}"
echo ""
echo "Se il messaggio non viene inviato:"
echo "1. Verifica che WhatsApp sia connesso nel Manager"
echo "2. Riavvia Evolution: docker restart evolution_api"
echo "3. Rigenera il QR code se necessario"
