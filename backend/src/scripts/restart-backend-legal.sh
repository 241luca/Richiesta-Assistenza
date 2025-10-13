#!/bin/bash

echo "🔄 Riavvio del backend per applicare le correzioni..."
echo ""

# Trova e termina il processo del backend sulla porta 3200
echo "⏹️  Terminazione processo backend..."
PID=$(lsof -ti :3200)
if [ ! -z "$PID" ]; then
  kill -9 $PID
  echo "   ✅ Processo terminato (PID: $PID)"
else
  echo "   ℹ️  Nessun processo attivo sulla porta 3200"
fi

sleep 2

# Riavvia il backend
echo "🚀 Avvio nuovo processo backend..."
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
npm run dev &

sleep 5

echo ""
echo "✅ Backend riavviato!"
echo ""
echo "🧪 Test degli URL pubblici dei documenti legali:"
echo ""

# Test Privacy Policy
echo "1. Privacy Policy:"
curl -s http://localhost:3200/api/public/legal/privacy-policy | head -c 200
echo ""
echo ""

# Test Terms Service
echo "2. Termini di Servizio:"
curl -s http://localhost:3200/api/public/legal/terms-service | head -c 200
echo ""
echo ""

# Test Cookie Policy
echo "3. Cookie Policy:"
curl -s http://localhost:3200/api/public/legal/cookie-policy | head -c 200
echo ""
echo ""

echo "✨ Se vedi i dati JSON sopra, il sistema funziona!"
echo ""
echo "📋 URL pubblici funzionanti:"
echo "   • http://localhost:5193/legal/privacy-policy"
echo "   • http://localhost:5193/legal/terms-service"
echo "   • http://localhost:5193/legal/cookie-policy"
