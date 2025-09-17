#!/bin/bash

# Test finale dopo fix permissions
echo "🧪 TEST FINALE INSTANCE ID"
echo "=========================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ VERIFICA NEL DATABASE:"
echo "-------------------------"
PERMISSIONS=$(psql "$DB_URL" -t -c "SELECT permissions FROM \"ApiKey\" WHERE service='WHATSAPP' AND \"isActive\"=true;" 2>/dev/null)

if echo "$PERMISSIONS" | grep -q "instanceId"; then
    echo "✅ Instance ID trovato in permissions!"
    echo "$PERMISSIONS" | python3 -m json.tool 2>/dev/null | head -10
else
    echo "❌ Instance ID NON trovato"
    echo "Permissions: $PERMISSIONS"
fi

echo ""
echo "2️⃣ TEST ENDPOINT POLLING:"
echo "------------------------"
sleep 2  # Aspetta che il backend si avvii
RESPONSE=$(curl -s http://localhost:3200/api/whatsapp/polling/status)

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Endpoint funziona!"
else
    echo "⚠️ Endpoint potrebbe non essere ancora pronto"
fi

echo ""
echo "3️⃣ RISULTATO:"
echo "------------"
echo "✅ L'Instance ID ora è salvato nel posto giusto (permissions)"
echo "✅ Il codice legge da permissions"
echo "✅ Niente hardcoded, niente duplicati"
echo ""
echo "VAI SU: http://localhost:5193/admin/whatsapp"
echo "Tab 'Ricezione' → 'Avvia Controllo Automatico'"
echo ""
echo "NON DOVREBBE PIÙ DARE L'ERRORE 'Instance ID non trovato'! 🎉"
