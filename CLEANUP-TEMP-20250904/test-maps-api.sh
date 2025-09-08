#!/bin/bash

echo "Testing Maps Config API with JWT token..."

# Get the auth token first by logging in
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@assistenza.it", "password": "password123"}')

echo "Login response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool

# Extract the token from the response
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('accessToken', ''))")

echo -e "\nExtracted token: ${TOKEN:0:50}..."

# Now get maps config with the token in Authorization header
echo -e "\nGetting maps config with token..."
MAPS_CONFIG=$(curl -s http://localhost:3200/api/maps/config \
  -H "Authorization: Bearer $TOKEN")

echo "Maps config response:"
echo "$MAPS_CONFIG" | python3 -m json.tool
