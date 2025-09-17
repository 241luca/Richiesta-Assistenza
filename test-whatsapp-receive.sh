#!/bin/bash

echo "📱 Test ricezione messaggi WhatsApp"
echo "===================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Verifica che il webhook sia raggiungibile
echo "1️⃣ Test webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Webhook raggiungibile${NC}"
else
    echo -e "${RED}❌ Webhook non raggiungibile${NC}"
    exit 1
fi

echo ""
echo "2️⃣ Simulazione messaggio WhatsApp in arrivo..."
echo ""

# Simula un messaggio di testo normale
curl -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "68C67956807C8",
    "data": {
        "event": "messages.upsert",
        "data": {
            "messages": [
                {
                    "key": {
                        "remoteJid": "393333333333@s.whatsapp.net",
                        "fromMe": false,
                        "id": "TEST_MESSAGE_001"
                    },
                    "messageTimestamp": 1757883610,
                    "pushName": "Test User",
                    "broadcast": false,
                    "message": {
                        "conversation": "Questo è un messaggio di test per verificare la ricezione"
                    }
                }
            ],
            "type": "notify"
        }
    }
}'

echo ""
echo -e "${GREEN}✅ Messaggio di test inviato al webhook${NC}"
echo ""

# Attendi 2 secondi per il processamento
sleep 2

echo "3️⃣ Verifica nel database..."
echo ""

# Query per verificare il messaggio salvato
psql $DATABASE_URL -c "
SELECT 
    id,
    \"phoneNumber\",
    message,
    type,
    status,
    direction,
    \"createdAt\"
FROM \"WhatsAppMessage\"
WHERE \"phoneNumber\" = '393333333333'
ORDER BY \"createdAt\" DESC
LIMIT 1;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Query database eseguita${NC}"
else
    echo -e "${RED}⚠️ Impossibile verificare nel database (controlla DATABASE_URL)${NC}"
fi

echo ""
echo "4️⃣ Controlla i log del backend per vedere il processamento..."
echo ""
echo "Ultimi log relativi a WhatsApp:"
echo "--------------------------------"
tail -n 50 /Users/lucamambelli/Desktop/Richiesta-Assistenza/logs/application.log 2>/dev/null | grep -i "whatsapp" | tail -n 10

echo ""
echo "======================================"
echo "📱 Test completato!"
echo ""
echo "Se vedi il messaggio nel database, la ricezione funziona! ✅"
echo "Altrimenti controlla i log del backend per errori."
