#!/bin/bash

echo "🔍 DIAGNOSTICA ERRORE NETWORK ERROR"
echo "===================================="

# 1. Backend attivo?
echo -e "\n1️⃣ Controllo se il backend è attivo..."
if curl -s http://localhost:3200/health | grep -q "ok"; then
    echo "✅ Backend ATTIVO sulla porta 3200"
else
    echo "❌ Backend NON ATTIVO!"
    echo "   Avvialo con: cd backend && npm run dev"
    exit 1
fi

# 2. Test endpoint scripts
echo -e "\n2️⃣ Test endpoint /api/admin/scripts..."
curl -X GET http://localhost:3200/api/admin/scripts \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -200

# 3. Controllo errori TypeScript
echo -e "\n3️⃣ Controllo errori TypeScript nel backend..."
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
npx tsc --noEmit 2>&1 | grep -E "shell-scripts" | head -10

echo -e "\n4️⃣ Controllo se il servizio è importato correttamente..."
grep -n "shellScriptsService" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/admin/shell-scripts.routes.ts

echo -e "\n===================================="
echo "📌 Controlliamo i log del backend per errori"
