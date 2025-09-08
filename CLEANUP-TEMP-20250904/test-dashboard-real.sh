#!/bin/bash

echo "🔍 TESTING ACTUAL DASHBOARD ENDPOINTS"
echo "====================================="

echo "✅ Backend health check..."
curl -s 'http://localhost:3200/health' | jq '.'

echo ""
echo "🔓 Testing Admin Dashboard (without auth - should show auth error but endpoint exists)..."
curl -s 'http://localhost:3200/api/admin/dashboard' | jq '.error // .data.stats'

echo ""
echo "🔓 Testing User Dashboard (without auth - should show auth error but endpoint exists)..."  
curl -s 'http://localhost:3200/api/dashboard' | jq '.error // .data.stats'

echo ""
echo "📊 The endpoints exist - we need to login first to get real data"
echo "Let's check if there's a test user we can use..."

echo ""
echo "🧪 Testing login endpoint..."
curl -s 'http://localhost:3200/api/auth/login' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"password123"}' | jq '.'
