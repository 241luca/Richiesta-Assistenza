#!/bin/bash
# Test rapido dell'endpoint travel/cost-settings

echo "🔄 Test endpoint /api/travel/cost-settings"
echo "==========================================="
echo ""

# Sostituisci questi valori con le credenziali di un professionista reale
EMAIL="test@example.com"  # CAMBIA CON EMAIL REALE
PASSWORD="password123"     # CAMBIA CON PASSWORD REALE

API_URL="http://localhost:3200"

echo "1. Tentativo di login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Estrai il token dalla risposta
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login fallito. Verifica email e password."
  echo "Risposta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login riuscito!"
echo ""

echo "2. Test GET /api/travel/cost-settings..."
SETTINGS_RESPONSE=$(curl -s -X GET "$API_URL/api/travel/cost-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Risposta ricevuta:"
echo "$SETTINGS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SETTINGS_RESPONSE"
echo ""

# Controlla se la risposta contiene "success"
if echo "$SETTINGS_RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ SUCCESSO! L'endpoint funziona correttamente!"
else
  echo "⚠️  L'endpoint ha risposto ma potrebbe esserci un problema."
  echo "Controlla la risposta sopra."
fi
