#!/bin/bash

echo "=== TEST DIRETTO DEGLI ENDPOINT ==="
echo ""

# Test endpoint stats
echo "1. Test /api/payments/stats:"
curl -s -X GET http://localhost:3200/api/payments/stats \
  -H "Authorization: Bearer $(cat ~/.test-token 2>/dev/null || echo 'dummy')" \
  | jq '.' 2>/dev/null || echo "ERRORE: Endpoint non risponde"

echo ""
echo "2. Test /api/payments:"
curl -s -X GET http://localhost:3200/api/payments \
  -H "Authorization: Bearer $(cat ~/.test-token 2>/dev/null || echo 'dummy')" \
  | jq '.' 2>/dev/null || echo "ERRORE: Endpoint non risponde"

echo ""
echo "3. Verifica se il backend gira:"
curl -s http://localhost:3200/health | jq '.' 2>/dev/null || echo "Backend NON raggiungibile"
