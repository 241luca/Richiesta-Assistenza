#!/bin/bash

# Test diretto dell'API SendApp

echo "🔧 Test diretto API SendApp..."
echo "---"

# Parametri
ACCESS_TOKEN="68c575f3c2ff1"
INSTANCE_ID="68C67956807C8"
PHONE_NUMBER="393420035610"  # Senza il +
MESSAGE="Test messaggio diretto da script"

echo "📱 Invio messaggio a: +$PHONE_NUMBER"
echo "📝 Messaggio: $MESSAGE"
echo "🔑 Token: $ACCESS_TOKEN"
echo "🆔 Instance ID: $INSTANCE_ID"
echo "---"

# Chiamata API SendApp con POST
curl -X POST "https://app.sendapp.cloud/api/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"type\": \"text\",
    \"message\": \"$MESSAGE\",
    \"instance_id\": \"$INSTANCE_ID\",
    \"access_token\": \"$ACCESS_TOKEN\"
  }"

echo ""
echo "---"
echo "✅ Test completato"
