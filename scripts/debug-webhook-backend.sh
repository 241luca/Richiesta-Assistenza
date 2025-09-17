#!/bin/bash

echo "🔍 DEBUG WEBHOOK - NGROK RICEVE MA NOI NO"
echo "=========================================="
echo ""

echo "1️⃣ Verifica che il backend stia girando:"
echo "------------------------------------------"
curl -s http://localhost:3200/health | python3 -m json.tool 2>/dev/null || echo "❌ Backend non risponde!"

echo ""
echo "2️⃣ Test diretto del webhook locale (senza ngrok):"
echo "---------------------------------------------------"
echo "Invio webhook di test direttamente a localhost:3200..."

RESPONSE=$(curl -s -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "message",
    "message_type": "text",
    "from": "393331234567",
    "message": "Test diretto senza ngrok",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "instance_id": "68C67956807C8",
    "pushname": "Test User"
  }')

echo "Risposta dal nostro backend:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "3️⃣ Verifica logs del backend:"
echo "------------------------------"
echo "Ultimi log di errore:"
tail -20 /Users/lucamambelli/Desktop/Richiesta-Assistenza/logs/error.log 2>/dev/null || echo "No error log"

echo ""
echo "4️⃣ Verifica che la route sia registrata:"
echo "-----------------------------------------"
curl -s -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{}' -v 2>&1 | grep "< HTTP"

echo ""
echo "5️⃣ POSSIBILI PROBLEMI:"
echo "----------------------"
echo "• Il webhook potrebbe avere bisogno di autenticazione"
echo "• Potrebbe esserci un problema di parsing del body"
echo "• La route potrebbe non essere registrata correttamente"
echo ""
echo "CONTROLLIAMO IL CODICE DEL WEBHOOK..."
