#!/bin/bash

echo "🔍 CONTROLLO COMPLETO INSTANCE ID IN API KEYS"
echo "=============================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ CONTROLLO NEL DATABASE - Tabella ApiKey:"
echo "--------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    id,
    service, 
    key AS token,
    metadata,
    \"isActive\",
    \"createdAt\"
FROM \"ApiKey\" 
WHERE service = 'WHATSAPP';
" 2>/dev/null

echo ""
echo "2️⃣ CONTROLLO SPECIFICO DEL METADATA:"
echo "-------------------------------------"
METADATA=$(psql "$DB_URL" -t -c "SELECT metadata FROM \"ApiKey\" WHERE service='WHATSAPP' AND \"isActive\"=true;" 2>/dev/null)
echo "Metadata raw: $METADATA"

if [ -z "$METADATA" ] || [ "$METADATA" = "" ]; then
    echo "❌ METADATA È NULL O VUOTO"
else
    echo "✅ Metadata presente"
    # Prova a estrarre instanceId
    INSTANCE_ID=$(echo "$METADATA" | python3 -c "import sys, json; data = json.load(sys.stdin) if sys.stdin.read().strip() else {}; print(data.get('instanceId', 'NON PRESENTE'))" 2>/dev/null)
    echo "Instance ID nel metadata: $INSTANCE_ID"
fi

echo ""
echo "3️⃣ CONTROLLO TIPO COLONNA METADATA:"
echo "------------------------------------"
psql "$DB_URL" -c "
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ApiKey' 
AND column_name = 'metadata';
" 2>/dev/null

echo ""
echo "📊 RISULTATO FINALE:"
echo "-------------------"
if echo "$METADATA" | grep -q "instanceId"; then
    echo "✅ Instance ID ESISTE nel metadata di ApiKey"
else
    echo "❌ Instance ID NON ESISTE nel metadata di ApiKey"
    echo "   Il metadata è: $METADATA"
fi
