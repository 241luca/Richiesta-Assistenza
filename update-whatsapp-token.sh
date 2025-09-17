#!/bin/bash

# Script per aggiornare il token WhatsApp con il nuovo token completo

cd backend

# Aggiorna il token WhatsApp nel database usando Prisma
npx prisma db execute --stdin <<EOF
UPDATE "ApiKey" 
SET key = '68c575f3c2ff1',
    permissions = jsonb_set(
        COALESCE(permissions, '{}')::jsonb,
        '{instanceId}',
        '"68C67956807C8"'
    ),
    "updatedAt" = NOW()
WHERE service = 'whatsapp';
EOF

echo "✅ Token WhatsApp aggiornato con successo!"
echo "Token: 68c575f3c2ff1"
echo "Instance ID: 68C67956807C8"
