#!/bin/bash

# Script per PULIRE la merda e tenere Instance ID SOLO in ApiKey
echo "🧹 PULIZIA INSTANCE ID DUPLICATI"
echo "================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ RIMUOVO Instance ID da SystemConfiguration (NON DEVE STARE QUI):"
psql "$DB_URL" -c "DELETE FROM \"SystemConfiguration\" WHERE key='whatsapp_instance_id';" 2>/dev/null
echo "✅ Rimosso da SystemConfiguration"

echo ""
echo "2️⃣ RIMUOVO altre config WhatsApp duplicate:"
psql "$DB_URL" -c "DELETE FROM \"SystemConfiguration\" WHERE key LIKE '%whatsapp%' AND key != 'whatsapp_polling_config';" 2>/dev/null
echo "✅ Rimosse config duplicate"

echo ""
echo "3️⃣ L'UNICO posto dove deve stare è ApiKey:"
psql "$DB_URL" -c "SELECT service, key, metadata FROM \"ApiKey\" WHERE service='WHATSAPP';" 2>/dev/null

echo ""
echo "✅ PULIZIA COMPLETATA"
echo ""
echo "L'Instance ID deve stare SOLO nella tabella ApiKey."
echo "Il codice deve leggerlo SOLO da lì."
