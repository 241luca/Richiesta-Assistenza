#!/bin/bash

# Verifica CORS seguendo le istruzioni di progetto
echo "🔍 VERIFICA CORS E BACKEND"
echo "=========================="

# 1. Backend attivo?
echo "1. Controllo backend..."
sleep 3
if curl -s http://localhost:3200/health | grep -q "ok"; then
    echo "✅ Backend ATTIVO"
else
    echo "❌ Backend NON attivo"
    exit 1
fi

# 2. Test CORS headers
echo -e "\n2. Test CORS headers..."
curl -I -X OPTIONS http://localhost:3200/api/admin/scripts \
  -H "Origin: http://localhost:5193" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" 2>/dev/null | grep -i "access-control"

echo -e "\n=========================="
echo "Se vedi Access-Control headers, CORS funziona"
