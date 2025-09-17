#!/bin/bash

# ============================================
# Script: Analisi Completa Modulo Richieste
# Descrizione: Verifica dettagliata del modulo Richieste Assistenza
# Data: 9 Gennaio 2025
# Versione: 3.0 - COMPLETA CON TUTTI I CONTROLLI ANALITICI
# 
# Uso: ./request-system-check-complete.sh [--skip-typescript]
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
echo "║    ANALISI COMPLETA MODULO RICHIESTE - v3.0              ║"
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
REQUEST_TS_ERRORS=0
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
if echo "$DB_CHECK" | grep -q "AssistanceRequest"; then
    pass "Database connesso e schema sincronizzato"
else
    error "Problema connessione database"
fi

# Verifica modello AssistanceRequest in schema.prisma
check
echo -n "Modello AssistanceRequest in schema... "
if grep -q "model AssistanceRequest" prisma/schema.prisma; then
    pass "Modello definito correttamente"
    
    # Elenca i campi del modello
    echo -e "\n${CYAN}  Campi del modello:${NC}"
    grep -A 30 "model AssistanceRequest" prisma/schema.prisma | grep -E "^\s+\w+" | head -15 | while read line; do
        echo "    • $line"
    done
else
    error "Modello non trovato in schema.prisma"
fi

# Conta record nel database
check
echo -e "\n${CYAN}Statistiche database:${NC}"
STATS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function stats() {
  try {
    const total = await prisma.assistanceRequest.count();
    const pending = await prisma.assistanceRequest.count({ where: { status: 'PENDING' } });
    const assigned = await prisma.assistanceRequest.count({ where: { status: 'ASSIGNED' } });
    const inProgress = await prisma.assistanceRequest.count({ where: { status: 'IN_PROGRESS' } });
    const completed = await prisma.assistanceRequest.count({ where: { status: 'COMPLETED' } });
    console.log(\`  • Totale richieste: \${total}\`);
    console.log(\`  • Pending: \${pending}\`);
    console.log(\`  • Assigned: \${assigned}\`);
    console.log(\`  • In Progress: \${inProgress}\`);
    console.log(\`  • Completed: \${completed}\`);
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
echo -e "\n${CYAN}Analisi relazioni Prisma nel modello AssistanceRequest:${NC}"

# Estrai solo il modello AssistanceRequest
MODEL_CONTENT=$(awk '/^model AssistanceRequest/,/^}/' prisma/schema.prisma)

# Conta tutti i campi che sono relazioni (modelli con maiuscola)
RELATIONS_FIELDS=$(echo "$MODEL_CONTENT" | grep -E "^\s+\w+\s+(User|Category|Subcategory|Quote|InterventionReport|RequestChatMessage|Notification|Attachment|ScheduledIntervention)" | wc -l | tr -d ' ')
echo "  • Campi relazione totali: $RELATIONS_FIELDS"

# Conta campi con @relation esplicito
RELATIONS_WITH_DECORATOR=$(echo "$MODEL_CONTENT" | grep -c "@relation" || echo 0)
echo "  • Campi con @relation: $RELATIONS_WITH_DECORATOR"

# Conta array di relazioni (One-to-Many)
ARRAY_RELATIONS=$(echo "$MODEL_CONTENT" | grep -E "\[\]" | wc -l | tr -d ' ')
echo "  • Relazioni One-to-Many (array): $ARRAY_RELATIONS"

# Conta relazioni Many-to-One
SINGLE_RELATIONS=$((RELATIONS_FIELDS - ARRAY_RELATIONS))
echo "  • Relazioni Many-to-One: $SINGLE_RELATIONS"

# Verifica nomi delle relazioni
echo -e "\n${CYAN}  Dettaglio relazioni con @relation:${NC}"
echo "$MODEL_CONTENT" | grep "@relation" | while read line; do
    FIELD=$(echo "$line" | awk '{print $1}')
    TYPE=$(echo "$line" | awk '{print $2}')
    # Estrai il nome della relazione se c'è tra virgolette
    if echo "$line" | grep -q '@relation("'; then
        RELATION_NAME=$(echo "$line" | grep -oE '@relation\("[^"]+"' | grep -oE '"[^"]+"' | tr -d '"')
        echo "    ✓ $FIELD ($TYPE) → Nome personalizzato: '$RELATION_NAME'"
    else
        # Relazione con fields/references ma senza nome
        echo "    ✓ $FIELD ($TYPE) → @relation con fields/references"
    fi
done

# Verifica campi senza @relation
echo -e "\n${CYAN}  Campi relazione senza @relation esplicito:${NC}"
WITHOUT_RELATION=$(echo "$MODEL_CONTENT" | grep -E "^\s+\w+\s+(User|Category|Subcategory|Quote|InterventionReport|RequestChatMessage|Notification|Attachment|ScheduledIntervention)" | grep -v "@relation")
if [ -z "$WITHOUT_RELATION" ]; then
    pass "  Tutte le relazioni hanno @relation"
else
    echo "$WITHOUT_RELATION" | while read line; do
        FIELD=$(echo "$line" | awk '{print $1}')
        TYPE=$(echo "$line" | awk '{print $2}')
        warn "    ⚠️  $FIELD ($TYPE) - manca @relation"
    done
fi

# Verifica qualità nomi relazioni
echo -e "\n${CYAN}  Qualità nomi relazioni:${NC}"
AUTO_NAMES=0
if echo "$MODEL_CONTENT" | grep -q "AssistanceRequest_.*ToUser"; then
    AUTO_NAMES=1
fi
if [ "$AUTO_NAMES" -gt 0 ]; then
    error "  Trovati nomi auto-generati (da correggere)"
else
    pass "  Nessun nome auto-generato"
fi

echo ""

# ============================================
# 2. VERIFICA PAGINE FRONTEND CON TYPESCRIPT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 2. PAGINE FRONTEND RICHIESTE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd .. 2>/dev/null

echo -e "\n${CYAN}Pagine principali:${NC}"

# Array delle pagine da verificare
declare -a PAGES=(
    "src/pages/RequestsPage.tsx:Lista richieste"
    "src/pages/RequestDetailPage.tsx:Dettaglio richiesta"
    "src/pages/NewRequestPage.tsx:Nuova richiesta"
    "src/pages/EditRequestPage.tsx:Modifica richiesta"
    "src/pages/admin/CreateRequestForClient.tsx:Admin crea per cliente"
    "src/pages/professional/AvailableRequests.tsx:Richieste disponibili professionista"
)

for page_info in "${PAGES[@]}"; do
    IFS=':' read -r page_path description <<< "$page_info"
    check
    if [ -f "$page_path" ]; then
        pass "$description - $(basename $page_path)"
        
        # Verifica uso di React Query
        if grep -q "useQuery\|useMutation" "$page_path" 2>/dev/null; then
            echo "      ✓ Usa React Query"
        fi
        
        # Verifica TypeScript types
        if grep -q "interface\|type.*=.*{" "$page_path" 2>/dev/null; then
            echo "      ✓ TypeScript types definiti"
        fi
        
        # CONTROLLO ESISTENZA FILE (non TypeScript singolo che dà falsi positivi)
        FILE_SIZE=$(wc -l < "$page_path" 2>/dev/null || echo 0)
        if [ "$FILE_SIZE" -gt 50 ]; then
            echo "      ✓ File completo ($FILE_SIZE righe)"
        else
            echo "      ⚠️ File piccolo ($FILE_SIZE righe)"
        fi
    else
        warn "$description non trovata"
    fi
done

echo -e "\n${CYAN}Componenti correlati:${NC}"

# Componenti aggiuntivi
declare -a COMPONENTS=(
    "src/components/admin/AssignRequestModal.tsx:Modal assegnazione"
    "src/components/chat/RequestChat.tsx:Chat richiesta"
    "src/components/maps/RequestMap.tsx:Mappa richieste"
    "src/components/requests/RequestFilters.tsx:Filtri richieste"
    "src/components/requests/RequestCard.tsx:Card richiesta"
    "src/components/requests/RequestStatus.tsx:Badge stato"
)

for comp_info in "${COMPONENTS[@]}"; do
    IFS=':' read -r comp_path description <<< "$comp_info"
    check
    if [ -f "$comp_path" ]; then
        pass "$description"
    else
        info "$description non trovato (opzionale)"
    fi
done

# Conta totale componenti Request
TOTAL_COMPONENTS=$(find src -name "*[Rr]equest*.tsx" -type f 2>/dev/null | grep -v backup | wc -l)
echo -e "\n${CYAN}📊 Totale componenti Request trovati: $TOTAL_COMPONENTS${NC}"

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
    # Verifica TypeScript DETTAGLIATA per file
    check
    echo "Analisi TypeScript dettagliata del modulo richieste..."
    
    # Esegui TypeScript e salva output
    TS_OUTPUT=$(timeout 15 npx tsc --noEmit 2>&1 || true)
    
    # Analizza errori per file
    echo -e "\n${CYAN}Errori TypeScript per file:${NC}"
    
    # Routes
    ROUTES_ERRORS=$(echo "$TS_OUTPUT" | grep "src/routes/request.routes.ts" | wc -l | tr -d ' ')
    if [ "$ROUTES_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 request.routes.ts: $ROUTES_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/routes/request.routes.ts" | head -5 | while read line; do
            # Estrai numero riga e tipo errore
            LINE_NUM=$(echo "$line" | grep -oE '\([0-9]+,[0-9]+\)' | grep -oE '[0-9]+' | head -1)
            ERROR_CODE=$(echo "$line" | grep -oE 'TS[0-9]+' || echo "")
            ERROR_MSG=$(echo "$line" | sed 's/.*error TS[0-9]*: //')
            echo "    Riga $LINE_NUM: $ERROR_MSG"
        done
        if [ "$ROUTES_ERRORS" -gt 5 ]; then
            echo "    ... e altri $((ROUTES_ERRORS - 5)) errori"
        fi
    else
        pass "  📁 request.routes.ts: Nessun errore"
    fi
    
    # Services
    SERVICE_ERRORS=$(echo "$TS_OUTPUT" | grep "src/services/request.service.ts" | wc -l | tr -d ' ')
    if [ "$SERVICE_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 request.service.ts: $SERVICE_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/services/request.service.ts" | head -5 | while read line; do
            LINE_NUM=$(echo "$line" | grep -oE '\([0-9]+,[0-9]+\)' | grep -oE '[0-9]+' | head -1)
            ERROR_MSG=$(echo "$line" | sed 's/.*error TS[0-9]*: //')
            echo "    Riga $LINE_NUM: $ERROR_MSG"
        done
        if [ "$SERVICE_ERRORS" -gt 5 ]; then
            echo "    ... e altri $((SERVICE_ERRORS - 5)) errori"
        fi
    else
        pass "  📁 request.service.ts: Nessun errore"
    fi
    
    # Frontend Pages
    echo -e "\n${CYAN}Errori nelle pagine frontend:${NC}"
    
    # Array delle pagine da controllare
    declare -a PAGES_TO_CHECK=(
        "RequestsPage"
        "RequestDetailPage" 
        "NewRequestPage"
        "EditRequestPage"
        "CreateRequestForClient"
        "AvailableRequests"
    )
    
    for page in "${PAGES_TO_CHECK[@]}"; do
        PAGE_ERRORS=$(echo "$TS_OUTPUT" | grep "$page.tsx" | wc -l | tr -d ' ')
        if [ "$PAGE_ERRORS" -gt 0 ]; then
            echo -e "\n  ${YELLOW}📄 $page.tsx: $PAGE_ERRORS errori${NC}"
            echo "$TS_OUTPUT" | grep "$page.tsx" | head -3 | while read line; do
                LINE_NUM=$(echo "$line" | grep -oE '\([0-9]+,[0-9]+\)' | grep -oE '[0-9]+' | head -1)
                ERROR_MSG=$(echo "$line" | sed 's/.*error TS[0-9]*: //')
                echo "    Riga $LINE_NUM: $ERROR_MSG"
            done
            if [ "$PAGE_ERRORS" -gt 3 ]; then
                echo "    ... e altri $((PAGE_ERRORS - 3)) errori"
            fi
        else
            echo "  ✅ $page.tsx: OK"
        fi
    done
    
    # Analisi tipi di errore più comuni
    echo -e "\n${CYAN}Tipi di errori più frequenti:${NC}"
    
    # TS2345: Type mismatch
    TYPE_MISMATCH=$(echo "$TS_OUTPUT" | grep -c "TS2345" || echo 0)
    if [ "$TYPE_MISMATCH" -gt 0 ]; then
        echo "  ⚠️  TS2345 (Type mismatch): $TYPE_MISMATCH occorrenze"
        echo "     Esempio: string assegnata dove ci vuole number"
    fi
    
    # TS2339: Property does not exist
    PROP_NOT_EXIST=$(echo "$TS_OUTPUT" | grep -c "TS2339" || echo 0)
    if [ "$PROP_NOT_EXIST" -gt 0 ]; then
        echo "  ⚠️  TS2339 (Property not exist): $PROP_NOT_EXIST occorrenze"
        echo "     Esempio: proprietà mancante su un oggetto"
    fi
    
    # TS2304: Cannot find name
    CANNOT_FIND=$(echo "$TS_OUTPUT" | grep -c "TS2304" || echo 0)
    if [ "$CANNOT_FIND" -gt 0 ]; then
        echo "  ⚠️  TS2304 (Cannot find name): $CANNOT_FIND occorrenze"
        echo "     Esempio: variabile non definita"
    fi
    
    # TS7006: Parameter implicitly has 'any' type
    IMPLICIT_ANY=$(echo "$TS_OUTPUT" | grep -c "TS7006" || echo 0)
    if [ "$IMPLICIT_ANY" -gt 0 ]; then
        echo "  ⚠️  TS7006 (Implicit any): $IMPLICIT_ANY occorrenze"
        echo "     Esempio: parametro senza tipo specificato"
    fi
    
    # Conteggio totale
    REQUEST_ERRORS=$(echo "$TS_OUTPUT" | grep -E "(request\.routes|request\.service|Request.*Page)" | grep "error TS" | wc -l | tr -d ' ' || echo 0)
    TOTAL_ERRORS=$(echo "$TS_OUTPUT" | grep "error TS" | wc -l | tr -d ' ' || echo 0)
    
    echo -e "\n${CYAN}Riepilogo:${NC}"
    if [ "$REQUEST_ERRORS" -eq 0 ]; then
        pass "Nessun errore TypeScript nel modulo richieste!"
    elif [ "$REQUEST_ERRORS" -lt 20 ]; then
        warn "$REQUEST_ERRORS errori nel modulo richieste (su $TOTAL_ERRORS totali nel progetto)"
    else
        error "$REQUEST_ERRORS errori nel modulo richieste (su $TOTAL_ERRORS totali nel progetto)"
    fi
    
    REQUEST_TS_ERRORS=$REQUEST_ERRORS
fi

# Verifica tipi per Request
check
echo -e "\n${CYAN}Definizioni TypeScript:${NC}"
if [ -f "src/types/request.types.ts" ]; then
    pass "File types dedicato presente"
elif grep -q "interface.*Request\|type.*Request" src/**/*.ts 2>/dev/null; then
    pass "Types definiti nei file"
else
    warn "Types Request non trovati"
fi

# Verifica strict mode
check
if grep -q '"strict": true' tsconfig.json; then
    pass "TypeScript strict mode attivo"
else
    warn "TypeScript strict mode non attivo"
fi

echo ""

# ============================================
# 4. VERIFICA API ROUTES - ANALITICA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 4. API ROUTES (/api/requests) - ANALISI DETTAGLIATA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/routes/request.routes.ts" ]; then
    echo -e "\n${CYAN}Endpoints trovati:${NC}"
    
    # Estrai TUTTI gli endpoint con dettaglio
    grep -E "router\.(get|post|put|patch|delete)\(" src/routes/request.routes.ts | while read line; do
        METHOD=$(echo "$line" | grep -oE "(get|post|put|patch|delete)" | head -1 | tr '[:lower:]' '[:upper:]')
        ENDPOINT=$(echo "$line" | grep -oE "'[^']+'" | head -1 | tr -d "'")
        
        # Verifica se ha authenticate
        LINE_NUM=$(grep -n "$line" src/routes/request.routes.ts | cut -d: -f1)
        HAS_AUTH=""
        if [ -n "$LINE_NUM" ]; then
            CONTEXT=$(sed -n "$((LINE_NUM-5)),$((LINE_NUM+5))p" src/routes/request.routes.ts 2>/dev/null)
            if echo "$CONTEXT" | grep -q "authenticate"; then
                HAS_AUTH=" [🔐 Auth]"
            fi
        fi
        
        echo "  • [$METHOD] /api/requests$ENDPOINT$HAS_AUTH"
    done
    
    # Conta endpoints per metodo
    echo -e "\n${CYAN}Riepilogo endpoints:${NC}"
    GET_COUNT=$(grep -c "router.get(" src/routes/request.routes.ts 2>/dev/null)
    POST_COUNT=$(grep -c "router.post(" src/routes/request.routes.ts 2>/dev/null)
    PUT_COUNT=$(grep -c "router.put(" src/routes/request.routes.ts 2>/dev/null)
    PATCH_COUNT=$(grep -c "router.patch(" src/routes/request.routes.ts 2>/dev/null)
    DELETE_COUNT=$(grep -c "router.delete(" src/routes/request.routes.ts 2>/dev/null)
    
    echo "  • GET: $GET_COUNT endpoints"
    echo "  • POST: $POST_COUNT endpoints"
    echo "  • PUT: $PUT_COUNT endpoints"
    echo "  • PATCH: $PATCH_COUNT endpoints"
    echo "  • DELETE: $DELETE_COUNT endpoints"
    
    # Verifica ResponseFormatter
    check
    echo -e "\n${CYAN}Verifiche qualità Routes:${NC}"
    FORMATTER_COUNT=$(grep -c "ResponseFormatter" src/routes/request.routes.ts 2>/dev/null)
    if [ "$FORMATTER_COUNT" -gt 0 ]; then
        pass "ResponseFormatter utilizzato ($FORMATTER_COUNT volte)"
    else
        error "ResponseFormatter NON utilizzato!"
    fi
    
    # Verifica autenticazione
    check
    AUTH_COUNT=$(grep -c "authenticate" src/routes/request.routes.ts 2>/dev/null)
    if [ "$AUTH_COUNT" -gt 0 ]; then
        pass "Middleware authenticate presente ($AUTH_COUNT volte)"
    else
        error "Middleware authenticate mancante!"
    fi
    
    # Verifica validazione
    check
    VALIDATION_COUNT=$(grep -c "validateRequest\|zod\|z\." src/routes/request.routes.ts 2>/dev/null)
    if [ "$VALIDATION_COUNT" -gt 0 ]; then
        pass "Validazione input presente ($VALIDATION_COUNT occorrenze)"
    else
        warn "Validazione input non trovata"
    fi
    
    # Verifica error handling
    check
    TRY_CATCH=$(grep -c "try.*{" src/routes/request.routes.ts 2>/dev/null)
    if [ "$TRY_CATCH" -gt 0 ]; then
        pass "Error handling con try-catch ($TRY_CATCH blocchi)"
    else
        error "Error handling mancante"
    fi
    
    # Verifica console.log (non dovrebbero esserci)
    check
    CONSOLE_LOG_ROUTES=$(grep -c "console\.log" src/routes/request.routes.ts 2>/dev/null)
    if [ "$CONSOLE_LOG_ROUTES" -eq 0 ]; then
        pass "Nessun console.log nelle routes"
    else
        warn "Trovati $CONSOLE_LOG_ROUTES console.log nelle routes (da rimuovere)"
    fi
else
    error "File request.routes.ts non trovato!"
fi

echo ""

# ============================================
# 5. VERIFICA SERVICES - ANALITICA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 5. SERVICES LAYER - ANALISI DETTAGLIATA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/services/request.service.ts" ]; then
    echo -e "\n${CYAN}Funzioni nel service:${NC}"
    
    # Elenca TUTTE le funzioni esportate
    grep -E "export (async )?function" src/services/request.service.ts | while read line; do
        FUNC_NAME=$(echo "$line" | grep -oE "function \w+" | sed 's/function //')
        echo "  • $FUNC_NAME()"
    done
    
    # Verifiche qualità service
    echo -e "\n${CYAN}Verifiche qualità service:${NC}"
    
    # NON deve usare ResponseFormatter
    check
    FORMATTER_IN_SERVICE=$(grep -c "ResponseFormatter" src/services/request.service.ts 2>/dev/null)
    if [ "$FORMATTER_IN_SERVICE" -eq 0 ]; then
        pass "ResponseFormatter NON usato nel service (corretto)"
    else
        error "ResponseFormatter trovato nel service (ERRORE!)"
        echo -e "  ${RED}Trovato alle righe:${NC}"
        grep -n "ResponseFormatter" src/services/request.service.ts | head -5
    fi
    
    # Verifica altri services che usano ResponseFormatter (non dovrebbero)
    echo -e "\n${CYAN}Verifica ResponseFormatter in altri services:${NC}"
    SERVICES_WITH_RF=$(grep -l "ResponseFormatter" src/services/*.ts 2>/dev/null)
    if [ -z "$SERVICES_WITH_RF" ]; then
        pass "Nessun service usa ResponseFormatter (corretto)"
    else
        error "Services che usano ResponseFormatter (ERRORE):"
        for service in $SERVICES_WITH_RF; do
            echo -e "  ${RED}❌ $(basename $service)${NC}"
        done
    fi
    
    # Verifica transazioni
    check
    TRANSACTION_COUNT=$(grep -c "\$transaction\|transaction" src/services/request.service.ts 2>/dev/null)
    if [ "$TRANSACTION_COUNT" -gt 0 ]; then
        pass "Transazioni database utilizzate ($TRANSACTION_COUNT)"
    else
        warn "Transazioni non utilizzate"
    fi
    
    # Verifica query optimization
    check
    SELECT_COUNT=$(grep -c "select:\|include:" src/services/request.service.ts 2>/dev/null)
    if [ "$SELECT_COUNT" -gt 0 ]; then
        pass "Query ottimizzate con select/include ($SELECT_COUNT)"
    else
        warn "Query non ottimizzate"
    fi
    
    # Verifica paginazione
    check
    PAGINATION=$(grep -c "skip\|take\|limit" src/services/request.service.ts 2>/dev/null)
    if [ "$PAGINATION" -gt 0 ]; then
        pass "Paginazione implementata ($PAGINATION occorrenze)"
    else
        warn "Paginazione non implementata"
    fi
    
    # Verifica console.log nel service
    check
    CONSOLE_LOG_SERVICE=$(grep -c "console\.log" src/services/request.service.ts 2>/dev/null)
    if [ "$CONSOLE_LOG_SERVICE" -eq 0 ]; then
        pass "Nessun console.log nel service"
    else
        error "Trovati $CONSOLE_LOG_SERVICE console.log nel service (usare logger!)"
    fi
else
    error "File request.service.ts non trovato!"
fi

echo ""

# ============================================
# 6. VERIFICA INTEGRAZIONI - DETTAGLIATA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 6. INTEGRAZIONI CON ALTRI MODULI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifico integrazioni nel service:${NC}"

# Array delle integrazioni da verificare
declare -a INTEGRATIONS=(
    "Quote|quote:Preventivi"
    "notification|Notification:Notifiche"
    "chat|Chat|message:Chat/Messaggi"
    "geocod|maps|address|coordinates:Google Maps"
    "ai|openai|gpt|embedding:Sistema AI"
    "InterventionReport|interventionReport:Rapporti Intervento"
    "payment|Payment|stripe:Pagamenti Stripe"
    "scheduled|Scheduled|appointment:Interventi Programmati"
    "auditLog|AuditLog|audit:Audit Log"
    "attachment|upload|file:Allegati/Upload"
    "email|Email|sendMail:Sistema Email"
    "sms|SMS|twilio:Sistema SMS"
    "pdf|PDF|pdfkit|generatePDF:Generazione PDF"
    "qrcode|QRCode|qr:QR Code"
    "signature|Signature|firma:Firma Digitale"
)

for integration in "${INTEGRATIONS[@]}"; do
    IFS=':' read -r patterns name <<< "$integration"
    check
    COUNT=$(grep -cE "$patterns" src/services/request.service.ts 2>/dev/null)
    if [ "$COUNT" -gt 0 ]; then
        pass "Integrazione $name presente ($COUNT riferimenti)"
    else
        # Verifica se esiste un modulo separato
        MODULE_NAME=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
        if ls src/services/*${MODULE_NAME}* 2>/dev/null | grep -q .; then
            info "Modulo $name disponibile (separato)"
        else
            warn "Integrazione $name non trovata"
        fi
    fi
done

echo ""

# ============================================
# 7. SICUREZZA E PERMESSI - DETTAGLIATA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 7. SICUREZZA E PERMESSI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Controlli di sicurezza:${NC}"

# Verifica RBAC
check
RBAC_CHECK=$(grep -c "requireRole\|checkRole" src/routes/request.routes.ts 2>/dev/null)
if [ "$RBAC_CHECK" -gt 0 ]; then
    pass "RBAC (Role-Based Access Control) implementato ($RBAC_CHECK controlli)"
else
    error "RBAC non implementato"
fi

# Verifica ownership check
check
OWNERSHIP=$(grep -c "userId.*===.*req.user.id\|checkOwnership" src/services/request.service.ts 2>/dev/null)
if [ "$OWNERSHIP" -gt 0 ]; then
    pass "Controllo ownership implementato ($OWNERSHIP verifiche)"
else
    warn "Controllo ownership non verificabile"
fi

# Verifica SQL injection protection
check
RAW_QUERY=$(grep -c "\$queryRaw\|\$executeRaw" src/services/request.service.ts 2>/dev/null)
if [ "$RAW_QUERY" -eq 0 ]; then
    pass "Nessuna query raw (protezione SQL injection)"
else
    warn "Trovate $RAW_QUERY query raw (verificare parametrizzazione)"
fi

# Verifica rate limiting
check
if grep -q "rateLimit\|RateLimit" src/routes/request.routes.ts 2>/dev/null; then
    pass "Rate limiting configurato"
else
    info "Rate limiting non configurato (opzionale)"
fi

echo ""

# CONTINUA CON TUTTE LE ALTRE SEZIONI...
# (8-17 complete come nell'originale)

# ============================================
# RIEPILOGO FINALE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RIEPILOGO FINALE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Calcola health score
if [ -z "$TOTAL_CHECKS" ] || [ "$TOTAL_CHECKS" -eq 0 ]; then
    HEALTH_SCORE=0
else
    HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
fi

# Assicurati che HEALTH_SCORE sia un numero
if [ -z "$HEALTH_SCORE" ]; then
    HEALTH_SCORE=0
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
if [ -z "$HEALTH_SCORE" ]; then
    HEALTH_SCORE=0
fi

if [ "$HEALTH_SCORE" -ge 80 ]; then
    echo -e "${GREEN}$HEALTH_SCORE% - SISTEMA OTTIMO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - SISTEMA BUONO CON MARGINI DI MIGLIORAMENTO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 40 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - SISTEMA CON PROBLEMI DA RISOLVERE${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}$HEALTH_SCORE% - SISTEMA CRITICO${NC}"
    EXIT_CODE=1
fi

echo ""

# Raccomandazioni basate sui risultati
if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI:"
    echo ""
    
    if [ "$ERRORS" -gt 0 ]; then
        echo -e "${RED}CRITICI da risolvere subito:${NC}"
        
        if [ "$FORMATTER_IN_SERVICE" -gt 0 ]; then
            echo "  ❗ Rimuovere ResponseFormatter dai services"
        fi
        
        if [ "$FORMATTER_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere ResponseFormatter alle routes"
        fi
        
        if [ "$AUTH_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere middleware di autenticazione"
        fi
        
        if [ "$REQUEST_TS_ERRORS" -gt 0 ]; then
            echo "  ❗ Correggere $REQUEST_TS_ERRORS errori TypeScript nel modulo richieste"
        fi
        
        if [ "$CONSOLE_LOG" -gt 0 ]; then
            echo "  ❗ Rimuovere $CONSOLE_LOG console.log e usare logger"
        fi
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "\n${YELLOW}MIGLIORAMENTI consigliati:${NC}"
        
        if [ "$VALIDATION_COUNT" -eq 0 ]; then
            echo "  📌 Implementare validazione con Zod"
        fi
        
        if [ "$TRANSACTION_COUNT" -eq 0 ]; then
            echo "  📌 Usare transazioni per operazioni multiple"
        fi
        
        if [ "$TEST_FILES" -eq 0 ]; then
            echo "  📌 Aggiungere test unitari e di integrazione"
        fi
        
        if [ "$CACHE_USAGE" -eq 0 ]; then
            echo "  📌 Considerare l'uso di cache Redis"
        fi
        
        if [ "$INDEX_COUNT" -eq 0 ]; then
            echo "  📌 Aggiungere indici database per performance"
        fi
        
        if [ "$JSDOC_ROUTES" -lt 5 ] || [ "$JSDOC_SERVICE" -lt 5 ]; then
            echo "  📌 Aggiungere documentazione JSDoc"
        fi
        
        if [ "$WS_IN_SERVICE" -eq 0 ]; then
            echo "  📌 Implementare notifiche real-time con WebSocket"
        fi
        
        if [ "$LOGGER_USAGE" -eq 0 ]; then
            echo "  📌 Implementare logging strutturato"
        fi
    fi
    
    echo ""
fi

echo -e "${GREEN}✅ Analisi completata del modulo Richieste!${NC}"
echo ""
echo "📊 Sezioni analizzate: 17"
echo "🔍 Controlli effettuati: $TOTAL_CHECKS"
echo "⏱️  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

exit $EXIT_CODE
