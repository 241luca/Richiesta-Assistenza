#!/bin/bash

echo "🔍 Testing Quotes API after fix..."
echo "==================================="

# Test as admin
echo -e "\n1️⃣ ADMIN (admin@assistenza.it):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes)
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    quotes = data.get('data', [])
    print(f'✅ Quotes returned: {len(quotes)}')
    for q in quotes:
        prof = q.get('professional', {})
        client = q['request']['client']
        print(f\"  - {q['title'][:30]}... by {prof.get('fullName', 'NO NAME')} for {client.get('fullName', 'NO NAME')}\")
except Exception as e:
    print(f'❌ Error: {e}')
    print('Response:', sys.stdin.read()[:200])
"

# Test as client
echo -e "\n2️⃣ CLIENT (luigi.bianchi@gmail.com):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luigi.bianchi@gmail.com","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes)
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    quotes = data.get('data', [])
    print(f'✅ Quotes returned: {len(quotes)}')
except:
    print('❌ Error parsing response')
"

echo -e "\n✅ Test complete - Try refreshing the browser now!"