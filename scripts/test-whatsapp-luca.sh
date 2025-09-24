#!/bin/bash

# Test invio messaggio WhatsApp con Evolution API
echo "📱 Test invio messaggio WhatsApp"
echo "================================"

# Configurazione
API_URL="http://37.27.89.35:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
NUMBER="393403803728"  # Il tuo numero con prefisso italiano
MESSAGE="Test messaggio da script - $(date '+%Y-%m-%d %H:%M:%S')"

echo "📍 Configurazione:"
echo "   URL: $API_URL"
echo "   Instance: $INSTANCE"
echo "   Numero: $NUMBER"
echo ""

# Test 1: Verifica stato istanza
echo "1️⃣ Verifico stato istanza..."
echo "------------------------------"
curl -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" \
  --max-time 10 \
  2>/dev/null | python3 -m json.tool || echo "Errore nel check stato"

echo ""
echo ""

# Test 2: Verifica se il numero esiste su WhatsApp
echo "2️⃣ Verifico se il numero esiste su WhatsApp..."
echo "------------------------------------------------"
curl -X POST "$API_URL/chat/whatsappNumbers/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"numbers\":[\"$NUMBER\"]}" \
  --max-time 10 \
  2>/dev/null | python3 -m json.tool || echo "Errore nel check numero"

echo ""
echo ""

# Test 3: Invio messaggio
echo "3️⃣ Invio messaggio..."
echo "---------------------"
echo "Messaggio: $MESSAGE"
echo ""

# Preparo il JSON con il formato ESATTO dalla documentazione
JSON_DATA=$(cat <<EOF
{
  "number": "$NUMBER",
  "text": "$MESSAGE"
}
EOF
)

echo "JSON inviato:"
echo "$JSON_DATA" | python3 -m json.tool
echo ""

echo "Invio in corso..."
RESPONSE=$(curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA" \
  --max-time 60 \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  2>/dev/null)

echo "Risposta:"
echo "$RESPONSE" | head -n -2 | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Test completato!"
echo ""

# Test 4: Prova con delay
echo "4️⃣ Provo anche con delay di 1 secondo..."
echo "-----------------------------------------"

JSON_WITH_DELAY=$(cat <<EOF
{
  "number": "$NUMBER",
  "text": "Test con delay - $(date '+%H:%M:%S')",
  "delay": 1000,
  "linkPreview": true
}
EOF
)

echo "JSON con delay:"
echo "$JSON_WITH_DELAY" | python3 -m json.tool
echo ""

curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_WITH_DELAY" \
  --max-time 60 \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Errore con delay"

echo ""
echo "🔚 Fine test"
