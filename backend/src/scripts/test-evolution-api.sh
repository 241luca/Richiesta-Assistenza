#!/bin/bash

# Test diretto Evolution API
echo "🔍 Test diretto Evolution API..."

# Variabili
API_URL="http://37.27.89.35:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
NUMBER="393331234567"  # Numero di test

echo "📞 Test 1: Verifica stato istanza..."
curl -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" \
  --max-time 10

echo -e "\n\n📨 Test 2: Invio messaggio di test..."
curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"number\":\"$NUMBER\",\"text\":\"Test messaggio $(date)\"}" \
  --max-time 10 \
  -v

echo -e "\n✅ Test completato"
