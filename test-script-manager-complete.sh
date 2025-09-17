#!/bin/bash

echo "🧪 TEST COMPLETO SCRIPT MANAGER API"
echo "===================================="

# Test 1: Backend attivo?
echo -e "\n1️⃣ Verifico che il backend sia attivo..."
if curl -s http://localhost:3200/health | grep -q "ok"; then
    echo "✅ Backend ATTIVO"
else
    echo "❌ Backend NON ATTIVO - Avvialo con: cd backend && npm run dev"
    exit 1
fi

# Test 2: Lista script (senza auth - dovrebbe dare errore 401)
echo -e "\n2️⃣ Test endpoint lista script (senza auth)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3200/api/admin/scripts)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
echo "Codice HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Richiede autenticazione (corretto)"
else
    echo "⚠️ Risposta inaspettata"
fi

# Test 3: Verifica presenza script
echo -e "\n3️⃣ Verifica presenza script fisici..."
SCRIPT_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/scripts"
if [ -f "$SCRIPT_DIR/audit-system-check.sh" ]; then
    echo "✅ Script audit-system-check.sh PRESENTE"
else
    echo "❌ Script audit-system-check.sh MANCANTE"
fi

echo -e "\n===================================="
echo "📌 Per testare completamente:"
echo "1. Accedi come admin su http://localhost:5193"
echo "2. Vai su http://localhost:5193/admin/scripts"
echo "3. Clicca Play su uno script"
echo "4. Guarda l'output nella console"
echo ""
echo "Se vedi gli script ma non funzionano, riavvia il backend:"
echo "cd backend && npm run dev"
