#!/bin/bash

echo "🔧 FIX DEFINITIVO WHATSAPP"
echo "=========================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
INSTANCE_ID="68C67956807C8"

# Prima vediamo cosa c'è
echo "1️⃣ Stato attuale ApiKey:"
psql "$DB_URL" -c "SELECT service, LEFT(key, 20) || '...' as token FROM \"ApiKey\" WHERE LOWER(service) = 'whatsapp';" 2>/dev/null

echo ""
echo "2️⃣ Aggiorno/Creo riga con service='whatsapp' minuscolo:"

# Se esiste con MAIUSCOLO, aggiorna a minuscolo
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET service = 'whatsapp',
    permissions = jsonb_build_object(
        'enabled', true,
        'baseURL', 'https://app.sendapp.cloud/api',
        'instanceId', '$INSTANCE_ID',
        'webhookUrl', 'http://localhost:3200/api/whatsapp/webhook'
    ),
    \"updatedAt\" = NOW()
WHERE LOWER(service) = 'whatsapp';
" 2>/dev/null

UPDATED=$?

# Se non esiste, creala
if [ $UPDATED -ne 0 ]; then
    echo "Non esisteva, la creo..."
    psql "$DB_URL" -c "
    INSERT INTO \"ApiKey\" (
        id,
        key,
        name,
        service,
        permissions,
        \"isActive\",
        \"createdAt\",
        \"updatedAt\"
    ) VALUES (
        'whatsapp_' || gen_random_uuid(),
        'IL_TUO_TOKEN_SENDAPP',
        'WhatsApp Integration',
        'whatsapp',
        jsonb_build_object(
            'enabled', true,
            'baseURL', 'https://app.sendapp.cloud/api',
            'instanceId', '$INSTANCE_ID',
            'webhookUrl', 'http://localhost:3200/api/whatsapp/webhook'
        ),
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (service) DO UPDATE 
    SET permissions = EXCLUDED.permissions,
        \"updatedAt\" = NOW();
    " 2>/dev/null
fi

echo ""
echo "3️⃣ Verifica finale:"
psql "$DB_URL" -c "
SELECT 
    service,
    LEFT(key, 30) || '...' as token,
    (permissions->>'instanceId') as instance_id,
    \"isActive\"
FROM \"ApiKey\" 
WHERE service = 'whatsapp';
" 2>/dev/null

echo ""
echo "✅ Sistema fixato:"
echo "   - service = 'whatsapp' (minuscolo come cerca il codice)"
echo "   - Instance ID = $INSTANCE_ID in permissions"
echo "   - Tutto al posto giusto!"
