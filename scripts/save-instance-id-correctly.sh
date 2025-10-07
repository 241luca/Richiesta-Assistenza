#!/bin/bash

# Salva Instance ID nel posto GIUSTO (ApiKey metadata)
echo "📝 SALVA INSTANCE ID NEL POSTO GIUSTO"
echo "======================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
INSTANCE_ID="68C67956807C8"

echo "Instance ID da salvare: $INSTANCE_ID"
echo ""

# Salva SOLO in ApiKey metadata
echo "Aggiornamento ApiKey metadata..."
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET metadata = jsonb_build_object('instanceId', '$INSTANCE_ID'),
    \"updatedAt\" = NOW()
WHERE service = 'WHATSAPP' AND \"isActive\" = true;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Instance ID salvato in ApiKey metadata"
else
    echo "❌ Errore salvataggio"
fi

echo ""
echo "Verifica:"
psql "$DB_URL" -c "SELECT service, metadata FROM \"ApiKey\" WHERE service='WHATSAPP';" 2>/dev/null

echo ""
echo "✅ Fatto. L'Instance ID è SOLO in ApiKey metadata."
echo "   Niente hardcoded, niente duplicati, niente casino."
