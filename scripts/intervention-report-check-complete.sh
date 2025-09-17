#!/bin/bash

# ============================================
# Script: Analisi Completa Modulo Rapporti Intervento
# Descrizione: Verifica dettagliata del modulo InterventionReport
# Data: 10 Settembre 2025
# Versione: 1.0 - COMPLETA CON TUTTI I CONTROLLI ANALITICI
# 
# Uso: ./intervention-report-check-complete.sh [--skip-typescript] [--quick]
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
echo "║   ANALISI COMPLETA MODULO RAPPORTI INTERVENTO - v1.0     ║"
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
REPORT_TS_ERRORS=0
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
if echo "$DB_CHECK" | grep -q "InterventionReport"; then
    pass "Database connesso e schema sincronizzato"
else
    error "Problema connessione database"
fi

# Verifica modello InterventionReport in schema.prisma
check
echo -n "Modello InterventionReport in schema... "
if grep -q "model InterventionReport" prisma/schema.prisma; then
    pass "Modello InterventionReport definito"
    
    # Elenca i campi del modello
    echo -e "\n${CYAN}  Campi del modello InterventionReport:${NC}"
    grep -A 50 "model InterventionReport" prisma/schema.prisma | grep -E "^\s+\w+" | head -25 | while read line; do
        echo "    • $line"
    done
else
    error "Modello InterventionReport non trovato"
fi

# Verifica modelli correlati
echo -e "\n${CYAN}Modelli correlati:${NC}"

# ReportTemplate
check
if grep -q "model ReportTemplate" prisma/schema.prisma; then
    pass "  • ReportTemplate (template personalizzabili)"
else
    warn "  • ReportTemplate non trovato"
fi

# ReportMaterial
check
if grep -q "model ReportMaterial" prisma/schema.prisma; then
    pass "  • ReportMaterial (materiali utilizzati)"
else
    warn "  • ReportMaterial non trovato"
fi

# ReportSignature
check
if grep -q "model ReportSignature" prisma/schema.prisma; then
    pass "  • ReportSignature (firme digitali)"
else
    warn "  • ReportSignature non trovato"
fi

# Conta record nel database
check
echo -e "\n${CYAN}Statistiche database rapporti:${NC}"
STATS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function stats() {
  try {
    const total = await prisma.interventionReport.count();
    const draft = await prisma.interventionReport.count({ where: { status: 'DRAFT' } });
    const completed = await prisma.interventionReport.count({ where: { status: 'COMPLETED' } });
    const signed = await prisma.interventionReport.count({ where: { status: 'SIGNED' } });
    const sent = await prisma.interventionReport.count({ where: { status: 'SENT' } });
    
    console.log(\`  • Totale rapporti: \${total}\`);
    console.log(\`  • Bozze: \${draft}\`);
    console.log(\`  • Completati: \${completed}\`);
    console.log(\`  • Firmati: \${signed}\`);
    console.log(\`  • Inviati: \${sent}\`);
    
    // Statistiche materiali
    const materials = await prisma.reportMaterial.count().catch(() => 0);
    console.log(\`  • Materiali registrati: \${materials}\`);
    
    // Statistiche template
    const templates = await prisma.reportTemplate.count().catch(() => 0);
    console.log(\`  • Template disponibili: \${templates}\`);
    
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
echo -e "\n${CYAN}Analisi relazioni nel modello InterventionReport:${NC}"

# Estrai solo il modello InterventionReport
MODEL_CONTENT=$(awk '/^model InterventionReport/,/^}/' prisma/schema.prisma)

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

if echo "$MODEL_CONTENT" | grep -q "Quote"; then
    pass "  • Collegamento con Preventivo"
else
    warn "  • Collegamento con Preventivo non trovato"
fi

# Verifica campi specifici rapporto
echo -e "\n${CYAN}  Campi specifici rapporto:${NC}"
if echo "$MODEL_CONTENT" | grep -q "reportNumber"; then
    pass "  • Numero rapporto presente"
fi
if echo "$MODEL_CONTENT" | grep -q "workStartTime"; then
    pass "  • Ora inizio lavoro presente"
fi
if echo "$MODEL_CONTENT" | grep -q "workEndTime"; then
    pass "  • Ora fine lavoro presente"
fi
if echo "$MODEL_CONTENT" | grep -q "workDescription"; then
    pass "  • Descrizione lavoro presente"
fi
if echo "$MODEL_CONTENT" | grep -q "notes"; then
    pass "  • Campo note presente"
fi
if echo "$MODEL_CONTENT" | grep -q "images\|photos"; then
    pass "  • Campo foto/immagini presente"
else
    warn "  • Campo foto/immagini non trovato"
fi

echo ""

# ============================================
# 2. VERIFICA PAGINE FRONTEND
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 2. PAGINE FRONTEND RAPPORTI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd .. 2>/dev/null

echo -e "\n${CYAN}Pagine principali modulo rapporti:${NC}"

# Array delle pagine da verificare
declare -a PAGES=(
    "src/pages/reports/ReportsListPage.tsx:Lista rapporti"
    "src/pages/reports/ReportDetailPage.tsx:Dettaglio rapporto"
    "src/pages/reports/CreateReportPage.tsx:Nuovo rapporto"
    "src/pages/reports/EditReportPage.tsx:Modifica rapporto"
    "src/pages/professional/MyReports.tsx:I miei rapporti (professionista)"
    "src/pages/reports/SignaturePage.tsx:Pagina firma digitale"
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
    else
        # Cerca file alternativi
        ALT_FILE=$(find src -name "*[Rr]eport*Page.tsx" -type f 2>/dev/null | grep -v backup | grep -v "Request" | head -1)
        if [ -n "$ALT_FILE" ]; then
            info "$description non trovata, ma trovato: $(basename $ALT_FILE)"
        else
            warn "$description non trovata"
        fi
    fi
done

echo -e "\n${CYAN}Componenti correlati rapporti:${NC}"

# Componenti aggiuntivi
declare -a COMPONENTS=(
    "src/components/reports/ReportForm.tsx:Form rapporto"
    "src/components/reports/MaterialsTable.tsx:Tabella materiali"
    "src/components/reports/SignatureCanvas.tsx:Canvas firma digitale"
    "src/components/reports/ReportPDF.tsx:Generatore PDF rapporto"
    "src/components/reports/TemplateSelector.tsx:Selettore template"
    "src/components/reports/PhotoUpload.tsx:Upload foto prima/dopo"
    "src/components/reports/WorkTimer.tsx:Timer ore lavoro"
    "src/components/reports/ReportStatus.tsx:Badge stato rapporto"
)

for comp_info in "${COMPONENTS[@]}"; do
    IFS=':' read -r comp_path description <<< "$comp_info"
    check
    if [ -f "$comp_path" ]; then
        pass "$description"
    else
        # Cerca componenti alternativi
        COMP_NAME=$(echo "$description" | cut -d' ' -f1)
        ALT_COMP=$(find src/components -name "*${COMP_NAME}*.tsx" -type f 2>/dev/null | head -1)
        if [ -n "$ALT_COMP" ]; then
            info "$description trovato come $(basename $ALT_COMP)"
        else
            info "$description non trovato (opzionale)"
        fi
    fi
done

# Conta totale componenti Report (escludendo Request)
TOTAL_COMPONENTS=$(find src -name "*[Rr]eport*.tsx" -type f 2>/dev/null | grep -v backup | grep -v Request | wc -l)
echo -e "\n${CYAN}📊 Totale componenti Report trovati: $TOTAL_COMPONENTS${NC}"

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
    # Verifica TypeScript per il modulo report
    check
    echo "Analisi TypeScript del modulo rapporti..."
    
    # Esegui TypeScript e salva output
    TS_OUTPUT=$(timeout 15 npx tsc --noEmit 2>&1 || true)
    
    # Analizza errori per file report
    echo -e "\n${CYAN}Errori TypeScript per file:${NC}"
    
    # Routes - cerca sia report che intervention-report
    ROUTES_ERRORS=$(echo "$TS_OUTPUT" | grep -E "(intervention-report|report)\.routes\.ts" | wc -l | tr -d ' ')
    if [ "$ROUTES_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 report.routes.ts: $ROUTES_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep -E "(intervention-report|report)\.routes\.ts" | head -3
    else
        pass "  📁 report.routes.ts: Nessun errore"
    fi
    
    # Services
    SERVICE_ERRORS=$(echo "$TS_OUTPUT" | grep -E "(intervention-report|report)\.service\.ts" | wc -l | tr -d ' ')
    if [ "$SERVICE_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 report.service.ts: $SERVICE_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep -E "(intervention-report|report)\.service\.ts" | head -3
    else
        pass "  📁 report.service.ts: Nessun errore"
    fi
    
    REPORT_TS_ERRORS=$((ROUTES_ERRORS + SERVICE_ERRORS))
fi

# Verifica tipi per Report
check
echo -e "\n${CYAN}Definizioni TypeScript:${NC}"
if [ -f "src/types/report.types.ts" ] || [ -f "src/types/intervention-report.types.ts" ]; then
    pass "File types dedicato presente"
elif grep -q "interface.*Report\|type.*Report" src/**/*.ts 2>/dev/null; then
    pass "Types Report definiti nei file"
else
    warn "Types Report non trovati"
fi

echo ""

# ============================================
# 4. VERIFICA API ROUTES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 4. API ROUTES (/api/reports)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Cerca file routes (potrebbe essere report o intervention-report)
ROUTES_FILE=""
if [ -f "src/routes/intervention-report.routes.ts" ]; then
    ROUTES_FILE="src/routes/intervention-report.routes.ts"
elif [ -f "src/routes/report.routes.ts" ]; then
    ROUTES_FILE="src/routes/report.routes.ts"
fi

if [ -n "$ROUTES_FILE" ]; then
    echo "  Analizzando: $(basename $ROUTES_FILE)"
    echo -e "\n${CYAN}Endpoints essenziali:${NC}"
    
    # Endpoints essenziali per rapporti
    declare -a ESSENTIAL_ENDPOINTS=(
        "GET:/:Lista rapporti"
        "GET:/:id:Dettaglio rapporto"
        "POST:/:Crea rapporto"
        "PUT:/:id:Aggiorna rapporto"
        "POST:/:id/sign:Firma rapporto"
        "GET:/:id/pdf:Genera PDF"
        "POST:/:id/send:Invia rapporto"
        "GET:/templates:Lista template"
        "POST:/:id/materials:Aggiungi materiali"
        "POST:/:id/photos:Upload foto"
    )
    
    for endpoint_info in "${ESSENTIAL_ENDPOINTS[@]}"; do
        IFS=':' read -r method path description <<< "$endpoint_info"
        check
        if grep -q "router\.${method,,}.*['\"].*${path}" "$ROUTES_FILE" 2>/dev/null; then
            pass "[$method] $path - $description"
        else
            warn "[$method] $path - $description non trovato"
        fi
    done
    
    # Verifica ResponseFormatter
    check
    echo -e "\n${CYAN}Verifiche qualità Routes:${NC}"
    FORMATTER_COUNT=$(grep -c "ResponseFormatter" "$ROUTES_FILE" 2>/dev/null)
    if [ "$FORMATTER_COUNT" -gt 0 ]; then
        pass "ResponseFormatter utilizzato ($FORMATTER_COUNT volte)"
    else
        error "ResponseFormatter NON utilizzato!"
    fi
    
    # Verifica autenticazione
    check
    AUTH_COUNT=$(grep -c "authenticate" "$ROUTES_FILE" 2>/dev/null)
    if [ "$AUTH_COUNT" -gt 0 ]; then
        pass "Middleware authenticate presente ($AUTH_COUNT volte)"
    else
        error "Middleware authenticate mancante!"
    fi
else
    error "File routes per rapporti non trovato!"
fi

echo ""

# ============================================
# 5. VERIFICA SERVICES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 5. SERVICES LAYER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Cerca file service
SERVICE_FILE=""
if [ -f "src/services/intervention-report.service.ts" ]; then
    SERVICE_FILE="src/services/intervention-report.service.ts"
elif [ -f "src/services/report.service.ts" ]; then
    SERVICE_FILE="src/services/report.service.ts"
fi

if [ -n "$SERVICE_FILE" ]; then
    echo "  Analizzando: $(basename $SERVICE_FILE)"
    echo -e "\n${CYAN}Funzioni essenziali nel service:${NC}"
    
    # Funzioni essenziali per rapporti
    declare -a ESSENTIAL_FUNCTIONS=(
        "createReport:Creazione rapporto"
        "updateReport:Aggiornamento rapporto"
        "signReport:Firma rapporto"
        "generatePDF:Generazione PDF"
        "addMaterials:Aggiunta materiali"
        "calculateHours:Calcolo ore lavoro"
        "uploadPhotos:Upload foto"
        "sendReport:Invio rapporto"
        "generateReportNumber:Generazione numero"
    )
    
    for func_info in "${ESSENTIAL_FUNCTIONS[@]}"; do
        IFS=':' read -r func_name description <<< "$func_info"
        check
        if grep -q "function $func_name\|const $func_name\|export.*$func_name" "$SERVICE_FILE" 2>/dev/null; then
            pass "$description - $func_name()"
        else
            warn "$description - $func_name() non trovata"
        fi
    done
    
    # NON deve usare ResponseFormatter
    check
    FORMATTER_IN_SERVICE=$(grep -c "ResponseFormatter" "$SERVICE_FILE" 2>/dev/null)
    if [ "$FORMATTER_IN_SERVICE" -eq 0 ]; then
        pass "ResponseFormatter NON usato nel service (corretto)"
    else
        error "ResponseFormatter trovato nel service (ERRORE!)"
    fi
else
    error "File service per rapporti non trovato!"
fi

echo ""

# ============================================
# 6. BUSINESS LOGIC RAPPORTI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💼 6. BUSINESS LOGIC RAPPORTI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifiche logica di business:${NC}"

# Numerazione automatica
check
echo -n "Numerazione automatica rapporti... "
if [ -n "$SERVICE_FILE" ] && grep -q "reportNumber\|generateNumber\|nextNumber" "$SERVICE_FILE" 2>/dev/null; then
    pass "Sistema numerazione implementato"
else
    warn "Numerazione automatica non trovata"
fi

# Calcolo ore lavoro
check
echo -n "Calcolo ore lavoro... "
if [ -n "$SERVICE_FILE" ] && grep -q "workHours\|calculateHours\|duration" "$SERVICE_FILE" 2>/dev/null; then
    pass "Calcolo ore implementato"
else
    warn "Calcolo ore non trovato"
fi

# Gestione materiali
check
echo -n "Gestione materiali utilizzati... "
if [ -n "$SERVICE_FILE" ] && grep -q "material\|Material\|addMaterial" "$SERVICE_FILE" 2>/dev/null; then
    pass "Gestione materiali presente"
else
    warn "Gestione materiali non trovata"
fi

# Template rapporti
check
echo -n "Sistema template rapporti... "
if [ -n "$SERVICE_FILE" ] && grep -q "template\|Template" "$SERVICE_FILE" 2>/dev/null; then
    pass "Template sistema presente"
else
    info "Template non implementati"
fi

# Frasi predefinite
check
echo -n "Frasi predefinite... "
if [ -n "$SERVICE_FILE" ] && grep -q "predefined\|phrases\|precompiled" "$SERVICE_FILE" 2>/dev/null; then
    pass "Frasi predefinite presenti"
else
    info "Frasi predefinite non trovate"
fi

echo ""

# ============================================
# 7. INTEGRAZIONI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 7. INTEGRAZIONI CON ALTRI MODULI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifico integrazioni:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    # Integrazione con Richieste
    check
    if grep -q "assistanceRequest\|AssistanceRequest" "$SERVICE_FILE" 2>/dev/null; then
        pass "Integrazione con modulo Richieste"
    else
        error "Manca integrazione con Richieste"
    fi
    
    # Integrazione con Preventivi
    check
    if grep -q "quote\|Quote" "$SERVICE_FILE" 2>/dev/null; then
        pass "Integrazione con modulo Preventivi"
    else
        warn "Integrazione Preventivi non trovata"
    fi
    
    # Integrazione Notifiche
    check
    if grep -q "notification\|sendNotification" "$SERVICE_FILE" 2>/dev/null; then
        pass "Integrazione con sistema Notifiche"
    else
        warn "Integrazione Notifiche non trovata"
    fi
    
    # Integrazione Email
    check
    if grep -q "sendEmail\|email" "$SERVICE_FILE" 2>/dev/null; then
        pass "Integrazione invio Email"
    else
        warn "Integrazione Email non trovata"
    fi
    
    # Integrazione PDF
    check
    if grep -q "pdf\|PDF\|generatePDF" "$SERVICE_FILE" 2>/dev/null; then
        pass "Integrazione generazione PDF"
    else
        error "Generazione PDF non trovata (essenziale!)"
    fi
    
    # Integrazione firma digitale
    check
    if grep -q "signature\|sign\|firma" "$SERVICE_FILE" 2>/dev/null; then
        pass "Sistema firma digitale"
    else
        warn "Firma digitale non trovata"
    fi
fi

echo ""

# ============================================
# 8. WORKFLOW E STATI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 8. WORKFLOW E STATI RAPPORTO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Stati del rapporto:${NC}"

# Verifica enum stati
if grep -q "enum ReportStatus\|enum InterventionReportStatus" prisma/schema.prisma 2>/dev/null; then
    echo "  Stati definiti in schema:"
    grep -A 10 "enum.*ReportStatus" prisma/schema.prisma | grep -E "^\s+\w+" | while read state; do
        echo "    • $state"
    done
else
    warn "Enum ReportStatus non definito"
fi

# Verifica transizioni di stato
echo -e "\n${CYAN}Transizioni di stato:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    declare -a TRANSITIONS=(
        "DRAFT.*COMPLETED:Da bozza a completato"
        "COMPLETED.*SIGNED:Da completato a firmato"
        "SIGNED.*SENT:Da firmato a inviato"
        "canEdit.*DRAFT:Solo bozze modificabili"
        "requireSignature:Richiede firma"
    )
    
    for transition_info in "${TRANSITIONS[@]}"; do
        IFS=':' read -r pattern description <<< "$transition_info"
        check
        if grep -q "$pattern" "$SERVICE_FILE" 2>/dev/null; then
            pass "$description"
        else
            info "$description - non verificabile"
        fi
    done
fi

echo ""

# ============================================
# 9. SICUREZZA E PERMESSI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 9. SICUREZZA E PERMESSI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Controlli di sicurezza:${NC}"

if [ -n "$ROUTES_FILE" ]; then
    # Solo professionista può creare rapporti
    check
    if grep -q "role.*PROFESSIONAL\|isProfessional" "$ROUTES_FILE" 2>/dev/null; then
        pass "Solo professionisti possono creare rapporti"
    else
        warn "Controllo ruolo professionista non trovato"
    fi
fi

if [ -n "$SERVICE_FILE" ]; then
    # Controllo ownership
    check
    if grep -q "checkOwnership\|isOwner\|userId.*===.*professionalId" "$SERVICE_FILE" 2>/dev/null; then
        pass "Controllo ownership implementato"
    else
        warn "Controllo ownership non verificabile"
    fi
    
    # Rapporto non modificabile dopo firma
    check
    if grep -q "status.*!==.*DRAFT\|canEdit\|isSigned" "$SERVICE_FILE" 2>/dev/null; then
        pass "Blocco modifica dopo firma"
    else
        warn "Controllo modifica non trovato"
    fi
fi

echo ""

# ============================================
# 10. TESTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 10. TEST E QUALITÀ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}File di test:${NC}"

# Cerca test per report
TEST_FILES=$(find . -name "*report*.test.ts" -o -name "*report*.spec.ts" 2>/dev/null | grep -v "request" | wc -l)
check
if [ "$TEST_FILES" -gt 0 ]; then
    pass "Trovati $TEST_FILES file di test"
    find . -name "*report*.test.ts" -o -name "*report*.spec.ts" 2>/dev/null | grep -v "request" | head -5 | while read test; do
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

if [ -n "$SERVICE_FILE" ]; then
    # Cache
    check
    if grep -q "cache\|Cache\|redis" "$SERVICE_FILE" 2>/dev/null; then
        pass "Caching implementato"
        CACHE_USAGE=1
    else
        info "Cache non implementata"
    fi
    
    # Paginazione
    check
    if grep -q "skip\|take\|limit\|pagination" "$SERVICE_FILE" 2>/dev/null; then
        pass "Paginazione implementata"
    else
        warn "Paginazione non trovata"
    fi
    
    # Query optimization
    check
    if grep -q "select:\|include:" "$SERVICE_FILE" 2>/dev/null; then
        pass "Query ottimizzate con select/include"
    else
        warn "Query non ottimizzate"
    fi
fi

# Indici database
check
echo -n "Verifica indici database... "
if grep -q "@@index\|@@unique" prisma/schema.prisma | grep -i report 2>/dev/null; then
    pass "Indici definiti per Report"
    INDEX_COUNT=1
else
    info "Nessun indice specifico per Report"
fi

echo ""

# ============================================
# 12. DOCUMENTAZIONE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📚 12. DOCUMENTAZIONE CODICE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Documentazione JSDoc:${NC}"

if [ -n "$ROUTES_FILE" ]; then
    # JSDoc nelle routes
    check
    JSDOC_ROUTES=$(grep -c "/\*\*" "$ROUTES_FILE" 2>/dev/null || echo 0)
    if [ "$JSDOC_ROUTES" -gt 0 ]; then
        pass "JSDoc in routes: $JSDOC_ROUTES blocchi"
    else
        info "JSDoc non presente in routes"
    fi
fi

if [ -n "$SERVICE_FILE" ]; then
    # JSDoc nel service
    check
    JSDOC_SERVICE=$(grep -c "/\*\*" "$SERVICE_FILE" 2>/dev/null || echo 0)
    if [ "$JSDOC_SERVICE" -gt 0 ]; then
        pass "JSDoc in service: $JSDOC_SERVICE blocchi"
    else
        info "JSDoc non presente in service"
    fi
fi

echo ""

# ============================================
# 13. REAL-TIME E WEBSOCKET
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔌 13. WEBSOCKET E REAL-TIME${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Eventi real-time:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    # WebSocket nel service
    check
    WS_IN_SERVICE=$(grep -c "io\.\|socket\.\|emit\|broadcast" "$SERVICE_FILE" 2>/dev/null || echo 0)
    if [ "$WS_IN_SERVICE" -gt 0 ]; then
        pass "Eventi WebSocket implementati ($WS_IN_SERVICE riferimenti)"
        
        # Cerca eventi specifici
        echo "  Eventi emessi:"
        grep -o "emit('[^']*'" "$SERVICE_FILE" 2>/dev/null | head -5 | while read event; do
            echo "    • $event"
        done
    else
        info "WebSocket non implementato nel service"
    fi
fi

echo ""

# ============================================
# 14. LOGGING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 14. SISTEMA DI LOGGING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Utilizzo logger:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    # Logger usage
    check
    LOGGER_USAGE=$(grep -c "logger\.\|Logger\." "$SERVICE_FILE" 2>/dev/null || echo 0)
    if [ "$LOGGER_USAGE" -gt 0 ]; then
        pass "Logger utilizzato ($LOGGER_USAGE volte)"
    else
        warn "Logger non utilizzato"
    fi
    
    # Console.log (non dovrebbero esserci)
    check
    CONSOLE_LOG=0
    if [ -n "$ROUTES_FILE" ]; then
        CONSOLE_LOG=$(($(grep -c "console\.log" "$SERVICE_FILE" 2>/dev/null || echo 0) + $(grep -c "console\.log" "$ROUTES_FILE" 2>/dev/null || echo 0)))
    fi
    
    if [ "$CONSOLE_LOG" -eq 0 ]; then
        pass "Nessun console.log trovato"
    else
        warn "Trovati $CONSOLE_LOG console.log (sostituire con logger)"
    fi
fi

echo ""

# ============================================
# 15. FUNZIONALITÀ AVANZATE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 15. FUNZIONALITÀ AVANZATE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Funzionalità speciali:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    # Foto prima/dopo
    check
    if grep -q "beforePhoto\|afterPhoto\|prima\|dopo" "$SERVICE_FILE" 2>/dev/null; then
        pass "Sistema foto prima/dopo"
    else
        info "Foto prima/dopo non trovate"
    fi
    
    # Watermark PDF
    check
    if grep -q "watermark\|Watermark" "$SERVICE_FILE" 2>/dev/null; then
        pass "Watermark su PDF presente"
    else
        info "Watermark non implementato"
    fi
    
    # QR Code
    check
    if grep -q "qrcode\|QRCode\|qr" "$SERVICE_FILE" 2>/dev/null; then
        pass "QR Code implementato"
    else
        info "QR Code non implementato"
    fi
    
    # Geolocalizzazione
    check
    if grep -q "coordinates\|latitude\|longitude\|gps" "$SERVICE_FILE" 2>/dev/null; then
        pass "Geolocalizzazione presente"
    else
        info "Geolocalizzazione non trovata"
    fi
    
    # Multi-lingua
    check
    if grep -q "language\|locale\|i18n" "$SERVICE_FILE" 2>/dev/null; then
        pass "Supporto multi-lingua"
    else
        info "Multi-lingua non implementato"
    fi
fi

echo ""

# ============================================
# 16. INTEGRAZIONE BACKUP
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 16. INTEGRAZIONE BACKUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema backup:${NC}"

if [ -n "$SERVICE_FILE" ]; then
    # Export dati
    check
    if grep -q "export\|Export\|backup" "$SERVICE_FILE" 2>/dev/null; then
        pass "Funzione export dati presente"
    else
        info "Export dati non implementato"
    fi
    
    # Archivio rapporti
    check
    if grep -q "archive\|Archive" "$SERVICE_FILE" 2>/dev/null; then
        pass "Sistema archiviazione presente"
    else
        info "Archiviazione non implementata"
    fi
fi

echo ""

# ============================================
# 17. MONITORING E ALERTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔔 17. MONITORING E ALERTING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema monitoring:${NC}"

if [ -n "$ROUTES_FILE" ]; then
    # Health check endpoint
    check
    if grep -q "health\|/health" "$ROUTES_FILE" 2>/dev/null; then
        pass "Health check endpoint presente"
    else
        info "Health check non implementato"
    fi
fi

if [ -n "$SERVICE_FILE" ]; then
    # Metriche
    check
    if grep -q "metric\|statistic\|analytics" "$SERVICE_FILE" 2>/dev/null; then
        pass "Sistema metriche presente"
    else
        info "Metriche non implementate"
    fi
    
    # Alert rapporti non firmati
    check
    if grep -q "alert\|reminder\|unsigned" "$SERVICE_FILE" 2>/dev/null; then
        pass "Sistema alert/reminder presente"
    else
        info "Alert non implementati"
    fi
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
    echo -e "${GREEN}$HEALTH_SCORE% - MODULO RAPPORTI OTTIMO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - MODULO RAPPORTI BUONO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 40 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - MODULO RAPPORTI CON PROBLEMI${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}$HEALTH_SCORE% - MODULO RAPPORTI CRITICO${NC}"
    EXIT_CODE=1
fi

echo ""

# Raccomandazioni
if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI PER IL MODULO RAPPORTI:"
    echo ""
    
    if [ "$ERRORS" -gt 0 ]; then
        echo -e "${RED}CRITICI da risolvere:${NC}"
        
        if [ "$FORMATTER_IN_SERVICE" -gt 0 ]; then
            echo "  ❗ Rimuovere ResponseFormatter dal service"
        fi
        
        if [ "$FORMATTER_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere ResponseFormatter alle routes"
        fi
        
        if [ "$AUTH_COUNT" -eq 0 ]; then
            echo "  ❗ Aggiungere autenticazione alle routes"
        fi
        
        if [ "$REPORT_TS_ERRORS" -gt 0 ]; then
            echo "  ❗ Correggere $REPORT_TS_ERRORS errori TypeScript"
        fi
        
        echo "  ❗ Verificare generazione PDF (essenziale!)"
        echo "  ❗ Implementare collegamento con richieste"
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
            echo "  📌 Aggiungere test per il modulo rapporti"
        fi
        
        echo "  📌 Implementare sistema firma digitale"
        echo "  📌 Aggiungere template personalizzabili"
        echo "  📌 Implementare foto prima/dopo"
        echo "  📌 Aggiungere numerazione automatica"
        echo "  📌 Verificare calcolo ore lavoro"
    fi
    
    echo ""
fi

echo -e "${GREEN}✅ Analisi completata del modulo Rapporti Intervento!${NC}"
echo ""
echo "📊 Sezioni analizzate: 17"
echo "🔍 Controlli effettuati: $TOTAL_CHECKS"
echo "⏱️  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

exit $EXIT_CODE
