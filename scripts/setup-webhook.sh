#!/bin/bash

echo "🔧 CONFIGURAZIONE WEBHOOK PER RICEZIONE MESSAGGI"
echo "================================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

# Recupera i dati dal database
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "📱 Dati WhatsApp:"
echo "Token: ${TOKEN:0:20}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

# Per localhost, usiamo webhook.site temporaneo per test
WEBHOOK_URL="http://localhost:3200/api/whatsapp/webhook"

echo "🔗 Configurazione webhook locale:"
echo "URL: $WEBHOOK_URL"
echo ""

echo "⚠️ ATTENZIONE:"
echo "Per ricevere messaggi su localhost hai 2 opzioni:"
echo ""
echo "OPZIONE 1 - WEBHOOK TEMPORANEO (per test):"
echo "1. Vai su https://webhook.site"
echo "2. Copia l'URL che ti dà (es: https://webhook.site/xxxxx)"
echo "3. Usa questo comando con il TUO URL:"
echo ""
echo "curl -X GET \"https://app.sendapp.cloud/api/set_webhook?webhook_url=IL_TUO_WEBHOOK_URL&enable=true&instance_id=$INSTANCE_ID&access_token=$TOKEN\""
echo ""
echo "OPZIONE 2 - POLLING (più semplice):"
echo "Non configurare webhook, usa il polling che controlla ogni 30 secondi"
echo ""
echo "OPZIONE 3 - NGROK (per produzione):"
echo "1. Installa ngrok: brew install ngrok"
echo "2. Esegui: ngrok http 3200"
echo "3. Usa l'URL di ngrok come webhook"
echo ""

# Test: configura webhook locale (non funzionerà da internet ma almeno è configurato)
echo "🔧 Configurazione webhook locale (per test interni):"
curl -X GET "https://app.sendapp.cloud/api/set_webhook?webhook_url=${WEBHOOK_URL}&enable=true&instance_id=${INSTANCE_ID}&access_token=${TOKEN}"

echo ""
echo ""
echo "✅ FATTO! Ora:"
echo "1. Se vuoi ricevere messaggi SUBITO: usa ngrok o webhook.site"
echo "2. Se vuoi semplicità: usa il POLLING (già configurato)"
echo "   Vai su http://localhost:5193/admin/whatsapp"
echo "   Tab 'Ricezione' → 'Avvia Controllo Automatico'"
