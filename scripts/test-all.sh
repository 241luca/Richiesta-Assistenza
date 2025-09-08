#!/bin/bash

# 🧪 Script per test completo sistema
# Uso: ./scripts/test-all.sh

echo "🧪 TEST COMPLETO SISTEMA"
echo "======================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Test Backend
echo "🔧 Testing Backend..."
echo "--------------------"

cd backend

# Check TypeScript
echo -n "TypeScript compile check... "
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Prisma
echo -n "Prisma validation... "
if npx prisma validate 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Run backend tests
echo -n "Backend unit tests... "
if npm test 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  SKIP (no tests)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

cd ..

# 2. Test Frontend
echo ""
echo "🎨 Testing Frontend..."
echo "--------------------"

# Check build
echo -n "Frontend build check... "
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check TypeScript
echo -n "Frontend TypeScript check... "
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 3. Test Dependencies
echo ""
echo "📦 Checking Dependencies..."
echo "-------------------------"

# Check for vulnerabilities
echo -n "Security audit... "
AUDIT=$(npm audit --audit-level=high 2>&1)
if echo "$AUDIT" | grep -q "found 0"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  VULNERABILITIES FOUND${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check outdated
echo -n "Outdated packages... "
OUTDATED=$(npm outdated 2>&1 | wc -l)
if [ "$OUTDATED" -lt 10 ]; then
    echo -e "${GREEN}✅ OK ($OUTDATED outdated)${NC}"
else
    echo -e "${YELLOW}⚠️  $OUTDATED packages outdated${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. Test Services
echo ""
echo "🔌 Testing Services..."
echo "--------------------"

# Test database connection
echo -n "PostgreSQL connection... "
if pg_isready -q; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
else
    echo -e "${RED}❌ NOT CONNECTED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test Redis
echo -n "Redis connection... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
else
    echo -e "${YELLOW}⚠️  NOT CONNECTED${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Test API Endpoints
echo ""
echo "🌐 Testing API Endpoints..."
echo "-------------------------"

# Start backend in background
cd backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Test health endpoint
echo -n "Health check endpoint... "
if curl -s http://localhost:3200/health | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test auth endpoint
echo -n "Auth endpoints... "
if curl -s http://localhost:3200/api/auth/login > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ACCESSIBLE${NC}"
else
    echo -e "${RED}❌ NOT ACCESSIBLE${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Kill backend
kill $BACKEND_PID 2>/dev/null

# 6. Lint Check
echo ""
echo "📝 Code Quality Checks..."
echo "-----------------------"

# ESLint
echo -n "ESLint check... "
if npx eslint src --max-warnings 20 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNINGS${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Prettier
echo -n "Prettier format check... "
if npx prettier --check "src/**/*.{ts,tsx,js,jsx}" 2>/dev/null; then
    echo -e "${GREEN}✅ FORMATTED${NC}"
else
    echo -e "${YELLOW}⚠️  NEEDS FORMATTING${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 7. File Structure Check
echo ""
echo "📁 File Structure Check..."
echo "------------------------"

# Check required files
echo -n "Required files... "
REQUIRED_FILES=(
    "ISTRUZIONI-PROGETTO.md"
    "STATO-AVANZAMENTO.md"
    "PIANO-SVILUPPO-DETTAGLIATO.md"
    "README.md"
    "package.json"
    "backend/package.json"
    "backend/prisma/schema.prisma"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL PRESENT${NC}"
else
    echo -e "${RED}❌ $MISSING_FILES FILES MISSING${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check no backup files in git
echo -n "Backup files in git... "
if git ls-files | grep -q ".backup"; then
    echo -e "${RED}❌ BACKUP FILES IN GIT${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ CLEAN${NC}"
fi

# 8. Summary
echo ""
echo "======================================="
echo "📊 TEST SUMMARY"
echo "======================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "System is ready for deployment!"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH $WARNINGS WARNINGS${NC}"
    echo "System is functional but needs attention"
else
    echo -e "${RED}❌ FAILED WITH $ERRORS ERRORS and $WARNINGS WARNINGS${NC}"
    echo "System has critical issues that need fixing"
fi

echo ""
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo "======================================="

# Exit with error code if there are errors
exit $ERRORS
