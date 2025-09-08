#!/bin/bash

# AI System Health Check
# Verifica completa del sistema di intelligenza artificiale

echo "🤖 AI SYSTEM CHECK"
echo "=================="
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

# 1. Verifica configurazione OpenAI
echo "🔑 VERIFICA CONFIGURAZIONE OPENAI"
echo "---------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "OPENAI_API_KEY" "$PROJECT_DIR/.env"; then
        check_pass "OpenAI API Key configurata"
        
        # Verifica lunghezza API key (dovrebbe iniziare con sk-)
        API_KEY=$(grep "OPENAI_API_KEY" "$PROJECT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if [[ "$API_KEY" == sk-* ]]; then
            check_pass "API Key ha formato valido"
        else
            check_warn "API Key potrebbe non essere valida"
        fi
    else
        check_fail "OPENAI_API_KEY non trovata in .env"
    fi
    
    # Controlla modello configurato
    if grep -q "OPENAI_MODEL" "$PROJECT_DIR/.env"; then
        MODEL=$(grep "OPENAI_MODEL" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        echo "   Modello configurato: $MODEL"
        check_pass "Modello AI specificato"
    else
        check_warn "OPENAI_MODEL non configurato (usando default)"
    fi
else
    check_fail "File .env non trovato"
fi

echo ""

# 2. Verifica servizi AI
echo "🧠 VERIFICA SERVIZI AI"
echo "----------------------"

if [ -f "$BACKEND_DIR/src/services/ai.service.ts" ]; then
    check_pass "AI service presente"
else
    check_fail "AI service MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/routes/ai.routes.ts" ]; then
    check_pass "AI routes configurate"
else
    check_warn "AI routes non trovate"
fi

echo ""

# 3. Verifica dipendenze OpenAI
echo "📦 VERIFICA DIPENDENZE"
echo "----------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q '"openai"' "$BACKEND_DIR/package.json"; then
        check_pass "OpenAI SDK installato"
        
        # Verifica versione
        VERSION=$(grep '"openai"' "$BACKEND_DIR/package.json" | sed 's/.*"openai".*"\([^"]*\)".*/\1/')
        echo "   Versione OpenAI: $VERSION"
    else
        check_fail "OpenAI SDK non installato"
        echo "   Esegui: cd backend && npm install openai"
    fi
fi

echo ""

# 4. Verifica rate limiting
echo "⏱️ VERIFICA RATE LIMITING"
echo "-------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "AI_RATE_LIMIT\|OPENAI_RATE_LIMIT" "$PROJECT_DIR/.env"; then
        RATE_LIMIT=$(grep "AI_RATE_LIMIT\|OPENAI_RATE_LIMIT" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        check_pass "Rate limiting configurato: $RATE_LIMIT req/min"
    else
        check_warn "Rate limiting non configurato"
        echo "   Rischio di superare i limiti API"
    fi
fi

echo ""

# 5. Verifica cache AI
echo "💾 VERIFICA CACHE AI"
echo "--------------------"

# Controlla se Redis è usato per cache
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        # Conta chiavi cache AI
        AI_CACHE_KEYS=$(redis-cli --scan --pattern "ai:*" 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$AI_CACHE_KEYS" -gt 0 ]; then
            check_pass "Cache AI attiva ($AI_CACHE_KEYS chiavi)"
        else
            check_warn "Cache AI vuota o non utilizzata"
        fi
    else
        check_warn "Redis non attivo per cache"
    fi
else
    check_warn "Redis non disponibile per cache"
fi

echo ""

# 6. Test endpoint AI (se backend attivo)
echo "🌐 TEST ENDPOINT AI"
echo "-------------------"

if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo"
    
    # Test endpoint AI health
    if curl -s http://localhost:3200/api/ai/health > /dev/null 2>&1; then
        RESPONSE=$(curl -s http://localhost:3200/api/ai/health)
        if echo "$RESPONSE" | grep -q "ok\|success\|healthy"; then
            check_pass "Endpoint AI health OK"
        else
            check_warn "Endpoint AI health risponde ma stato incerto"
        fi
    else
        check_warn "Endpoint AI health non raggiungibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare endpoint"
fi

echo ""

# 7. Verifica log e utilizzo
echo "📊 STATISTICHE UTILIZZO AI"
echo "--------------------------"

LOG_DIR="$PROJECT_DIR/logs"

if [ -d "$LOG_DIR" ]; then
    # Cerca chiamate AI nei log di oggi
    TODAY=$(date +%Y-%m-%d)
    AI_CALLS_TODAY=$(grep -h "openai\|ai.*request\|gpt" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    
    if [ "$AI_CALLS_TODAY" -gt 0 ]; then
        echo "   Chiamate AI oggi: $AI_CALLS_TODAY"
        check_pass "Sistema AI utilizzato oggi"
    else
        echo "   Nessuna chiamata AI registrata oggi"
    fi
    
    # Cerca errori AI
    AI_ERRORS=$(grep -h "openai.*error\|ai.*failed" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    if [ "$AI_ERRORS" -gt 0 ]; then
        check_warn "Trovati $AI_ERRORS errori AI oggi"
    fi
else
    echo "   Directory log non trovata"
fi

echo ""

# 8. Verifica limiti e costi
echo "💰 VERIFICA LIMITI E COSTI"
echo "--------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Token limit
    if grep -q "AI_MAX_TOKENS\|OPENAI_MAX_TOKENS" "$PROJECT_DIR/.env"; then
        MAX_TOKENS=$(grep "AI_MAX_TOKENS\|OPENAI_MAX_TOKENS" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        check_pass "Token limit configurato: $MAX_TOKENS"
    else
        check_warn "Token limit non configurato"
    fi
    
    # Budget limit
    if grep -q "AI_DAILY_BUDGET\|AI_COST_LIMIT" "$PROJECT_DIR/.env"; then
        check_pass "Budget limit configurato"
    else
        check_warn "Budget limit non configurato"
        echo "   Rischio di costi non controllati"
    fi
fi

echo ""

# 9. Summary e raccomandazioni
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
        echo "  - Configurare OPENAI_API_KEY in .env"
        echo "  - Installare OpenAI SDK"
        echo "  - Verificare servizi AI"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Configurare rate limiting"
        echo "  - Implementare cache con Redis"
        echo "  - Configurare limiti di token e budget"
        echo "  - Monitorare utilizzo e costi"
    fi
fi

echo ""
echo "✅ AI System Check completato!"

exit 0
