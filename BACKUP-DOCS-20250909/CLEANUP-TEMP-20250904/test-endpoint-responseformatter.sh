#!/bin/bash

# Aspetta qualche secondo che il server si avvii
sleep 5

echo "🌐 TEST ENDPOINT DOPO CORREZIONE"
echo "==============================="

# Test endpoint salute sistema
echo "📡 1. Test /api/health..."
curl -s http://localhost:3200/api/health || echo "❌ Server non risponde"

echo ""
echo ""

# Test endpoint admin dashboard (se accessibile)
echo "📊 2. Test /api/admin/dashboard (mock)..."
curl -s -X GET http://localhost:3200/api/admin/dashboard \
  -H "Content-Type: application/json" || echo "❌ Endpoint admin non accessibile"

echo ""
echo ""
echo "✅ Test endpoint completati"
echo "Se vedi risposte JSON ben formattate, tutto funziona!"
