#!/bin/bash

# Test API Scripts endpoint
echo "🔍 Testing Scripts API endpoint..."

# Prova senza autenticazione
echo -e "\n1. Test senza autenticazione:"
curl -X GET http://localhost:3200/api/admin/scripts 2>/dev/null | head -c 200

# Se hai un token, sostituiscilo qui
TOKEN="YOUR_JWT_TOKEN_HERE"

echo -e "\n\n2. Test con autenticazione (se hai un token):"
# curl -X GET http://localhost:3200/api/admin/scripts \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" | python3 -m json.tool

echo -e "\n3. Test esecuzione script (audit-system-check):"
curl -X POST http://localhost:3200/api/admin/scripts/run \
  -H "Content-Type: application/json" \
  -d '{"scriptName": "audit-system-check"}' 2>/dev/null | head -c 500

echo -e "\n\n✅ Test completato"
