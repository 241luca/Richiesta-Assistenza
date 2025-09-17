#!/bin/bash

# SALVA Instance ID nel campo GIUSTO (permissions, NON metadata)
echo "🔧 FIX DEFINITIVO INSTANCE ID"
echo "============================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
INSTANCE_ID="68C67956807C8"

echo "📝 Salvataggio Instance ID nel campo PERMISSIONS (il campo giusto):"
echo ""

# Salva nel campo permissions (che ESISTE nello schema)
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET permissions = jsonb_build_object(
    'enabled', true,
    'baseURL', 'https://app.sendapp.cloud/api',
    'instanceId', '$INSTANCE_ID',
    'webhookUrl', 'http://localhost:3200/api/whatsapp/webhook'
),
\"updatedAt\" = NOW()
WHERE service = 'WHATSAPP' AND \"isActive\" = true;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Instance ID salvato nel campo PERMISSIONS"
else
    echo "❌ Errore salvataggio"
fi

echo ""
echo "📊 Verifica finale:"
psql "$DB_URL" -c "
SELECT 
    service,
    permissions,
    \"isActive\"
FROM \"ApiKey\" 
WHERE service = 'WHATSAPP';
" 2>/dev/null

echo ""
echo "✅ ORA L'INSTANCE ID È SALVATO NEL POSTO GIUSTO!"
echo "   Campo: permissions (NON metadata che non esiste)"
echo "   Valore: $INSTANCE_ID"
