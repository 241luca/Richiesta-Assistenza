#!/bin/bash

echo "🔴 TEST DIRETTO SENZA CHECK"
echo "============================"

# Config
API_URL="http://37.27.89.35:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
NUMBER="393403803728"

# 1. Stato istanza
echo -e "\n1️⃣ STATO ISTANZA:"
curl -s -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" \
  --max-time 5 | python3 -m json.tool

# 2. Lista istanze
echo -e "\n\n2️⃣ LISTA ISTANZE:"
curl -s -X GET "$API_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" \
  --max-time 5 | python3 -m json.tool | head -50

# 3. Restart istanza
echo -e "\n\n3️⃣ RESTART ISTANZA:"
curl -s -X PUT "$API_URL/instance/restart/$INSTANCE" \
  -H "apikey: $API_KEY" \
  --max-time 10 | python3 -m json.tool

# Aspetta 5 secondi
echo -e "\nAspetto 5 secondi..."
sleep 5

# 4. Controlla di nuovo lo stato
echo -e "\n4️⃣ STATO DOPO RESTART:"
curl -s -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" \
  --max-time 5 | python3 -m json.tool

# 5. Test invio SEMPLICE (solo number e text)
echo -e "\n\n5️⃣ INVIO MESSAGGIO SEMPLICE:"
echo '{"number":"393403803728","text":"Test semplice"}' | \
curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @- \
  --max-time 30 \
  -v 2>&1 | tail -20

echo -e "\n✅ Fine test"
