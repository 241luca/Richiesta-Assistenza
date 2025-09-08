#!/bin/bash

echo "🗺️ TEST GOOGLE MAPS CON INDIRIZZI ITALIANI"
echo "==========================================="
echo ""

# 1. Login con le credenziali corrette dalla pagina
echo "1️⃣ Login con admin@assistenza.it..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@assistenza.it", "password": "password123"}')

# Estrai il token dalla risposta
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', '') if isinstance(data, dict) else '')" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "⚠️ Primo tentativo fallito, provo con Luigi Bianchi (cliente)..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "luigi.bianchi@gmail.com", "password": "password123"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', '') if isinstance(data, dict) else '')" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Login fallito anche con il secondo utente"
    echo "Risposta: $LOGIN_RESPONSE"
    echo ""
    echo "Provo con Mario Rossi (professionista)..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "mario.rossi@assistenza.it", "password": "password123"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', '') if isinstance(data, dict) else '')" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Non riesco a fare login con nessun utente"
    echo "Ultima risposta: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login completato con successo!"
echo ""
echo "==========================================="
echo ""

# 2. Test geocoding di vari indirizzi italiani
echo "2️⃣ TEST CONVERSIONE INDIRIZZI IN COORDINATE"
echo ""

# Array di indirizzi italiani da testare
declare -a addresses=(
    "Via Roma 1, Milano, Italia"
    "Piazza del Duomo, Milano, Italia"
    "Via Torino 15, Milano, Italia"
    "Corso Buenos Aires 33, Milano, Italia"
    "Via Montenapoleone 10, Milano, Italia"
    "Colosseo, Roma, Italia"
    "Piazza San Marco, Venezia, Italia"
    "Torre di Pisa, Pisa, Italia"
    "Ponte Vecchio, Firenze, Italia"
    "Piazza del Campo, Siena, Italia"
)

echo "Testerò ${#addresses[@]} indirizzi italiani..."
echo "-------------------------------------------"
echo ""

# Test ogni indirizzo
for address in "${addresses[@]}"; do
    echo "📍 Indirizzo: $address"
    
    # Fai la richiesta geocoding
    GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"address\": \"$address\"}")
    
    # Controlla se c'è un errore
    ERROR=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error', ''))" 2>/dev/null)
    
    if [ -n "$ERROR" ]; then
        echo "   ❌ Errore: $ERROR"
    else
        # Estrai latitudine e longitudine
        LAT=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('location', {}).get('lat', 'N/A'))" 2>/dev/null)
        LNG=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('location', {}).get('lng', 'N/A'))" 2>/dev/null)
        FORMATTED=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('formatted_address', 'N/A'))" 2>/dev/null)
        
        if [ "$LAT" != "N/A" ] && [ "$LAT" != "" ]; then
            echo "   ✅ Coordinate trovate!"
            echo "      • Latitudine: $LAT"
            echo "      • Longitudine: $LNG"
            if [ "$FORMATTED" != "N/A" ] && [ "$FORMATTED" != "" ]; then
                echo "      • Indirizzo formattato: $FORMATTED"
            fi
        else
            echo "   ⚠️ Coordinate non trovate"
            echo "   Risposta completa:"
            echo "$GEOCODE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GEOCODE_RESPONSE"
        fi
    fi
    echo ""
done

echo "==========================================="
echo ""

# 3. Test calcolo distanza tra due punti
echo "3️⃣ TEST CALCOLO DISTANZA"
echo ""
echo "Calcoliamo la distanza tra:"
echo "• Milano (Duomo)"
echo "• Roma (Colosseo)"
echo ""

DISTANCE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/distance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "origin": "Piazza del Duomo, Milano, Italia",
    "destination": "Colosseo, Roma, Italia"
  }')

# Estrai i risultati
DISTANCE=$(echo $DISTANCE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('distance', {}).get('text', 'N/A'))" 2>/dev/null)
DURATION=$(echo $DISTANCE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('duration', {}).get('text', 'N/A'))" 2>/dev/null)

if [ "$DISTANCE" != "N/A" ] && [ "$DISTANCE" != "" ]; then
    echo "✅ Distanza calcolata:"
    echo "   • Distanza: $DISTANCE"
    echo "   • Tempo di viaggio: $DURATION"
else
    echo "⚠️ Non riesco a calcolare la distanza"
    echo "Risposta:"
    echo "$DISTANCE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DISTANCE_RESPONSE"
fi

echo ""
echo "==========================================="
echo "✅ TEST COMPLETATO!"
echo "==========================================="
echo ""
echo "📊 RIEPILOGO:"
echo "• Google Maps API: $([ -n "$TOKEN" ] && echo "✅ Configurata" || echo "❌ Non configurata")"
echo "• Geocoding: $([ "$LAT" != "N/A" ] && echo "✅ Funzionante" || echo "⚠️ Da verificare")"
echo "• Calcolo distanze: $([ "$DISTANCE" != "N/A" ] && echo "✅ Funzionante" || echo "⚠️ Da verificare")"
echo ""
