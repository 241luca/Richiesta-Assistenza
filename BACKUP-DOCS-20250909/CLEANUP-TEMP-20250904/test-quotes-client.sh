#!/bin/bash

echo "🔍 Testing QuotesPage with different users..."
echo "============================================="

# Test as CLIENT (luigi.bianchi)
echo -e "\n1️⃣ As CLIENT (luigi.bianchi@gmail.com):"
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luigi.bianchi@gmail.com","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/api/quotes)
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
quotes = data.get('data', [])
print(f'Quotes visible: {len(quotes)}')
if quotes:
    for q in quotes:
        prof = q.get('professional', {})
        print(f\"  - {q['title']} by {prof.get('fullName', 'NO FULLNAME')}\")"

echo -e "\n✅ Test complete"
echo -e "\nProva a fare login nel browser con:"
echo "  luigi.bianchi@gmail.com / password123"
echo "Dovresti vedere i preventivi!"