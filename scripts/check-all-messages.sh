#!/bin/bash

echo "📱 CONTROLLO DIRETTO DATABASE MESSAGGI"
echo "======================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "TUTTI I MESSAGGI SALVATI:"
echo "-------------------------"
psql "$DB_URL" -c "
SELECT 
    id,
    \"phoneNumber\" as telefono,
    message as messaggio,
    direction as direzione,
    status as stato,
    \"createdAt\" as data_ora
FROM \"WhatsAppMessage\"
ORDER BY \"createdAt\" DESC;
" 2>/dev/null

COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')

echo ""
echo "📊 TOTALE MESSAGGI NEL DATABASE: $COUNT"
echo ""

if [ "$COUNT" -gt 0 ]; then
    echo "✅ CI SONO MESSAGGI NEL DATABASE!"
    echo "   Se non li vedi nell'interfaccia, potrebbe essere un problema del frontend."
else
    echo "❌ NESSUN MESSAGGIO NEL DATABASE"
    echo "   Invia un messaggio WhatsApp ora per testare"
fi
