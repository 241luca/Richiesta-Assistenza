#!/bin/bash

echo "🔍 TEST ENDPOINT SENDAPP PER MESSAGGI"
echo "======================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "Token: ${TOKEN:0:20}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

# Test con GET e parametri nella query string (come da documentazione SendApp)
echo "📱 Test recupero messaggi (metodo GET con parametri):"
echo "-----------------------------------------------------"

URL="https://app.sendapp.cloud/api/get_messages?instance_id=${INSTANCE_ID}&access_token=${TOKEN}"
echo "Chiamata: $URL"
echo ""

curl -s -X GET "$URL" | python3 -m json.tool 2>/dev/null || curl -s -X GET "$URL"

echo ""
echo ""
echo "Se vedi messaggi sopra, il problema era l'endpoint sbagliato!"
echo "Altrimenti dobbiamo configurare il webhook."
