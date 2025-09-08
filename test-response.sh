#!/bin/bash

# Test veloce per vedere la risposta esatta dell'API

# Login
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."

# Chiamata API audit/logs
echo -e "\nChiamata API /api/audit/logs:"
echo "=============================="
curl -s http://localhost:3200/api/audit/logs \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool | head -50
