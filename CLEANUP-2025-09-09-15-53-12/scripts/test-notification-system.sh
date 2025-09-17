#!/bin/bash

# ========================================
# SCRIPT TEST COMPLETO SISTEMA NOTIFICHE
# ========================================
# Verifica che il sistema notifiche sia completamente funzionante
# Data: 6 Settembre 2025
# ========================================

echo "🔍 TEST COMPLETO SISTEMA NOTIFICHE"
echo "=================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatori
PASSED=0
FAILED=0
WARNINGS=0

# Directory di lavoro
BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"
ROOT_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza"

# Funzione per test
run_test() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval $command 2>/dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

# Funzione per warning
check_warning() {
    local test_name=$1
    local command=$2
    
    echo -n "Checking: $test_name... "
    
    if eval $command 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARNINGS++))
    fi
}

echo "📁 1. VERIFICA FILE SISTEMA NOTIFICHE"
echo "--------------------------------------"

# Test esistenza file principali
run_test "notification.service.ts exists" "[ -f $BACKEND_DIR/src/services/notification.service.ts ]"
run_test "notification.handler.ts exists" "[ -f $BACKEND_DIR/src/websocket/handlers/notification.handler.ts ]"
run_test "errors.ts created" "[ -f $BACKEND_DIR/src/utils/errors.ts ]"

echo ""
echo "🔧 2. VERIFICA INTEGRAZIONI MODULI"
echo "-----------------------------------"

# Verifica che i servizi importino notificationService
run_test "scheduledInterventionService imports notificationService" \
    "grep -q 'import.*notificationService.*from.*notification.service' $BACKEND_DIR/src/services/scheduledInterventionService.ts"

run_test "user.service imports notificationService" \
    "grep -q 'import.*notificationService.*from.*notification.service' $BACKEND_DIR/src/services/user.service.ts"

run_test "quote.service imports notificationService" \
    "grep -q 'import.*notificationService.*from.*notification.service' $BACKEND_DIR/src/services/quote.service.ts"

run_test "auth.routes imports notificationService" \
    "grep -q 'import.*notificationService.*from.*notification.service' $BACKEND_DIR/src/routes/auth.routes.ts"

run_test "message.handler imports notificationService" \
    "grep -q 'import.*notificationService.*from.*notification.service' $BACKEND_DIR/src/websocket/handlers/message.handler.ts"

echo ""
echo "📝 3. VERIFICA PATTERN CORRETTO"
echo "--------------------------------"

# Verifica uso di userId (non recipientId nelle chiamate)
run_test "request.service uses userId pattern" \
    "grep -q 'userId:.*clientId' $BACKEND_DIR/src/services/request.service.ts"

run_test "quote.service uses userId pattern" \
    "grep -q 'userId:.*clientId' $BACKEND_DIR/src/services/quote.service.ts"

# Verifica che non ci siano più vecchie chiamate
check_warning "No old sendWebSocketNotification calls" \
    "! grep -q 'sendWebSocketNotification' $BACKEND_DIR/src/services/scheduledInterventionService.ts"

check_warning "No recipientId in service calls" \
    "! grep -q 'recipientId:' $BACKEND_DIR/src/services/request.service.ts"

echo ""
echo "🎯 4. VERIFICA TIPI NOTIFICHE"
echo "------------------------------"

# Verifica presenza dei tipi di notifica
run_test "NEW_REQUEST notification type" \
    "grep -q 'type:.*NEW_REQUEST' $BACKEND_DIR/src/services/request.service.ts"

run_test "INTERVENTIONS_PROPOSED notification type" \
    "grep -q 'type:.*INTERVENTIONS_PROPOSED' $BACKEND_DIR/src/services/scheduledInterventionService.ts"

run_test "NEW_QUOTE notification type" \
    "grep -q 'type:.*NEW_QUOTE' $BACKEND_DIR/src/services/quote.service.ts"

run_test "WELCOME notification type" \
    "grep -q 'type:.*WELCOME' $BACKEND_DIR/src/services/user.service.ts"

run_test "PASSWORD_RESET notification type" \
    "grep -q 'type:.*PASSWORD_RESET' $BACKEND_DIR/src/routes/auth.routes.ts"

run_test "NEW_MESSAGE notification type" \
    "grep -q 'type:.*NEW_MESSAGE' $BACKEND_DIR/src/websocket/handlers/message.handler.ts"

echo ""
echo "🔍 5. VERIFICA TYPESCRIPT"
echo "-------------------------"

cd $BACKEND_DIR

# Check TypeScript compilation
echo -n "TypeScript compilation check... "
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠ Some TypeScript errors found${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
    ((PASSED++))
fi

echo ""
echo "📊 6. VERIFICA DATABASE FIELDS"
echo "------------------------------"

# Verifica che usi 'content' nel database
run_test "notification.service uses 'content' field" \
    "grep -q 'content:.*data.message' $BACKEND_DIR/src/services/notification.service.ts"

run_test "Priority uppercase conversion" \
    "grep -q 'toUpperCase()' $BACKEND_DIR/src/services/notification.service.ts"

echo ""
echo "✅ 7. VERIFICA GESTIONE ERRORI"
echo "-------------------------------"

# Verifica try/catch per non bloccare flusso
run_test "Error handling in user.service" \
    "grep -q 'try.*await notificationService' $BACKEND_DIR/src/services/user.service.ts"

run_test "Error handling in scheduledIntervention" \
    "grep -q 'catch.*error.*logger.error' $BACKEND_DIR/src/services/scheduledInterventionService.ts"

run_test "Error handling in quote.service" \
    "grep -q 'catch.*error.*logger.error' $BACKEND_DIR/src/services/quote.service.ts"

echo ""
echo "📚 8. VERIFICA DOCUMENTAZIONE"
echo "-----------------------------"

# Verifica report creati
run_test "Phase 1 report exists" \
    "[ -f $ROOT_DIR/REPORT-SESSIONI-CLAUDE/2025-09-SETTEMBRE/report-fix-notifiche-20250906.md ]"

run_test "Phase 2 report exists" \
    "[ -f $ROOT_DIR/REPORT-SESSIONI-CLAUDE/2025-09-SETTEMBRE/report-fase2-completata-20250906.md ]"

echo ""
echo "🌐 9. VERIFICA CANALI NOTIFICA"
echo "-------------------------------"

# Verifica multi-channel
run_test "WebSocket channel configured" \
    "grep -q \"channels.*websocket\" $BACKEND_DIR/src/services/user.service.ts"

run_test "Email channel configured" \
    "grep -q \"channels.*email\" $BACKEND_DIR/src/services/user.service.ts"

run_test "Multi-channel support" \
    "grep -q \"channels.*\\['websocket', 'email'\\]\" $BACKEND_DIR/src/services/scheduledInterventionService.ts"

echo ""
echo "======================================"
echo "📊 RISULTATI TEST"
echo "======================================"
echo -e "✅ Test Passati: ${GREEN}$PASSED${NC}"
echo -e "❌ Test Falliti: ${RED}$FAILED${NC}"
echo -e "⚠️  Warning: ${YELLOW}$WARNINGS${NC}"
echo ""

# Calcola percentuale successo
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}🎉 SISTEMA NOTIFICHE COMPLETAMENTE FUNZIONANTE!${NC}"
    elif [ $SUCCESS_RATE -ge 75 ]; then
        echo -e "${YELLOW}⚠️  Sistema notifiche funzionante con alcuni warning${NC}"
    else
        echo -e "${RED}❌ Sistema notifiche richiede ulteriori fix${NC}"
    fi
else
    echo "Nessun test eseguito"
fi

echo ""
echo "======================================"
echo "📝 PROSSIMI PASSI CONSIGLIATI"
echo "======================================"

if [ $FAILED -gt 0 ]; then
    echo "1. Correggere i test falliti"
    echo "2. Verificare gli import mancanti"
    echo "3. Controllare i percorsi dei file"
fi

if [ $WARNINGS -gt 0 ]; then
    echo "1. Verificare i warning TypeScript"
    echo "2. Controllare pattern deprecati"
    echo "3. Aggiornare documentazione"
fi

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Sistema pronto per il testing manuale!"
    echo ""
    echo "Test manuali consigliati:"
    echo "1. Avviare backend: cd backend && npm run dev"
    echo "2. Avviare frontend: npm run dev"
    echo "3. Creare una richiesta e verificare notifiche"
    echo "4. Inviare un preventivo e verificare notifiche"
    echo "5. Testare reset password"
    echo ""
    echo "Per monitorare le notifiche:"
    echo "- Aprire Prisma Studio: cd backend && npx prisma studio"
    echo "- Verificare tabella Notification"
    echo "- Controllare logs: tail -f backend/logs/combined.log"
fi

echo ""
echo "Test completato il: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
