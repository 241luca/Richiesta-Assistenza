#!/bin/bash

echo "🔍 TEST ENDPOINT MAPS COMPLETO"
echo "=============================="

# Login per token
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | jq -r '.data.accessToken')

echo "Token ottenuto: ${TOKEN:0:20}..."

echo ""
echo "1️⃣ Test GET /api/maps/config:"
curl -s -X GET http://localhost:3200/api/maps/config \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "2️⃣ Test richiesta specifica con coordinate:"
curl -s -X GET "http://localhost:3200/api/requests/ef5ed7b6-a933-48f9-b968-1c7d590bea0b" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {id, title, latitude, longitude, address, city}'

echo ""
echo "=============================="
