#!/bin/bash

# Script per verificare Instance ID nel DB e cosa ritorna SendApp
echo "🔍 VERIFICA INSTANCE ID"
echo "======================"
echo ""

# 1. VERIFICA NEL DATABASE
echo "1️⃣ CONTROLLO DATABASE:"
echo "------------------------"

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT value FROM \"SystemConfiguration\" WHERE key='whatsapp_instance_id';" 2>/dev/null | tr -d ' ')

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "" ]; then
    echo "❌ Instance ID NON presente nel database"
else
    echo "✅ Instance ID nel DB: $INSTANCE_ID"
fi

echo ""
echo "Tutte le config WhatsApp nel DB:"
psql "$DB_URL" -c "SELECT key, value FROM \"SystemConfiguration\" WHERE key LIKE '%whatsapp%';" 2>/dev/null

echo ""
echo "2️⃣ CHIAMATA API SENDAPP:"
echo "------------------------"

# Recupera token da DB
ACCESS_TOKEN=$(psql "$DB_URL" -t -c "SELECT value FROM \"ApiKey\" WHERE service='WHATSAPP' AND \"isActive\"=true ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null | tr -d ' ')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Token WhatsApp non trovato nel DB"
    exit 1
fi

echo "Token trovato: ${ACCESS_TOKEN:0:20}..."
echo ""

# Chiamata API SendApp per status
echo "Chiamata status API SendApp..."
RESPONSE=$(curl -s -X GET "https://app.sendapp.cloud/api/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Risposta SendApp:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "3️⃣ VERIFICA INSTANCE ID DA SENDAPP:"
echo "------------------------------------"

# Estrai instance_id dalla risposta se presente
INSTANCE_FROM_API=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('instance_id', data.get('instanceId', 'NON TROVATO')))" 2>/dev/null)

echo "Instance ID da SendApp: $INSTANCE_FROM_API"

echo ""
echo "4️⃣ CONFRONTO:"
echo "--------------"
if [ "$INSTANCE_ID" = "$INSTANCE_FROM_API" ]; then
    echo "✅ Instance ID corrispondono!"
else
    echo "❌ Instance ID NON corrispondono!"
    echo "   DB: $INSTANCE_ID"
    echo "   API: $INSTANCE_FROM_API"
fi
