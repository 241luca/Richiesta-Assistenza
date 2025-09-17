#!/bin/bash

# Script per aggiornare il token WhatsApp nel database

cd backend

# Crea un file SQL temporaneo
cat > update_whatsapp.sql << 'EOF'
UPDATE "ApiKey" 
SET key = '68c575f3c2ff1',
    permissions = jsonb_set(
        COALESCE(permissions, '{}')::jsonb,
        '{instanceId}',
        '"68C67956807C8"'
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE service = 'whatsapp';
EOF

# Esegui il comando SQL usando Prisma
npx prisma db execute --file ./update_whatsapp.sql --schema ./prisma/schema.prisma

# Rimuovi il file temporaneo
rm update_whatsapp.sql

echo "✅ Token WhatsApp aggiornato con successo!"
echo "Token: 68c575f3c2ff1"
echo "Instance ID: 68C67956807C8"
