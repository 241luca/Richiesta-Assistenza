#!/bin/bash

echo "🔍 Testing API with authentication..."
echo "===================================="

# Login and get token
echo -e "\n1. Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool
    exit 1
fi

echo "✅ Login successful"

# Test requests endpoint with token
echo -e "\n2. Fetching requests..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/requests | python3 -m json.tool | head -50

# Test quotes endpoint with token
echo -e "\n3. Fetching quotes..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes | python3 -m json.tool | head -50

# Test categories
echo -e "\n4. Fetching categories..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/categories | python3 -m json.tool | head -30

echo -e "\n✅ Test complete"