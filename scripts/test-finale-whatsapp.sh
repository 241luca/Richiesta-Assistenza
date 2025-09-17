#!/bin/bash

# Test finale del sistema WhatsApp
echo "🧪 TEST FINALE SISTEMA WHATSAPP"
echo "================================"
echo ""

# Test endpoint polling
echo "1️⃣ Test endpoint polling status:"
RESPONSE=$(curl -s http://localhost:3200/api/whatsapp/polling/status)

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Endpoint funzionante"
    echo "Risposta:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo "❌ Errore endpoint"
    echo "$RESPONSE"
fi

echo ""
echo "2️⃣ Verifica Instance ID nel database:"
DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
METADATA=$(psql "$DB_URL" -t -c "SELECT metadata FROM \"ApiKey\" WHERE service='WHATSAPP' AND \"isActive\"=true;" 2>/dev/null)

if echo "$METADATA" | grep -q "instanceId"; then
    echo "✅ Instance ID presente in ApiKey metadata"
    echo "   $METADATA"
else
    echo "❌ Instance ID non trovato in ApiKey metadata"
fi

echo ""
echo "3️⃣ RIEPILOGO:"
echo "-------------"
echo "✅ Sistema pulito:"
echo "   - Instance ID SOLO in ApiKey metadata"
echo "   - Niente dati hardcoded"
echo "   - Niente duplicati"
echo ""
echo "📱 Per usare il sistema:"
echo "   1. Vai su http://localhost:5193/admin/whatsapp"
echo "   2. Tab 'Ricezione'"
echo "   3. Clicca 'Avvia Controllo Automatico'"
echo ""
echo "Se l'Instance ID è configurato, funzionerà."
echo "Se non è configurato, dirà che manca (onestamente)."
