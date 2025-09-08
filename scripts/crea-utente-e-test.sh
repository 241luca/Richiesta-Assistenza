#!/bin/bash

echo "👤 CREAZIONE UTENTE DI TEST"
echo "================================"
echo ""

# Crea un utente di test tramite l'endpoint di registrazione
echo "Creazione utente test@test.it..."

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.it",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Organization"
  }')

echo "Risposta registrazione:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool

echo ""
echo "================================"
echo ""

# Prova il login con il nuovo utente
echo "Tentativo login con test@test.it..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.it",
    "password": "Test123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "✅ Login riuscito!"
    echo ""
    
    # Test geocoding
    echo "🗺️ TEST GEOCODING CON GOOGLE MAPS"
    echo "================================"
    echo ""
    echo "Test indirizzo: Via Roma 1, Milano"
    
    GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"address": "Via Roma 1, Milano, Italia"}')
    
    echo "📍 RISULTATO:"
    echo "$GEOCODE_RESPONSE" | python3 -m json.tool
    
else
    echo "❌ Login fallito"
    echo "Risposta: $LOGIN_RESPONSE"
fi

echo ""
echo "================================"
