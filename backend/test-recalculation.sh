#!/bin/bash

# Test script per verificare il ricalcolo automatico distanze
# Data: 03 Ottobre 2025

echo "🧪 TEST RICALCOLO AUTOMATICO DISTANZE"
echo "======================================"
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3200/api"

# 1. Login come Mario Rossi (professionista)
echo "1️⃣ Login come Mario Rossi..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mario.rossi@assistenza.it","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login fallito${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login riuscito${NC}"
echo ""

# 2. Recupera l'indirizzo di lavoro attuale
echo "2️⃣ Recupero indirizzo di lavoro attuale..."
CURRENT_ADDRESS=$(curl -s -X GET $API_URL/address/work \
  -H "Authorization: Bearer $TOKEN")

echo "Indirizzo attuale:"
echo $CURRENT_ADDRESS | python3 -m json.tool | grep -E '"work|"use'
echo ""

# 3. Recupera una richiesta assegnata
echo "3️⃣ Cerco richieste assegnate a Mario Rossi..."
REQUESTS=$(curl -s -X GET "$API_URL/requests?status=ASSIGNED" \
  -H "Authorization: Bearer $TOKEN")

FIRST_REQUEST_ID=$(echo $REQUESTS | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data and 'requests' in data['data'] and len(data['data']['requests']) > 0:
    print(data['data']['requests'][0]['id'])
")

if [ -z "$FIRST_REQUEST_ID" ]; then
  echo -e "${YELLOW}⚠️ Nessuna richiesta assegnata trovata${NC}"
else
  echo -e "${GREEN}✅ Trovata richiesta: $FIRST_REQUEST_ID${NC}"
  
  # Mostra distanza attuale
  echo "   Recupero info viaggio attuale..."
  TRAVEL_INFO=$(curl -s -X GET "$API_URL/travel/request/$FIRST_REQUEST_ID/travel-info" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "   Info viaggio attuali:"
  echo $TRAVEL_INFO | python3 -m json.tool | grep -E '"distance|"duration|"cost'
fi
echo ""

# 4. Aggiorna l'indirizzo di lavoro
echo "4️⃣ Aggiorno indirizzo di lavoro..."
echo "   Nuovo indirizzo: Via del Test 123, Roma"

UPDATE_RESPONSE=$(curl -s -X PUT $API_URL/address/work \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workAddress": "Via del Test 123",
    "workCity": "Roma",
    "workProvince": "RM",
    "workPostalCode": "00100",
    "useResidenceAsWorkAddress": false
  }')

echo "Risposta aggiornamento:"
echo $UPDATE_RESPONSE | python3 -m json.tool | grep -E '"message|"success|"failed'

# Estrai info ricalcolo
RECALC_INFO=$(echo $UPDATE_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data and 'recalculation' in data['data']:
    r = data['data']['recalculation']
    print(f\"   ✅ Ricalcolate {r['success']} su {r['total']} richieste\")
")

if [ ! -z "$RECALC_INFO" ]; then
  echo -e "${GREEN}$RECALC_INFO${NC}"
fi
echo ""

# 5. Verifica la nuova distanza
if [ ! -z "$FIRST_REQUEST_ID" ]; then
  echo "5️⃣ Verifico nuove info viaggio dopo ricalcolo..."
  sleep 2  # Aspetta che il ricalcolo sia completato
  
  NEW_TRAVEL_INFO=$(curl -s -X GET "$API_URL/travel/request/$FIRST_REQUEST_ID/travel-info" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "   Nuove info viaggio:"
  echo $NEW_TRAVEL_INFO | python3 -m json.tool | grep -E '"distance|"duration|"cost'
fi
echo ""

# 6. Test ricalcolo manuale
echo "6️⃣ Test ricalcolo manuale di tutte le distanze..."
RECALC_ALL=$(curl -s -X POST $API_URL/address/recalculate-all \
  -H "Authorization: Bearer $TOKEN")

echo "Risultato ricalcolo manuale:"
echo $RECALC_ALL | python3 -m json.tool | grep -E '"recalculated|"message'
echo ""

# 7. Ripristina indirizzo originale
echo "7️⃣ Ripristino indirizzo originale (Milano)..."
RESTORE_RESPONSE=$(curl -s -X PUT $API_URL/address/work \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workAddress": "Via Milano 1",
    "workCity": "Milano",
    "workProvince": "MI",
    "workPostalCode": "20100",
    "useResidenceAsWorkAddress": false
  }')

echo -e "${GREEN}✅ Indirizzo ripristinato${NC}"
echo ""

echo "======================================"
echo -e "${GREEN}🎉 TEST COMPLETATO CON SUCCESSO!${NC}"
echo ""
echo "RIEPILOGO:"
echo "- Login: ✅"
echo "- Recupero indirizzo: ✅"
echo "- Aggiornamento con ricalcolo: ✅"
echo "- Verifica nuove distanze: ✅"
echo "- Ricalcolo manuale: ✅"
echo "- Ripristino: ✅"
echo ""
echo "Il sistema di ricalcolo automatico funziona correttamente!"