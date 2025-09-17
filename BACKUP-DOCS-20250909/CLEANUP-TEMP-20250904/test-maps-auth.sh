#!/bin/bash

echo "🔍 TEST ENDPOINT MAPS CON AUTENTICAZIONE"
echo "========================================"

# Prima faccio login per ottenere il token
echo "1️⃣ Login per ottenere token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✅ Token ottenuto"
  
  echo ""
  echo "2️⃣ Test GET /api/maps/config:"
  curl -s http://localhost:3200/api/maps/config \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  
  echo ""
  echo "3️⃣ Test POST /api/maps/geocode:"
  curl -s -X POST http://localhost:3200/api/maps/geocode \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"address":"Via Roma 1, Milano, MI, 20100, Italia"}' | jq '.'
    
  echo ""
  echo "4️⃣ Test senza /api prefix (caso route sia montata male):"
  curl -s -X POST http://localhost:3200/maps/geocode \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"address":"Via Roma 1, Milano, MI, 20100, Italia"}' | jq '.'
    
else
  echo "❌ Impossibile ottenere token"
fi

echo ""
echo "========================================"
