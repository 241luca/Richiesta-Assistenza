#!/bin/bash

echo "🔍 DEBUG COMPLETO ENDPOINT MAPS"
echo "================================"

# Test diretto senza autenticazione per vedere l'errore
echo "1️⃣ Test senza auth (per vedere errore):"
curl -s -X GET http://localhost:3200/api/maps/geocode 2>&1 | jq '.' || echo "Risposta non JSON"

echo ""
echo "2️⃣ Test con metodo sbagliato (GET invece di POST):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | jq -r '.data.accessToken')

curl -s -X GET http://localhost:3200/api/maps/geocode \
  -H "Authorization: Bearer $TOKEN" 2>&1 | jq '.' || echo "Risposta"

echo ""
echo "3️⃣ Test corretto (POST con auth e body):"
curl -s -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address":"Via Roma 1, Milano, MI, Italia"}' 2>&1 | jq '.'

echo ""
echo "================================"
