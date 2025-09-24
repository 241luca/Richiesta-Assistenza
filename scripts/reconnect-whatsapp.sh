#!/bin/bash

# Script per riconnettere WhatsApp su Evolution API

echo "🔄 RICONNESSIONE WHATSAPP"
echo "========================="

API_URL="http://localhost:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. Eliminazione vecchia istanza...${NC}"
curl -X DELETE "$API_URL/instance/delete/$INSTANCE" \
  -H "apikey: $API_KEY" 2>/dev/null
echo "Eliminata (o non esisteva)"

sleep 3

echo -e "\n${YELLOW}2. Creazione nuova istanza...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "'$INSTANCE'",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }')

echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null | head -10

sleep 2

echo -e "\n${YELLOW}3. Generazione QR Code...${NC}"
QR_RESPONSE=$(curl -s -X GET "$API_URL/instance/connect/$INSTANCE" \
  -H "apikey: $API_KEY")

# Estrai il codice
QR_CODE=$(echo "$QR_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('code', 'Non trovato'))" 2>/dev/null)

if [ "$QR_CODE" != "Non trovato" ] && [ ! -z "$QR_CODE" ]; then
    echo -e "${GREEN}✅ QR Code generato!${NC}"
    echo ""
    echo "================================================"
    echo "ISTRUZIONI PER CONNETTERE:"
    echo "================================================"
    echo "1. Apri WhatsApp sul telefono"
    echo "2. Vai su: Impostazioni → Dispositivi collegati"
    echo "3. Tocca 'Collega un dispositivo'"
    echo "4. Scansiona questo QR:"
    echo ""
    
    # Se hai qrencode installato, genera il QR visivo
    if command -v qrencode &> /dev/null; then
        echo "$QR_CODE" | qrencode -t UTF8
    else
        echo "Codice QR (installa 'qrencode' per visualizzarlo):"
        echo "$QR_CODE"
    fi
    
    echo ""
    echo "================================================"
    
    # Aspetta la connessione
    echo -e "\n${YELLOW}Aspetto la connessione (max 60 secondi)...${NC}"
    
    for i in {1..12}; do
        sleep 5
        STATE=$(curl -s "$API_URL/instance/connectionState/$INSTANCE" \
          -H "apikey: $API_KEY" | python3 -c "import sys, json; print(json.load(sys.stdin)['instance']['state'])" 2>/dev/null)
        
        if [ "$STATE" == "open" ]; then
            echo -e "\n${GREEN}✅ CONNESSO! WhatsApp è online!${NC}"
            
            # Test invio
            echo -e "\n${YELLOW}Test invio messaggio...${NC}"
            curl -X POST "$API_URL/message/sendText/$INSTANCE" \
              -H "apikey: $API_KEY" \
              -H "Content-Type: application/json" \
              -d '{"number":"393403803728","text":"WhatsApp riconnesso con successo!"}' \
              --max-time 10
            
            exit 0
        else
            echo -n "."
        fi
    done
    
    echo -e "\n${RED}Timeout - Scansiona il QR più velocemente${NC}"
else
    echo -e "${RED}❌ Errore nella generazione del QR${NC}"
    echo "Risposta: $QR_RESPONSE"
fi
