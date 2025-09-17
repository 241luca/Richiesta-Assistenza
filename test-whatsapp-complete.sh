#!/bin/bash

echo "====================================="
echo "🚀 TEST COMPLETO SISTEMA WHATSAPP"
echo "====================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verifica Backend
echo "1️⃣ Verificando backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/health)
if [ "$BACKEND_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Backend attivo${NC}"
else
    echo -e "${RED}❌ Backend non risponde${NC}"
    echo "Avvia il backend con: cd backend && npm run dev"
    exit 1
fi

# 2. Test webhook endpoint
echo ""
echo "2️⃣ Test webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint funzionante${NC}"
else
    echo -e "${RED}❌ Webhook non risponde (HTTP $HTTP_CODE)${NC}"
fi

# 3. Simula messaggio WhatsApp
echo ""
echo "3️⃣ Simulando messaggio WhatsApp in arrivo..."
echo ""

TIMESTAMP=$(date +%s)
MESSAGE_ID="TEST_MSG_${TIMESTAMP}"

curl -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"instance_id\": \"68C67956807C8\",
    \"data\": {
        \"event\": \"messages.upsert\",
        \"data\": {
            \"messages\": [
                {
                    \"key\": {
                        \"remoteJid\": \"393333333333@s.whatsapp.net\",
                        \"fromMe\": false,
                        \"id\": \"${MESSAGE_ID}\"
                    },
                    \"messageTimestamp\": ${TIMESTAMP},
                    \"pushName\": \"Test User\",
                    \"broadcast\": false,
                    \"message\": {
                        \"conversation\": \"Test message at $(date) - Verifica salvataggio nel database\"
                    }
                }
            ],
            \"type\": \"notify\"
        }
    }
}" > /dev/null 2>&1

echo -e "${GREEN}✅ Messaggio di test inviato${NC}"

# 4. Attendi processamento
echo ""
echo "⏳ Attendo 3 secondi per il processamento..."
sleep 3

# 5. Verifica nel database usando l'API
echo ""
echo "4️⃣ Verificando salvataggio tramite API..."
echo ""

# Ottieni token di autenticazione (se necessario)
# Per ora assumiamo che tu sia già autenticato

API_RESPONSE=$(curl -s -X GET "http://localhost:3200/api/whatsapp/messages?phoneNumber=393333333333&limit=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" 2>/dev/null)

if echo "$API_RESPONSE" | grep -q "393333333333"; then
    echo -e "${GREEN}✅ Messaggio trovato nell'API${NC}"
    echo ""
    echo "Ultimo messaggio salvato:"
    echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo -e "${YELLOW}⚠️ Messaggio non trovato nell'API (potrebbe richiedere autenticazione)${NC}"
fi

# 6. Test notifiche admin
echo ""
echo "5️⃣ Verificando notifiche admin..."
ADMIN_COUNT=$(curl -s http://localhost:3200/api/notifications/unread \
  -H "Authorization: Bearer ${AUTH_TOKEN}" 2>/dev/null | grep -c "WHATSAPP_MESSAGE" || echo "0")

if [ "$ADMIN_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Notifiche admin create${NC}"
else
    echo -e "${YELLOW}⚠️ Nessuna notifica trovata (verifica autenticazione)${NC}"
fi

# 7. Verifica logs
echo ""
echo "6️⃣ Ultimi log WhatsApp dal backend:"
echo "--------------------------------"

# Cerca nei log dell'applicazione
if [ -f "/Users/lucamambelli/Desktop/Richiesta-Assistenza/logs/application.log" ]; then
    tail -n 100 /Users/lucamambelli/Desktop/Richiesta-Assistenza/logs/application.log 2>/dev/null | grep -i "whatsapp\|webhook" | tail -5
else
    echo "File log non trovato"
fi

# 8. Test invio messaggio
echo ""
echo "7️⃣ Test invio messaggio WhatsApp..."
echo ""

SEND_RESPONSE=$(curl -s -X POST http://localhost:3200/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "phoneNumber": "393333333333",
    "message": "Test invio messaggio da dashboard"
  }' 2>/dev/null)

if echo "$SEND_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test invio completato${NC}"
else
    echo -e "${YELLOW}⚠️ Test invio richiede autenticazione o configurazione${NC}"
fi

# Riepilogo
echo ""
echo "====================================="
echo "📊 RIEPILOGO TEST"
echo "====================================="
echo ""
echo "Per verificare completamente il sistema:"
echo ""
echo "1. Accedi all'admin panel: http://localhost:5193"
echo "2. Vai su: WhatsApp Dashboard (nel menu laterale)"
echo "3. Dovresti vedere i messaggi di test"
echo ""
echo "Per testare con un vero messaggio WhatsApp:"
echo "1. Assicurati che ngrok sia attivo"
echo "2. Invia un messaggio al numero WhatsApp configurato"
echo "3. Il messaggio apparirà nella dashboard"
echo ""
echo "Database UI:"
echo "cd backend && npx prisma studio"
echo "Poi guarda la tabella WhatsAppMessage"
echo ""
echo -e "${GREEN}✅ Test completato!${NC}"
