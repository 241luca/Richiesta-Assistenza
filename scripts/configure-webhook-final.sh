#!/bin/bash

echo "🔧 CONFIGURAZIONE WEBHOOK SENDAPP"
echo "================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "📱 Dati WhatsApp:"
echo "Token: ${TOKEN:0:30}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

echo "⚠️ COPIA l'URL di ngrok dal terminale dove sta girando"
echo "   Sarà tipo: https://abc123xyz.ngrok-free.app"
echo ""
read -p "Incolla qui l'URL di ngrok: " NGROK_URL

# Rimuovi slash finale se presente
NGROK_URL=${NGROK_URL%/}
WEBHOOK_URL="${NGROK_URL}/api/whatsapp/webhook"

echo ""
echo "📌 Webhook URL completo: $WEBHOOK_URL"
echo ""

# URL encode del webhook URL
WEBHOOK_URL_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$WEBHOOK_URL'))")

# Configura webhook su SendApp
echo "Invio configurazione a SendApp..."
FULL_URL="https://app.sendapp.cloud/api/set_webhook?webhook_url=${WEBHOOK_URL_ENCODED}&enable=true&instance_id=${INSTANCE_ID}&access_token=${TOKEN}"

echo "Chiamata API:"
echo "$FULL_URL"
echo ""

RESPONSE=$(curl -s -X GET "$FULL_URL")

echo "Risposta SendApp:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Salva nel database locale
echo ""
echo "Salvataggio nel database..."
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET permissions = jsonb_set(
    COALESCE(permissions, '{}'::jsonb),
    '{webhookUrl}',
    '\"${WEBHOOK_URL}\"'::jsonb
),
\"updatedAt\" = NOW()
WHERE service = 'whatsapp';
" 2>/dev/null

echo ""
echo "✅ FATTO!"
echo ""
echo "🧪 ORA TESTA:"
echo "1. Invia un messaggio WhatsApp al numero connesso"
echo "2. Guarda i log del backend - dovresti vedere:"
echo "   📨 Webhook WhatsApp ricevuto"
echo "3. Vai su http://localhost:5193/admin/whatsapp"
echo "   Tab 'Messaggi' - dovrebbe apparire il messaggio!"
echo ""
echo "📌 Ngrok DEVE rimanere attivo per ricevere messaggi"
