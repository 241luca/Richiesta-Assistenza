#!/bin/bash

# Request System Health Check
# Verifica completa del sistema di richieste assistenza

echo "📋 REQUEST SYSTEM CHECK"
echo "======================="
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

# 1. Verifica modelli database richieste
echo "🗄️ VERIFICA DATABASE RICHIESTE"
echo "------------------------------"

if [ -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    # Modello AssistanceRequest
    if grep -q "model AssistanceRequest" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello AssistanceRequest presente"
    else
        check_fail "Modello AssistanceRequest MANCANTE"
    fi
    
    # Modello Quote
    if grep -q "model Quote" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Quote presente"
    else
        check_fail "Modello Quote MANCANTE"
    fi
    
    # Modello Category
    if grep -q "model Category" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Category presente"
    else
        check_warn "Modello Category non trovato"
    fi
    
    # Modello Subcategory
    if grep -q "model Subcategory" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Subcategory presente"
    else
        echo "   Modello Subcategory non presente (opzionale)"
    fi
else
    check_fail "Schema Prisma non trovato"
fi

echo ""

# 2. Verifica servizi richieste
echo "🔧 VERIFICA SERVIZI RICHIESTE"
echo "-----------------------------"

if [ -f "$BACKEND_DIR/src/services/request.service.ts" ] || [ -f "$BACKEND_DIR/src/services/assistanceRequest.service.ts" ]; then
    check_pass "Request service presente"
else
    check_fail "Request service MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/services/quote.service.ts" ]; then
    check_pass "Quote service presente"
else
    check_warn "Quote service non trovato"
fi

if [ -f "$BACKEND_DIR/src/routes/request.routes.ts" ] || [ -f "$BACKEND_DIR/src/routes/assistanceRequest.routes.ts" ]; then
    check_pass "Request routes configurate"
else
    check_fail "Request routes MANCANTI"
fi

echo ""

# 3. Verifica workflow richieste
echo "⚙️ VERIFICA WORKFLOW RICHIESTE"
echo "------------------------------"

# Stati workflow
if [ -f "$BACKEND_DIR/src/types/request.types.ts" ] || grep -r "RequestStatus\|REQUEST_STATUS" "$BACKEND_DIR/src/" 2>/dev/null | grep -q "enum"; then
    check_pass "Stati workflow definiti"
    echo "   Stati tipici: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED"
else
    check_warn "Stati workflow non definiti chiaramente"
fi

# Auto-assignment
if grep -r "autoAssign\|automaticAssignment" "$BACKEND_DIR/src/" 2>/dev/null | grep -q "function\|async"; then
    check_pass "Sistema auto-assegnazione presente"
else
    check_warn "Auto-assegnazione non implementata"
fi

echo ""

# 4. Verifica queue jobs
echo "📦 VERIFICA QUEUE JOBS"
echo "----------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q '"bull"' "$BACKEND_DIR/package.json"; then
        check_pass "Bull Queue installato"
        
        # Verifica job richieste
        if [ -d "$BACKEND_DIR/src/queues" ]; then
            REQUEST_QUEUES=$(find "$BACKEND_DIR/src/queues" -name "*request*" -o -name "*assignment*" 2>/dev/null | wc -l | tr -d ' ')
            if [ "$REQUEST_QUEUES" -gt 0 ]; then
                check_pass "$REQUEST_QUEUES queue per richieste trovate"
            else
                check_warn "Nessuna queue specifica per richieste"
            fi
        fi
    else
        check_warn "Bull Queue non installato"
    fi
fi

echo ""

# 5. Test endpoint richieste
echo "🌐 TEST ENDPOINT RICHIESTE"
echo "--------------------------"

if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo"
    
    # Test requests endpoint
    if curl -s http://localhost:3200/api/requests > /dev/null 2>&1 || curl -s http://localhost:3200/api/assistance-requests > /dev/null 2>&1; then
        check_pass "Endpoint richieste raggiungibile"
    else
        check_warn "Endpoint richieste non raggiungibile"
    fi
    
    # Test quotes endpoint
    if curl -s http://localhost:3200/api/quotes > /dev/null 2>&1; then
        check_pass "Endpoint preventivi raggiungibile"
    else
        echo "   Endpoint preventivi non disponibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare endpoint"
fi

echo ""

# 6. Verifica notifiche richieste
echo "🔔 VERIFICA NOTIFICHE RICHIESTE"
echo "-------------------------------"

# Cerca integrazione notifiche
if grep -r "sendNotification.*request\|notifyProfessional" "$BACKEND_DIR/src/" 2>/dev/null | grep -q "function"; then
    check_pass "Sistema notifiche per richieste presente"
else
    check_warn "Notifiche richieste non implementate"
fi

# Verifica template notifiche
TEMPLATE_DIR="$BACKEND_DIR/src/templates"
if [ -d "$TEMPLATE_DIR" ]; then
    REQUEST_TEMPLATES=$(find "$TEMPLATE_DIR" -name "*request*" -o -name "*quote*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$REQUEST_TEMPLATES" -gt 0 ]; then
        check_pass "$REQUEST_TEMPLATES template per richieste trovati"
    else
        check_warn "Template notifiche richieste non trovati"
    fi
fi

echo ""

# 7. Statistiche richieste
echo "📊 STATISTICHE RICHIESTE"
echo "------------------------"

# Query database per statistiche (se possibile)
cd "$BACKEND_DIR" 2>/dev/null
if [ $? -eq 0 ]; then
    # Crea script per contare richieste
    cat > /tmp/request_stats_$$.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function stats() {
    try {
        const total = await prisma.assistanceRequest.count().catch(() => 0);
        const pending = await prisma.assistanceRequest.count({
            where: { status: 'PENDING' }
        }).catch(() => 0);
        const completed = await prisma.assistanceRequest.count({
            where: { status: 'COMPLETED' }
        }).catch(() => 0);
        
        console.log(`TOTAL:${total}`);
        console.log(`PENDING:${pending}`);
        console.log(`COMPLETED:${completed}`);
    } catch (error) {
        console.log(`ERROR:Database not accessible`);
    } finally {
        await prisma.$disconnect();
    }
}
stats();
EOF

    # Esegui statistiche
    STATS=$(timeout 5 node /tmp/request_stats_$$.js 2>/dev/null)
    
    TOTAL=$(echo "$STATS" | grep "TOTAL:" | cut -d':' -f2)
    PENDING=$(echo "$STATS" | grep "PENDING:" | cut -d':' -f2)
    COMPLETED=$(echo "$STATS" | grep "COMPLETED:" | cut -d':' -f2)
    
    if [ -n "$TOTAL" ] && [ "$TOTAL" != "0" ]; then
        echo "   Richieste totali: $TOTAL"
        [ -n "$PENDING" ] && echo "   In attesa: $PENDING"
        [ -n "$COMPLETED" ] && echo "   Completate: $COMPLETED"
        check_pass "Database richieste popolato"
    elif [ -n "$TOTAL" ] && [ "$TOTAL" = "0" ]; then
        check_warn "Database vuoto - nessuna richiesta"
    else
        echo "   Statistiche non disponibili"
    fi
    
    rm -f /tmp/request_stats_$$.js
    cd "$PROJECT_DIR"
fi

echo ""

# 8. Verifica SLA e metriche
echo "📈 VERIFICA SLA E METRICHE"
echo "--------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # SLA configurati
    if grep -q "SLA_\|REQUEST_TIMEOUT\|ASSIGNMENT_TIMEOUT" "$PROJECT_DIR/.env"; then
        check_pass "SLA/Timeout configurati"
    else
        check_warn "SLA non configurati"
    fi
fi

# Verifica tracking metriche
if grep -r "responseTime\|completionRate\|customerSatisfaction" "$BACKEND_DIR/src/" 2>/dev/null | grep -q "metric"; then
    check_pass "Tracking metriche implementato"
else
    check_warn "Tracking metriche non trovato"
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
        echo "  - Creare modelli database mancanti"
        echo "  - Implementare servizi richieste"
        echo "  - Configurare routes API"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Implementare auto-assegnazione"
        echo "  - Configurare queue jobs con Bull"
        echo "  - Creare template notifiche"
        echo "  - Definire SLA e timeout"
        echo "  - Implementare tracking metriche"
    fi
fi

echo ""
echo "✅ Request System Check completato!"

exit 0
