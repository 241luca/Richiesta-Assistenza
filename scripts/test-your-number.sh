#!/bin/bash

echo "🔴 TEST SOLO CON IL TUO NUMERO"
echo "==============================="

API_URL="http://37.27.89.35:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
YOUR_NUMBER="393403803728"  # Il tuo numero reale

echo "📱 Numero: $YOUR_NUMBER"
echo ""

# 1. Test diretto invio messaggio
echo "1️⃣ INVIO DIRETTO SENZA CHECK:"
echo "-------------------------------"

curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$YOUR_NUMBER\",
    \"text\": \"Test diretto senza verifiche - $(date '+%H:%M:%S')\"
  }" \
  --max-time 15 \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  2>/dev/null

echo ""
echo "✅ Test completato"
