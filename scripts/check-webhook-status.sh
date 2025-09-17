#!/bin/bash

echo "🔍 VERIFICA WEBHOOK E MESSAGGI"
echo "==============================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ Verifica configurazione webhook nel database:"
echo "-------------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    service,
    permissions->>'webhookUrl' as webhook_url,
    permissions->>'instanceId' as instance_id,
    \"isActive\"
FROM \"ApiKey\" 
WHERE service = 'whatsapp';
" 2>/dev/null

echo ""
echo "2️⃣ Controlla se ci sono messaggi salvati:"
echo "------------------------------------------"
MESSAGES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')
echo "Messaggi totali nel database: $MESSAGES"

echo ""
echo "3️⃣ Ultimi 5 messaggi (se presenti):"
echo "------------------------------------"
psql "$DB_URL" -c "
SELECT 
    \"phoneNumber\",
    LEFT(message, 50) as message,
    direction,
    \"createdAt\"
FROM \"WhatsAppMessage\"
ORDER BY \"createdAt\" DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "4️⃣ Test webhook diretto:"
echo "------------------------"
echo "Invio un webhook di test al tuo server..."

# Webhook di test
curl -X POST https://057cb876802e.ngrok-free.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "message",
    "message_type": "text",
    "from": "393331234567",
    "message": "Test webhook diretto",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "instance_id": "68C67956807C8"
  }'

echo ""
echo ""
echo "5️⃣ POSSIBILI PROBLEMI:"
echo "----------------------"
echo "• SendApp potrebbe non reinviare messaggi vecchi"
echo "• Il webhook potrebbe non essere attivo su SendApp"
echo "• Potrebbe esserci un filtro temporale"
echo ""
echo "PROVA:"
echo "1. Invia un NUOVO messaggio WhatsApp ORA"
echo "2. Guarda se appare nei log del backend"
echo "3. Se non funziona, potremmo dover debuggare il webhook"
