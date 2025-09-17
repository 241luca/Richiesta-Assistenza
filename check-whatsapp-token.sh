#!/bin/bash

# Verifica il token WhatsApp nel database

cd backend

# Query per verificare il token
npx prisma db execute --file /dev/stdin --schema ./prisma/schema.prisma << 'EOF'
SELECT service, key, permissions, "isActive" 
FROM "ApiKey" 
WHERE service = 'whatsapp';
EOF

echo "---"
echo "Se il token è corretto dovrebbe essere: 68c575f3c2ff1"
echo "E l'instanceId dovrebbe essere: 68C67956807C8"
