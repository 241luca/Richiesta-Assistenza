#!/bin/bash

# =================================================================
# 🔍 PRE-COMMIT CHECK SCRIPT
# =================================================================
# Esegue tutti i controlli necessari prima di un commit
# Uso: ./scripts/pre-commit-check.sh
# =================================================================

echo ""
echo "======================================"
echo "🔍 PRE-COMMIT CHECKS"
echo "======================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatori errori
ERRORS=0
WARNINGS=0

# =================================================================
# 1. TYPESCRIPT CHECK
# =================================================================
echo "📝 [1/7] Checking TypeScript..."
cd backend
npx tsc --noEmit 2>/dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ TypeScript errors found!${NC}"
  echo "   Run: cd backend && npx tsc --noEmit"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ TypeScript: OK${NC}"
fi
cd ..

# =================================================================
# 2. RESPONSEFORMATTER CHECK
# =================================================================
echo ""
echo "📝 [2/7] Checking ResponseFormatter usage..."

# Check services (non dovrebbero usare ResponseFormatter)
SERVICES_WITH_RF=$(grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | grep -v "test" | wc -l)
if [ $SERVICES_WITH_RF -gt 0 ]; then
  echo -e "${RED}❌ ResponseFormatter found in services!${NC}"
  echo "   Services should return data directly, not use ResponseFormatter"
  grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | grep -v "test" | head -3
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Services: Clean (no ResponseFormatter)${NC}"
fi

# Check routes (DEVONO usare ResponseFormatter)
ROUTES_WITHOUT_RF=$(grep -r "res\.json\|res\.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | grep -v "test" | grep -v "comment" | wc -l)
if [ $ROUTES_WITHOUT_RF -gt 0 ]; then
  echo -e "${RED}❌ Routes without ResponseFormatter found!${NC}"
  echo "   All routes must use ResponseFormatter for responses"
  grep -r "res\.json\|res\.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | grep -v "test" | head -3
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Routes: OK (all use ResponseFormatter)${NC}"
fi

# =================================================================
# 3. CONSOLE.LOG CHECK
# =================================================================
echo ""
echo "📝 [3/7] Checking for console.log statements..."

CONSOLE_LOGS=$(grep -r "console\.log" src/ backend/src/ 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | grep -v "test" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: ${CONSOLE_LOGS} console.log statements found${NC}"
  echo "   Consider using logger instead"
  grep -r "console\.log" src/ backend/src/ 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | head -3
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ No console.log found${NC}"
fi

# =================================================================
# 4. BACKUP FILES CHECK
# =================================================================
echo ""
echo "📝 [4/7] Checking for backup files..."

BACKUP_FILES=$(find . -name "*.backup*" -o -name "*backup-*" 2>/dev/null | grep -v node_modules | wc -l)
if [ $BACKUP_FILES -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: ${BACKUP_FILES} backup files found${NC}"
  echo "   Run: find . -name '*.backup*' -delete"
  find . -name "*.backup*" -o -name "*backup-*" 2>/dev/null | grep -v node_modules | head -3
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ No backup files${NC}"
fi

# =================================================================
# 5. PRISMA SYNC CHECK
# =================================================================
echo ""
echo "📝 [5/7] Checking Prisma schema sync..."

cd backend
npx prisma generate > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Prisma generate failed!${NC}"
  echo "   Run: cd backend && npx prisma generate"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Prisma client: Generated${NC}"
fi
cd ..

# =================================================================
# 6. PACKAGE.JSON CHECK
# =================================================================
echo ""
echo "📝 [6/7] Checking dependencies..."

# Check if tailwindcss is v3 (not v4)
TAILWIND_VERSION=$(grep '"tailwindcss":' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | cut -d. -f1)
if [ "$TAILWIND_VERSION" = "4" ]; then
  echo -e "${RED}❌ Tailwind CSS v4 detected! Must use v3${NC}"
  echo "   Run: npm uninstall tailwindcss && npm install -D tailwindcss@^3.4.0"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Tailwind CSS: v3 (correct)${NC}"
fi

# =================================================================
# 7. BUILD CHECK
# =================================================================
echo ""
echo "📝 [7/7] Checking build..."

# Quick build test (frontend)
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Frontend build failed${NC}"
  echo "   Run: npm run build (to see errors)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ Frontend build: OK${NC}"
fi

# =================================================================
# FINAL REPORT
# =================================================================
echo ""
echo "======================================"
echo "📊 SUMMARY"
echo "======================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready to commit.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. git add ."
  echo "  2. git commit -m 'your message'"
  echo "  3. git push"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  ${WARNINGS} warnings found (non-blocking)${NC}"
  echo ""
  echo "You can commit, but consider fixing the warnings."
  exit 0
else
  echo -e "${RED}❌ ${ERRORS} errors found! Fix before committing.${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}   Also ${WARNINGS} warnings to review${NC}"
  fi
  echo ""
  echo "Fix the errors above and run this script again."
  exit 1
fi
