#!/bin/bash

echo "🔍 VERIFICA STATO BACKEND"
echo "========================"
echo ""

# Controlla se il backend è in esecuzione
curl -s http://localhost:3200/api/ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend è in esecuzione!"
    
    # Test endpoint backup
    echo ""
    echo "Test endpoint backup..."
    response=$(curl -s -w "\n%{http_code}" http://localhost:3200/api/backup/stats)
    status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" = "401" ]; then
        echo "✅ Endpoint risponde (richiede autenticazione)"
    elif [ "$status_code" = "200" ]; then
        echo "✅ Endpoint funzionante!"
    else
        echo "⚠️ Endpoint restituisce status: $status_code"
    fi
else
    echo "❌ Backend NON è in esecuzione o ha errori"
    echo ""
    echo "Controlla il terminale del backend per vedere l'errore"
fi

echo ""
echo "========================"
