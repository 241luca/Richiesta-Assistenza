#!/bin/bash

echo "🔍 TEST ENDPOINTS API"
echo "===================="

# Test health
echo "1️⃣ Test /api/health:"
curl -s http://localhost:3200/api/health | jq '.' || echo "Errore"

echo ""
echo "2️⃣ Test /api/categories:"
curl -s http://localhost:3200/api/categories | jq '.' 2>/dev/null | head -20 || echo "Errore"

echo ""
echo "3️⃣ Test /api/auth/status:"
curl -s http://localhost:3200/api/auth/status | jq '.' || echo "Errore"

echo ""
echo "4️⃣ Test login con admin@assistenza.it:"
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' \
  -c cookies.txt -s | jq '.'

echo ""
echo "===================="
