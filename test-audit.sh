#!/bin/bash

# Test Audit API
echo "Testing Audit Log API..."

# First login to get token
echo "1. Login..."
TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "Login failed. Trying with different credentials..."
  TOKEN=$(curl -s -X POST http://localhost:3200/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@lmtecnologie.it","password":"SuperAdmin123!"}' \
    | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
fi

if [ -z "$TOKEN" ]; then
  echo "Cannot login. Please check credentials."
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Test audit logs endpoint
echo -e "\n2. Fetching audit logs..."
curl -s http://localhost:3200/api/audit/logs \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo -e "\n3. Fetching statistics..."
curl -s http://localhost:3200/api/audit/statistics \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
