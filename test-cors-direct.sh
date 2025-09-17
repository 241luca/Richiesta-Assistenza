#!/bin/bash

# Test diretto dell'API con curl per capire il problema
echo "🧪 TEST DIRETTO API SCRIPTS"
echo "==========================="

# Aspetta backend
sleep 3

# 1. Test health
echo "1. Health check:"
curl -s http://localhost:3200/health | python3 -m json.tool | head -5

# 2. Test con richiesta OPTIONS (preflight CORS)
echo -e "\n2. Test OPTIONS (preflight):"
curl -X OPTIONS http://localhost:3200/api/admin/scripts/run \
  -H "Origin: http://localhost:5193" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v 2>&1 | grep -i "< access-control"

# 3. Test POST diretta (dovrebbe dare 401)
echo -e "\n3. Test POST senza auth:"
curl -X POST http://localhost:3200/api/admin/scripts/run \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5193" \
  -d '{"scriptName":"check-system"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n==========================="
echo "📌 Se OPTIONS non risponde con headers CORS, c'è un problema di configurazione"
echo "📌 Se POST dà 404, l'endpoint non esiste"
echo "📌 Se POST dà 401, funziona ma serve autenticazione"
