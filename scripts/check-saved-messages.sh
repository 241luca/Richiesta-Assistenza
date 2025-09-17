#!/bin/bash

echo "✅ WEBHOOK FUNZIONA! Verifichiamo i messaggi salvati"
echo "===================================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ Conta messaggi nel database:"
echo "--------------------------------"
COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')
echo "Totale messaggi salvati: $COUNT"

echo ""
echo "2️⃣ Ultimi 10 messaggi ricevuti:"
echo "--------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    LEFT(message, 60) as message,
    direction,
    status,
    \"createdAt\"
FROM \"WhatsAppMessage\"
ORDER BY \"createdAt\" DESC
LIMIT 10;
" 2>/dev/null

echo ""
echo "3️⃣ Messaggi ricevuti negli ultimi 5 minuti:"
echo "--------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    message,
    \"createdAt\"
FROM \"WhatsAppMessage\"
WHERE \"createdAt\" > NOW() - INTERVAL '5 minutes'
ORDER BY \"createdAt\" DESC;
" 2>/dev/null

echo ""
echo "4️⃣ Controlla un messaggio in dettaglio:"
echo "----------------------------------------"
psql "$DB_URL" -c "
SELECT 
    id,
    \"phoneNumber\",
    message,
    type,
    status,
    direction,
    metadata
FROM \"WhatsAppMessage\"
ORDER BY \"createdAt\" DESC
LIMIT 1;
" 2>/dev/null

echo ""
echo "📌 SE NON VEDI MESSAGGI:"
echo "------------------------"
echo "Potrebbe essere che SendApp manda un formato diverso."
echo "Guardiamo cosa arriva esattamente nel webhook..."
