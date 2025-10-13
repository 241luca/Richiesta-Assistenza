#!/bin/bash

# ============================================
# Script: Audit System Check - ANALISI COMPLETA
# Descrizione: Verifica dettagliata del sistema Audit Log
# Data: 9 Gennaio 2025
# 
# Uso: ./audit-check.sh [--skip-typescript]
# ============================================

# Controlla parametri
SKIP_TYPESCRIPT=false
if [ "$1" = "--skip-typescript" ]; then
    SKIP_TYPESCRIPT=true
    echo "🚨 Salto controlli TypeScript per velocità"
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       AUDIT SYSTEM CHECK - ANALISI COMPLETA              ║"
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

# Funzioni helper
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# ============================================
# 1. VERIFICA DATABASE E MODELLI
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 1. DATABASE E MODELLO AUDITLOG${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd backend 2>/dev/null || cd ../backend 2>/dev/null || {
    error "Directory backend non trovata"
    exit 1
}

# Verifica modello AuditLog in schema.prisma
check
echo -n "Modello AuditLog in schema... "
if grep -q "model AuditLog" prisma/schema.prisma; then
    pass "Modello definito correttamente"
    
    # Elenca i campi del modello
    echo -e "\n${CYAN}  Campi del modello:${NC}"
    grep -A 20 "model AuditLog" prisma/schema.prisma | grep -E "^\s+\w+" | head -15 | while read line; do
        echo "    • $line"
    done
else
    error "Modello AuditLog non trovato in schema.prisma"
fi

# Conta record nel database
check
echo -e "\n${CYAN}Statistiche Audit Log:${NC}"
STATS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function stats() {
  const total = await prisma.auditLog.count().catch(() => 0);
  const today = await prisma.auditLog.count({ 
    where: { 
      createdAt: { 
        gte: new Date(new Date().setHours(0,0,0,0)) 
      } 
    } 
  }).catch(() => 0);
  const errors = await prisma.auditLog.count({ 
    where: { success: false } 
  }).catch(() => 0);
  console.log(\`  • Totale log: \${total}\`);
  console.log(\`  • Log di oggi: \${today}\`);
  console.log(\`  • Log con errori: \${errors}\`);
}
stats().finally(() => prisma.\$disconnect());
" 2>/dev/null)
echo "$STATS"

# Verifica categorie di audit
echo -e "\n${CYAN}Categorie di Audit:${NC}"
if grep -q "enum.*AuditCategory" prisma/schema.prisma; then
    grep -A 10 "enum AuditCategory" prisma/schema.prisma | grep -E "^\s+\w+" | while read cat; do
        echo "  • $cat"
    done
else
    warn "Enum AuditCategory non trovato"
fi

echo ""

# ============================================
# 2. VERIFICA MIDDLEWARE AUDIT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🛡️ 2. MIDDLEWARE AUDITLOGGER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verifica esistenza middleware
check
if [ -f "src/middleware/auditLogger.ts" ]; then
    pass "Middleware auditLogger.ts presente"
    
    # Verifica export della funzione
    if grep -q "export.*auditLogger" src/middleware/auditLogger.ts; then
        pass "Funzione auditLogger esportata"
    else
        error "Funzione auditLogger non esportata"
    fi
    
    # Verifica categorie tracciate
    echo -e "\n${CYAN}Azioni tracciate:${NC}"
    ACTIONS=$(grep -oE "'[A-Z_]+'" src/middleware/auditLogger.ts | sort -u | head -10)
    if [ -n "$ACTIONS" ]; then
        echo "$ACTIONS" | while read action; do
            echo "  • $action"
        done
    fi
else
    error "Middleware auditLogger.ts non trovato"
fi

echo ""

# ============================================
# 3. VERIFICA SERVICE AUDIT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 3. AUDIT SERVICE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

check
if [ -f "src/services/auditLog.service.ts" ] || [ -f "src/services/audit.service.ts" ]; then
    AUDIT_SERVICE=$(ls src/services/audit*.service.ts 2>/dev/null | head -1)
    pass "Audit service trovato: $(basename $AUDIT_SERVICE)"
    
    # Verifica funzioni principali
    echo -e "\n${CYAN}Funzioni disponibili:${NC}"
    grep -E "export (async )?function" "$AUDIT_SERVICE" | while read line; do
        FUNC_NAME=$(echo "$line" | grep -oE "function \w+" | sed 's/function //')
        echo "  • $FUNC_NAME()"
    done
    
    # Verifica query functions
    check
    if grep -q "findMany\|count\|aggregate" "$AUDIT_SERVICE" 2>/dev/null; then
        pass "Query functions implementate"
    else
        warn "Query functions non trovate"
    fi
else
    error "Audit service non trovato"
fi

echo ""

# ============================================
# 4. VERIFICA ROUTES AUDIT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 4. API ROUTES AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

AUDIT_ROUTES=$(find src/routes -name "*audit*.ts" 2>/dev/null | head -1)
if [ -n "$AUDIT_ROUTES" ]; then
    pass "Routes audit trovate: $(basename $AUDIT_ROUTES)"
    
    echo -e "\n${CYAN}Endpoints disponibili:${NC}"
    grep -E "router\.(get|post|put|patch|delete)\(" "$AUDIT_ROUTES" | while read line; do
        METHOD=$(echo "$line" | grep -oE "(get|post|put|patch|delete)" | head -1 | tr '[:lower:]' '[:upper:]')
        ENDPOINT=$(echo "$line" | grep -oE "'[^']+'" | head -1 | tr -d "'")
        echo "  • [$METHOD] /api/audit$ENDPOINT"
    done
else
    warn "Routes audit non trovate"
fi

echo ""

# ============================================
# 5. VERIFICA UTILIZZO NEL SISTEMA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📍 5. UTILIZZO AUDIT NEL SISTEMA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Conta utilizzo in routes
echo -e "\n${CYAN}Utilizzo del middleware nelle routes:${NC}"
ROUTES_WITH_AUDIT=0
for route in src/routes/*.ts; do
    if [ -f "$route" ]; then
        if grep -q "auditLogger\|auditLog" "$route" 2>/dev/null; then
            ROUTES_WITH_AUDIT=$((ROUTES_WITH_AUDIT + 1))
        fi
    fi
done

if [ "$ROUTES_WITH_AUDIT" -gt 0 ]; then
    pass "Audit utilizzato in $ROUTES_WITH_AUDIT routes"
else
    error "Audit non utilizzato nelle routes"
fi

# Verifica categorie utilizzate
check
echo -e "\n${CYAN}Categorie utilizzate:${NC}"
CATEGORIES=$(grep -r "category:.*['\"]" src/ --include="*.ts" | grep -oE "AUTH|DATA|ADMIN|SYSTEM|SECURITY|BUSINESS" | sort -u)
if [ -n "$CATEGORIES" ]; then
    echo "$CATEGORIES" | while read cat; do
        COUNT=$(grep -r "category:.*['\"]$cat" src/ --include="*.ts" | wc -l | tr -d ' ')
        echo "  • $cat: $COUNT utilizzi"
    done
else
    warn "Nessuna categoria trovata nell'uso"
fi

echo ""

# ============================================
# 6. VERIFICA CONFIGURAZIONE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️ 6. CONFIGURAZIONE AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verifica retention policy
check
if grep -q "AUDIT_RETENTION\|retentionDays" src/ -r --include="*.ts" 2>/dev/null; then
    pass "Retention policy configurata"
else
    warn "Retention policy non configurata"
fi

# Verifica severity levels
check
echo -e "\n${CYAN}Livelli di severity utilizzati:${NC}"
SEVERITIES=$(grep -r "severity:.*['\"]" src/ --include="*.ts" | grep -oE "INFO|WARNING|ERROR|CRITICAL" | sort | uniq -c)
if [ -n "$SEVERITIES" ]; then
    echo "$SEVERITIES" | while read count level; do
        echo "  • $level: $count occorrenze"
    done
else
    warn "Nessun livello di severity trovato"
fi

echo ""

# ============================================
# 7. VERIFICA SICUREZZA
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 7. SICUREZZA AUDIT LOG${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verifica accesso protetto
check
if [ -n "$AUDIT_ROUTES" ]; then
    if grep -q "authenticate\|requireRole.*ADMIN" "$AUDIT_ROUTES" 2>/dev/null; then
        pass "Routes audit protette con autenticazione"
    else
        error "Routes audit non protette!"
    fi
fi

# Verifica dati sensibili
check
if grep -q "password.*redact\|sanitize\|exclude.*password" src/middleware/auditLogger.ts 2>/dev/null; then
    pass "Dati sensibili protetti nel log"
else
    warn "Protezione dati sensibili non verificabile"
fi

echo ""

# ============================================
# 8. VERIFICA PERFORMANCE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}⚡ 8. PERFORMANCE AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verifica async logging
check
if grep -q "async.*log\|Promise" src/middleware/auditLogger.ts 2>/dev/null; then
    pass "Logging asincrono implementato"
else
    warn "Logging potrebbe essere sincrono"
fi

# Verifica indici database
check
if grep -q "@@index.*AuditLog" prisma/schema.prisma 2>/dev/null; then
    pass "Indici database configurati"
else
    warn "Indici database non configurati"
fi

echo ""

# ============================================
# 9. VERIFICA REPORTING
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 9. REPORTING E ANALYTICS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verifica funzioni di reporting
check
if [ -n "$AUDIT_SERVICE" ]; then
    if grep -q "getStats\|getReport\|aggregate" "$AUDIT_SERVICE" 2>/dev/null; then
        pass "Funzioni di reporting presenti"
    else
        warn "Funzioni di reporting non trovate"
    fi
fi

# Verifica export capabilities
check
if grep -q "export.*CSV\|export.*JSON\|export.*PDF" src/ -r --include="*.ts" 2>/dev/null; then
    pass "Export dati implementato"
else
    info "Export dati non implementato"
fi

echo ""

# ============================================
# 10. VERIFICA FRONTEND
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 10. INTERFACCIA AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

cd .. 2>/dev/null

# Verifica componenti frontend
check
if [ -f "src/pages/admin/AuditLog.tsx" ] || [ -f "src/components/admin/AuditDashboard.tsx" ]; then
    pass "Interfaccia admin audit presente"
    
    # Verifica uso React Query
    AUDIT_COMPONENT=$(find src -name "*[Aa]udit*.tsx" -type f | head -1)
    if [ -n "$AUDIT_COMPONENT" ] && grep -q "useQuery\|useMutation" "$AUDIT_COMPONENT" 2>/dev/null; then
        pass "React Query utilizzato"
    fi
else
    warn "Interfaccia admin audit non trovata"
fi

echo ""

# ============================================
# RIEPILOGO FINALE
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RIEPILOGO FINALE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Calcola health score
HEALTH_SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo ""
echo -e "${CYAN}📈 Risultati:${NC}"
echo "  • Controlli totali: $TOTAL_CHECKS"
echo "  • Passati: $PASSED_CHECKS"
echo "  • Warning: $WARNINGS"
echo "  • Errori: $ERRORS"

echo ""
if [ "$HEALTH_SCORE" -ge 80 ]; then
    echo -e "${GREEN}🏥 Health Score: ${HEALTH_SCORE}% - SISTEMA AUDIT ECCELLENTE${NC}"
elif [ "$HEALTH_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}🏥 Health Score: ${HEALTH_SCORE}% - SISTEMA AUDIT BUONO${NC}"
else
    echo -e "${RED}🏥 Health Score: ${HEALTH_SCORE}% - SISTEMA AUDIT DA MIGLIORARE${NC}"
fi

echo ""
echo -e "${CYAN}📋 RACCOMANDAZIONI:${NC}"
echo ""
if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}CRITICI da risolvere subito:${NC}"
    echo "  ❗ Verificare gli errori segnalati sopra"
fi

echo ""
echo -e "${YELLOW}MIGLIORAMENTI consigliati:${NC}"
echo "  📌 Configurare retention policy"
echo "  📌 Implementare dashboard di visualizzazione"
echo "  📌 Aggiungere export in formati multipli"
echo "  📌 Ottimizzare performance con indici"

echo ""
echo -e "${CYAN}💡 SUGGERIMENTI:${NC}"
echo ""
echo "  1. Verificare log: SELECT * FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 10;"
echo "  2. Controllare errori: SELECT * FROM \"AuditLog\" WHERE success = false;"
echo "  3. Analizzare per categoria: SELECT category, COUNT(*) FROM \"AuditLog\" GROUP BY category;"
echo "  4. Verificare utenti: SELECT \"userId\", COUNT(*) FROM \"AuditLog\" GROUP BY \"userId\";"

echo ""
echo -e "${GREEN}✅ Verifica completata del sistema Audit!${NC}"
echo ""
echo "📊 Sezioni analizzate: 10"
echo "🔍 Controlli effettuati: $TOTAL_CHECKS"
echo "⏱️  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
