#!/bin/bash

# Notification System Health Check
# Verifica completa del sistema di notifiche

echo "📨 NOTIFICATION SYSTEM CHECK"
echo "============================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori
ERRORS=0
WARNINGS=0
CHECKS=0

# Directory progetto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "📍 Directory progetto: $PROJECT_DIR"
echo ""

# Funzione per incrementare contatori
check_pass() {
    CHECKS=$((CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

check_warn() {
    CHECKS=$((CHECKS + 1))
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_fail() {
    CHECKS=$((CHECKS + 1))
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verifica configurazione email
echo "📧 VERIFICA CONFIGURAZIONE EMAIL"
echo "--------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Controlla Brevo/SendinBlue
    if grep -q "BREVO_API_KEY\|SENDINBLUE_API_KEY" "$PROJECT_DIR/.env"; then
        check_pass "API Key Brevo/SendinBlue configurata"
    else
        check_warn "API Key Brevo non configurata"
    fi
    
    # Controlla SMTP
    if grep -q "SMTP_HOST" "$PROJECT_DIR/.env"; then
        check_pass "SMTP Host configurato"
    else
        check_warn "SMTP non configurato (usando API Brevo)"
    fi
    
    # Email mittente
    if grep -q "EMAIL_FROM" "$PROJECT_DIR/.env"; then
        check_pass "Email mittente configurata"
    else
        check_fail "EMAIL_FROM non configurato"
    fi
else
    check_fail "File .env non trovato"
fi

echo ""

# 2. Verifica servizi notifiche
echo "🔔 VERIFICA SERVIZI NOTIFICHE"
echo "-----------------------------"

# Controlla file servizi
if [ -f "$BACKEND_DIR/src/services/notification.service.ts" ]; then
    check_pass "Notification service presente"
else
    check_fail "Notification service MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/services/email.service.ts" ]; then
    check_pass "Email service presente"
else
    check_fail "Email service MANCANTE"
fi

echo ""

# 3. Verifica Socket.io per notifiche real-time
echo "🔌 VERIFICA WEBSOCKET"
echo "---------------------"

# Controlla se Socket.io è installato
if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q "socket.io" "$BACKEND_DIR/package.json"; then
        check_pass "Socket.io installato"
        
        # Verifica file WebSocket
        if [ -f "$BACKEND_DIR/src/websocket/server.ts" ] || [ -f "$BACKEND_DIR/src/websocket/index.ts" ]; then
            check_pass "WebSocket server configurato"
        else
            check_warn "File WebSocket server non trovato"
        fi
    else
        check_warn "Socket.io non installato"
    fi
fi

echo ""

# 4. Verifica Redis per code notifiche
echo "🗄️ VERIFICA REDIS/QUEUE"
echo "------------------------"

# Test Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        check_pass "Redis server attivo"
        
        # Conta chiavi notifiche
        NOTIF_KEYS=$(redis-cli --scan --pattern "bull:notification:*" 2>/dev/null | wc -l | tr -d ' ')
        echo "   Code notifiche in Redis: $NOTIF_KEYS"
    else
        check_warn "Redis non attivo"
    fi
else
    check_warn "Redis client non installato"
fi

# Verifica Bull Queue
if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q '"bull"' "$BACKEND_DIR/package.json"; then
        check_pass "Bull Queue installato"
    else
        check_warn "Bull Queue non installato"
    fi
fi

echo ""

# 5. Verifica template email
echo "📝 VERIFICA TEMPLATE"
echo "--------------------"

TEMPLATES_DIR="$BACKEND_DIR/src/templates"
EMAIL_TEMPLATES_DIR="$BACKEND_DIR/src/email-templates"

if [ -d "$TEMPLATES_DIR" ] || [ -d "$EMAIL_TEMPLATES_DIR" ]; then
    check_pass "Directory template trovata"
    
    # Conta template
    if [ -d "$TEMPLATES_DIR" ]; then
        TEMPLATE_COUNT=$(find "$TEMPLATES_DIR" -name "*.html" -o -name "*.hbs" -o -name "*.ejs" 2>/dev/null | wc -l | tr -d ' ')
    else
        TEMPLATE_COUNT=$(find "$EMAIL_TEMPLATES_DIR" -name "*.html" -o -name "*.hbs" -o -name "*.ejs" 2>/dev/null | wc -l | tr -d ' ')
    fi
    
    if [ "$TEMPLATE_COUNT" -gt 0 ]; then
        check_pass "$TEMPLATE_COUNT template trovati"
    else
        check_warn "Nessun template email trovato"
    fi
else
    check_warn "Directory template non trovata"
fi

echo ""

# 6. Test invio email (simulato)
echo "🧪 TEST SISTEMA NOTIFICHE"
echo "-------------------------"

# Verifica se il backend è attivo
if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo su porta 3200"
    
    # Se ci sono endpoint di test notifiche
    if curl -s http://localhost:3200/api/notifications/test -X POST > /dev/null 2>&1; then
        check_pass "Endpoint test notifiche raggiungibile"
    else
        echo "   Endpoint test non disponibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare"
fi

echo ""

# 7. Verifica log notifiche
echo "📊 STATISTICHE NOTIFICHE"
echo "------------------------"

LOG_DIR="$PROJECT_DIR/logs"

if [ -d "$LOG_DIR" ]; then
    # Cerca log recenti di notifiche
    RECENT_LOGS=$(find "$LOG_DIR" -name "*.log" -mtime -1 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$RECENT_LOGS" -gt 0 ]; then
        check_pass "Log recenti trovati"
        
        # Conta notifiche inviate oggi (se loggato)
        SENT_TODAY=$(grep -h "notification.*sent\|email.*sent" "$LOG_DIR"/*.log 2>/dev/null | grep "$(date +%Y-%m-%d)" | wc -l | tr -d ' ')
        if [ "$SENT_TODAY" -gt 0 ]; then
            echo "   Notifiche inviate oggi: $SENT_TODAY"
        fi
    else
        check_warn "Nessun log recente trovato"
    fi
else
    echo "   Directory log non trovata"
fi

echo ""

# 8. Summary e raccomandazioni
echo "📊 RIEPILOGO"
echo "============"
echo ""
echo "Controlli eseguiti: $CHECKS"
echo -e "${GREEN}✅ Passati: $((CHECKS - WARNINGS - ERRORS))${NC}"
echo -e "${YELLOW}⚠️  Warning: $WARNINGS${NC}"
echo -e "${RED}❌ Errori: $ERRORS${NC}"
echo ""

# Calcola health score
SCORE=$((100 - (ERRORS * 20) - (WARNINGS * 5)))
if [ $SCORE -lt 0 ]; then
    SCORE=0
fi

echo "🏥 Health Score: $SCORE/100"
echo ""

# Raccomandazioni
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI"
    echo "=================="
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}CRITICHE (da risolvere subito):${NC}"
        [ ! -f "$PROJECT_DIR/.env" ] && echo "  - Configurare file .env"
        echo "  - Verificare servizi mancanti"
        echo "  - Configurare EMAIL_FROM"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Configurare Brevo/SendinBlue API"
        echo "  - Installare e configurare Redis"
        echo "  - Creare template email"
        echo "  - Implementare WebSocket per real-time"
        echo "  - Configurare Bull Queue per notifiche async"
    fi
fi

echo ""
echo "✅ Notification System Check completato!"

# Exit sempre con 0 per non causare errori nel backend
exit 0
