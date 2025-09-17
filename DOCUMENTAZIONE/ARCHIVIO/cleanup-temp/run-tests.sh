#!/bin/bash

# Script per eseguire tutti i test automatici
# Sistema Richiesta Assistenza - Test Suite Completa

echo "🧪 Sistema Richiesta Assistenza - Test Suite"
echo "==========================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare con colori
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Setup ambiente di test
print_info "Preparazione ambiente di test..."

# Verifica se i servizi sono in esecuzione
check_service() {
    if lsof -i:$1 > /dev/null 2>&1; then
        print_success "Servizio su porta $1 attivo"
        return 0
    else
        print_error "Servizio su porta $1 non attivo"
        return 1
    fi
}

# Controlla PostgreSQL
if ! check_service 5432; then
    print_error "PostgreSQL non in esecuzione. Avvialo prima di eseguire i test."
    exit 1
fi

# Controlla Redis
if ! check_service 6379; then
    print_info "Redis non in esecuzione. Alcuni test potrebbero fallire."
fi

echo ""
echo "📦 Installazione dipendenze di test..."

# Installa dipendenze se necessario
cd backend
if ! npm list supertest > /dev/null 2>&1; then
    npm install --save-dev supertest @types/supertest
fi

if ! npm list @playwright/test > /dev/null 2>&1; then
    cd ..
    npm install --save-dev @playwright/test
    npx playwright install
fi

echo ""
echo "🔧 Selezione modalità test"
echo "========================="
echo "1) Test Backend (Unit + Integration)"
echo "2) Test Frontend (E2E con Playwright)"
echo "3) Test Completi (Backend + Frontend)"
echo "4) Test con Coverage"
echo "5) Test Specifico (inserisci pattern)"
echo ""

read -p "Scegli opzione (1-5): " choice

case $choice in
    1)
        echo ""
        print_info "Esecuzione test Backend..."
        echo "------------------------"
        cd backend
        npm test
        ;;
    
    2)
        echo ""
        print_info "Esecuzione test E2E Frontend..."
        echo "-----------------------------"
        cd ..
        
        # Avvia i servizi se non sono già attivi
        if ! check_service 3200; then
            print_info "Avvio backend..."
            cd backend && npm run dev &
            BACKEND_PID=$!
            sleep 5
        fi
        
        if ! check_service 5193; then
            print_info "Avvio frontend..."
            cd .. && npm run dev &
            FRONTEND_PID=$!
            sleep 5
        fi
        
        # Esegui test Playwright
        npx playwright test
        
        # Ferma i servizi se li abbiamo avviati
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID
        fi
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID
        fi
        ;;
    
    3)
        echo ""
        print_info "Esecuzione test completi..."
        echo "-------------------------"
        
        # Test backend
        print_info "Test Backend..."
        cd backend
        npm test
        BACKEND_RESULT=$?
        
        # Test frontend
        print_info "Test Frontend E2E..."
        cd ..
        npx playwright test
        FRONTEND_RESULT=$?
        
        # Risultati
        echo ""
        echo "📊 RISULTATI TEST"
        echo "================="
        
        if [ $BACKEND_RESULT -eq 0 ]; then
            print_success "Backend: PASSED"
        else
            print_error "Backend: FAILED"
        fi
        
        if [ $FRONTEND_RESULT -eq 0 ]; then
            print_success "Frontend: PASSED"
        else
            print_error "Frontend: FAILED"
        fi
        ;;
    
    4)
        echo ""
        print_info "Esecuzione test con coverage..."
        echo "-----------------------------"
        cd backend
        npm run test:coverage
        
        echo ""
        print_info "Report coverage salvato in backend/coverage/index.html"
        
        # Apri il report nel browser
        if command -v open > /dev/null; then
            open coverage/index.html
        fi
        ;;
    
    5)
        echo ""
        read -p "Inserisci pattern test (es: auth, websocket, api): " pattern
        print_info "Esecuzione test: $pattern"
        echo "------------------------"
        cd backend
        npx vitest run --grep "$pattern"
        ;;
    
    *)
        print_error "Opzione non valida"
        exit 1
        ;;
esac

echo ""
print_info "Test completati!"

# Genera report se ci sono risultati
if [ -f "test-results.json" ]; then
    echo ""
    print_info "📈 Generazione report..."
    
    # Conta test passati/falliti
    PASSED=$(grep -o '"status":"passed"' test-results.json | wc -l)
    FAILED=$(grep -o '"status":"failed"' test-results.json | wc -l)
    SKIPPED=$(grep -o '"status":"skipped"' test-results.json | wc -l)
    
    echo ""
    echo "📊 SOMMARIO TEST"
    echo "==============="
    print_success "Passati: $PASSED"
    if [ $FAILED -gt 0 ]; then
        print_error "Falliti: $FAILED"
    fi
    if [ $SKIPPED -gt 0 ]; then
        print_info "Saltati: $SKIPPED"
    fi
fi

echo ""
echo "==========================================="
echo "✨ Test Suite Completata"
echo "==========================================="
