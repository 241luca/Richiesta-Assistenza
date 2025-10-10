#!/bin/bash

echo "🔧 CONFIGURAZIONE WEBHOOK EVOLUTION API"
echo "======================================="

# Configurazione
API_URL="http://37.27.89.35:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"

# Determina l'URL del webhook
# Se sei in locale, usa ngrok o il tuo IP pubblico
# Altrimenti usa l'URL del tuo server
WEBHOOK_URL="http://37.27.89.35:3200/api/whatsapp/webhook"  # CAMBIA CON IL TUO URL!

echo "📍 Configurazione:"
echo "  API URL: $API_URL"
echo "  Instance: $INSTANCE"
echo "  Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Verifica webhook attuale
echo "1️⃣ Verifica webhook attuale..."
CURRENT=$(curl -s -X GET "$API_URL/webhook/find/$INSTANCE" \
  -H "apikey: $API_KEY")

echo "Webhook attuale:"
echo "$CURRENT" | python3 -m json.tool 2>/dev/null || echo "$CURRENT"
echo ""

# 2. Configura nuovo webhook
echo "2️⃣ Configurazione nuovo webhook..."
RESPONSE=$(curl -s -X POST "$API_URL/webhook/set/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"enabled\": true,
    \"url\": \"$WEBHOOK_URL\",
    \"webhookByEvents\": true,
    \"webhookBase64\": true,
    \"events\": [
      \"APPLICATION_STARTUP\",
      \"MESSAGES_UPSERT\",
      \"MESSAGES_UPDATE\",
      \"MESSAGES_DELETE\",
      \"CONNECTION_UPDATE\",
      \"QRCODE_UPDATED\",
      \"GROUP_UPDATE\",
      \"GROUP_PARTICIPANTS_UPDATE\",
      \"PRESENCE_UPDATE\"
    ]
  }")

echo "Risposta:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 3. Verifica configurazione
echo "3️⃣ Verifica configurazione finale..."
FINAL=$(curl -s -X GET "$API_URL/webhook/find/$INSTANCE" \
  -H "apikey: $API_KEY")

echo "Configurazione finale:"
echo "$FINAL" | python3 -m json.tool 2>/dev/null || echo "$FINAL"
echo ""

# 4. Test invio webhook manuale
echo "4️⃣ Test webhook con messaggio di prova..."
TEST_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instance": "assistenza",
    "data": {
      "messages": [{
        "key": {
          "remoteJid": "393331234567@s.whatsapp.net",
          "fromMe": false,
          "id": "TEST_'$(date +%s)'"
        },
        "message": {
          "conversation": "Test webhook - '$(date)'"
        },
        "pushName": "Test User",
        "messageTimestamp": "'$(date +%s)'"
      }]
    }
  }' \
  --max-time 5 2>&1)

echo "Test webhook response:"
echo "$TEST_RESPONSE"
echo ""

echo "✅ Configurazione completata!"
echo ""
echo "NOTA: Assicurati che:"
echo "1. Il tuo backend sia raggiungibile dall'esterno"
echo "2. La porta 3200 sia aperta nel firewall"
echo "3. Il backend sia in esecuzione"
echo ""
echo "Se sei in locale, considera l'uso di ngrok:"
echo "  ngrok http 3200"
echo "  Poi usa l'URL di ngrok come webhook"
