#!/bin/bash

echo "=== Testing Quotes API Endpoint ==="
echo ""

# Prima otteniamo un token di login valido
echo "1. Logging in as professional..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@professional.com",
    "password": "password123"
  }' \
  -c cookies.txt)

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Estrai il token dal response se disponibile
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo "2. Testing /api/quotes with Bearer token..."
  curl -X GET http://localhost:3200/api/quotes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -v
else
  echo "2. Testing /api/quotes with cookies..."
  curl -X GET http://localhost:3200/api/quotes \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -v
fi

echo ""
echo ""
echo "3. Testing as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }' \
  -c cookies-admin.txt)

echo "Admin login response: $LOGIN_RESPONSE"
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo "4. Testing /api/quotes as admin with Bearer token..."
  curl -X GET http://localhost:3200/api/quotes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -v
else
  echo "4. Testing /api/quotes as admin with cookies..."
  curl -X GET http://localhost:3200/api/quotes \
    -H "Content-Type: application/json" \
    -b cookies-admin.txt \
    -v
fi

# Cleanup
rm -f cookies.txt cookies-admin.txt

echo ""
echo "=== Test Complete ==="
