#!/bin/bash

# Script per verificare il sistema WhatsApp completo
# Usage: ./check-whatsapp-system.sh

echo "🔍 Verifica Sistema WhatsApp Completo"
echo "======================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per verificare endpoint
check_endpoint() {
    local url=$1
    local method=${2:-GET}
    local description=$3
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ $description${NC}"
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${YELLOW}⚠️  $description (Richiede autenticazione)${NC}"
    else
        echo -e "${RED}❌ $description (HTTP $response)${NC}"
    fi
}

# Base URL
BASE_URL="http://localhost:3200/api/whatsapp"

echo "📡 Verifica Endpoints WhatsApp"
echo "------------------------------"

# Test connessione base
check_endpoint "$BASE_URL/status" "GET" "Status WhatsApp"
check_endpoint "$BASE_URL/config" "GET" "Configurazione"
check_endpoint "$BASE_URL/instance-id" "GET" "Instance ID"

echo ""
echo "📨 Verifica Sistema Messaggi"
echo "----------------------------"

check_endpoint "$BASE_URL/messages" "GET" "Lista messaggi"
check_endpoint "$BASE_URL/send" "POST" "Invio messaggi"
check_endpoint "$BASE_URL/webhook" "POST" "Webhook ricezione"

echo ""
echo "🔄 Verifica Polling System"
echo "-------------------------"

check_endpoint "$BASE_URL/polling/status" "GET" "Stato polling"
check_endpoint "$BASE_URL/polling/start" "POST" "Avvio polling"
check_endpoint "$BASE_URL/polling/stop" "POST" "Stop polling"
check_endpoint "$BASE_URL/polling/check" "POST" "Check manuale"

echo ""
echo "📊 Statistiche Database"
echo "-----------------------"

# Connessione al database
DB_URL=$(grep DATABASE_URL backend/.env | cut -d '=' -f2- | tr -d '"')

if [ -n "$DB_URL" ]; then
    # Conta messaggi
    TOTAL_MSG=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\";" 2>/dev/null | tr -d ' ')
    INBOUND=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\" WHERE direction='inbound';" 2>/dev/null | tr -d ' ')
    OUTBOUND=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"WhatsAppMessage\" WHERE direction='outbound';" 2>/dev/null | tr -d ' ')
    
    echo -e "Totale messaggi: ${GREEN}$TOTAL_MSG${NC}"
    echo -e "Ricevuti: ${GREEN}$INBOUND${NC}"
    echo -e "Inviati: ${GREEN}$OUTBOUND${NC}"
    
    # Stato polling
    POLLING=$(psql "$DB_URL" -t -c "SELECT value FROM \"SystemConfiguration\" WHERE key='whatsapp_polling_config';" 2>/dev/null)
    if [ -n "$POLLING" ]; then
        echo ""
        echo "Configurazione Polling:"
        echo "$POLLING" | python3 -m json.tool 2>/dev/null || echo "$POLLING"
    fi
fi

echo ""
echo "🌐 Verifica Frontend"
echo "-------------------"

# Verifica se il frontend è attivo
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5193")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend attivo su http://localhost:5193${NC}"
    echo ""
    echo "📱 Pagine WhatsApp disponibili:"
    echo "  → http://localhost:5193/admin/whatsapp"
    echo "  → http://localhost:5193/admin/whatsapp/messages"
    echo "  → http://localhost:5193/admin/whatsapp/settings"
else
    echo -e "${RED}❌ Frontend non raggiungibile${NC}"
fi

echo ""
echo "🔧 Azioni Consigliate"
echo "--------------------"

# Verifica se il polling è attivo
if [ -n "$POLLING" ] && echo "$POLLING" | grep -q '"enabled":true'; then
    echo -e "${GREEN}✅ Polling attivo - I messaggi vengono controllati automaticamente${NC}"
else
    echo -e "${YELLOW}⚠️  Polling non attivo${NC}"
    echo "   → Vai su http://localhost:5193/admin/whatsapp"
    echo "   → Clicca 'Avvia Controllo Automatico'"
fi

# Verifica connessione WhatsApp
CONNECTED=$(psql "$DB_URL" -t -c "SELECT value FROM \"SystemConfiguration\" WHERE key='whatsapp_connected_manual';" 2>/dev/null | tr -d ' ')
if [ "$CONNECTED" = "true" ]; then
    echo -e "${GREEN}✅ WhatsApp connesso${NC}"
else
    echo -e "${YELLOW}⚠️  WhatsApp non connesso${NC}"
    echo "   → Vai su http://localhost:5193/admin/whatsapp"
    echo "   → Scansiona il QR Code"
fi

echo ""
echo "✅ Verifica completata!"
echo ""
echo "📚 Documentazione:"
echo "  • Invio messaggi: POST /api/whatsapp/send"
echo "  • Polling: Controlla automaticamente i messaggi"
echo "  • Webhook: Opzionale, solo se vuoi real-time"
echo "  • Sicurezza: Tutto resta nel tuo server!"
