#!/bin/bash

echo "====================================="
echo "🔔 TEST SISTEMA NOTIFICHE WHATSAPP"
echo "====================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verifica backend
echo "1️⃣ Verificando backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/health)
if [ "$BACKEND_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Backend attivo${NC}"
else
    echo -e "${RED}❌ Backend non risponde${NC}"
    echo "Avvia il backend con: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Simulando messaggio WhatsApp da NUOVO numero..."
echo ""

# Genera dati casuali per il test
RANDOM_NUM=$((RANDOM % 10000))
PHONE_NUMBER="39333${RANDOM_NUM}"
TIMESTAMP=$(date +%s)
MESSAGE_ID="TEST_NOTIF_${TIMESTAMP}"

# Invia messaggio da nuovo numero (non registrato)
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
                        \"remoteJid\": \"${PHONE_NUMBER}@s.whatsapp.net\",
                        \"fromMe\": false,
                        \"id\": \"${MESSAGE_ID}\"
                    },
                    \"messageTimestamp\": ${TIMESTAMP},
                    \"pushName\": \"Test User ${RANDOM_NUM}\",
                    \"broadcast\": false,
                    \"message\": {
                        \"conversation\": \"🧪 Test notifiche: messaggio da nuovo numero ${PHONE_NUMBER}\"
                    }
                }
            ],
            \"type\": \"notify\"
        }
    }
}" > /dev/null 2>&1

echo -e "${GREEN}✅ Messaggio da nuovo numero inviato${NC}"
echo "   Numero: +${PHONE_NUMBER}"
echo ""

# Attendi processamento
echo "⏳ Attendo 3 secondi per il processamento..."
sleep 3

echo ""
echo "3️⃣ Simulando messaggio da numero REGISTRATO (simulato)..."
echo ""

# Simula un messaggio da un numero che potrebbe essere registrato
REGISTERED_PHONE="393333333333"
MESSAGE_ID2="TEST_NOTIF_REG_${TIMESTAMP}"

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
                        \"remoteJid\": \"${REGISTERED_PHONE}@s.whatsapp.net\",
                        \"fromMe\": false,
                        \"id\": \"${MESSAGE_ID2}\"
                    },
                    \"messageTimestamp\": ${TIMESTAMP},
                    \"pushName\": \"Mario Rossi\",
                    \"broadcast\": false,
                    \"message\": {
                        \"conversation\": \"🧪 Test notifiche: messaggio da utente potenzialmente registrato\"
                    }
                }
            ],
            \"type\": \"notify\"
        }
    }
}" > /dev/null 2>&1

echo -e "${GREEN}✅ Messaggio da numero registrato inviato${NC}"
echo ""

# Attendi processamento
echo "⏳ Attendo 3 secondi..."
sleep 3

echo ""
echo "4️⃣ Simulando messaggio di GRUPPO..."
echo ""

GROUP_ID="120363123456789012@g.us"
MESSAGE_ID3="TEST_GROUP_${TIMESTAMP}"

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
                        \"remoteJid\": \"${GROUP_ID}\",
                        \"fromMe\": false,
                        \"id\": \"${MESSAGE_ID3}\",
                        \"participant\": \"393338888888@s.whatsapp.net\"
                    },
                    \"messageTimestamp\": ${TIMESTAMP},
                    \"pushName\": \"Gruppo Test User\",
                    \"broadcast\": false,
                    \"message\": {
                        \"conversation\": \"🧪 Test notifiche: messaggio da gruppo WhatsApp\"
                    }
                }
            ],
            \"type\": \"notify\"
        }
    }
}" > /dev/null 2>&1

echo -e "${GREEN}✅ Messaggio di gruppo inviato${NC}"
echo ""

# Verifica logs
echo "====================================="
echo "📋 VERIFICA RISULTATI"
echo "====================================="
echo ""

echo "5️⃣ Ultimi log dal sistema notifiche:"
echo "--------------------------------"

# Cerca nei log per verificare l'invio notifiche
LOG_FILE="/Users/lucamambelli/Desktop/Richiesta-Assistenza/logs/application.log"
if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}Notifiche inviate:${NC}"
    tail -n 200 "$LOG_FILE" 2>/dev/null | grep -i "notifica.*admin.*sistema notifiche" | tail -5
    
    echo ""
    echo -e "${BLUE}Risposte automatiche:${NC}"
    tail -n 200 "$LOG_FILE" 2>/dev/null | grep -i "risposta automatica" | tail -5
    
    echo ""
    echo -e "${BLUE}Messaggi salvati:${NC}"
    tail -n 200 "$LOG_FILE" 2>/dev/null | grep -i "messaggio salvato con ID" | tail -5
else
    echo "Log file non trovato"
fi

echo ""
echo "====================================="
echo "🔍 COSA VERIFICARE"
echo "====================================="
echo ""
echo "Il sistema dovrebbe aver:"
echo ""
echo "1. 📱 Per il NUOVO numero (${PHONE_NUMBER}):"
echo "   - Salvato il messaggio nel database"
echo "   - Inviato notifica agli admin tramite sistema centralizzato"
echo "   - Inviato risposta automatica (se non già inviata nelle ultime 24h)"
echo "   - Creato notifica 'NEW_WHATSAPP_NUMBER' per gli admin"
echo ""
echo "2. 👤 Per il numero REGISTRATO (${REGISTERED_PHONE}):"
echo "   - Salvato il messaggio"
echo "   - Collegato all'utente (se esiste)"
echo "   - Inviato notifica agli admin"
echo "   - NON inviato risposta automatica"
echo ""
echo "3. 👥 Per il messaggio di GRUPPO:"
echo "   - Salvato il messaggio"
echo "   - Inviato notifica con priorità 'normal' (non 'high')"
echo "   - NON inviato risposta automatica"
echo ""
echo "====================================="
echo "📊 PER VEDERE LE NOTIFICHE"
echo "====================================="
echo ""
echo "1. Accedi come ADMIN su http://localhost:5193"
echo "2. Guarda l'icona campanello in alto a destra"
echo "3. Oppure vai su WhatsApp Dashboard nel menu"
echo "4. I messaggi dovrebbero apparire in tempo reale"
echo ""
echo "Per vedere nel database:"
echo "cd backend && npx prisma studio"
echo "Tabelle da controllare:"
echo "- WhatsAppMessage (messaggi salvati)"
echo "- Notification (notifiche create)"
echo ""
echo -e "${GREEN}✅ Test completato!${NC}"
echo ""
echo "Nota: Le notifiche via WebSocket appaiono istantaneamente"
echo "      Le notifiche via Email dipendono dalla configurazione Brevo"
