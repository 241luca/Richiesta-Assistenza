#!/bin/bash

# ========================================
# TEST DASHBOARD NOTIFICHE ADMIN
# ========================================
# Script per testare completamente la dashboard notifiche
# Data: 6 Settembre 2025
# ========================================

echo "🔍 TEST COMPLETO DASHBOARD NOTIFICHE ADMIN"
echo "=========================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione
BACKEND_URL="http://localhost:3200"
FRONTEND_URL="http://localhost:5193"

# Funzione per fare richieste HTTP
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$BACKEND_URL$endpoint"
    else
        curl -s -X $method \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BACKEND_URL$endpoint"
    fi
}

echo "📋 STEP 1: LOGIN COME SUPER_ADMIN"
echo "----------------------------------"
echo "Usa queste credenziali per login:"
echo -e "${BLUE}Email: admin@test.com${NC}"
echo -e "${BLUE}Password: Admin123!${NC}"
echo ""

echo "🔐 Tentativo di login automatico..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"Admin123!"}' \
    "$BACKEND_URL/api/auth/login")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login fallito. Verifica le credenziali.${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Login riuscito! Token ottenuto.${NC}"
fi

echo ""
echo "📊 STEP 2: TEST ENDPOINT STATISTICHE"
echo "------------------------------------"

STATS_RESPONSE=$(make_request GET "/api/notifications/stats" "" "$TOKEN")
if echo "$STATS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Endpoint statistiche funzionante${NC}"
    echo "Statistiche:"
    echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
else
    echo -e "${RED}❌ Errore endpoint statistiche${NC}"
    echo "$STATS_RESPONSE"
fi

echo ""
echo "📝 STEP 3: TEST ENDPOINT LOGS"
echo "------------------------------"

LOGS_RESPONSE=$(make_request GET "/api/notifications/logs?limit=5" "" "$TOKEN")
if echo "$LOGS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Endpoint logs funzionante${NC}"
    LOGS_COUNT=$(echo "$LOGS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo "Totale notifiche nel database: $LOGS_COUNT"
else
    echo -e "${RED}❌ Errore endpoint logs${NC}"
    echo "$LOGS_RESPONSE"
fi

echo ""
echo "🧪 STEP 4: INVIO NOTIFICA DI TEST"
echo "---------------------------------"

TEST_DATA='{
    "email": "admin@test.com",
    "type": "TEST_NOTIFICATION",
    "title": "Test Dashboard Admin",
    "message": "Questa è una notifica di test inviata dalla dashboard admin",
    "priority": "high",
    "channels": ["websocket", "email"]
}'

TEST_RESPONSE=$(make_request POST "/api/notifications/test" "$TEST_DATA" "$TOKEN")
if echo "$TEST_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Notifica di test inviata con successo${NC}"
else
    echo -e "${YELLOW}⚠️ Possibile errore invio test${NC}"
    echo "$TEST_RESPONSE"
fi

echo ""
echo "📋 STEP 5: CREAZIONE NOTIFICA DI ESEMPIO"
echo "----------------------------------------"

# Crea una richiesta di esempio per generare notifiche
REQUEST_DATA='{
    "title": "Test Richiesta per Notifiche",
    "description": "Richiesta creata per testare il sistema notifiche",
    "categoryId": "1",
    "subcategoryId": "1",
    "urgency": "normal",
    "preferredDate": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "address": "Via Test 123, Milano",
    "additionalInfo": "Test notifiche dashboard"
}'

echo "Creazione richiesta di test..."
REQUEST_RESPONSE=$(make_request POST "/api/requests" "$REQUEST_DATA" "$TOKEN")
if echo "$REQUEST_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Richiesta creata (dovrebbe generare notifiche)${NC}"
else
    echo -e "${YELLOW}⚠️ Possibile errore creazione richiesta${NC}"
fi

echo ""
echo "🔄 STEP 6: VERIFICA NUOVE NOTIFICHE"
echo "-----------------------------------"

sleep 2 # Attendi che le notifiche siano create

NEW_LOGS_RESPONSE=$(make_request GET "/api/notifications/logs?limit=10" "" "$TOKEN")
if echo "$NEW_LOGS_RESPONSE" | grep -q "success"; then
    NEW_COUNT=$(echo "$NEW_LOGS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ Notifiche aggiornate. Totale: $NEW_COUNT${NC}"
else
    echo -e "${RED}❌ Errore recupero nuovi logs${NC}"
fi

echo ""
echo "🌐 STEP 7: VERIFICA FRONTEND"
echo "----------------------------"

# Verifica che il frontend sia raggiungibile
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/admin/notifications")
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Dashboard frontend raggiungibile${NC}"
    echo ""
    echo "📱 Apri il browser e vai a:"
    echo -e "${BLUE}$FRONTEND_URL/admin/notifications${NC}"
    echo ""
    echo "Dovresti vedere:"
    echo "• Tab Overview con statistiche"
    echo "• Tab Log Notifiche con tabella completa"
    echo "• Tab Test per inviare notifiche di test"
    echo "• Tab Templates per gestire i template"
    echo "• Tab Eventi per configurare eventi automatici"
else
    echo -e "${YELLOW}⚠️ Frontend non raggiungibile o richiede login${NC}"
    echo "Assicurati che il frontend sia avviato su porta 5193"
fi

echo ""
echo "======================================"
echo "📊 RIEPILOGO TEST"
echo "======================================"

# Conta successi e fallimenti
TESTS_PASSED=0
TESTS_FAILED=0

# Valuta risultati
if [ ! -z "$TOKEN" ]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if echo "$STATS_RESPONSE" | grep -q "success"; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if echo "$LOGS_RESPONSE" | grep -q "success"; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if echo "$TEST_RESPONSE" | grep -q "success"; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi

echo -e "✅ Test Passati: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Test Falliti: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 TUTTI I TEST PASSATI!${NC}"
    echo "La dashboard notifiche è completamente funzionante!"
else
    echo ""
    echo -e "${YELLOW}⚠️ Alcuni test sono falliti${NC}"
    echo "Verifica i log sopra per dettagli"
fi

echo ""
echo "======================================"
echo "📝 AZIONI MANUALI DA TESTARE"
echo "======================================"
echo ""
echo "1. LOGIN:"
echo "   - Vai a $FRONTEND_URL/login"
echo "   - Usa admin@test.com / Admin123!"
echo ""
echo "2. DASHBOARD NOTIFICHE:"
echo "   - Vai a $FRONTEND_URL/admin/notifications"
echo "   - Verifica tutte le tab:"
echo "     • Overview: statistiche e grafici"
echo "     • Log: tabella notifiche con filtri"
echo "     • Test: form invio test"
echo "     • Templates: gestione template"
echo ""
echo "3. TEST FUNZIONALITÀ:"
echo "   - Invia una notifica di test"
echo "   - Applica filtri sui log"
echo "   - Reinvia una notifica fallita"
echo "   - Visualizza dettagli notifica"
echo ""
echo "4. MONITORAGGIO:"
echo "   - Controlla WebSocket: F12 > Network > WS"
echo "   - Verifica console per errori"
echo "   - Controlla Network per chiamate API"
echo ""

echo "Test completato il: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
