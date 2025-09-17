#!/bin/bash

echo "🗺️ TEST INDIRIZZO CON GOOGLE MAPS"
echo "================================"
echo ""

# 1. Login per ottenere il token
echo "1️⃣ Login in corso..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sistema.it", "password": "admin123"}')

# Estrai il token dalla risposta
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login fallito. Proviamo con un altro utente..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "cliente@test.it", "password": "password123"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Non riesco a fare login. Verifica le credenziali."
    echo "Risposta: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login completato!"
echo ""

# 2. Test geocoding di un indirizzo
echo "2️⃣ Test conversione indirizzo in coordinate..."
echo "   Indirizzo: Via Roma 1, Milano"
echo ""

GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "Via Roma 1, Milano, Italia"}')

echo "📍 RISULTATO:"
echo "$GEOCODE_RESPONSE" | python3 -m json.tool

echo ""
echo "================================"
echo ""

# 3. Test con altri indirizzi italiani
echo "3️⃣ Altri test con indirizzi italiani..."
echo ""

# Array di indirizzi da testare
ADDRESSES=(
    "Colosseo, Roma"
    "Piazza San Marco, Venezia"
    "Torre di Pisa, Pisa"
    "Duomo di Milano, Milano"
)

for ADDRESS in "${ADDRESSES[@]}"; do
    echo "📍 Testing: $ADDRESS"
    RESULT=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"address\": \"$ADDRESS\"}")
    
    # Estrai solo latitudine e longitudine
    LAT=$(echo $RESULT | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('location', {}).get('lat', 'N/A'))" 2>/dev/null)
    LNG=$(echo $RESULT | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('location', {}).get('lng', 'N/A'))" 2>/dev/null)
    
    if [ "$LAT" != "N/A" ]; then
        echo "   ✅ Coordinate: Lat: $LAT, Lng: $LNG"
    else
        echo "   ❌ Errore nel geocoding"
    fi
    echo ""
done

echo "================================"
echo "✅ TEST COMPLETATO!"
echo "================================"
