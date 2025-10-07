#!/bin/bash

# CREA la riga WhatsApp in ApiKey se non esiste
echo "🔧 CREAZIONE ENTRY WHATSAPP IN APIKEY"
echo "======================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
INSTANCE_ID="68C67956807C8"

# Prima verifica se esiste
echo "1️⃣ Verifica se esiste già:"
EXISTING=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"ApiKey\" WHERE service='WHATSAPP';" 2>/dev/null | tr -d ' ')

if [ "$EXISTING" = "0" ] || [ -z "$EXISTING" ]; then
    echo "❌ Non esiste nessuna riga WhatsApp in ApiKey"
    echo ""
    echo "2️⃣ Creazione nuova riga WhatsApp:"
    
    # Recupera il token se esiste da qualche parte
    TOKEN=$(psql "$DB_URL" -t -c "SELECT value FROM \"SystemConfiguration\" WHERE key LIKE '%whatsapp%token%' LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    if [ -z "$TOKEN" ]; then
        TOKEN="IL_TUO_TOKEN_SENDAPP"  # Placeholder
    fi
    
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
        gen_random_uuid(),
        '$TOKEN',
        'WhatsApp API',
        'WHATSAPP',
        jsonb_build_object(
            'enabled', true,
            'baseURL', 'https://app.sendapp.cloud/api',
            'instanceId', '$INSTANCE_ID',
            'webhookUrl', 'http://localhost:3200/api/whatsapp/webhook'
        ),
        true,
        NOW(),
        NOW()
    );
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Riga WhatsApp creata con successo!"
    else
        echo "❌ Errore nella creazione"
    fi
else
    echo "✅ Esiste già una riga WhatsApp"
    echo ""
    echo "2️⃣ Aggiornamento permissions con Instance ID:"
    
    psql "$DB_URL" -c "
    UPDATE \"ApiKey\" 
    SET permissions = jsonb_build_object(
        'enabled', true,
        'baseURL', 'https://app.sendapp.cloud/api',
        'instanceId', '$INSTANCE_ID',
        'webhookUrl', 'http://localhost:3200/api/whatsapp/webhook'
    ),
    \"updatedAt\" = NOW()
    WHERE service = 'WHATSAPP';
    " 2>/dev/null
    
    echo "✅ Permissions aggiornate"
fi

echo ""
echo "3️⃣ VERIFICA FINALE:"
echo "------------------"
psql "$DB_URL" -c "
SELECT 
    service,
    LEFT(key, 20) || '...' as token_preview,
    permissions,
    \"isActive\"
FROM \"ApiKey\" 
WHERE service = 'WHATSAPP';
" 2>/dev/null

echo ""
echo "✅ Ora l'Instance ID dovrebbe essere salvato correttamente!"
echo "   Vai su http://localhost:5193/admin/whatsapp e prova il polling"
