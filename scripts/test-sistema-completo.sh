#!/bin/bash

# ===============================================
# 🧪 SCRIPT DI TEST COMPLETO PER IL SISTEMA
# ===============================================
# Questo script verifica che tutte le funzionalità
# del sistema funzionino correttamente
# ===============================================

set -e  # Esci se c'è un errore

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory del progetto
PROJECT_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

# Contatori
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Funzione per stampare header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Funzione per testare un comando
test_command() {
    local test_name="$1"
    local command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -e "\n${YELLOW}Test #$TESTS_TOTAL:${NC} $test_name"
    
    if eval "$command" > /tmp/test_output.txt 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${RED}Error output:${NC}"
        cat /tmp/test_output.txt | head -5
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Funzione per verificare se un servizio è attivo
check_service() {
    local service_name="$1"
    local port="$2"
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $service_name is not running on port $port${NC}"
        return 1
    fi
}

# ===============================================
# INIZIO TEST
# ===============================================

print_header "🚀 SISTEMA TEST AUTOMATICI - RICHIESTA ASSISTENZA"
echo "Data: $(date)"
echo "Directory: $PROJECT_DIR"

# ===============================================
# 1. VERIFICA AMBIENTE
# ===============================================
print_header "1️⃣ VERIFICA AMBIENTE DI SVILUPPO"

test_command "Node.js installato" "node --version"
test_command "NPM installato" "npm --version"
test_command "TypeScript installato" "cd $BACKEND_DIR && npx tsc --version"

# ===============================================
# 2. VERIFICA DIPENDENZE
# ===============================================
print_header "2️⃣ VERIFICA DIPENDENZE"

test_command "Dipendenze backend installate" "[ -d '$BACKEND_DIR/node_modules' ]"
test_command "Dipendenze frontend installate" "[ -d '$FRONTEND_DIR/node_modules' ]"
test_command "Prisma Client generato" "[ -d '$BACKEND_DIR/node_modules/.prisma' ]"

# ===============================================
# 3. COMPILAZIONE TYPESCRIPT
# ===============================================
print_header "3️⃣ COMPILAZIONE TYPESCRIPT"

echo "Compilazione backend..."
cd "$BACKEND_DIR"

# Conta gli errori TypeScript
echo "Verifica errori TypeScript..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc_output.txt

TS_ERRORS=$(grep -c "error TS" /tmp/tsc_output.txt 2>/dev/null || echo "0")

if [ "$TS_ERRORS" -eq "0" ]; then
    echo -e "${GREEN}✅ Nessun errore TypeScript!${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Trovati $TS_ERRORS errori TypeScript${NC}"
    echo "Dettagli errori:"
    grep "error TS" /tmp/tsc_output.txt | head -10
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ===============================================
# 4. VERIFICA DATABASE
# ===============================================
print_header "4️⃣ VERIFICA CONNESSIONE DATABASE"

test_command "Schema Prisma valido" "cd $BACKEND_DIR && npx prisma validate"

# ===============================================
# 5. TEST UNITARI
# ===============================================
print_header "5️⃣ ESECUZIONE TEST UNITARI"

echo "Esecuzione test con Vitest..."
cd "$BACKEND_DIR"

if npm test 2>&1 | tee /tmp/test_results.txt; then
    echo -e "${GREEN}✅ Test unitari completati${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Alcuni test falliti${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ===============================================
# 6. VERIFICA SERVIZI
# ===============================================
print_header "6️⃣ VERIFICA SERVIZI ATTIVI"

check_service "Backend API" 3200
check_service "Frontend" 5193
check_service "Redis" 6379
check_service "PostgreSQL" 5432

# ===============================================
# 7. TEST API ENDPOINTS
# ===============================================
print_header "7️⃣ TEST API ENDPOINTS"

API_URL="http://localhost:3200/api"

# Test health endpoint
test_command "Health check endpoint" "curl -f -s $API_URL/health"

# Test se il backend risponde
if curl -s $API_URL/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API risponde correttamente${NC}"
    
    # Altri test API
    test_command "Categories endpoint" "curl -f -s $API_URL/categories"
    test_command "System settings endpoint" "curl -f -s $API_URL/system/settings"
else
    echo -e "${RED}❌ Backend non raggiungibile${NC}"
fi

# ===============================================
# 8. VERIFICA FILE CRITICI
# ===============================================
print_header "8️⃣ VERIFICA FILE CRITICI"

test_command "File request.service.ts esiste" "[ -f '$BACKEND_DIR/src/services/request.service.ts' ]"
test_command "File .env esiste" "[ -f '$BACKEND_DIR/.env' ]"
test_command "Schema Prisma esiste" "[ -f '$BACKEND_DIR/prisma/schema.prisma' ]"
test_command "Package.json backend esiste" "[ -f '$BACKEND_DIR/package.json' ]"
test_command "Package.json frontend esiste" "[ -f '$FRONTEND_DIR/package.json' ]"

# ===============================================
# 9. CONTROLLO BACKUP
# ===============================================
print_header "9️⃣ VERIFICA BACKUP"

BACKUP_FILE="$BACKEND_DIR/src/services/request.service.backup-20250910-150000.ts"
test_command "Backup request.service.ts esiste" "[ -f '$BACKUP_FILE' ]"

# ===============================================
# 10. LINT E FORMATTING
# ===============================================
print_header "🔟 VERIFICA CODICE (LINT)"

cd "$BACKEND_DIR"
if npx eslint src --ext .ts --max-warnings 50 > /tmp/eslint_output.txt 2>&1; then
    echo -e "${GREEN}✅ Nessun errore ESLint critico${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Alcuni warning ESLint${NC}"
    WARNINGS=$(grep -c "warning" /tmp/eslint_output.txt 2>/dev/null || echo "0")
    echo "Trovati $WARNINGS warning"
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ===============================================
# REPORT FINALE
# ===============================================
print_header "📊 REPORT FINALE"

echo -e "\n${BLUE}Risultati Test:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Test Totali:    ${TESTS_TOTAL}"
echo -e "Test Passati:   ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Test Falliti:   ${RED}${TESTS_FAILED}${NC}"

# Calcola percentuale successo
if [ $TESTS_TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "Success Rate:   ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -eq 100 ]; then
        echo -e "\n${GREEN}🎉 TUTTI I TEST SONO PASSATI! 🎉${NC}"
    elif [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "\n${GREEN}✅ Sistema funzionante (${SUCCESS_RATE}% successo)${NC}"
    elif [ $SUCCESS_RATE -ge 60 ]; then
        echo -e "\n${YELLOW}⚠️  Sistema parzialmente funzionante (${SUCCESS_RATE}% successo)${NC}"
    else
        echo -e "\n${RED}❌ Sistema con problemi critici (${SUCCESS_RATE}% successo)${NC}"
    fi
fi

# ===============================================
# SUGGERIMENTI
# ===============================================
if [ $TESTS_FAILED -gt 0 ]; then
    print_header "💡 SUGGERIMENTI PER RISOLVERE I PROBLEMI"
    
    echo "1. Se TypeScript ha errori:"
    echo "   cd $BACKEND_DIR && npm run build"
    echo ""
    echo "2. Se il database non si connette:"
    echo "   cd $BACKEND_DIR && npx prisma db push"
    echo ""
    echo "3. Se i servizi non sono attivi:"
    echo "   Backend:  cd $BACKEND_DIR && npm run dev"
    echo "   Frontend: cd $FRONTEND_DIR && npm run dev"
    echo "   Redis:    redis-server"
    echo ""
    echo "4. Per rigenerare Prisma Client:"
    echo "   cd $BACKEND_DIR && npx prisma generate"
fi

# ===============================================
# SALVA REPORT
# ===============================================
REPORT_FILE="$PROJECT_DIR/test-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "TEST REPORT - $(date)"
    echo "================================"
    echo "Tests Passed: $TESTS_PASSED/$TESTS_TOTAL"
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo "TypeScript Errors: $TS_ERRORS"
} > "$REPORT_FILE"

echo -e "\n${BLUE}Report salvato in: $REPORT_FILE${NC}"

# Exit code basato sul successo
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
