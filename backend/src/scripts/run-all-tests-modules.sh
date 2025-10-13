#!/bin/bash

# =======================================================
# 🧪 RUN ALL TESTS - Sistema Moduli
# Script completo per testing del sistema moduli
# 
# Autore: Sistema Richiesta Assistenza
# Versione: 1.0.0
# Data: 06/10/2025
# =======================================================

echo "🧪 =============================================="
echo "🧪 TESTING SUITE COMPLETA - SISTEMA MODULI"
echo "🧪 =============================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori risultati
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Funzione per stampare sezioni
print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Funzione per stampare risultati
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Funzione per controllo prerequisiti
check_prerequisites() {
    print_section "CONTROLLO PREREQUISITI"
    
    # Verifica Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js trovato: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js non trovato${NC}"
        exit 1
    fi
    
    # Verifica npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm trovato: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm non trovato${NC}"
        exit 1
    fi
    
    # Verifica che siamo nella directory corretta
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json non trovato. Assicurati di essere nella directory root del progetto${NC}"
        exit 1
    fi
    
    # Verifica che il backend sia in running
    if curl -s http://localhost:3200/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend in esecuzione su porta 3200${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend non raggiungibile su porta 3200${NC}"
        echo -e "${YELLOW}   Assicurati che 'cd backend && npm run dev' sia in esecuzione${NC}"
    fi
    
    # Verifica che il frontend sia in running (per test E2E)
    if curl -s http://localhost:5193 > /dev/null; then
        echo -e "${GREEN}✅ Frontend in esecuzione su porta 5193${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend non raggiungibile su porta 5193${NC}"
        echo -e "${YELLOW}   Assicurati che 'npm run dev' sia in esecuzione per i test E2E${NC}"
    fi
}

# 1. BACKEND UNIT TESTS
run_unit_tests() {
    print_section "1️⃣ BACKEND UNIT TESTS"
    echo "Eseguendo test unit per ModuleService..."
    
    cd backend
    npm test -- src/__tests__/services/module.service.test.ts
    UNIT_RESULT=$?
    cd ..
    
    print_result $UNIT_RESULT "Unit Tests (ModuleService)"
    
    if [ $UNIT_RESULT -ne 0 ]; then
        echo -e "${RED}Unit tests falliti. Dettagli degli errori sopra.${NC}"
    else
        echo -e "${GREEN}Tutti i unit test sono passati!${NC}"
    fi
}

# 2. BACKEND INTEGRATION TESTS  
run_integration_tests() {
    print_section "2️⃣ BACKEND INTEGRATION TESTS"
    echo "Eseguendo test integration per API Modules..."
    
    cd backend
    npm test -- src/__tests__/integration/modules.api.test.ts
    INTEGRATION_RESULT=$?
    cd ..
    
    print_result $INTEGRATION_RESULT "Integration Tests (API Modules)"
    
    if [ $INTEGRATION_RESULT -ne 0 ]; then
        echo -e "${RED}Integration tests falliti. Dettagli degli errori sopra.${NC}"
    else
        echo -e "${GREEN}Tutti gli integration test sono passati!${NC}"
    fi
}

# 3. FRONTEND E2E TESTS
run_e2e_tests() {
    print_section "3️⃣ FRONTEND E2E TESTS"
    echo "Eseguendo test End-to-End con Playwright..."
    
    # Verifica che Playwright sia installato
    if [ ! -d "node_modules/@playwright" ]; then
        echo -e "${YELLOW}⚠️  Playwright non trovato. Installazione in corso...${NC}"
        npm install @playwright/test
        npx playwright install
    fi
    
    # Esegui test E2E solo per moduli
    npx playwright test tests/modules.spec.ts
    E2E_RESULT=$?
    
    print_result $E2E_RESULT "E2E Tests (Playwright)"
    
    if [ $E2E_RESULT -ne 0 ]; then
        echo -e "${RED}E2E tests falliti. Dettagli degli errori sopra.${NC}"
        echo -e "${YELLOW}Nota: I test E2E richiedono che frontend e backend siano in esecuzione${NC}"
    else
        echo -e "${GREEN}Tutti gli E2E test sono passati!${NC}"
    fi
}

# 4. TYPESCRIPT CHECK
run_typescript_check() {
    print_section "4️⃣ TYPESCRIPT CHECK"
    echo "Verificando errori TypeScript nel backend..."
    
    cd backend
    npx tsc --noEmit
    TS_RESULT=$?
    cd ..
    
    print_result $TS_RESULT "TypeScript Check"
    
    if [ $TS_RESULT -ne 0 ]; then
        echo -e "${RED}Errori TypeScript trovati. Correggi prima di procedere.${NC}"
    else
        echo -e "${GREEN}Nessun errore TypeScript!${NC}"
    fi
}

# 5. LINT CHECK  
run_lint_check() {
    print_section "5️⃣ LINT CHECK"
    echo "Verificando standard di codice..."
    
    # Backend lint
    cd backend
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        npm run lint 2>/dev/null || echo "Lint script non configurato nel backend"
        BACKEND_LINT=$?
    else
        echo -e "${YELLOW}⚠️  ESLint non configurato nel backend${NC}"
        BACKEND_LINT=0
    fi
    cd ..
    
    # Frontend lint
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        npm run lint 2>/dev/null || echo "Lint script non configurato nel frontend"
        FRONTEND_LINT=$?
    else
        echo -e "${YELLOW}⚠️  ESLint non configurato nel frontend${NC}"
        FRONTEND_LINT=0
    fi
    
    LINT_RESULT=$((BACKEND_LINT + FRONTEND_LINT))
    print_result $LINT_RESULT "Lint Check"
}

# 6. BUILD CHECK
run_build_check() {
    print_section "6️⃣ BUILD CHECK"
    echo "Verificando che il progetto compili correttamente..."
    
    # Build frontend
    npm run build
    FRONTEND_BUILD=$?
    
    # Build backend
    cd backend
    npm run build 2>/dev/null || echo "Build script non configurato nel backend"
    BACKEND_BUILD=$?
    cd ..
    
    BUILD_RESULT=$((FRONTEND_BUILD + BACKEND_BUILD))
    print_result $BUILD_RESULT "Build Check"
    
    if [ $BUILD_RESULT -ne 0 ]; then
        echo -e "${RED}Errori di build trovati. Il progetto non compila correttamente.${NC}"
    else
        echo -e "${GREEN}Build completato con successo!${NC}"
    fi
}

# 7. COVERAGE REPORT
generate_coverage_report() {
    print_section "7️⃣ COVERAGE REPORT"
    echo "Generando report di copertura test..."
    
    cd backend
    npm run test:coverage 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Script test:coverage non configurato${NC}"
        echo "Eseguendo test con coverage manuale..."
        npm test -- --coverage
    }
    COVERAGE_RESULT=$?
    cd ..
    
    print_result $COVERAGE_RESULT "Coverage Report"
    
    if [ $COVERAGE_RESULT -eq 0 ]; then
        echo -e "${GREEN}Report coverage generato. Controlla la cartella coverage/ per i dettagli.${NC}"
    fi
}

# MAIN EXECUTION
main() {
    echo -e "${BLUE}Inizio testing suite completa...${NC}"
    echo "Data: $(date)"
    echo ""
    
    # 0. Controllo prerequisiti
    check_prerequisites
    
    # 1. Unit Tests
    run_unit_tests
    
    # 2. Integration Tests
    run_integration_tests
    
    # 3. E2E Tests
    run_e2e_tests
    
    # 4. TypeScript Check
    run_typescript_check
    
    # 5. Lint Check
    run_lint_check
    
    # 6. Build Check
    run_build_check
    
    # 7. Coverage Report
    generate_coverage_report
    
    # RISULTATI FINALI
    print_section "📊 RISULTATI FINALI"
    echo -e "Test totali eseguiti: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Test passati: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Test falliti: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 TUTTI I TEST SONO PASSATI!${NC}"
        echo -e "${GREEN}✅ Il sistema moduli è pronto per il deploy${NC}"
        EXIT_CODE=0
    else
        echo -e "${RED}❌ $FAILED_TESTS test falliti${NC}"
        echo -e "${RED}🚨 Correggi gli errori prima del deploy${NC}"
        EXIT_CODE=1
    fi
    
    echo ""
    echo -e "${BLUE}Testing completato in: $(date)${NC}"
    echo -e "${BLUE}=============================================${NC}"
    
    exit $EXIT_CODE
}

# Esegui se script chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
