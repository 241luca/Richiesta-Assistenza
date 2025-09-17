#!/bin/bash

echo "🔍 ANALISI PROBLEMA RICEZIONE MESSAGGI"
echo "======================================="
echo ""

# Test diretto API SendApp per vedere se ci sono messaggi
echo "1️⃣ Test diretto API SendApp per recuperare messaggi:"
echo "-----------------------------------------------------"

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

# Recupera token e instance ID dal database
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "Token: ${TOKEN:0:20}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

# Test 1: Prova a recuperare le chat
echo "📱 Test 1 - Recupero chat:"
curl -s -X GET "https://app.sendapp.cloud/api/chats/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID\"}" | head -100

echo ""
echo ""

# Test 2: Prova endpoint alternativo
echo "📱 Test 2 - Endpoint alternativo per messaggi:"
curl -s -X POST "https://app.sendapp.cloud/api/message/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID\"}" | head -100

echo ""
echo ""

# Test 3: Verifica se ci sono messaggi salvati nel database locale
echo "2️⃣ Messaggi già salvati nel database locale:"
echo "--------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    LEFT(message, 50) as message_preview,
    direction,
    status,
    \"receivedAt\"
FROM \"WhatsAppMessage\"
ORDER BY \"receivedAt\" DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "3️⃣ POSSIBILI CAUSE DEL PROBLEMA:"
echo "---------------------------------"
echo "1. L'API di SendApp potrebbe usare endpoint diversi"
echo "2. Il formato della richiesta potrebbe essere sbagliato"
echo "3. Potrebbero servire parametri aggiuntivi"
echo "4. Il token potrebbe non avere i permessi per leggere messaggi"
echo ""
echo "Controlla i risultati sopra per capire quale sia il problema."
