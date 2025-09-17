#!/bin/bash

echo "🔍 TEST WEBHOOK ATTRAVERSO NGROK"
echo "================================="
echo ""

# Test attraverso ngrok
echo "1️⃣ Test webhook attraverso ngrok:"
echo "----------------------------------"
RESPONSE=$(curl -s -X POST https://057cb876802e.ngrok-free.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "User-Agent: SendApp/1.0" \
  -d '{
    "event_type": "message",
    "message_type": "text",
    "from": "393331234567",
    "message": "Test attraverso ngrok",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "instance_id": "68C67956807C8",
    "pushname": "Test User"
  }')

echo "Risposta:"
echo "$RESPONSE"

echo ""
echo "2️⃣ Se vedi una pagina HTML di ngrok:"
echo "--------------------------------------"
echo "Ngrok potrebbe mostrare una pagina di warning la prima volta."
echo "Soluzioni:"
echo ""
echo "a) Aggiungi header per bypassare il warning:"
curl -s -X POST https://057cb876802e.ngrok-free.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -H "User-Agent: SendApp/1.0" \
  -d '{
    "event_type": "message",
    "message_type": "text",
    "from": "393331234567",
    "message": "Test con skip warning",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "instance_id": "68C67956807C8"
  }'

echo ""
echo "3️⃣ Controlla il pannello di ngrok:"
echo "-----------------------------------"
echo "Apri nel browser: http://127.0.0.1:4040"
echo "Lì puoi vedere:"
echo "• Tutte le richieste ricevute"
echo "• Headers e body"
echo "• Risposte del tuo server"
echo "• Eventuali errori"
