#!/bin/bash

echo "🗺️ TEST GOOGLE MAPS CON INDIRIZZI ITALIANI"
echo "==========================================="
echo ""

# 1. Login con le credenziali corrette dalla pagina
echo "1️⃣ Login con luigi.bianchi@gmail.com..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "luigi.bianchi@gmail.com", "password": "password123"}')

# Il backend restituisce "accessToken" non "token"
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login fallito"
    echo "Risposta: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login completato con successo!"
echo "Token ottenuto: ${TOKEN:0:20}..." # Mostra solo i primi 20 caratteri per sicurezza
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
    "Colosseo, Roma, Italia"
    "Torre di Pisa, Pisa, Italia"
)

echo "Testerò ${#addresses[@]} indirizzi italiani..."
echo "-------------------------------------------"
echo ""

# Test ogni indirizzo
for address in "${addresses[@]}"; do
    echo "📍 Testando: $address"
    
    # Fai la richiesta geocoding
    GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"address\": \"$address\"}")
    
    # Debug: mostra la risposta completa
    echo "   Risposta raw: $GEOCODE_RESPONSE"
    
    # Controlla se c'è un errore
    ERROR=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin) if sys.stdin.read().strip() else {}; print(d.get('error', ''))" 2>/dev/null)
    
    if [ -n "$ERROR" ]; then
        echo "   ❌ Errore: $ERROR"
        
        # Se l'endpoint non esiste, proviamo con un altro percorso
        echo "   Provo endpoint alternativo /api/geocode..."
        GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/geocode \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{\"address\": \"$address\"}")
        
        echo "   Risposta alternativa: $GEOCODE_RESPONSE"
    else
        # Prova a estrarre i dati
        LAT=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('lat', d.get('location', {}).get('lat', 'N/A')))" 2>/dev/null)
        LNG=$(echo $GEOCODE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('lng', d.get('location', {}).get('lng', 'N/A')))" 2>/dev/null)
        
        if [ "$LAT" != "N/A" ] && [ "$LAT" != "" ]; then
            echo "   ✅ Coordinate trovate!"
            echo "      • Latitudine: $LAT"
            echo "      • Longitudine: $LNG"
        else
            echo "   ⚠️ Formato risposta non riconosciuto"
        fi
    fi
    echo ""
    
    # Fermiamoci dopo il primo test per debugging
    break
done

echo "==========================================="
echo ""

# 3. Verifichiamo quali endpoint API sono disponibili
echo "3️⃣ VERIFICA ENDPOINT DISPONIBILI"
echo ""

echo "Verifico /api/maps/geocode..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "test"}')
echo "   Codice risposta: $RESPONSE"

echo ""
echo "Verifico /api/geocode..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3200/api/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "test"}')
echo "   Codice risposta: $RESPONSE"

echo ""
echo "Verifico /api/google-maps/geocode..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3200/api/google-maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "test"}')
echo "   Codice risposta: $RESPONSE"

echo ""
echo "==========================================="
echo "📊 RIEPILOGO:"
echo "• Login: ✅ Funzionante"
echo "• Token JWT: ✅ Ottenuto"
echo "• Endpoint Maps: Da verificare quali sono attivi"
echo ""
echo "Nota: Codici risposta HTTP:"
echo "• 200 = OK, funzionante"
echo "• 401 = Non autorizzato"
echo "• 404 = Endpoint non esiste"
echo "• 500 = Errore server"
echo "==========================================="
