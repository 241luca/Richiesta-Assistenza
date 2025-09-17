#!/bin/bash

echo "🔍 Testing both quotes directly by ID..."
echo "========================================"

# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

echo "✅ Logged in as admin"

# Test quote 1
echo -e "\n1️⃣ Quote 1 (Preventivo installazione prese cucina):"
echo "   ID: e45443ff-d182-4642-be3f-b836ad8b94de"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3200/api/quotes/e45443ff-d182-4642-be3f-b836ad8b94de 2>/dev/null | \
  python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"   Found: {d.get('title', 'NOT FOUND')}\")" 2>/dev/null || echo "   NOT FOUND via API"

# Test quote 2  
echo -e "\n2️⃣ Quote 2 (Preventivo sostituzione quadro elettrico):"
echo "   ID: 48f6549e-fb23-4bd9-b484-ef49fdd21487"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3200/api/quotes/48f6549e-fb23-4bd9-b484-ef49fdd21487 2>/dev/null | \
  python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"   Found: {d.get('title', 'NOT FOUND')}\")" 2>/dev/null || echo "   NOT FOUND via API"

# Get all quotes with verbose output
echo -e "\n📊 Getting ALL quotes from /api/quotes:"
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes)
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
quotes = data.get('data', [])
print(f'   Total quotes returned: {len(quotes)}')
for q in quotes:
    print(f\"   - {q['title']} (ID: {q['id']})\")"

echo -e "\n✅ Test complete"