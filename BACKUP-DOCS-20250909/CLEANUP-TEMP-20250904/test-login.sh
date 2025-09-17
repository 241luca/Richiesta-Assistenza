#!/bin/bash

echo "🔍 Testing Login Directly..."
echo "=========================="

# Test with admin@example.com
echo -e "\nTrying: admin@example.com / Admin123!"
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  -s | python3 -m json.tool

echo -e "\n---"

# Try with username instead of email
echo -e "\nTrying: admin (username) / Admin123!"
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"Admin123!"}' \
  -s | python3 -m json.tool

echo -e "\n✅ Test complete"