#!/bin/bash

# ============================================
# Script: Analisi Completa Sistema Audit Log
# Descrizione: Verifica dettagliata del sistema di Audit Log e tracciamento
# Data: 10 Settembre 2025
# Versione: 2.0 - COMPLETA CON TUTTI I CONTROLLI ANALITICI
# 
# Uso: ./audit-system-check.sh [--skip-typescript] [--quick]
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
echo "║      ANALISI COMPLETA SISTEMA AUDIT LOG - v2.0           ║"
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
AUDIT_TS_ERRORS=0
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
if echo "$DB_CHECK" | grep -q "AuditLog"; then
    pass "Database connesso e schema sincronizzato"
else
    error "Problema connessione database"
fi

# Verifica modello AuditLog in schema.prisma
check
echo -n "Modello AuditLog in schema... "
if grep -q "model AuditLog" prisma/schema.prisma; then
    pass "Modello AuditLog definito"
    
    # Elenca i campi del modello
    echo -e "\n${CYAN}  Campi del modello AuditLog:${NC}"
    grep -A 30 "model AuditLog" prisma/schema.prisma | grep -E "^\s+\w+" | head -20 | while read line; do
        echo "    • $line"
    done
else
    error "Modello AuditLog non trovato in schema.prisma"
fi

# Verifica modelli correlati
echo -e "\n${CYAN}Modelli correlati audit:${NC}"

# AuditLogRetention
check
if grep -q "model AuditLogRetention" prisma/schema.prisma; then
    pass "  • AuditLogRetention (politiche di retention)"
else
    warn "  • AuditLogRetention non trovato"
fi

# AuditLogAlert
check
if grep -q "model AuditLogAlert" prisma/schema.prisma; then
    pass "  • AuditLogAlert (configurazione alert)"
else
    warn "  • AuditLogAlert non trovato"
fi

# Conta record nel database
check
echo -e "\n${CYAN}Statistiche database audit:${NC}"
STATS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function stats() {
  try {
    const total = await prisma.auditLog.count();
    const today = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0,0,0,0))
        }
      }
    });
    const last7days = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Conta per categoria
    const byCategory = await prisma.auditLog.groupBy({
      by: ['category'],
      _count: true
    });
    
    // Conta per severity
    const bySeverity = await prisma.auditLog.groupBy({
      by: ['severity'],
      _count: true
    });
    
    console.log(\`  • Totale log: \${total}\`);
    console.log(\`  • Log oggi: \${today}\`);
    console.log(\`  • Log ultimi 7 giorni: \${last7days}\`);
    
    console.log(\`\\n  Distribuzione per categoria:\`);
    byCategory.forEach(cat => {
      console.log(\`    • \${cat.category || 'N/A'}: \${cat._count} log\`);
    });
    
    console.log(\`\\n  Distribuzione per severity:\`);
    bySeverity.forEach(sev => {
      console.log(\`    • \${sev.severity || 'N/A'}: \${sev._count} log\`);
    });
    
    // Ultimi errori critici
    const criticalErrors = await prisma.auditLog.count({
      where: {
        severity: 'CRITICAL',
        success: false
      }
    });
    console.log(\`\\n  • Errori critici totali: \${criticalErrors}\`);
    
  } catch(e) {
    console.log('  • Errore:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}
stats();
" 2>/dev/null || echo "  • Errore nel conteggio")
echo "$STATS"

# Analisi campi speciali
echo -e "\n${CYAN}Analisi campi AuditLog:${NC}"

MODEL_CONTENT=$(awk '/^model AuditLog/,/^}/' prisma/schema.prisma)

# Verifica campi essenziali
if echo "$MODEL_CONTENT" | grep -q "action"; then
    pass "  • Campo 'action' presente"
fi
if echo "$MODEL_CONTENT" | grep -q "userId"; then
    pass "  • Campo 'userId' presente"
fi
if echo "$MODEL_CONTENT" | grep -q "ipAddress"; then
    pass "  • Campo 'ipAddress' presente"
fi
if echo "$MODEL_CONTENT" | grep -q "userAgent"; then
    pass "  • Campo 'userAgent' presente"
fi
if echo "$MODEL_CONTENT" | grep -q "oldValues"; then
    pass "  • Campo 'oldValues' presente (per diff)"
fi
if echo "$MODEL_CONTENT" | grep -q "newValues"; then
    pass "  • Campo 'newValues' presente (per diff)"
fi
if echo "$MODEL_CONTENT" | grep -q "severity"; then
    pass "  • Campo 'severity' presente"
else
    warn "  • Campo 'severity' non trovato"
fi
if echo "$MODEL_CONTENT" | grep -q "category"; then
    pass "  • Campo 'category' presente"
else
    warn "  • Campo 'category' non trovato"
fi

echo ""

# ============================================
# 2. VERIFICA PAGINE FRONTEND
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 2. PAGINE FRONTEND AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd .. 2>/dev/null

echo -e "\n${CYAN}Pagine principali modulo audit:${NC}"

# Array delle pagine da verificare
declare -a PAGES=(
    "src/pages/admin/AuditLogPage.tsx:Dashboard audit log"
    "src/pages/admin/AuditDashboard.tsx:Dashboard alternativo"
    "src/pages/admin/SecurityDashboard.tsx:Dashboard sicurezza"
    "src/pages/admin/AuditReports.tsx:Report audit"
    "src/pages/admin/AuditAlerts.tsx:Configurazione alert"
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
        ALT_FILE=$(find src/pages/admin -name "*[Aa]udit*.tsx" -type f 2>/dev/null | head -1)
        if [ -n "$ALT_FILE" ]; then
            info "$description non trovata, ma trovato: $(basename $ALT_FILE)"
        else
            warn "$description non trovata"
        fi
    fi
done

echo -e "\n${CYAN}Componenti correlati audit:${NC}"

# Componenti aggiuntivi
declare -a COMPONENTS=(
    "src/components/admin/audit-log/AuditDashboard.tsx:Dashboard component"
    "src/components/admin/audit-log/AuditFilters.tsx:Filtri ricerca"
    "src/components/admin/audit-log/AuditTable.tsx:Tabella log"
    "src/components/admin/audit-log/AuditDetails.tsx:Dettagli log"
    "src/components/admin/audit-log/AuditExport.tsx:Export dati"
    "src/components/admin/audit-log/AuditChart.tsx:Grafici statistiche"
    "src/components/admin/audit-log/AuditTimeline.tsx:Timeline eventi"
    "src/components/admin/audit-log/AuditAlerts.tsx:Gestione alert"
)

for comp_info in "${COMPONENTS[@]}"; do
    IFS=':' read -r comp_path description <<< "$comp_info"
    check
    if [ -f "$comp_path" ]; then
        pass "$description"
    else
        # Cerca componenti alternativi
        ALT_COMP=$(find src/components -name "*[Aa]udit*.tsx" -type f 2>/dev/null | grep -v backup | head -1)
        if [ -n "$ALT_COMP" ] && [ "$FOUND_PAGES" -eq 0 ]; then
            info "$description trovato come $(basename $ALT_COMP)"
        else
            info "$description non trovato (opzionale)"
        fi
    fi
done

# Conta totale componenti Audit
TOTAL_COMPONENTS=$(find src -name "*[Aa]udit*.tsx" -type f 2>/dev/null | grep -v backup | wc -l)
echo -e "\n${CYAN}📊 Totale componenti Audit trovati: $TOTAL_COMPONENTS${NC}"

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
    # Verifica TypeScript per il modulo audit
    check
    echo "Analisi TypeScript del modulo audit..."
    
    # Esegui TypeScript e salva output
    TS_OUTPUT=$(timeout 15 npx tsc --noEmit 2>&1 || true)
    
    # Analizza errori per file audit
    echo -e "\n${CYAN}Errori TypeScript per file:${NC}"
    
    # Routes
    ROUTES_ERRORS=$(echo "$TS_OUTPUT" | grep "src/routes/audit.routes.ts" | wc -l | tr -d ' ')
    if [ "$ROUTES_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 audit.routes.ts: $ROUTES_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/routes/audit.routes.ts" | head -3
    else
        pass "  📁 audit.routes.ts: Nessun errore"
    fi
    
    # Services
    SERVICE_ERRORS=$(echo "$TS_OUTPUT" | grep "src/services/audit.service.ts" | wc -l | tr -d ' ')
    if [ "$SERVICE_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 audit.service.ts: $SERVICE_ERRORS errori${NC}"
        echo "$TS_OUTPUT" | grep "src/services/audit.service.ts" | head -3
    else
        pass "  📁 audit.service.ts: Nessun errore"
    fi
    
    # Middleware
    MIDDLEWARE_ERRORS=$(echo "$TS_OUTPUT" | grep "src/middleware/auditLogger.ts" | wc -l | tr -d ' ')
    if [ "$MIDDLEWARE_ERRORS" -gt 0 ]; then
        echo -e "\n  ${YELLOW}📁 auditLogger.ts: $MIDDLEWARE_ERRORS errori${NC}"
    else
        pass "  📁 auditLogger.ts: Nessun errore"
    fi
    
    AUDIT_TS_ERRORS=$((ROUTES_ERRORS + SERVICE_ERRORS + MIDDLEWARE_ERRORS))
fi

# Verifica tipi per Audit
check
echo -e "\n${CYAN}Definizioni TypeScript:${NC}"
if [ -f "src/types/audit.types.ts" ]; then
    pass "File types dedicato presente"
elif grep -q "interface.*AuditLog\|type.*AuditLog" src/**/*.ts 2>/dev/null; then
    pass "Types AuditLog definiti nei file"
else
    warn "Types AuditLog non trovati"
fi

echo ""

# ============================================
# 4. VERIFICA API ROUTES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 4. API ROUTES (/api/audit)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/routes/audit.routes.ts" ]; then
    echo -e "\n${CYAN}Endpoints trovati:${NC}"
    
    # Endpoints essenziali per audit
    declare -a ESSENTIAL_ENDPOINTS=(
        "GET:/:Lista log audit"
        "GET:/:id:Dettaglio log"
        "GET:/stats:Statistiche"
        "GET:/search:Ricerca avanzata"
        "POST:/export:Export dati"
        "GET:/alerts:Lista alert"
        "POST:/alerts:Crea alert"
        "DELETE:/cleanup:Pulizia log vecchi"
        "GET:/retention:Politiche retention"
        "GET:/timeline:Timeline eventi"
    )
    
    for endpoint_info in "${ESSENTIAL_ENDPOINTS[@]}"; do
        IFS=':' read -r method path description <<< "$endpoint_info"
        check
        if grep -q "router\.${method,,}.*['\"].*${path}" src/routes/audit.routes.ts 2>/dev/null; then
            pass "[$method] $path - $description"
        else
            warn "[$method] $path - $description non trovato"
        fi
    done
    
    # Verifica ResponseFormatter
    check
    echo -e "\n${CYAN}Verifiche qualità Routes:${NC}"
    FORMATTER_COUNT=$(grep -c "ResponseFormatter" src/routes/audit.routes.ts 2>/dev/null)
    if [ "$FORMATTER_COUNT" -gt 0 ]; then
        pass "ResponseFormatter utilizzato ($FORMATTER_COUNT volte)"
    else
        error "ResponseFormatter NON utilizzato!"
    fi
    
    # Verifica autenticazione
    check
    AUTH_COUNT=$(grep -c "authenticate" src/routes/audit.routes.ts 2>/dev/null)
    if [ "$AUTH_COUNT" -gt 0 ]; then
        pass "Middleware authenticate presente ($AUTH_COUNT volte)"
    else
        error "Middleware authenticate mancante!"
    fi
    
    # Verifica RBAC (solo admin)
    check
    if grep -q "requireRole.*ADMIN\|checkRole.*ADMIN" src/routes/audit.routes.ts 2>/dev/null; then
        pass "Controllo ruolo ADMIN presente"
    else
        warn "Controllo ruolo ADMIN non trovato"
    fi
else
    error "File audit.routes.ts non trovato!"
fi

echo ""

# ============================================
# 5. VERIFICA SERVICES
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 5. SERVICES LAYER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "src/services/audit.service.ts" ]; then
    echo -e "\n${CYAN}Funzioni essenziali nel service:${NC}"
    
    # Funzioni essenziali per audit
    declare -a ESSENTIAL_FUNCTIONS=(
        "logAction:Registrazione azioni"
        "searchLogs:Ricerca log"
        "getStats:Statistiche"
        "exportLogs:Export dati"
        "cleanupOldLogs:Pulizia log vecchi"
        "createAlert:Creazione alert"
        "checkAlerts:Controllo alert"
        "getTimeline:Timeline eventi"
        "getUserActivity:Attività utente"
        "getSecurityEvents:Eventi sicurezza"
    )
    
    for func_info in "${ESSENTIAL_FUNCTIONS[@]}"; do
        IFS=':' read -r func_name description <<< "$func_info"
        check
        if grep -q "function $func_name\|const $func_name\|export.*$func_name" src/services/audit.service.ts 2>/dev/null; then
            pass "$description - $func_name()"
        else
            warn "$description - $func_name() non trovata"
        fi
    done
    
    # NON deve usare ResponseFormatter
    check
    FORMATTER_IN_SERVICE=$(grep -c "ResponseFormatter" src/services/audit.service.ts 2>/dev/null)
    if [ "$FORMATTER_IN_SERVICE" -eq 0 ]; then
        pass "ResponseFormatter NON usato nel service (corretto)"
    else
        error "ResponseFormatter trovato nel service (ERRORE!)"
    fi
else
    error "File audit.service.ts non trovato!"
fi

echo ""

# ============================================
# 6. MIDDLEWARE AUDIT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔌 6. MIDDLEWARE AUDIT LOGGER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifica middleware audit:${NC}"

# Verifica esistenza middleware
check
if [ -f "src/middleware/auditLogger.ts" ]; then
    pass "Middleware auditLogger presente"
    
    # Verifica funzionalità nel middleware
    echo -e "\n${CYAN}  Funzionalità middleware:${NC}"
    
    if grep -q "req.user" src/middleware/auditLogger.ts 2>/dev/null; then
        pass "  • Cattura user ID"
    fi
    
    if grep -q "req.ip\|req.headers" src/middleware/auditLogger.ts 2>/dev/null; then
        pass "  • Cattura IP address"
    fi
    
    if grep -q "user-agent" src/middleware/auditLogger.ts 2>/dev/null; then
        pass "  • Cattura user agent"
    fi
    
    if grep -q "oldValues\|newValues" src/middleware/auditLogger.ts 2>/dev/null; then
        pass "  • Supporto diff valori"
    fi
    
    if grep -q "severity\|category" src/middleware/auditLogger.ts 2>/dev/null; then
        pass "  • Categorizzazione log"
    fi
else
    error "Middleware auditLogger non trovato!"
fi

# Verifica integrazione in server.ts
check
echo -e "\n${CYAN}Integrazione middleware:${NC}"
if grep -q "auditLogger\|AuditLogger" src/server.ts 2>/dev/null; then
    pass "Middleware integrato in server.ts"
else
    warn "Middleware non integrato in server.ts"
fi

# Verifica uso nelle routes
check
AUDIT_IN_ROUTES=$(grep -r "auditLogger\|auditLog" src/routes/*.ts 2>/dev/null | wc -l)
if [ "$AUDIT_IN_ROUTES" -gt 0 ]; then
    pass "Middleware usato in $AUDIT_IN_ROUTES routes"
else
    warn "Middleware non usato nelle routes"
fi

echo ""

# ============================================
# 7. BUSINESS LOGIC AUDIT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💼 7. BUSINESS LOGIC AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifiche logica di business:${NC}"

# Retention policies
check
echo -n "Sistema retention policies... "
if [ -f "src/services/audit.service.ts" ] && grep -q "retention\|Retention\|cleanup" src/services/audit.service.ts 2>/dev/null; then
    pass "Retention policies implementate"
else
    warn "Retention policies non trovate"
fi

# Alert system
check
echo -n "Sistema alert... "
if [ -f "src/services/audit.service.ts" ] && grep -q "alert\|Alert\|notification" src/services/audit.service.ts 2>/dev/null; then
    pass "Sistema alert presente"
else
    warn "Sistema alert non trovato"
fi

# Security monitoring
check
echo -n "Security monitoring... "
if [ -f "src/services/audit.service.ts" ] && grep -q "security\|Security\|suspicious" src/services/audit.service.ts 2>/dev/null; then
    pass "Security monitoring implementato"
else
    warn "Security monitoring non trovato"
fi

# Export capabilities
check
echo -n "Export dati... "
if [ -f "src/services/audit.service.ts" ] && grep -q "export\|Export\|csv\|json" src/services/audit.service.ts 2>/dev/null; then
    pass "Export dati implementato"
else
    warn "Export dati non trovato"
fi

# Compliance features
check
echo -n "Compliance/GDPR... "
if [ -f "src/services/audit.service.ts" ] && grep -q "gdpr\|GDPR\|compliance\|privacy" src/services/audit.service.ts 2>/dev/null; then
    pass "Features compliance presenti"
else
    info "Features compliance non trovate"
fi

echo ""

# ============================================
# 8. INTEGRAZIONI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 8. INTEGRAZIONI CON ALTRI MODULI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Verifico integrazioni:${NC}"

# Integrazione con tutti i moduli principali
check
if grep -r "auditLog\|auditLogger" src/services/request.service.ts 2>/dev/null | grep -q .; then
    pass "Integrazione con modulo Richieste"
else
    warn "Integrazione Richieste non trovata"
fi

check
if grep -r "auditLog\|auditLogger" src/services/quote.service.ts 2>/dev/null | grep -q .; then
    pass "Integrazione con modulo Preventivi"
else
    info "Integrazione Preventivi non trovata"
fi

check
if grep -r "auditLog\|auditLogger" src/services/user.service.ts 2>/dev/null | grep -q .; then
    pass "Integrazione con modulo Utenti"
else
    warn "Integrazione Utenti non trovata"
fi

check
if grep -r "auditLog\|auditLogger" src/services/auth.service.ts 2>/dev/null | grep -q .; then
    pass "Integrazione con sistema Auth"
else
    error "Integrazione Auth non trovata (critico!)"
fi

# Integrazione con notifiche
check
if [ -f "src/services/audit.service.ts" ] && grep -q "notification\|sendNotification" src/services/audit.service.ts 2>/dev/null; then
    pass "Integrazione con sistema Notifiche"
else
    info "Integrazione Notifiche non trovata"
fi

echo ""

# ============================================
# 9. CATEGORIE E SEVERITY
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 9. CATEGORIE E LIVELLI SEVERITY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Categorie audit definite:${NC}"

# Verifica enum categorie
if grep -q "enum AuditCategory\|enum AuditLogCategory" prisma/schema.prisma 2>/dev/null; then
    echo "  Categorie in schema:"
    grep -A 10 "enum.*Category" prisma/schema.prisma | grep -E "^\s+\w+" | grep -v "^}" | while read cat; do
        echo "    • $cat"
    done
else
    warn "Enum categorie non definito"
fi

echo -e "\n${CYAN}Livelli severity:${NC}"

# Verifica enum severity
if grep -q "enum AuditSeverity\|enum LogSeverity" prisma/schema.prisma 2>/dev/null; then
    echo "  Severity levels in schema:"
    grep -A 10 "enum.*Severity" prisma/schema.prisma | grep -E "^\s+\w+" | grep -v "^}" | while read sev; do
        echo "    • $sev"
    done
else
    warn "Enum severity non definito"
fi

echo ""

# ============================================
# 10. TESTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 10. TEST E QUALITÀ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}File di test:${NC}"

# Cerca test per audit
TEST_FILES=$(find . -name "*audit*.test.ts" -o -name "*audit*.spec.ts" 2>/dev/null | wc -l)
check
if [ "$TEST_FILES" -gt 0 ]; then
    pass "Trovati $TEST_FILES file di test"
    find . -name "*audit*.test.ts" -o -name "*audit*.spec.ts" 2>/dev/null | head -5 | while read test; do
        echo "    • $(basename $test)"
    done
else
    warn "Nessun file di test trovato"
fi

# Test creazione log
check
echo -e "\n${CYAN}Test creazione log:${NC}"
TEST_RESULT=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function testLog() {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action: 'TEST_AUDIT_CHECK',
        entityType: 'System',
        entityId: 'test-' + Date.now(),
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'AuditCheck/1.0',
        success: true,
        severity: 'INFO',
        category: 'SYSTEM'
      }
    });
    console.log('✅ Test log creato con ID:', log.id);
    
    // Cancella il log di test
    await prisma.auditLog.delete({ where: { id: log.id } });
    console.log('✅ Test log cancellato');
  } catch(e) {
    console.log('❌ Errore:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}
testLog();
" 2>&1)
echo "$TEST_RESULT"

echo ""

# ============================================
# 11. PERFORMANCE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚡ 11. OTTIMIZZAZIONI PERFORMANCE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Ottimizzazioni implementate:${NC}"

# Indici database
check
echo -n "Verifica indici database... "
if grep -q "@@index.*createdAt\|@@index.*userId\|@@index.*action" prisma/schema.prisma 2>/dev/null; then
    pass "Indici ottimizzati per AuditLog"
    INDEX_COUNT=1
else
    warn "Indici non ottimizzati"
fi

# Paginazione
check
if [ -f "src/services/audit.service.ts" ] && grep -q "skip\|take\|limit\|pagination" src/services/audit.service.ts 2>/dev/null; then
    pass "Paginazione implementata"
else
    warn "Paginazione non trovata"
fi

# Query optimization
check
if [ -f "src/services/audit.service.ts" ] && grep -q "select:\|include:" src/services/audit.service.ts 2>/dev/null; then
    pass "Query ottimizzate con select/include"
else
    warn "Query non ottimizzate"
fi

# Batch operations
check
if [ -f "src/services/audit.service.ts" ] && grep -q "createMany\|deleteMany" src/services/audit.service.ts 2>/dev/null; then
    pass "Operazioni batch implementate"
else
    info "Operazioni batch non trovate"
fi

# Cache
check
if [ -f "src/services/audit.service.ts" ] && grep -q "cache\|Cache\|redis" src/services/audit.service.ts 2>/dev/null; then
    pass "Caching implementato"
    CACHE_USAGE=1
else
    info "Cache non implementata (ok per audit)"
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
if [ -f "src/routes/audit.routes.ts" ]; then
    JSDOC_ROUTES=$(grep -c "/\*\*" src/routes/audit.routes.ts 2>/dev/null || echo 0)
    if [ "$JSDOC_ROUTES" -gt 0 ]; then
        pass "JSDoc in routes: $JSDOC_ROUTES blocchi"
    else
        info "JSDoc non presente in routes"
    fi
fi

# JSDoc nel service
check
if [ -f "src/services/audit.service.ts" ]; then
    JSDOC_SERVICE=$(grep -c "/\*\*" src/services/audit.service.ts 2>/dev/null || echo 0)
    if [ "$JSDOC_SERVICE" -gt 0 ]; then
        pass "JSDoc in service: $JSDOC_SERVICE blocchi"
    else
        info "JSDoc non presente in service"
    fi
fi

# JSDoc nel middleware
check
if [ -f "src/middleware/auditLogger.ts" ]; then
    JSDOC_MIDDLEWARE=$(grep -c "/\*\*" src/middleware/auditLogger.ts 2>/dev/null || echo 0)
    if [ "$JSDOC_MIDDLEWARE" -gt 0 ]; then
        pass "JSDoc in middleware: $JSDOC_MIDDLEWARE blocchi"
    else
        info "JSDoc non presente in middleware"
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

# WebSocket nel service
check
if [ -f "src/services/audit.service.ts" ]; then
    WS_IN_SERVICE=$(grep -c "io\.\|socket\.\|emit\|broadcast" src/services/audit.service.ts 2>/dev/null || echo 0)
    if [ "$WS_IN_SERVICE" -gt 0 ]; then
        pass "Eventi WebSocket per audit real-time"
    else
        info "WebSocket non implementato (opzionale)"
    fi
fi

# Dashboard real-time
check
if [ "$TOTAL_COMPONENTS" -gt 0 ] && grep -r "useEffect.*socket\|io\." src/components/*audit* 2>/dev/null | grep -q .; then
    pass "Dashboard con aggiornamenti real-time"
else
    info "Dashboard senza real-time"
fi

echo ""

# ============================================
# 14. LOGGING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 14. SISTEMA DI LOGGING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Utilizzo logger:${NC}"

# Logger usage nel service
check
if [ -f "src/services/audit.service.ts" ]; then
    LOGGER_USAGE=$(grep -c "logger\.\|Logger\." src/services/audit.service.ts 2>/dev/null || echo 0)
    if [ "$LOGGER_USAGE" -gt 0 ]; then
        pass "Logger utilizzato nel service ($LOGGER_USAGE volte)"
    else
        info "Logger non utilizzato (audit è già un log)"
    fi
fi

# Console.log (non dovrebbero esserci)
check
CONSOLE_LOG=0
if [ -f "src/services/audit.service.ts" ] && [ -f "src/routes/audit.routes.ts" ]; then
    CONSOLE_LOG=$(($(grep -c "console\.log" src/services/audit.service.ts 2>/dev/null || echo 0) + $(grep -c "console\.log" src/routes/audit.routes.ts 2>/dev/null || echo 0)))
fi

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

# Anomaly detection
check
if [ -f "src/services/audit.service.ts" ] && grep -q "anomaly\|suspicious\|unusual" src/services/audit.service.ts 2>/dev/null; then
    pass "Rilevamento anomalie implementato"
else
    info "Rilevamento anomalie non trovato"
fi

# Forensic analysis
check
if [ -f "src/services/audit.service.ts" ] && grep -q "forensic\|investigation\|trace" src/services/audit.service.ts 2>/dev/null; then
    pass "Analisi forensi supportate"
else
    info "Analisi forensi non implementate"
fi

# Compliance reporting
check
if [ -f "src/services/audit.service.ts" ] && grep -q "compliance\|report\|regulation" src/services/audit.service.ts 2>/dev/null; then
    pass "Report compliance presenti"
else
    info "Report compliance non trovati"
fi

# Session reconstruction
check
if [ -f "src/services/audit.service.ts" ] && grep -q "session\|reconstruction\|replay" src/services/audit.service.ts 2>/dev/null; then
    pass "Ricostruzione sessione supportata"
else
    info "Ricostruzione sessione non implementata"
fi

# IP geolocation
check
if [ -f "src/services/audit.service.ts" ] && grep -q "geolocation\|geoip\|location" src/services/audit.service.ts 2>/dev/null; then
    pass "Geolocalizzazione IP presente"
else
    info "Geolocalizzazione IP non trovata"
fi

echo ""

# ============================================
# 16. INTEGRAZIONE BACKUP
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 16. INTEGRAZIONE BACKUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema backup audit:${NC}"

# Export/Archive capabilities
check
if [ -f "src/services/audit.service.ts" ] && grep -q "archive\|Archive\|backup" src/services/audit.service.ts 2>/dev/null; then
    pass "Sistema archiviazione audit presente"
else
    info "Archiviazione audit non implementata"
fi

# Restore capabilities
check
if [ -f "src/services/audit.service.ts" ] && grep -q "restore\|import" src/services/audit.service.ts 2>/dev/null; then
    pass "Funzione restore/import presente"
else
    info "Restore/import non implementato"
fi

echo ""

# ============================================
# 17. MONITORING E ALERTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔔 17. MONITORING E ALERTING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Sistema monitoring:${NC}"

# Health check per audit system
check
if [ -f "src/routes/audit.routes.ts" ] && grep -q "health\|/health\|/status" src/routes/audit.routes.ts 2>/dev/null; then
    pass "Health check audit presente"
else
    info "Health check non implementato"
fi

# Alert automatici
check
if [ -f "src/services/audit.service.ts" ] && grep -q "checkAlerts\|triggerAlert\|sendAlert" src/services/audit.service.ts 2>/dev/null; then
    pass "Sistema alert automatici presente"
else
    warn "Alert automatici non trovati"
fi

# Metriche audit
check
if [ -f "src/services/audit.service.ts" ] && grep -q "metric\|statistic\|count\|aggregate" src/services/audit.service.ts 2>/dev/null; then
    pass "Metriche audit implementate"
else
    info "Metriche non implementate"
fi

# Dashboard monitoring
check
if [ "$TOTAL_COMPONENTS" -gt 0 ]; then
    pass "Dashboard monitoring presente ($TOTAL_COMPONENTS componenti)"
else
    warn "Dashboard monitoring non trovato"
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
    echo -e "${GREEN}$HEALTH_SCORE% - SISTEMA AUDIT OTTIMO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - SISTEMA AUDIT BUONO${NC}"
    EXIT_CODE=0
elif [ "$HEALTH_SCORE" -ge 40 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - SISTEMA AUDIT CON PROBLEMI${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}$HEALTH_SCORE% - SISTEMA AUDIT CRITICO${NC}"
    EXIT_CODE=1
fi

echo ""

# Raccomandazioni
if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI PER IL SISTEMA AUDIT:"
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
            echo "  ❗ Aggiungere autenticazione alle routes audit"
        fi
        
        if [ "$AUDIT_TS_ERRORS" -gt 0 ]; then
            echo "  ❗ Correggere $AUDIT_TS_ERRORS errori TypeScript"
        fi
        
        echo "  ❗ Verificare integrazione con Auth (login/logout)"
        echo "  ❗ Implementare middleware auditLogger"
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "\n${YELLOW}MIGLIORAMENTI consigliati:${NC}"
        
        if [ "$TEST_FILES" -eq 0 ]; then
            echo "  📌 Aggiungere test per il modulo audit"
        fi
        
        echo "  📌 Implementare retention policies automatiche"
        echo "  📌 Aggiungere alert su eventi critici"
        echo "  📌 Implementare export in vari formati"
        echo "  📌 Aggiungere dashboard real-time"
        echo "  📌 Implementare rilevamento anomalie"
        echo "  📌 Verificare compliance GDPR"
    fi
    
    echo ""
fi

echo -e "${GREEN}✅ Analisi completata del sistema Audit Log!${NC}"
echo ""
echo "📊 Sezioni analizzate: 17"
echo "🔍 Controlli effettuati: $TOTAL_CHECKS"
echo "⏱️  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

exit $EXIT_CODE
