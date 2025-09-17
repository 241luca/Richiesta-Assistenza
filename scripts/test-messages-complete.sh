#!/bin/bash

echo "🔍 VERIFICA COMPLETA MESSAGGI WHATSAPP"
echo "======================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ CONTROLLO DATABASE:"
echo "----------------------"
COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')
echo "Messaggi totali nel database: $COUNT"

if [ "$COUNT" -gt 0 ]; then
    echo ""
    echo "2️⃣ ULTIMI MESSAGGI:"
    echo "-------------------"
    psql "$DB_URL" -c "
    SELECT 
        \"phoneNumber\" as numero,
        message as messaggio,
        direction as direzione,
        \"createdAt\" as data
    FROM \"WhatsAppMessage\"
    ORDER BY \"createdAt\" DESC
    LIMIT 5;
    " 2>/dev/null
else
    echo "❌ Nessun messaggio nel database"
fi

echo ""
echo "3️⃣ TEST INVIO NUOVO MESSAGGIO:"
echo "-------------------------------"
echo "Invia ORA un messaggio WhatsApp al numero connesso"
echo "Poi controlla:"
echo "• Nel pannello ngrok (http://127.0.0.1:4040) - dovrebbe arrivare una richiesta"
echo "• Nei log del backend - dovrebbe dire 'Messaggio salvato'"
echo "• Ricarica la pagina e clicca 'Aggiorna' nel tab Messaggi"

echo ""
echo "4️⃣ SE ANCORA NON FUNZIONA:"
echo "--------------------------"
echo "Proviamo a inserire un messaggio di test direttamente:"
read -p "Vuoi inserire un messaggio di test? (s/n): " RISPOSTA

if [ "$RISPOSTA" = "s" ]; then
    psql "$DB_URL" -c "
    INSERT INTO \"WhatsAppMessage\" (
        id,
        \"phoneNumber\",
        message,
        type,
        status,
        direction,
        \"createdAt\",
        \"updatedAt\"
    ) VALUES (
        'test_$(date +%s)',
        '393331234567',
        'Messaggio di test inserito manualmente',
        'text',
        'received',
        'inbound',
        NOW(),
        NOW()
    );
    " 2>/dev/null
    
    echo "✅ Messaggio di test inserito!"
    echo "Ricarica la pagina e clicca 'Aggiorna' per vederlo"
fi
