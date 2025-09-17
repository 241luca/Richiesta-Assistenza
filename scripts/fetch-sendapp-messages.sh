#!/bin/bash

echo "📱 RECUPERO MESSAGGI DA SENDAPP"
echo "================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "Token: ${TOKEN:0:30}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

# Prova vari endpoint SendApp per recuperare messaggi
echo "1️⃣ Tentativo: get_messages"
echo "----------------------------"
curl -s "https://app.sendapp.cloud/api/get_messages?instance_id=${INSTANCE_ID}&access_token=${TOKEN}" | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "2️⃣ Tentativo: messages"
echo "-----------------------"
curl -s "https://app.sendapp.cloud/api/messages?instance_id=${INSTANCE_ID}&access_token=${TOKEN}" | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "3️⃣ Tentativo: fetch_messages"
echo "-----------------------------"
curl -s -X POST "https://app.sendapp.cloud/api/fetch_messages" \
  -H "Content-Type: application/json" \
  -d "{\"instance_id\":\"${INSTANCE_ID}\",\"access_token\":\"${TOKEN}\"}" | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "📌 NOTA:"
echo "SendApp potrebbe:"
echo "• Non avere un endpoint per recuperare messaggi vecchi"
echo "• Inviare solo nuovi messaggi dopo la configurazione webhook"
echo "• Richiedere una chiamata API specifica per sincronizzare"
echo ""
echo "Il modo più sicuro è:"
echo "1. Webhook configurato ✅"
echo "2. Invia un NUOVO messaggio di test"
echo "3. Dovrebbe arrivare immediatamente via webhook"
