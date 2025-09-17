#!/bin/bash

echo "🔍 Testing Quotes API with different users..."
echo "============================================="

# 1. Test as admin
echo -e "\n1️⃣ As ADMIN (admin@assistenza.it):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

echo "Fetching /api/quotes..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes | python3 -m json.tool | head -30

# 2. Test as professional
echo -e "\n\n2️⃣ As PROFESSIONAL (mario.rossi@assistenza.it):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mario.rossi@assistenza.it","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

echo "Fetching /api/quotes..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes | python3 -m json.tool | head -30

# 3. Test as client
echo -e "\n\n3️⃣ As CLIENT (luigi.bianchi@gmail.com):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luigi.bianchi@gmail.com","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

echo "Fetching /api/quotes..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes | python3 -m json.tool | head -30

echo -e "\n✅ Test complete"