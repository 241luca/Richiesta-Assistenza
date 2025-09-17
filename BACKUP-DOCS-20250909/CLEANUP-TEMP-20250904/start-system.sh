#!/bin/bash

echo "🚀 AVVIO SISTEMA COMPLETO"
echo "========================="

# Controlla se il backend è già in esecuzione
lsof -i :3200 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend già in esecuzione su porta 3200"
else
    echo "📦 Avvio backend..."
    osascript -e 'tell application "Terminal" to do script "cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend && npm run dev"'
    echo "⏳ Backend in avvio su porta 3200..."
fi

# Controlla se il frontend è già in esecuzione
lsof -i :5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend già in esecuzione su porta 5193"
else
    echo "🎨 Avvio frontend..."
    osascript -e 'tell application "Terminal" to do script "cd /Users/lucamambelli/Desktop/richiesta-assistenza && npm run dev"'
    echo "⏳ Frontend in avvio su porta 5193..."
fi

echo ""
echo "========================="
echo "📌 URL di accesso:"
echo "   Frontend: http://localhost:5193"
echo "   Backend API: http://localhost:3200"
echo ""
echo "🔐 Per testare il login usa le credenziali mostrate sopra"
echo "   Password default: password123"
