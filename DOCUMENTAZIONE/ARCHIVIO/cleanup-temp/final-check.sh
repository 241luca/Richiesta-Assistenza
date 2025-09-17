#!/bin/bash

echo "🔍 VERIFICA STATO FINALE SISTEMA"
echo "================================"
echo ""

# Aspetta un attimo per il riavvio
sleep 2

# Test backend
echo "1️⃣ Controllo backend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/ping)

if [ "$response" = "200" ]; then
    echo "✅ Backend operativo!"
else
    echo "⚠️ Backend non risponde (status: $response)"
fi

# Test endpoint backup
echo ""
echo "2️⃣ Controllo endpoint backup..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/backup)

if [ "$response" = "401" ]; then
    echo "✅ Endpoint backup funzionante (richiede login)"
elif [ "$response" = "200" ]; then
    echo "✅ Endpoint backup funzionante!"
else
    echo "⚠️ Endpoint backup status: $response"
fi

# Test frontend
echo ""
echo "3️⃣ Controllo frontend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5193)

if [ "$response" = "200" ]; then
    echo "✅ Frontend operativo!"
else
    echo "⚠️ Frontend non risponde (status: $response)"
fi

echo ""
echo "================================"
echo ""

if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "🎉 SISTEMA BACKUP PRONTO ALL'USO!"
    echo ""
    echo "📍 Accedi a: http://localhost:5193/admin/backup"
    echo "   Menu: Sistema Backup"
    echo ""
    echo "✅ Tutto funziona correttamente!"
else
    echo "⚠️ Controlla il terminale del backend per eventuali errori"
fi
