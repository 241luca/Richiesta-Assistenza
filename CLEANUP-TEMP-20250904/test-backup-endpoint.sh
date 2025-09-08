#!/bin/bash

echo "🔍 TEST ENDPOINT BACKUP"
echo "======================="
echo ""

# Aspetta riavvio
sleep 3

echo "1️⃣ Test endpoint /api/backup..."
response=$(curl -s -w "\nSTATUS:%{http_code}" http://localhost:3200/api/backup)
status=$(echo "$response" | grep "STATUS:" | cut -d: -f2)

if [ "$status" = "401" ]; then
    echo "✅ Endpoint risponde correttamente (401 = richiede autenticazione)"
elif [ "$status" = "404" ]; then
    echo "❌ Endpoint non trovato (404) - Route non registrata"
elif [ "$status" = "200" ]; then
    echo "✅ Endpoint funzionante!"
else
    echo "⚠️ Status inaspettato: $status"
fi

echo ""
echo "2️⃣ Test endpoint /api/backup/stats..."
response=$(curl -s -w "\nSTATUS:%{http_code}" http://localhost:3200/api/backup/stats)
status=$(echo "$response" | grep "STATUS:" | cut -d: -f2)

if [ "$status" = "401" ]; then
    echo "✅ Endpoint stats risponde (401 = richiede auth)"
elif [ "$status" = "404" ]; then
    echo "❌ Endpoint stats non trovato (404)"
else
    echo "✅ Status: $status"
fi

echo ""
echo "3️⃣ Verifica registrazione route nel server..."
grep -q "app.use('/api/backup'" backend/src/server.ts
if [ $? -eq 0 ]; then
    echo "✅ Route registrata nel server.ts"
    echo "Posizione:"
    grep -n "app.use('/api/backup'" backend/src/server.ts
else
    echo "❌ Route NON trovata nel server.ts"
fi

echo ""
echo "======================="

if [ "$status" = "401" ] || [ "$status" = "200" ]; then
    echo ""
    echo "🎉 SISTEMA BACKUP FUNZIONANTE!"
    echo "Vai su: http://localhost:5193/admin/backup"
else
    echo ""
    echo "⚠️ Il sistema necessita ancora configurazione"
fi
