#!/bin/bash

echo "🔍 TEST CONNESSIONE BACKEND"
echo "=========================="

# Test health endpoint
echo -e "\n📡 Test endpoint /api/health:"
curl -s http://localhost:3200/api/health | jq '.' 2>/dev/null || echo "❌ Backend non raggiungibile"

# Test auth status
echo -e "\n🔐 Test auth status:"
curl -s http://localhost:3200/api/auth/status | jq '.' 2>/dev/null || echo "❌ Endpoint auth non raggiungibile"

# Test categories
echo -e "\n📂 Test categorie:"
curl -s http://localhost:3200/api/categories | jq '.' 2>/dev/null || echo "❌ Endpoint categorie non raggiungibile"

echo -e "\n=========================="
