#!/bin/bash
# Script per generare QR code da Evolution API
# Da eseguire sul VPS

API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
API_URL="http://localhost:8080"

echo "=== Evolution API QR Generator ==="

# 1. Prima elimina l'istanza esistente
echo "1. Eliminando istanza esistente..."
curl -X DELETE "$API_URL/instance/delete/$INSTANCE" \
  -H "apikey: $API_KEY" 2>/dev/null

sleep 2

# 2. Crea nuova istanza con tutti i parametri
echo "2. Creando nuova istanza..."
RESPONSE=$(curl -X POST "$API_URL/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "'$INSTANCE'",
    "token": "'$API_KEY'",
    "qrcode": true,
    "number": "",
    "businessId": "",
    "webhookUrl": "http://localhost:3201/api/whatsapp/webhook/'$INSTANCE'",
    "webhookByEvents": false,
    "webhookBase64": true,
    "webhookHeaders": {},
    "events": [
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONTACTS_SET",
      "CONTACTS_UPSERT",
      "CONTACTS_UPDATE",
      "PRESENCE_UPDATE",
      "CHATS_SET",
      "CHATS_UPSERT",
      "CHATS_UPDATE",
      "CHATS_DELETE",
      "GROUPS_UPSERT",
      "GROUPS_UPDATE",
      "GROUP_PARTICIPANTS_UPDATE",
      "CONNECTION_UPDATE"
    ],
    "rejectCall": false,
    "msgCall": "",
    "groupsIgnore": false,
    "alwaysOnline": false,
    "readMessages": false,
    "readStatus": false,
    "syncFullHistory": false
  }' 2>/dev/null)

echo "Response: $RESPONSE"

# 3. Se non c'è QR nella risposta, prova a ottenerlo
if ! echo "$RESPONSE" | grep -q "qrcode"; then
  echo "3. Tentando di ottenere QR code..."
  
  sleep 2
  
  # Prova connect
  QR_RESPONSE=$(curl "$API_URL/instance/connect/$INSTANCE" \
    -H "apikey: $API_KEY" 2>/dev/null)
  
  echo "QR Response: $QR_RESPONSE"
  
  # Prova anche qrcode endpoint se esiste
  QR_DIRECT=$(curl "$API_URL/instance/qrcode/$INSTANCE" \
    -H "apikey: $API_KEY" 2>/dev/null)
  
  echo "QR Direct: $QR_DIRECT"
  
  # Prova status
  STATUS=$(curl "$API_URL/instance/connectionState/$INSTANCE" \
    -H "apikey: $API_KEY" 2>/dev/null)
  
  echo "Status: $STATUS"
fi

# 4. Controlla webhook
echo "4. Verificando webhook..."
WEBHOOK=$(curl "$API_URL/webhook/find/$INSTANCE" \
  -H "apikey: $API_KEY" 2>/dev/null)

echo "Webhook: $WEBHOOK"

# 5. Lista tutte le istanze
echo "5. Istanze disponibili:"
curl "$API_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" 2>/dev/null | python3 -m json.tool

echo ""
echo "=== Fine ==="
echo "Se il QR non appare, usa il Manager Web: http://37.27.89.35:8080/manager/"
