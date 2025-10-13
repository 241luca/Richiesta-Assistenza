#!/bin/bash

# =======================================================
# 🧪 QUICK TEST VERIFICATION - Sistema Moduli  
# Verifica rapida che i test siano pronti per l'esecuzione
# 
# Autore: Sistema Richiesta Assistenza
# Versione: 1.0.0
# Data: 06/10/2025
# =======================================================

echo "🧪 =============================================="
echo "🧪 VERIFICA RAPIDA SUITE TESTING"
echo "🧪 =============================================="

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=== VERIFICA FILE TEST CREATI ===${NC}"

# Verifica Unit Tests
if [ -f "backend/src/__tests__/services/module.service.test.ts" ]; then
    echo -e "${GREEN}✅ Unit Tests: module.service.test.ts${NC}"
else
    echo -e "${RED}❌ Unit Tests: module.service.test.ts MANCANTE${NC}"
fi

# Verifica Integration Tests  
if [ -f "backend/src/__tests__/integration/modules.api.test.ts" ]; then
    echo -e "${GREEN}✅ Integration Tests: modules.api.test.ts${NC}"
else
    echo -e "${RED}❌ Integration Tests: modules.api.test.ts MANCANTE${NC}"
fi

# Verifica E2E Tests
if [ -f "tests/modules.spec.ts" ]; then
    echo -e "${GREEN}✅ E2E Tests: modules.spec.ts${NC}"
else
    echo -e "${RED}❌ E2E Tests: modules.spec.ts MANCANTE${NC}"
fi

# Verifica Script Automazione
if [ -f "scripts/run-all-tests-modules.sh" ] && [ -x "scripts/run-all-tests-modules.sh" ]; then
    echo -e "${GREEN}✅ Script Automazione: run-all-tests-modules.sh (eseguibile)${NC}"
else
    echo -e "${RED}❌ Script Automazione: MANCANTE o non eseguibile${NC}"
fi

echo ""
echo -e "${BLUE}=== VERIFICA DEPENDENCIES ===${NC}"

# Verifica package.json backend
if grep -q '"vitest"' backend/package.json; then
    echo -e "${GREEN}✅ Backend: vitest configurato${NC}"
else
    echo -e "${RED}❌ Backend: vitest MANCANTE${NC}"
fi

if grep -q '"supertest"' backend/package.json; then
    echo -e "${GREEN}✅ Backend: supertest configurato${NC}"
else
    echo -e "${RED}❌ Backend: supertest MANCANTE${NC}"
fi

# Verifica Playwright
if [ -f "package.json" ] && grep -q '"@playwright/test"' package.json; then
    echo -e "${GREEN}✅ Frontend: Playwright configurato${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Playwright potrebbe non essere configurato${NC}"
fi

echo ""
echo -e "${BLUE}=== CONTEGGIO TEST ===${NC}"

# Conta test unit
UNIT_TESTS=$(grep -c "it('.*'," backend/src/__tests__/services/module.service.test.ts 2>/dev/null || echo "0")
echo -e "${GREEN}📊 Unit Tests trovati: ${UNIT_TESTS}${NC}"

# Conta test integration
INTEGRATION_TESTS=$(grep -c "it('.*'," backend/src/__tests__/integration/modules.api.test.ts 2>/dev/null || echo "0")
echo -e "${GREEN}📊 Integration Tests trovati: ${INTEGRATION_TESTS}${NC}"

# Conta test E2E
E2E_TESTS=$(grep -c "test('.*'," tests/modules.spec.ts 2>/dev/null || echo "0")
echo -e "${GREEN}📊 E2E Tests trovati: ${E2E_TESTS}${NC}"

TOTAL_TESTS=$((UNIT_TESTS + INTEGRATION_TESTS + E2E_TESTS))
echo -e "${BLUE}📊 TOTALE TEST: ${TOTAL_TESTS}${NC}"

echo ""
echo -e "${BLUE}=== COMANDI PER ESEGUIRE I TEST ===${NC}"
echo ""
echo -e "${YELLOW}# 1. INSTALLA DEPENDENCIES MANCANTI:${NC}"
echo "cd backend && npm install --save-dev @types/supertest"
echo "cd .. && npm install @playwright/test"
echo "npx playwright install"
echo ""
echo -e "${YELLOW}# 2. ESEGUI UNIT TESTS:${NC}"
echo "cd backend && npm test src/__tests__/services/module.service.test.ts"
echo ""
echo -e "${YELLOW}# 3. ESEGUI INTEGRATION TESTS:${NC}"
echo "cd backend && npm test src/__tests__/integration/modules.api.test.ts"
echo ""
echo -e "${YELLOW}# 4. ESEGUI E2E TESTS:${NC}"
echo "npx playwright test tests/modules.spec.ts"
echo ""
echo -e "${YELLOW}# 5. ESEGUI TUTTI I TEST:${NC}"
echo "./scripts/run-all-tests-modules.sh"
echo ""
echo -e "${YELLOW}# 6. TYPESCRIPT CHECK:${NC}"
echo "cd backend && npx tsc --noEmit"
echo ""

echo -e "${BLUE}=== PREREQUISITES CHECK ===${NC}"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js non trovato${NC}"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}❌ npm non trovato${NC}"
fi

# Check backend running
if curl -s http://localhost:3200/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running su :3200${NC}"
else
    echo -e "${YELLOW}⚠️  Backend NON running su :3200${NC}"
    echo -e "${YELLOW}   Avvia con: cd backend && npm run dev${NC}"
fi

# Check frontend running  
if curl -s http://localhost:5193 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running su :5193${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend NON running su :5193${NC}"
    echo -e "${YELLOW}   Avvia con: npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}=== NEXT STEPS ===${NC}"
echo ""
echo "1. 📦 Installa dependencies mancanti"
echo "2. 🚀 Avvia backend e frontend"  
echo "3. 🧪 Esegui: ./scripts/run-all-tests-modules.sh"
echo "4. 📊 Verifica coverage > 80%"
echo "5. ✅ Tutti test passano = SISTEMA PRONTO!"
echo ""
echo -e "${GREEN}🎉 SUITE TESTING PRONTA PER L'USO!${NC}"
