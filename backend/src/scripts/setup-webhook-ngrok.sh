#!/bin/bash

echo "🔧 CONFIGURAZIONE WEBHOOK CON NGROK"
echo "===================================="
echo ""

# Recupera dati dal database
DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "📱 Configurazione WhatsApp:"
echo "Token: ${TOKEN:0:30}..."
echo "Instance ID: $INSTANCE_ID"
echo ""

echo "⚠️  IMPORTANTE: Ngrok deve essere in esecuzione!"
echo ""
echo "1️⃣ Controlla che ngrok sia attivo nell'altro terminale"
echo "   Dovresti vedere qualcosa tipo:"
echo "   Forwarding: https://abc123.ngrok.io -> http://localhost:3200"
echo ""

# Chiedi l'URL di ngrok all'utente
echo "2️⃣ COPIA l'URL di ngrok (es: https://abc123.ngrok.io)"
read -p "Incolla qui l'URL di ngrok: " NGROK_URL

# Rimuovi eventuale slash finale
NGROK_URL=${NGROK_URL%/}

# Costruisci l'URL completo del webhook
WEBHOOK_URL="${NGROK_URL}/api/whatsapp/webhook"

echo ""
echo "3️⃣ Configurazione webhook su SendApp:"
echo "URL webhook: $WEBHOOK_URL"
echo ""

# Configura il webhook su SendApp
echo "Invio configurazione a SendApp..."
RESPONSE=$(curl -s -X GET "https://app.sendapp.cloud/api/set_webhook?webhook_url=${WEBHOOK_URL}&enable=true&instance_id=${INSTANCE_ID}&access_token=${TOKEN}")

echo "Risposta SendApp:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Salva anche nel database locale
echo ""
echo "4️⃣ Salvataggio URL webhook nel database locale..."
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET permissions = jsonb_set(
    permissions,
    '{webhookUrl}',
    '\"${WEBHOOK_URL}\"'
),
\"updatedAt\" = NOW()
WHERE service = 'whatsapp';
" 2>/dev/null

echo ""
echo "✅ CONFIGURAZIONE COMPLETATA!"
echo ""
echo "🧪 TEST:"
echo "1. Invia un messaggio WhatsApp al numero connesso"
echo "2. Guarda i log del backend (dovrebbe mostrare 'Webhook WhatsApp ricevuto')"
echo "3. Controlla nel database se il messaggio è stato salvato"
echo ""
echo "📌 L'URL del webhook è: $WEBHOOK_URL"
echo "📌 Ngrok deve rimanere attivo per ricevere messaggi!"
