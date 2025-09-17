#!/bin/bash

# ============================================
# Script: Analisi Completa Modulo Preventivi
# Descrizione: Verifica dettagliata del modulo Quote (Preventivi)
# Data: 10 Settembre 2025
# Versione: 1.0 - COMPLETA CON TUTTI I CONTROLLI ANALITICI
# 
# Uso: ./quote-system-check-complete.sh [--skip-typescript] [--quick]
# ============================================

# Controlla parametri
SKIP_TYPESCRIPT=false
QUICK_MODE=false

for arg in "$@"; do
    case $arg in
        --skip-typescript)
            SKIP_TYPESCRIPT=true
            echo "🚨 Salto controlli TypeScript per velocità"
            ;;
        --quick)
            QUICK_MODE=true
            SKIP_TYPESCRIPT=true
            echo "⚡ Modalità veloce: solo controlli essenziali"
            ;;
        --help)
            echo "Uso: $0 [opzioni]"
            echo "Opzioni:"
            echo "  --quick           Modalità veloce (salta TypeScript e controlli lunghi)"
            echo "  --skip-typescript Salta solo i controlli TypeScript"
            echo "  --help           Mostra questo messaggio"
            exit 0
            ;;
    esac
done

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ANALISI COMPLETA MODULO PREVENTIVI - v1.0            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contatori
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
ERRORS=0
EXIT_CODE=0

# Variabili globali per i controlli
QUOTE_TS_ERRORS=0
FORMATTER_IN_SERVICE=0
FORMATTER_COUNT=0
AUTH_COUNT=0
CONSOLE_LOG=0
VALIDATION_COUNT=0
TRANSACTION_COUNT=0
TEST_FILES=0
CACHE_USAGE=0
INDEX_COUNT=0
JSDOC_ROUTES=0
JSDOC_SERVICE=0
WS_IN_SERVICE=0
LOGGER_USAGE=0

# Funzione per incrementare i check
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# Funzione per successo
pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

# Funzione per warning
warn() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Funzione per errore
error() {
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

# Funzione per info
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# ============================================
# 1. VERIFICA DATABASE E MODELLI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 1. DATABASE E MODELLI PRISMA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Vai nella directory backend
cd backend 2>/dev/null || cd ../backend 2>/dev/null || {
    error "Directory backend non trovata"
    exit 1
}

# Verifica connessione database
check
echo -n "Connessione database PostgreSQL... "
DB_CHECK=$(npx prisma db pull --print 2>&1)
if echo "$DB_CHECK" | grep -q "Quote"; then
    pass "Database connesso e schema sincronizzato"
else
    error "Problema connessione database"
fi

# Verifica modello Quote in schema.prisma
check
echo -n "Modello Quote in schema... "
if grep -q "model Quote" prisma/schema.prisma; then
    pass "Modello Quote definito correttamente"
    
    # Elenca i campi del modello
    echo -e "\n${CYAN}  Campi del modello Quote:${NC}"
    grep -A 40 "model Quote" prisma/schema.prisma | grep -E "^\s+\w+" | head -20 | while read line; do
        echo "    • $line"
    done
else
    error "Modello Quote non trovato in schema.prisma"
fi

# Verifica modello QuoteVersion per versioning
check
echo -n "Modello QuoteVersion per versioning... "
if grep -q "model QuoteVersion" prisma/schema.prisma; then
    pass "Sistema versioning preventivi presente"
else
    warn "QuoteVersion non trovato - versioning non implementato"
fi

# Conta record nel database
check
echo -e "\n${CYAN}Statistiche database preventivi:${NC}"
STATS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function stats() {
  try {
    const total = await prisma.quote.count();
    const draft = await prisma.quote.count({ where: { status: 'DRAFT' } });
    const sent = await prisma.quote.count({ where: { status: 'SENT' } });
    const viewed = await prisma.quote.count({ where: { status: 'VIEWED' } });
    const accepted = await prisma.quote.count({ where: { status: 'ACCEPTED' } });
    const rejected = await prisma.quote.count({ where: { status: 'REJECTED' } });
    const expired = await prisma.quote.count({ where: { status: 'EXPIRED' } });
    
    console.log(\`  • Totale preventivi: \${total}\`);
    console.log(\`  • Bozze: \${draft}\`);
    console.log(\`  • Inviati: \${sent}\`);
    console.log(\`  • Visualizzati: \${viewed}\`);
    console.log(\`  • Accettati: \${accepted}\`);
    console.log(\`  • Rifiutati: \${rejected}\`);
    console.log(\`  • Scaduti: \${expired}\`);
    
    // Calcola metriche
    const avgAmount = await prisma.quote.aggregate({
      _avg: { totalAmount: true }
    });
    console.log(\`  • Importo medio: €\${avgAmount._avg.totalAmount?.toFixed(2) || '0'}\`);
    
  } catch(e) {
    console.log('  • Errore:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}
stats();
" 2>/dev/null || echo "  • Errore nel conteggio")
echo "$STATS"

# Analisi relazioni Prisma
echo -e "\n${CYAN}Analisi relazioni nel modello Quote:${NC}"

# Estrai solo il modello Quote
MODEL_CONTENT=$(awk '/^model Quote/,/^}/' prisma/schema.prisma)

# Verifica relazioni chiave
echo "  Relazioni principali:"
if echo "$MODEL_CONTENT" | grep -q "AssistanceRequest"; then
    pass "  • Collegamento con AssistanceRequest"
else
    error "  • Manca collegamento con AssistanceRequest"
fi

if echo "$MODEL_CONTENT" | grep -q "professional.*User"; then
    pass "  • Collegamento con Professionista"
else
    error "  • Manca collegamento con Professionista"
fi

if echo "$MODEL_CONTENT" | grep -q "client.*User"; then
    pass "  • Collegamento con Cliente"
else
    warn "  • Collegamento diretto con Cliente non trovato"
fi

# Verifica campi monetari
echo -e "\n${CYAN}  Campi monetari e calcoli:${NC}"
if echo "$MODEL_CONTENT" | grep -q "laborCost"; then
    pass "  • Campo costo manodopera presente"
fi
if echo "$MODEL_CONTENT" | grep -q "materialCost"; then
    pass "  • Campo costo materiali presente"
fi
if echo "$MODEL_CONTENT" | grep -q "travelCost"; then
    pass "  • Campo costo trasferimento presente"
fi
if echo "$MODEL_CONTENT" | grep -q "totalAmount"; then
    pass "  • Campo totale preventivo presente"
fi
if echo "$MODEL_CONTENT" | grep -q "vat\|tax\|iva"; then
    pass "  • Campo IVA/tasse presente"
else
    warn "  • Campo IVA non trovato"
fi

echo ""

# ============================================
# 2. VERIFICA PAGINE FRONTEND
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 2. PAGINE FRONTEND PREVENTIVI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd .. 2>/dev/null

echo -e "\n${CYAN}Pagine principali modulo preventivi:${NC}"

# Array delle pagine da verificare
declare -a PAGES=(
    "src/pages/quotes/QuotesListPage.tsx:Lista preventivi"
    "src/pages/quotes/QuoteDetailPage.tsx:Dettaglio preventivo"
    "src/pages/quotes/CreateQuotePage.tsx:Nuovo preventivo"
    "src/pages/quotes/EditQuotePage.tsx:Modifica preventivo"
    "src/pages/professional/MyQuotes.tsx:I miei preventivi (professionista)"
    "src/pages/client/ReceivedQuotes.tsx:Preventivi ricevuti (cliente)"
)

FOUND_PAGES=0
for page_info in "${PAGES[@]}"; do
    IFS=':' read -r page_path description <<< "$page_info"
    check
    if [ -f "$page_path" ]; then
        pass "$description - $(basename $page_path)"
        FOUND_PAGES=$((FOUND_PAGES + 1))
        
        # Verifica uso di React Query
        if grep -q "useQuery\|useMutation" "$page_path" 2>/dev/null; then
            echo "      ✓ Usa React Query"
        fi
        
        # Verifica TypeScript types
        if grep -q "interface\|type.*=.*{" "$page_path" 2>/dev/null; then
            echo "      ✓ TypeScript types definiti"
        fi
    else
        # Cerca file alternativi con pattern Quote
        ALT_FILE=$(find src -name "*[Qq]uote*Page.tsx" -type f 2>/dev/null | grep -v backup | head -1)
        if [ -n "$ALT_FILE" ]; then
            info "$description non trovata, ma trovato: $(basename $ALT_FILE)"
        else
            warn "$description non trovata"
        fi
    fi
done

echo -e "\n${CYAN}Componenti correlati preventivi:${NC}"

# Componenti aggiuntivi
declare -a COMPONENTS=(
    "src/components/quotes/QuoteForm.tsx:Form preventivo"
    "src/components/quotes/QuoteCard.tsx:Card preventivo"
    "src/components/quotes/QuoteStatus.tsx:Badge stato preventivo"
    "src/components/quotes/QuoteCalculator.tsx:Calcolatore prezzi"
    "src/components/quotes/QuoteVersionHistory.tsx:Storia versioni"
    "src/components/quotes/QuotePDF.tsx:Generatore PDF"
    "src/components/quotes/AcceptRejectButtons.tsx:Pulsanti accetta/rifiuta"
)

for comp_info in "${COMPONENTS[@]}"; do
    IFS=':' read -r comp_path description <<< "$comp_info"
    check
    if [ -f "$comp_path" ]; then
        pass "$description"
    else
        # Cerca componenti alternativi
        ALT_COMP=$(find src/components -name "*[Qq]uote*.tsx" -type f 2>/dev/null | grep "$description" | head -1)
        if [ -n "$ALT_COMP" ]; then
            info "$description trovato in posizione alternativa"
        else
            info "$description non trovato (opzionale)"
        fi
    fi
done

# Conta totale componenti Quote
TOTAL_COMPONENTS=$(find src -name "*[Qq]uote*.tsx" -type f 2>/dev/null | grep -v backup | wc -l)
echo -e "\n${CYAN}📊 Totale componenti Quote trovati: $TOTAL_COMPONENTS${NC}"

echo ""

# ============================================
# 3. VERIFICA TYPESCRIPT BACKEND
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📘 3. CONTROLLI TYPESCRIPT BACKEND${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd backend 2>/dev/null

if [ "$SKIP_TYPESCRIPT" = true ]; then
    info "Controlli TypeScript saltati (--skip-typescript)"
else
    # Verifica TypeScript per il modulo quote
    check
    echo "Analisi TypeScript del modulo preventivi..."
    
    # Esegui TypeScript e salva output
    TS_OUTPUT=$(timeout 15 npx tsc --noEmit 2>&1 || true)
    
    # Analizza errori per file quote
    echo -e "\n${CYAN}Errori TypeScript per file:${NC}"
    
    # Routes
    ROUTES_ERRORS=$(echo "$TS_OUTPUT" | grep "src/routes/quote.routes.ts" | wc -l | tr -d ' ')
    if [ "$ROUTES_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 quote.routes.ts: $ROUTES_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/routes/quote.routes.ts" | head -3
    else
        pass "  📁 quote.routes.ts: Nessun errore"
    fi
    
    # Services
    SERVICE_ERRORS=$(echo "$TS_OUTPUT" | grep "src/services/quote.service.ts" | wc -l | tr -d ' ')
    if [ "$SERVICE_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 quote.service.ts: $SERVICE_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/services/quote.service.ts" | head -3
    else
        pass "  📁 quote.service.ts: Nessun errore"
    fi
    
    QUOTE_TS_ERRORS=$((ROUTES_ERRORS + SERVICE_ERRORS))
fi

# Verifica tipi per Quote
check
echo -e "\n${CYAN}Definizioni TypeScript:${NC}"
if [ -f "src/types/quote.types.ts" ]; then
    pass "File types dedicato presente"
elif grep -q "interface.*Quote\|type.*Quote" src/**/*.ts 2>/dev/null; then
    pass "Types Quote definiti nei file"
else
    warn "Types Quote non trovati"
fi

echo ""

# ============================================
# 4. VERIFICA API ROUTES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 4. API ROUTES (/api/quotes)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/routes/quote.routes.ts" ]; then
    echo -e "\n${CYAN}Endpoints trovati:${NC}"
    
    # Endpoints essenziali per preventivi
    declare -a ESSENTIAL_ENDPOINTS=(
        "GET:/:Lista preventivi"
        "GET:/:id:Dettaglio preventivo"
        "POST:/:Crea preventivo"
        "PUT:/:id:Aggiorna preventivo"
        "POST:/:id/send:Invia preventivo"
        "POST:/:id/accept:Accetta preventivo"
        "POST:/:id/reject:Rifiuta preventivo"
        "GET:/:id/versions:Storia versioni"
        "GET:/:id/pdf:Genera PDF"
        "POST:/:id/duplicate:Duplica preventivo"
    )
    
    for endpoint_info in "${ESSENTIAL_ENDPOINTS[@]}"; do
        IFS=':' read -r method path description <<< "$endpoint_info"
        check
        if grep -q "router.$method.*['\"].*$path" src/routes/quote.routes.ts 2>/dev/null; then
            pass "[$method] $path - $description"
        else
            warn "[$method] $path - $description non trovato"
        fi
    done
    
    # Verifica ResponseFormatter
    check
    echo -e "\n${CYAN}Verifiche qualità Routes:${NC}"
    FORMATTER_COUNT=$(grep -c "ResponseFormatter" src/routes/quote.routes.ts 2>/dev/null)
    if [ "$FORMATTER_COUNT" -gt 0 ]; then
        pass "ResponseFormatter utilizzato ($FORMATTER_COUNT volte)"
    else
        error "ResponseFormatter NON utilizzato!"
    fi
    
    # Verifica autenticazione
    check
    AUTH_COUNT=$(grep -c "authenticate" src/routes/quote.routes.ts 2>/dev/null)
    if [ "$AUTH_COUNT" -gt 0 ]; then
        pass "Middleware authenticate presente ($AUTH_COUNT volte)"
    else
        error "Middleware authenticate mancante!"
    fi
else
    error "File quote.routes.ts non trovato!"
fi

echo ""

# ============================================
# 5. VERIFICA SERVICES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 5. SERVICES LAYER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/services/quote.service.ts" ]; then
    echo -e "\n${CYAN}Funzioni essenziali nel service:${NC}"
    
    # Funzioni essenziali per preventivi
    declare -a ESSENTIAL_FUNCTIONS=(
        "createQuote:Creazione preventivo"
        "updateQuote:Aggiornamento preventivo"
        "calculateTotal:Calcolo totale"
        "sendQuote:Invio preventivo"
        "acceptQuote:Accettazione"
        "rejectQuote:Rifiuto"
        "duplicateQuote:Duplicazione"
        "generatePDF:Generazione PDF"
        "checkExpiry:Controllo scadenza"
    )
    
    for func_info in "${ESSENTIAL_FUNCTIONS[@]}"; do
        IFS=':' read -r func_name description <<< "$func_info"
        check
        if grep -q "function $func_name\|const $func_name\|export.*$func_name" src/services/quote.service.ts 2>/dev/null; then
            pass "$description - $func_name()"
        else
            warn "$description - $func_name() non trovata"
        fi
    done
    
    # NON deve usare ResponseFormatter
    check
    FORMATTER_IN_SERVICE=$(grep -c "ResponseFormatter" src/services/quote.service.ts 2>/dev/null)
    if [ "$FORMATTER_IN_SERVICE" -eq 0 ]; then
        pass "ResponseFormatter NON usato nel service (corretto)"
    else
        error "ResponseFormatter trovato nel service (ERRORE!)"
    fi
else
    error "File quote.service.ts non trovato!"
fi

echo ""

# ============================================
# 6. BUSINESS LOGIC PREVENTIVI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💼 6. BUSINESS LOGIC PREVENTIVI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifiche logica di business:${NC}"

# Calcolo prezzi
check
echo -n "Calcolo automatico totale... "
if grep -q "laborCost.*+.*materialCost.*+.*travelCost" src/services/quote.service.ts 2>/dev/null; then
    pass "Formula calcolo implementata"
else
    warn "Formula calcolo non trovata"
fi

# Gestione IVA
check
echo -n "Gestione IVA/tasse... "
if grep -qE "vat|tax|iva|VAT|IVA" src/services/quote.service.ts 2>/dev/null; then
    pass "Calcolo IVA presente"
else
    warn "Gestione IVA non trovata"
fi

# Scadenza preventivi
check
echo -n "Gestione scadenza preventivi... "
if grep -qE "expiry|expire|scaden|validUntil" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema scadenza implementato"
else
    warn "Gestione scadenza non trovata"
fi

# Versioning preventivi
check
echo -n "Sistema versioning... "
if grep -q "version\|Version\|revision" src/services/quote.service.ts 2>/dev/null; then
    pass "Versioning implementato"
else
    info "Versioning non implementato"
fi

# Template preventivi
check
echo -n "Template preventivi... "
if grep -q "template\|Template" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema template presente"
else
    info "Template non implementati"
fi

echo ""

# ============================================
# 7. INTEGRAZIONI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 7. INTEGRAZIONI CON ALTRI MODULI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifico integrazioni:${NC}"

# Integrazione con Richieste
check
if grep -q "assistanceRequest\|AssistanceRequest" src/services/quote.service.ts 2>/dev/null; then
    pass "Integrazione con modulo Richieste"
else
    error "Manca integrazione con Richieste"
fi

# Integrazione con Notifiche
check
if grep -q "notification\|sendNotification" src/services/quote.service.ts 2>/dev/null; then
    pass "Integrazione con sistema Notifiche"
else
    warn "Integrazione Notifiche non trovata"
fi

# Integrazione Email
check
if grep -q "sendEmail\|email" src/services/quote.service.ts 2>/dev/null; then
    pass "Integrazione invio Email"
else
    warn "Integrazione Email non trovata"
fi

# Integrazione PDF
check
if grep -q "pdf\|PDF\|generatePDF" src/services/quote.service.ts 2>/dev/null; then
    pass "Integrazione generazione PDF"
else
    warn "Generazione PDF non trovata"
fi

# Integrazione Pagamenti
check
if grep -q "payment\|Payment\|stripe" src/services/quote.service.ts 2>/dev/null; then
    pass "Integrazione con Pagamenti"
else
    info "Integrazione Pagamenti non trovata"
fi

echo ""

# ============================================
# 8. WORKFLOW E STATI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 8. WORKFLOW E STATI PREVENTIVO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Stati del preventivo:${NC}"

# Verifica enum stati
if grep -q "enum QuoteStatus" prisma/schema.prisma 2>/dev/null; then
    echo "  Stati definiti in schema:"
    grep -A 10 "enum QuoteStatus" prisma/schema.prisma | grep -E "^\s+\w+" | while read state; do
        echo "    • $state"
    done
else
    warn "Enum QuoteStatus non definito"
fi

# Verifica transizioni di stato
echo -e "\n${CYAN}Transizioni di stato:${NC}"

declare -a TRANSITIONS=(
    "DRAFT.*SENT:Da bozza a inviato"
    "SENT.*VIEWED:Da inviato a visualizzato"
    "VIEWED.*ACCEPTED:Da visualizzato ad accettato"
    "VIEWED.*REJECTED:Da visualizzato a rifiutato"
    "canEdit.*DRAFT:Solo bozze modificabili"
    "canSend.*DRAFT:Solo bozze inviabili"
)

for transition_info in "${TRANSITIONS[@]}"; do
    IFS=':' read -r pattern description <<< "$transition_info"
    check
    if grep -q "$pattern" src/services/quote.service.ts 2>/dev/null; then
        pass "$description"
    else
        info "$description - non verificabile"
    fi
done

echo ""

# ============================================
# 9. SICUREZZA E PERMESSI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 9. SICUREZZA E PERMESSI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Controlli di sicurezza:${NC}"

# Solo professionista può creare preventivi
check
if grep -q "role.*PROFESSIONAL\|isProfessional" src/routes/quote.routes.ts 2>/dev/null; then
    pass "Solo professionisti possono creare preventivi"
else
    warn "Controllo ruolo professionista non trovato"
fi

# Cliente può solo visualizzare/accettare/rifiutare
check
if grep -q "checkOwnership\|isOwner\|userId.*===.*req.user.id" src/services/quote.service.ts 2>/dev/null; then
    pass "Controllo ownership implementato"
else
    warn "Controllo ownership non verificabile"
fi

# Preventivo non modificabile dopo invio
check
if grep -q "status.*!==.*DRAFT\|canEdit" src/services/quote.service.ts 2>/dev/null; then
    pass "Blocco modifica dopo invio"
else
    warn "Controllo modifica non trovato"
fi

echo ""

# ============================================
# 10. TESTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 10. TEST E QUALITÀ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}File di test:${NC}"

# Cerca test per quote
TEST_FILES=$(find . -name "*quote*.test.ts" -o -name "*quote*.spec.ts" 2>/dev/null | wc -l)
check
if [ "$TEST_FILES" -gt 0 ]; then
    pass "Trovati $TEST_FILES file di test"
    find . -name "*quote*.test.ts" -o -name "*quote*.spec.ts" 2>/dev/null | head -5 | while read test; do
        echo "    • $(basename $test)"
    done
else
    warn "Nessun file di test trovato"
fi

echo ""

# ============================================
# 11. PERFORMANCE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚡ 11. OTTIMIZZAZIONI PERFORMANCE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Ottimizzazioni implementate:${NC}"

# Cache
check
if grep -q "cache\|Cache\|redis" src/services/quote.service.ts 2>/dev/null; then
    pass "Caching implementato"
    CACHE_USAGE=1
else
    info "Cache non implementata"
fi

# Paginazione
check
if grep -q "skip\|take\|limit\|pagination" src/services/quote.service.ts 2>/dev/null; then
    pass "Paginazione implementata"
else
    warn "Paginazione non trovata"
fi

# Query optimization
check
if grep -q "select:\|include:" src/services/quote.service.ts 2>/dev/null; then
    pass "Query ottimizzate con select/include"
else
    warn "Query non ottimizzate"
fi

# Indici database
check
echo -n "Verifica indici database... "
if grep -q "@@index\|@@unique" prisma/schema.prisma | grep -i quote 2>/dev/null; then
    pass "Indici definiti per Quote"
    INDEX_COUNT=1
else
    info "Nessun indice specifico per Quote"
fi

echo ""

# ============================================
# 12. DOCUMENTAZIONE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📚 12. DOCUMENTAZIONE CODICE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Documentazione JSDoc:${NC}"

# JSDoc nelle routes
check
JSDOC_ROUTES=$(grep -c "/\*\*" src/routes/quote.routes.ts 2>/dev/null || echo 0)
if [ "$JSDOC_ROUTES" -gt 0 ]; then
    pass "JSDoc in routes: $JSDOC_ROUTES blocchi"
else
    info "JSDoc non presente in routes"
fi

# JSDoc nel service
check
JSDOC_SERVICE=$(grep -c "/\*\*" src/services/quote.service.ts 2>/dev/null || echo 0)
if [ "$JSDOC_SERVICE" -gt 0 ]; then
    pass "JSDoc in service: $JSDOC_SERVICE blocchi"
else
    info "JSDoc non presente in service"
fi

echo ""

# ============================================
# 13. REAL-TIME E WEBSOCKET
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔌 13. WEBSOCKET E REAL-TIME${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Eventi real-time:${NC}"

# WebSocket nel service
check
WS_IN_SERVICE=$(grep -c "io\.\|socket\.\|emit\|broadcast" src/services/quote.service.ts 2>/dev/null || echo 0)
if [ "$WS_IN_SERVICE" -gt 0 ]; then
    pass "Eventi WebSocket implementati ($WS_IN_SERVICE riferimenti)"
    
    # Cerca eventi specifici
    echo "  Eventi emessi:"
    grep -o "emit('[^']*'" src/services/quote.service.ts 2>/dev/null | head -5 | while read event; do
        echo "    • $event"
    done
else
    info "WebSocket non implementato nel service"
fi

echo ""

# ============================================
# 14. LOGGING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 14. SISTEMA DI LOGGING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Utilizzo logger:${NC}"

# Logger usage
check
LOGGER_USAGE=$(grep -c "logger\.\|Logger\." src/services/quote.service.ts 2>/dev/null || echo 0)
if [ "$LOGGER_USAGE" -gt 0 ]; then
    pass "Logger utilizzato ($LOGGER_USAGE volte)"
else
    warn "Logger non utilizzato"
fi

# Console.log (non dovrebbero esserci)
check
CONSOLE_LOG=$(grep -c "console\.log" src/services/quote.service.ts src/routes/quote.routes.ts 2>/dev/null || echo 0)
if [ "$CONSOLE_LOG" -eq 0 ]; then
    pass "Nessun console.log trovato"
else
    warn "Trovati $CONSOLE_LOG console.log (sostituire con logger)"
fi

echo ""

# ============================================
# 15. FUNZIONALITÀ AVANZATE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 15. FUNZIONALITÀ AVANZATE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Funzionalità speciali:${NC}"

# Scaglioni chilometrici
check
if grep -q "travelDistance\|kmRange\|distanceRange" src/services/quote.service.ts 2>/dev/null; then
    pass "Scaglioni chilometrici implementati"
else
    info "Scaglioni chilometrici non trovati"
fi

# Firma digitale
check
if grep -q "signature\|sign\|firma" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema firma digitale presente"
else
    info "Firma digitale non implementata"
fi

# Negoziazione/Counter-offer
check
if grep -q "counter\|negotiate\|contrattazione" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema negoziazione presente"
else
    info "Negoziazione non implementata"
fi

# Multi-valuta
check
if grep -q "currency\|EUR\|USD" src/services/quote.service.ts 2>/dev/null; then
    pass "Supporto multi-valuta"
else
    info "Multi-valuta non implementato"
fi

# Sconti e promozioni
check
if grep -q "discount\|promo\|sconto" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema sconti presente"
else
    info "Sistema sconti non trovato"
fi

echo ""

# ============================================
# 16. INTEGRAZIONE BACKUP
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 16. INTEGRAZIONE BACKUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema backup:${NC}"

# Export dati
check
if grep -q "export\|Export\|backup" src/services/quote.service.ts 2>/dev/null; then
    pass "Funzione export dati presente"
else
    info "Export dati non implementato"
fi

echo ""

# ============================================
# 17. MONITORING E ALERTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔔 17. MONITORING E ALERTING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema monitoring:${NC}"

# Health check endpoint
check
if grep -q "health\|/health" src/routes/quote.routes.ts 2>/dev/null; then
    pass "Health check endpoint presente"
else
    info "Health check non implementato"
fi

# Metriche
check
if grep -q "metric\|statistic\|analytics" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema metriche presente"
else
    info "Metriche non implementate"
fi

# Alert su eventi critici
check
if grep -q "alert\|Alert\|critical" src/services/quote.service.ts 2>/dev/null; then
    pass "Sistema alert presente"
else
    info "Alert non implementati"
fi

echo ""

# ============================================
# RIEPILOGO FINALE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RIEPILOGO FINALE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Calcola health score
if [ "$TOTAL_CHECKS" -eq 0 ]; then
    HEALTH_SCORE=0
else
    HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
fi

echo ""
echo "📈 Risultati:"
echo "  • Controlli totali: $TOTAL_CHECKS"
echo -e "  • Passati: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "  • Warning: ${YELLOW}$WARNINGS${NC}"
echo -e "  • Errori: ${RED}$ERRORS${NC}"
echo ""

# Valuta lo stato del sistema
echo -n "🏥 Health Score: "
if [ "$HEALTH_SCORE" -ge 80 ]; then
    echo -e "${GREEN}$HEALTH_SCORE% - MODULO PREVENTIVI OTTIMO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - MODULO PREVENTIVI BUONO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 40 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - MODULO PREVENTIVI CON PROBLEMI${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}$HEALTH_SCORE% - MODULO PREVENTIVI CRITICO${NC}"
    EXIT_CODE=1
fi

echo ""

# Raccomandazioni
if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI PER IL MODULO PREVENTIVI:"
    echo ""
    
    if [ "$ERRORS" -gt 0 ]; then
        echo -e "${RED}CRITICI da risolvere:${NC}"
        
        if [ "$FORMATTER_IN_SERVICE" -gt 0 ]; then
            echo "  ❗ Rimuovere ResponseFormatter dal service quote"
        fi
        
        if [ "$FORMATTER_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere ResponseFormatter alle routes quote"
        fi
        
        if [ "$AUTH_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere autenticazione alle routes"
        fi
        
        if [ "$QUOTE_TS_ERRORS" -gt 0 ]; then
            echo "  ❗ Correggere $QUOTE_TS_ERRORS errori TypeScript"
        fi
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "\n${YELLOW}MIGLIORAMENTI consigliati:${NC}"
        
        if [ "$VALIDATION_COUNT" -eq 0 ]; then
            echo "  📌 Implementare validazione input con Zod"
        fi
        
        if [ "$TRANSACTION_COUNT" -eq 0 ]; then
            echo "  📌 Usare transazioni per operazioni multiple"
        fi
        
        if [ "$TEST_FILES" -eq 0 ]; then
            echo "  📌 Aggiungere test per il modulo preventivi"
        fi
        
        if [ "$CACHE_USAGE" -eq 0 ]; then
            echo "  📌 Implementare cache per performance"
        fi
        
        echo "  📌 Verificare calcolo IVA e scadenza preventivi"
        echo "  📌 Implementare versioning preventivi"
        echo "  📌 Aggiungere template preventivi"
    fi
    
    echo ""
fi

echo -e "${GREEN}✅ Analisi completata del modulo Preventivi!${NC}"
echo ""
echo "📊 Sezioni analizzate: 17"
echo "🔍 Controlli effettuati: $TOTAL_CHECKS"
echo "⏱️  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

exit $EXIT_CODE
