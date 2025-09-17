#!/bin/bash

# Test diretto del health check system

echo "🔍 TEST DIRETTO HEALTH CHECK SYSTEM"
echo "===================================="
echo ""

# 1. Test endpoint status
echo "1️⃣ TEST: GET /api/admin/health-check/status"
curl -s http://localhost:3200/api/admin/health-check/status | head -c 200
echo ""
echo ""

# 2. Test run all checks
echo "2️⃣ TEST: POST /api/admin/health-check/run (all modules)"
curl -s -X POST http://localhost:3200/api/admin/health-check/run \
  -H "Content-Type: application/json" \
  -d '{}' | head -c 500
echo ""
echo ""

# 3. Test single module
echo "3️⃣ TEST: POST /api/admin/health-check/run (auth module)"
curl -s -X POST http://localhost:3200/api/admin/health-check/run \
  -H "Content-Type: application/json" \
  -d '{"module":"auth"}' | head -c 500
echo ""
echo ""

echo "===================================="
echo "✅ TEST COMPLETATO"
echo ""
echo "SE VEDI:"
echo "- 'Unauthorized' = Backend funziona ma serve login"
echo "- 'Cannot POST' = Endpoint non esiste"
echo "- 'Connection refused' = Backend non attivo"
echo "- Dati JSON = Sistema funzionante!"
