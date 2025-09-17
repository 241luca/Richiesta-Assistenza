#!/bin/bash

echo "📱 VERIFICA MESSAGGI WHATSAPP SALVATI"
echo "======================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ Totale messaggi nel database:"
COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')
echo "Messaggi totali: $COUNT"

echo ""
echo "2️⃣ Ultimi 5 messaggi ricevuti:"
echo "-------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    message,
    direction,
    \"createdAt\"
FROM \"WhatsAppMessage\"
ORDER BY \"createdAt\" DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "3️⃣ Messaggi da Andre (393420035610):"
echo "-------------------------------------"
psql "$DB_URL" -c "
SELECT 
    message,
    \"createdAt\"
FROM \"WhatsAppMessage\"
WHERE \"phoneNumber\" LIKE '%393420035610%'
ORDER BY \"createdAt\" DESC;
" 2>/dev/null

echo ""
echo "✅ Se vedi il messaggio '👍🏻' da Andre, IL SISTEMA FUNZIONA!"
echo ""
echo "📌 Ora vai su http://localhost:5193/admin/whatsapp"
echo "   Tab 'Messaggi' - dovrebbe mostrare tutti i messaggi!"
