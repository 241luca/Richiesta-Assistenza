#!/bin/bash

echo "=== Update Google Maps API Key ==="
echo ""

# Chiedi la nuova API key
echo "Inserisci la nuova API key di Google Maps:"
read -r NEW_API_KEY

if [ -z "$NEW_API_KEY" ]; then
  echo "API key non può essere vuota!"
  exit 1
fi

echo ""
echo "Aggiornamento API key..."

# Login first
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@assistenza.it",
    "password": "password123"
  }' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Errore nel login"
  exit 1
fi

# Update the API key
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3200/api/apikeys/GOOGLE_MAPS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"encryptedKey\": \"$NEW_API_KEY\",
    \"configuration\": {
      \"enabled\": true,
      \"apis\": [\"maps\", \"geocoding\", \"places\", \"directions\", \"distance\"]
    }
  }")

echo "Response: $UPDATE_RESPONSE"
echo ""

# Test the new key
echo "Testing the new API key..."
TEST_RESPONSE=$(curl -s -X GET http://localhost:3200/api/maps/config \
  -H "Authorization: Bearer $TOKEN")

echo "Test response: $TEST_RESPONSE"
echo ""

# Test geocoding
echo "Testing geocoding..."
GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "address": "Colosseo, Roma, Italia"
  }')

echo "Geocoding test: $GEOCODE_RESPONSE"
echo ""

echo "=== Update Complete ==="
echo "Ora ricarica la pagina nel browser per testare la mappa"
