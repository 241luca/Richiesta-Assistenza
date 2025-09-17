#!/bin/bash

echo "🔍 DEBUG ResponseFormatter - Confronto risposte API"
echo "=================================================="

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZGUyMTgzNi04NzA1LTRhOWEtYWY1My04YWI1ZGIyYzgwYTQiLCJpYXQiOjE3NTY0OTgxMzQsImV4cCI6MTc1NzEwMjkzNH0.QiLtTiCdQWTaYfNmCNukeeGrwD0qDDamNzryZCLxhZA"

echo "📊 1. ADMIN DASHBOARD ENDPOINT (/api/admin/dashboard):"
echo "Raw JSON:"
curl -s "http://localhost:3200/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n📊 2. NORMAL DASHBOARD ENDPOINT (/api/dashboard):"
echo "Raw JSON:"
curl -s "http://localhost:3200/api/dashboard" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n🎯 Focus sui numeri IN_PROGRESS:"
echo "Admin dashboard in_progress:"
curl -s "http://localhost:3200/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['stats']['requestsByStatus']['in_progress'])"

echo "Normal dashboard in_progress (admin user):"
curl -s "http://localhost:3200/api/dashboard" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['stats']['requestsByStatus']['in_progress'])"

echo -e "\nDovrebbero essere uguali!"
