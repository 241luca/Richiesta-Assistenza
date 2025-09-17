#!/bin/bash

echo "🧪 TEST FINALE SCRIPT MANAGER"
echo "============================="

# Aspetta che il backend parta
echo "⏳ Attendo avvio backend..."
sleep 5

# Test 1: Backend attivo?
echo -e "\n1️⃣ Verifico backend..."
if curl -s http://localhost:3200/health | grep -q "ok"; then
    echo "✅ Backend ATTIVO"
else
    echo "❌ Backend NON risponde"
    echo "   Controllare il terminale del backend per errori"
    exit 1
fi

# Test 2: API Scripts (dovrebbe dare 401 se non autenticato)
echo -e "\n2️⃣ Test API /api/admin/scripts..."
HTTP_CODE=$(curl -s -o /tmp/scripts-response.json -w "%{http_code}" \
  http://localhost:3200/api/admin/scripts \
  -H "Content-Type: application/json")

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ API funziona! (richiede autenticazione)"
    echo "Risposta:"
    cat /tmp/scripts-response.json | python3 -m json.tool 2>/dev/null | head -10
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API funziona! (hai già un token attivo)"
    echo "Scripts disponibili:"
    cat /tmp/scripts-response.json | python3 -m json.tool 2>/dev/null | grep displayName
else
    echo "❌ Errore inaspettato"
    echo "Risposta:"
    cat /tmp/scripts-response.json
fi

echo -e "\n============================="
echo "📌 PROSSIMI PASSI:"
echo "1. Vai su http://localhost:5193"
echo "2. Fai login come admin"
echo "3. Vai su http://localhost:5193/admin/scripts"
echo "4. Gli script dovrebbero apparire nella lista"
echo "5. Clicca Play per eseguirli"
