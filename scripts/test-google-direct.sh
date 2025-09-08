#!/bin/bash

echo "🔍 VERIFICA DETTAGLIATA CHIAVE GOOGLE MAPS"
echo "==========================================="
echo ""

# La chiave API dal file .env
API_KEY="AIzaSyBoWQaouY1WxyhKFpp2mrPxklq_1ucbAIE"

echo "📌 Chiave API: ${API_KEY:0:20}..."
echo ""

echo "1️⃣ TEST DIRETTO GEOCODING API (senza autenticazione server)"
echo "-----------------------------------------------------------"
echo "Chiamata diretta a Google senza passare dal nostro backend:"
echo ""

# Test diretto all'API di Google
echo "Test indirizzo: Colosseo, Roma"
echo "URL: https://maps.googleapis.com/maps/api/geocode/json?address=Colosseo+Roma&key=${API_KEY:0:10}..."
echo ""

RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/geocode/json?address=Colosseo+Roma&key=$API_KEY")

# Estrai lo status
STATUS=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null)
ERROR_MSG=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('error_message', ''))" 2>/dev/null)

echo "📊 Risultato:"
echo "Status: $STATUS"

if [ "$STATUS" = "OK" ]; then
    echo "✅ LA CHIAVE FUNZIONA! Geocoding API è abilitata"
    
    # Estrai le coordinate
    LAT=$(echo $RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['results'][0]['geometry']['location']['lat'])" 2>/dev/null)
    LNG=$(echo $RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['results'][0]['geometry']['location']['lng'])" 2>/dev/null)
    FORMATTED=$(echo $RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['results'][0]['formatted_address'])" 2>/dev/null)
    
    echo ""
    echo "📍 Coordinate trovate:"
    echo "   • Latitudine: $LAT"
    echo "   • Longitudine: $LNG"
    echo "   • Indirizzo: $FORMATTED"
    
elif [ "$STATUS" = "REQUEST_DENIED" ]; then
    echo "❌ CHIAVE RIFIUTATA"
    echo "Messaggio di errore: $ERROR_MSG"
    echo ""
    echo "Possibili cause:"
    echo "1. La Geocoding API non è abilitata nel progetto"
    echo "2. La chiave ha restrizioni di IP/referrer"
    echo "3. Il progetto ha superato le quote"
    
elif [ "$STATUS" = "INVALID_REQUEST" ]; then
    echo "⚠️ Richiesta non valida"
    
else
    echo "❓ Status sconosciuto: $STATUS"
    echo "Risposta completa:"
    echo "$RESPONSE" | python3 -m json.tool
fi

echo ""
echo "==========================================="
echo ""

echo "2️⃣ TEST ALTRI SERVIZI GOOGLE"
echo "----------------------------"
echo ""

# Test Places API
echo "Test Places API (ricerca 'ristoranti Milano'):"
PLACES_RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/place/textsearch/json?query=ristoranti+milano&key=$API_KEY")
PLACES_STATUS=$(echo $PLACES_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null)
echo "Status: $PLACES_STATUS"

if [ "$PLACES_STATUS" = "OK" ]; then
    echo "✅ Places API è abilitata"
else
    PLACES_ERROR=$(echo $PLACES_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('error_message', ''))" 2>/dev/null)
    echo "❌ Places API non funziona: $PLACES_ERROR"
fi

echo ""

# Test Distance Matrix API
echo "Test Distance Matrix API (distanza Milano-Roma):"
DISTANCE_RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/distancematrix/json?origins=Milano&destinations=Roma&key=$API_KEY")
DISTANCE_STATUS=$(echo $DISTANCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null)
echo "Status: $DISTANCE_STATUS"

if [ "$DISTANCE_STATUS" = "OK" ]; then
    echo "✅ Distance Matrix API è abilitata"
else
    DISTANCE_ERROR=$(echo $DISTANCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('error_message', ''))" 2>/dev/null)
    echo "❌ Distance Matrix API non funziona: $DISTANCE_ERROR"
fi

echo ""
echo "==========================================="
echo "📋 RIEPILOGO"
echo "==========================================="
echo ""
echo "Per far funzionare Google Maps nel tuo progetto, devi:"
echo ""
echo "1. Vai su: https://console.cloud.google.com/"
echo "2. Seleziona il progetto associato a questa chiave"
echo "3. Vai su 'API e servizi' → 'Libreria'"
echo "4. Cerca e ABILITA queste API:"
echo "   • Geocoding API (per convertire indirizzi in coordinate)"
echo "   • Places API (per cercare luoghi)"
echo "   • Distance Matrix API (per calcolare distanze)"
echo "   • Maps JavaScript API (per le mappe nel frontend)"
echo ""
echo "Ogni API ha un pulsante 'ABILITA' blu. Cliccalo per attivarla."
echo ""
echo "==========================================="
