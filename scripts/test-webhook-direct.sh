#!/bin/bash

echo "🧪 TEST DIRETTO DEL WEBHOOK"
echo "============================"
echo ""

# Test 1: Invio messaggio al webhook locale
echo "1️⃣ Test webhook locale (senza ngrok):"
echo "--------------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "68C67956807C8",
    "data": {
      "event": "messages.upsert",
      "data": {
        "messages": [
          {
            "key": {
              "remoteJid": "393331234567@s.whatsapp.net",
              "fromMe": false,
              "id": "TEST_'$(date +%s)'"
            },
            "messageTimestamp": '$(date +%s)',
            "pushName": "Test User",
            "message": {
              "conversation": "Test messaggio diretto webhook"
            }
          }
        ],
        "type": "notify"
      }
    }
  }')

echo "Risposta: $RESPONSE"
echo ""

# Test 2: Verifica se è stato salvato
echo "2️⃣ Verifica salvataggio nel database:"
echo "--------------------------------------"
DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

sleep 2  # Aspetta che venga salvato

psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    message,
    direction,
    \"createdAt\"
FROM \"WhatsAppMessage\"
WHERE message LIKE '%Test messaggio%'
ORDER BY \"createdAt\" DESC;
" 2>/dev/null

echo ""
echo "3️⃣ Controlla i log del backend:"
echo "--------------------------------"
echo "Dovresti vedere:"
echo "• 📨 Webhook WhatsApp ricevuto"
echo "• 📩 Messaggio in arrivo rilevato"
echo "• ✅ Messaggio salvato con ID: ..."
echo ""
echo "Se NON vedi questi messaggi, c'è un problema nel codice del webhook."
