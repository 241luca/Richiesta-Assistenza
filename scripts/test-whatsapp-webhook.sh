#!/bin/bash

# Script per testare il webhook WhatsApp localmente
# Usage: ./test-whatsapp-webhook.sh

echo "🔧 Test Webhook WhatsApp"
echo "========================"

# URL del webhook locale
WEBHOOK_URL="http://localhost:3200/api/whatsapp/webhook"

echo ""
echo "📨 Test 1: Messaggio in arrivo"
echo "-------------------------------"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "message",
    "message_type": "text",
    "from": "393331234567",
    "to": "393339876543",
    "message": "Ciao! Ho bisogno di assistenza",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "message_id": "MSG_'$(date +%s)'",
    "pushname": "Mario Rossi",
    "instance_id": "68C67956807C8"
  }'

echo ""
echo ""
echo "📊 Test 2: Stato messaggio (delivered)"
echo "---------------------------------------"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "status",
    "status": "delivered",
    "status_timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "message_id": "MSG_TEST_123",
    "from": "393339876543",
    "to": "393331234567"
  }'

echo ""
echo ""
echo "🔌 Test 3: Stato connessione"
echo "-----------------------------"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "connection",
    "connection_status": "connected",
    "battery_level": 85,
    "instance_id": "68C67956807C8"
  }'

echo ""
echo ""
echo "📷 Test 4: Messaggio con media"
echo "-------------------------------"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "message",
    "message_type": "image",
    "from": "393331234567",
    "message": "Ecco la foto del problema",
    "media_url": "https://example.com/image.jpg",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "message_id": "MSG_IMG_'$(date +%s)'",
    "pushname": "Mario Rossi"
  }'

echo ""
echo ""
echo "✅ Test completati!"
echo ""
echo "📋 Verifica i log del backend per vedere i messaggi ricevuti"
echo "   tail -f backend/logs/app.log"
