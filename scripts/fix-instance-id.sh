#!/bin/bash

# Script per sistemare l'Instance ID di WhatsApp
echo "🔧 FIX INSTANCE ID WHATSAPP"
echo "============================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

# L'Instance ID che vediamo nella pagina
INSTANCE_ID="68C67956807C8"

echo "📝 Instance ID da configurare: $INSTANCE_ID"
echo ""

# 1. Salva in SystemConfiguration (dove lo cerca il polling)
echo "1️⃣ Salvataggio in SystemConfiguration..."
psql "$DB_URL" -c "
INSERT INTO \"SystemConfiguration\" (key, value, description, \"createdAt\", \"updatedAt\")
VALUES ('whatsapp_instance_id', '$INSTANCE_ID', 'WhatsApp Instance ID', NOW(), NOW())
ON CONFLICT (key) 
DO UPDATE SET value = '$INSTANCE_ID', \"updatedAt\" = NOW();
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Salvato in SystemConfiguration"
else
    echo "❌ Errore salvataggio in SystemConfiguration"
fi

# 2. Aggiorna anche metadata in ApiKey per consistenza
echo ""
echo "2️⃣ Aggiornamento metadata in ApiKey..."
psql "$DB_URL" -c "
UPDATE \"ApiKey\" 
SET metadata = jsonb_build_object('instanceId', '$INSTANCE_ID')
WHERE service = 'WHATSAPP' AND \"isActive\" = true;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Aggiornato metadata in ApiKey"
else
    echo "❌ Errore aggiornamento ApiKey"
fi

echo ""
echo "3️⃣ Verifica finale:"
echo "------------------"
echo "SystemConfiguration:"
psql "$DB_URL" -c "SELECT value FROM \"SystemConfiguration\" WHERE key='whatsapp_instance_id';" 2>/dev/null

echo ""
echo "ApiKey metadata:"
psql "$DB_URL" -c "SELECT metadata FROM \"ApiKey\" WHERE service='WHATSAPP' AND \"isActive\"=true;" 2>/dev/null

echo ""
echo "✅ Fix completato! L'avviso 'Instance ID non trovato' dovrebbe sparire."
echo ""
echo "🔄 Ora vai su http://localhost:5193/admin/whatsapp"
echo "   Tab 'Ricezione' → Clicca 'Avvia Controllo Automatico'"
echo "   Non dovrebbe più dare l'errore!"
