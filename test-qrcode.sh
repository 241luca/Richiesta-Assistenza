#!/bin/bash

# Test QR Code Generation
echo "🔧 Testing WhatsApp QR Code generation..."

# Ottieni il token dal database
TOKEN=$(cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsx -e "
const { prisma } = require('./src/config/database');
async function getToken() {
  const config = await prisma.apiKey.findUnique({
    where: { service: 'whatsapp' }
  });
  if (config) {
    console.log(config.key);
  }
}
getToken();
" 2>/dev/null)

# Ottieni l'instance ID
INSTANCE_ID=$(cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsx -e "
const { prisma } = require('./src/config/database');
async function getInstanceId() {
  const config = await prisma.apiKey.findUnique({
    where: { service: 'whatsapp' }
  });
  if (config && config.permissions) {
    const perms = config.permissions;
    console.log(perms.instanceId || '');
  }
}
getInstanceId();
" 2>/dev/null)

echo "Token: $TOKEN"
echo "Instance ID: $INSTANCE_ID"

if [ -z "$TOKEN" ] || [ -z "$INSTANCE_ID" ]; then
  echo "❌ Missing token or instance ID"
  exit 1
fi

# Chiama l'API SendApp direttamente
echo ""
echo "📡 Calling SendApp API..."
curl -s "https://app.sendapp.cloud/api/get_qrcode?instance_id=$INSTANCE_ID&access_token=$TOKEN" | head -100

echo ""
echo "✅ Test completed"
