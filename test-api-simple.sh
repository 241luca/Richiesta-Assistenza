#!/bin/bash

echo "🧪 TEST API SCRIPTS - Semplificato"
echo "===================================="

# Aspetta che il backend sia pronto
echo "⏳ Attendo che il backend si avvii..."
sleep 3

# Test 1: Health check
echo -e "\n1️⃣ Backend attivo?"
curl -s http://localhost:3200/health | python3 -m json.tool 2>/dev/null | head -5

# Test 2: Prova l'endpoint scripts (dovrebbe dare 401 senza auth)
echo -e "\n2️⃣ Test endpoint /api/admin/scripts (senza auth):"
curl -X GET http://localhost:3200/api/admin/scripts \
  -H "Content-Type: application/json" \
  -w "\n📊 HTTP Status: %{http_code}\n" \
  -s -o /tmp/response.json

echo "📄 Risposta:"
cat /tmp/response.json | python3 -m json.tool 2>/dev/null | head -20

# Test 3: Verifica se c'è un errore nel backend
echo -e "\n3️⃣ Ultimi errori nel backend:"
grep -i "error" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/backend.log 2>/dev/null | tail -5

echo -e "\n===================================="
echo "✅ Se vedi HTTP Status 401 = L'API funziona (richiede login)"
echo "❌ Se vedi HTTP Status 500 = C'è un errore nel backend"
echo "❌ Se non risponde = Backend non attivo"
