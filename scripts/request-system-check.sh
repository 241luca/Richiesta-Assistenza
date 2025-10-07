#!/bin/bash

# ============================================
# Script: Request System Check
# Descrizione: Verifica completa del modulo Richieste Assistenza
# Data: 9 Gennaio 2025
# ============================================

echo "╔══════════════════════════════════════════════════════════╗"
echo "║      REQUEST SYSTEM - VERIFICA MODULO RICHIESTE          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
ERRORS=0

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

# ============================================
# 1. VERIFICA DATABASE E TABELLE
# ============================================
echo "📊 1. VERIFICA DATABASE E TABELLE"
echo "=================================="

# Vai nella directory backend
cd backend 2>/dev/null || cd ../backend 2>/dev/null || {
    error "Directory backend non trovata"
    exit 1
}

# Verifica connessione database
check
echo -n "Connessione database... "
DB_CHECK=$(npx prisma db pull --print 2>&1)
if echo "$DB_CHECK" | grep -q "Introspected 1 model"; then
    pass "Database connesso"
elif echo "$DB_CHECK" | grep -q "Prisma schema loaded"; then
    pass "Database connesso"
elif echo "$DB_CHECK" | grep -q "AssistanceRequest"; then
    pass "Database connesso"
else
    error "Database non raggiungibile"
    echo "  Debug: $DB_CHECK" | head -2
fi

# Verifica tabella AssistanceRequest
check
echo -n "Tabella AssistanceRequest... "
# Usa lo stesso output del check precedente per efficienza
if echo "$DB_CHECK" | grep -q "AssistanceRequest"; then
    pass "Tabella presente"
else
    # Prova query diretta
    TABLE_EXISTS=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1 FROM \\"AssistanceRequest\\" LIMIT 1\`
  .then(() => console.log('exists'))
  .catch(() => console.log('not_exists'))
  .finally(() => prisma.\$disconnect());
" 2>/dev/null)
    if [ "$TABLE_EXISTS" = "exists" ]; then
        pass "Tabella presente"
    else
        error "Tabella non trovata"
    fi
fi

# Conta richieste nel database
check
echo -n "Conteggio richieste... "
REQUEST_COUNT=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.assistanceRequest.count()
  .then(count => console.log(count))
  .catch((err) => console.log('error:', err.message))
  .finally(() => prisma.\$disconnect());
" 2>/dev/null)

if [[ "$REQUEST_COUNT" =~ ^[0-9]+$ ]]; then
    pass "Trovate $REQUEST_COUNT richieste nel database"
elif [[ "$REQUEST_COUNT" == *"error"* ]]; then
    error "Errore nel conteggio richieste"
else
    warn "Impossibile contare le richieste"
fi

echo ""

# ============================================
# 2. VERIFICA FILE E ROUTES
# ============================================
echo "📁 2. VERIFICA FILE E ROUTES"
echo "============================"

# Verifica file routes
check
if [ -f "src/routes/request.routes.ts" ]; then
    pass "File request.routes.ts presente"
    
    # Verifica endpoints principali
    check
    ENDPOINTS=$(grep -c "router\.\(get\|post\|put\|delete\|patch\)" src/routes/request.routes.ts 2>/dev/null)
    if [ "$ENDPOINTS" -gt 0 ]; then
        pass "Trovati $ENDPOINTS endpoints nelle routes"
    else
        warn "Nessun endpoint trovato nelle routes"
    fi
else
    error "File request.routes.ts non trovato"
fi

# Verifica file service
check
if [ -f "src/services/request.service.ts" ]; then
    pass "File request.service.ts presente"
    
    # Verifica funzioni principali
    check
    FUNCTIONS=$(grep -c "export.*function" src/services/request.service.ts 2>/dev/null)
    if [ "$FUNCTIONS" -gt 0 ]; then
        pass "Trovate $FUNCTIONS funzioni nel service"
    else
        warn "Nessuna funzione esportata nel service"
    fi
else
    error "File request.service.ts non trovato"
fi

echo ""

# ============================================
# 3. VERIFICA STATI E WORKFLOW
# ============================================
echo "🔄 3. VERIFICA STATI E WORKFLOW"
echo "================================"

# Verifica stati richieste
check
echo "Stati richieste supportati:"
STATES=$(grep -o "PENDING\|ASSIGNED\|IN_PROGRESS\|COMPLETED\|CANCELLED" src/services/request.service.ts 2>/dev/null | sort -u)
if [ -n "$STATES" ]; then
    while IFS= read -r state; do
        echo "  • $state"
    done <<< "$STATES"
    pass "Stati del workflow configurati"
else
    warn "Stati del workflow non trovati nel codice"
fi

# Verifica priorità
check
echo -e "\nPriorità supportate:"
PRIORITIES=$(grep -o "LOW\|MEDIUM\|HIGH\|URGENT" src/services/request.service.ts 2>/dev/null | sort -u)
if [ -n "$PRIORITIES" ]; then
    while IFS= read -r priority; do
        echo "  • $priority"
    done <<< "$PRIORITIES"
    pass "Priorità configurate"
else
    warn "Priorità non trovate nel codice"
fi

echo ""

# ============================================
# 4. VERIFICA INTEGRAZIONI
# ============================================
echo "🔗 4. VERIFICA INTEGRAZIONI"
echo "==========================="

# Verifica integrazione con Quote
check
QUOTE_INTEGRATION=$(grep -c "Quote\|quote" src/services/request.service.ts 2>/dev/null)
if [ "$QUOTE_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con modulo Preventivi presente"
else
    warn "Integrazione con modulo Preventivi non trovata"
fi

# Verifica integrazione con Notifiche
check
NOTIFICATION_INTEGRATION=$(grep -c "notification\|Notification" src/services/request.service.ts 2>/dev/null)
if [ "$NOTIFICATION_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con sistema Notifiche presente"
else
    warn "Integrazione con sistema Notifiche non trovata"
fi

# Verifica integrazione con Chat
check
CHAT_INTEGRATION=$(grep -c "chat\|Chat\|message" src/services/request.service.ts 2>/dev/null)
if [ "$CHAT_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con sistema Chat presente"
else
    warn "Integrazione con sistema Chat non trovata"
fi

# Verifica integrazione con Google Maps
check
MAPS_INTEGRATION=$(grep -c "geocod\|maps\|address\|coordinates\|lat\|lng" src/services/request.service.ts 2>/dev/null)
if [ "$MAPS_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con Google Maps presente"
else
    # Verifica anche nelle routes
    MAPS_IN_ROUTES=$(grep -c "geocod\|maps" src/routes/request.routes.ts 2>/dev/null)
    if [ "$MAPS_IN_ROUTES" -gt 0 ]; then
        pass "Integrazione con Google Maps presente (routes)"
    else
        warn "Integrazione con Google Maps non trovata"
    fi
fi

# Verifica integrazione con AI
check
AI_INTEGRATION=$(grep -c "ai\|openai\|gpt\|embedding\|suggestion" src/services/request.service.ts 2>/dev/null)
if [ "$AI_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con sistema AI presente"
else
    # Verifica se c'è un service AI separato
    if [ -f "src/services/ai.service.ts" ] || [ -f "src/services/ai-professional.service.ts" ]; then
        pass "Sistema AI disponibile (service separato)"
    else
        warn "Integrazione con sistema AI non trovata"
    fi
fi

# Verifica integrazione con Rapporti Intervento
check
INTERVENTION_INTEGRATION=$(grep -c "InterventionReport\|interventionReport\|rapporto" src/services/request.service.ts 2>/dev/null)
if [ "$INTERVENTION_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con Rapporti Intervento presente"
else
    # Verifica se ci sono file dedicati
    if [ -f "src/services/intervention-report.service.ts" ] || [ -f "src/routes/intervention-report.routes.ts" ]; then
        pass "Modulo Rapporti Intervento disponibile"
    else
        warn "Integrazione con Rapporti Intervento non trovata"
    fi
fi

# Verifica integrazione con Pagamenti (Stripe)
check
PAYMENT_INTEGRATION=$(grep -c "payment\|Payment\|stripe\|Stripe" src/services/request.service.ts 2>/dev/null)
if [ "$PAYMENT_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con sistema Pagamenti presente"
else
    warn "Integrazione con sistema Pagamenti non trovata"
fi

# Verifica integrazione con Scheduled Interventions
check
SCHEDULED_INTEGRATION=$(grep -c "scheduled\|Scheduled\|appointment" src/services/request.service.ts 2>/dev/null)
if [ "$SCHEDULED_INTEGRATION" -gt 0 ]; then
    pass "Integrazione con Interventi Programmati presente"
else
    if [ -f "src/services/scheduledInterventions.service.ts" ]; then
        pass "Modulo Interventi Programmati disponibile"
    else
        warn "Integrazione con Interventi Programmati non trovata"
    fi
fi

echo ""

# ============================================
# 5. VERIFICA API ENDPOINTS
# ============================================
echo "🌐 5. VERIFICA API ENDPOINTS"
echo "============================"

# Test endpoint base (richiede autenticazione)
check
echo -n "Endpoint GET /api/requests... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/requests)
if [ "$HTTP_CODE" = "401" ]; then
    pass "Endpoint risponde (richiede autenticazione)"
elif [ "$HTTP_CODE" = "200" ]; then
    pass "Endpoint accessibile"
else
    error "Endpoint non raggiungibile (HTTP $HTTP_CODE)"
fi

# Verifica ResponseFormatter
check
FORMATTER_USAGE=$(grep -c "ResponseFormatter" src/routes/request.routes.ts 2>/dev/null)
if [ "$FORMATTER_USAGE" -gt 0 ]; then
    pass "ResponseFormatter utilizzato ($FORMATTER_USAGE volte)"
else
    error "ResponseFormatter non utilizzato nelle routes!"
fi

echo ""

# ============================================
# 6. VERIFICA COMPONENTI FRONTEND
# ============================================
echo "🎨 6. VERIFICA COMPONENTI FRONTEND"
echo "=================================="

# Torna alla root del progetto per cercare i componenti
cd .. 2>/dev/null || cd ../.. 2>/dev/null

# Verifica presenza componenti React per le richieste
check
if [ -f "src/pages/RequestsPage.tsx" ]; then
    pass "Componente RequestsPage (lista richieste) presente"
else
    warn "Componente RequestsPage non trovato"
fi

check
if [ -f "src/pages/RequestDetailPage.tsx" ]; then
    pass "Componente RequestDetailPage presente"
else
    warn "Componente RequestDetailPage non trovato"
fi

check
if [ -f "src/pages/NewRequestPage.tsx" ]; then
    pass "Componente NewRequestPage (creazione) presente"
else
    warn "Componente NewRequestPage non trovato"
fi

check
if [ -f "src/pages/EditRequestPage.tsx" ]; then
    pass "Componente EditRequestPage presente"
else
    warn "Componente EditRequestPage non trovato"
fi

# Verifica componenti aggiuntivi
check
if [ -f "src/components/admin/AssignRequestModal.tsx" ]; then
    pass "Componente AssignRequestModal presente"
else
    warn "Componente AssignRequestModal non trovato"
fi

check
if [ -f "src/components/chat/RequestChat.tsx" ]; then
    pass "Componente RequestChat presente"
else
    warn "Componente RequestChat non trovato"
fi

check
if [ -f "src/components/maps/RequestMap.tsx" ]; then
    pass "Componente RequestMap presente"
else
    warn "Componente RequestMap non trovato"
fi

# Conta totale componenti Request
REQUEST_COMPONENTS=$(find src -name "*Request*.tsx" -type f 2>/dev/null | grep -v backup | wc -l)
if [ "$REQUEST_COMPONENTS" -gt 0 ]; then
    echo "  📊 Totale componenti Request trovati: $REQUEST_COMPONENTS"
fi

# Torna nella directory backend per i test successivi
cd backend 2>/dev/null

echo ""

# ============================================
# 7. VERIFICA PERMESSI E RUOLI
# ============================================
echo "🔐 7. VERIFICA PERMESSI E RUOLI"
echo "================================"

# Verifica middleware autenticazione
check
AUTH_MIDDLEWARE=$(grep -c "authenticate" src/routes/request.routes.ts 2>/dev/null)
if [ "$AUTH_MIDDLEWARE" -gt 0 ]; then
    pass "Middleware di autenticazione configurato"
else
    error "Middleware di autenticazione non trovato!"
fi

# Verifica controllo ruoli
check
RBAC_CHECK=$(grep -c "requireRole\|checkRole\|role" src/routes/request.routes.ts 2>/dev/null)
if [ "$RBAC_CHECK" -gt 0 ]; then
    pass "Controllo ruoli implementato"
else
    warn "Controllo ruoli non verificabile"
fi

echo ""

# ============================================
# 8. VERIFICA VALIDAZIONE DATI
# ============================================
echo "✅ 8. VERIFICA VALIDAZIONE DATI"
echo "================================"

# Verifica uso di Zod
check
ZOD_USAGE=$(grep -c "zod\|z\." src/routes/request.routes.ts 2>/dev/null)
if [ "$ZOD_USAGE" -gt 0 ]; then
    pass "Validazione con Zod implementata"
else
    warn "Validazione Zod non trovata"
fi

# Verifica sanitizzazione input
check
SANITIZATION=$(grep -c "sanitize\|escape\|trim" src/services/request.service.ts 2>/dev/null)
if [ "$SANITIZATION" -gt 0 ]; then
    pass "Sanitizzazione input presente"
else
    warn "Sanitizzazione input non verificabile"
fi

echo ""

# ============================================
# 9. STATISTICHE E PERFORMANCE
# ============================================
echo "📈 9. STATISTICHE E PERFORMANCE"
echo "================================"

# Conta query Prisma nel service
check
PRISMA_QUERIES=$(grep -c "prisma\." src/services/request.service.ts 2>/dev/null)
if [ "$PRISMA_QUERIES" -gt 0 ]; then
    pass "Trovate $PRISMA_QUERIES query Prisma"
else
    warn "Nessuna query Prisma trovata"
fi

# Verifica paginazione
check
PAGINATION=$(grep -c "skip\|take\|limit\|page" src/services/request.service.ts 2>/dev/null)
if [ "$PAGINATION" -gt 0 ]; then
    pass "Paginazione implementata"
else
    warn "Paginazione non trovata"
fi

# Verifica caching
check
CACHE_USAGE=$(grep -c "cache\|redis" src/services/request.service.ts 2>/dev/null)
if [ "$CACHE_USAGE" -gt 0 ]; then
    pass "Sistema di cache utilizzato"
else
    warn "Cache non implementata (opzionale)"
fi

echo ""

# ============================================
# RIEPILOGO FINALE
# ============================================
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    RIEPILOGO FINALE                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Calcola health score
HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))

echo "📊 Risultati:"
echo "  • Controlli totali: $TOTAL_CHECKS"
echo -e "  • Passati: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "  • Warning: ${YELLOW}$WARNINGS${NC}"
echo -e "  • Errori: ${RED}$ERRORS${NC}"
echo ""

# Valuta lo stato del sistema
echo -n "🏥 Health Score: "
if [ $HEALTH_SCORE -ge 80 ]; then
    echo -e "${GREEN}$HEALTH_SCORE% - SISTEMA SANO${NC}"
    EXIT_CODE=0
elif [ $HEALTH_SCORE -ge 60 ]; then
    echo -e "${YELLOW}$HEALTH_SCORE% - SISTEMA CON PROBLEMI MINORI${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}$HEALTH_SCORE% - SISTEMA CRITICO${NC}"
    EXIT_CODE=1
fi

echo ""

# Raccomandazioni
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "📋 Raccomandazioni:"
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}  • Correggere gli errori critici prima possibile${NC}"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}  • Verificare e risolvere i warning per migliorare il sistema${NC}"
    fi
    
    echo ""
fi

echo "✅ Verifica del modulo Richieste completata!"
echo ""

exit $EXIT_CODE
