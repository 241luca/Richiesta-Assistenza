#!/bin/bash

echo "🔍 Testing Login with CORRECT credentials from LoginPage..."
echo "========================================================="

# Test admin@assistenza.it
echo -e "\n✅ Testing: admin@assistenza.it / password123"
curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"password123"}' | python3 -m json.tool | head -20

echo -e "\n---"

# Test luigi.bianchi@gmail.com  
echo -e "\n✅ Testing: luigi.bianchi@gmail.com / password123"
curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luigi.bianchi@gmail.com","password":"password123"}' | python3 -m json.tool | head -20

echo -e "\n✅ Test complete - These are the CORRECT credentials!"