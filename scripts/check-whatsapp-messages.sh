#!/bin/bash

# Script per verificare i messaggi WhatsApp nel database
# Usage: ./check-whatsapp-messages.sh

echo "📱 Verifica Messaggi WhatsApp nel Database"
echo "==========================================="
echo ""

# Connessione al database
DB_URL=$(grep DATABASE_URL backend/.env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL non trovato in backend/.env"
    exit 1
fi

echo "📊 Ultimi 5 messaggi ricevuti:"
echo "-------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\" as \"Numero\",
    LEFT(\"message\", 50) as \"Messaggio\",
    \"type\" as \"Tipo\",
    \"status\" as \"Stato\",
    \"receivedAt\" as \"Ricevuto alle\"
FROM \"WhatsAppMessage\"
WHERE \"direction\" = 'inbound'
ORDER BY \"createdAt\" DESC
LIMIT 5;
" 2>/dev/null || echo "Nessun messaggio trovato o errore database"

echo ""
echo "🔌 Stato Connessione WhatsApp:"
echo "-------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"key\" as \"Configurazione\",
    \"value\" as \"Valore\",
    \"updatedAt\" as \"Ultimo aggiornamento\"
FROM \"SystemConfiguration\"
WHERE \"key\" LIKE 'whatsapp%'
ORDER BY \"key\";
" 2>/dev/null || echo "Configurazione non trovata"

echo ""
echo "📈 Statistiche:"
echo "---------------"
psql "$DB_URL" -c "
SELECT 
    COUNT(*) as \"Totale Messaggi\",
    COUNT(CASE WHEN \"direction\" = 'inbound' THEN 1 END) as \"Ricevuti\",
    COUNT(CASE WHEN \"direction\" = 'outbound' THEN 1 END) as \"Inviati\",
    COUNT(CASE WHEN \"status\" = 'delivered' THEN 1 END) as \"Consegnati\",
    COUNT(CASE WHEN \"status\" = 'read' THEN 1 END) as \"Letti\"
FROM \"WhatsAppMessage\";
" 2>/dev/null || echo "Nessuna statistica disponibile"

echo ""
echo "🕐 Ultimo messaggio ricevuto:"
echo "------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\" as \"Da\",
    \"message\" as \"Messaggio\",
    \"receivedAt\" as \"Ricevuto alle\",
    \"createdAt\" as \"Salvato alle\"
FROM \"WhatsAppMessage\"
WHERE \"direction\" = 'inbound'
ORDER BY \"createdAt\" DESC
LIMIT 1;
" 2>/dev/null || echo "Nessun messaggio"

echo ""
echo "✅ Verifica completata!"
