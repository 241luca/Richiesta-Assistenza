#!/bin/bash

# =================================================================
# 🔍 PRE-COMMIT CHECK SCRIPT - v4.4.0
# =================================================================
# Esegue tutti i controlli necessari prima di un commit
# Include controlli TypeScript strict mode e case sensitivity
# Uso: ./scripts/pre-commit-check.sh
# =================================================================

echo ""
echo "======================================"
echo "🔍 PRE-COMMIT CHECKS v4.4.0"
echo "======================================"
echo "📚 REMINDER: All documentation goes in DOCUMENTAZIONE/"
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
# 1. TYPESCRIPT STRICT MODE CHECK
# =================================================================
echo "📝 [1/11] Checking TypeScript (strict mode simulation)..."
cd backend
npx tsc --noEmit 2>/dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ TypeScript errors found!${NC}"
  echo "   Run: cd backend && npx tsc --noEmit"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ TypeScript compilation: OK${NC}"
fi

# Check for implicit 'any' types
IMPLICIT_ANY=$(grep -r ": any" backend/src/ src/ 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | grep -v "test" | grep -v "// eslint" | wc -l)
if [ $IMPLICIT_ANY -gt 5 ]; then
  echo -e "${YELLOW}⚠️  Found ${IMPLICIT_ANY} explicit 'any' types${NC}"
  echo "   Consider using specific types instead"
  WARNINGS=$((WARNINGS + 1))
fi
cd ..

# =================================================================
# 2. CASE SENSITIVITY CHECK  
# =================================================================
echo ""
echo "📝 [2/11] Checking case sensitivity in imports..."

# Check for potential case issues in imports
CASE_ISSUES=$(grep -r "from '\./[A-Z]" backend/src/ src/ 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | wc -l)
if [ $CASE_ISSUES -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Potential case sensitivity issues in imports${NC}"
  echo "   Review import statements (Mac filesystem is case-insensitive)"
  grep -r "from '\./[A-Z]" backend/src/ src/ 2>/dev/null | grep -v "node_modules" | head -3
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ Import case sensitivity: OK${NC}"
fi

# =================================================================
# 3. PRISMA CASE CHECK
# =================================================================
echo ""
echo "📝 [3/11] Checking Prisma model names..."

# Check for incorrect Prisma model usage (capitalized)
PRISMA_CAPS=$(grep -r "prisma\.[A-Z]" backend/src/ 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | grep -v "test" | wc -l)
if [ $PRISMA_CAPS -gt 0 ]; then
  echo -e "${RED}❌ Incorrect Prisma model names (capitalized)!${NC}"
  echo "   Prisma models should be lowercase: prisma.user (not prisma.User)"
  grep -r "prisma\.[A-Z]" backend/src/ 2>/dev/null | grep -v "node_modules" | head -3
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Prisma model names: OK${NC}"
fi

# =================================================================
# 4. NULL/UNDEFINED SAFETY CHECK
# =================================================================
echo ""
echo "📝 [4/11] Checking for unsafe null/undefined access..."

# Check for direct property access without null checks (basic pattern)
UNSAFE_ACCESS=$(grep -r "\\.email\|\\.name\|\\.id" backend/src/routes/ 2>/dev/null | grep -v "?" | grep -v "if" | grep -v "//" | grep -v "node_modules" | wc -l)
if [ $UNSAFE_ACCESS -gt 20 ]; then
  echo -e "${YELLOW}⚠️  Potential unsafe property access detected${NC}"
  echo "   Consider using optional chaining (?.) or null checks"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ Property access: Safe patterns detected${NC}"
fi

# =================================================================
# 5. RESPONSEFORMATTER CHECK
# =================================================================
echo ""
echo "📝 [5/11] Checking ResponseFormatter usage..."

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
# 6. DOUBLE /api PATTERN CHECK
# =================================================================
echo ""
echo "📝 [6/11] Checking for double /api pattern..."

DOUBLE_API=$(grep -r "api\.\(get\|post\|put\|delete\|patch\)('/api" src/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ $DOUBLE_API -gt 0 ]; then
  echo -e "${RED}❌ Found api.get('/api/...') pattern! Remove /api prefix!${NC}"
  echo "   API client already has /api in baseURL"
  grep -r "api\.\(get\|post\|put\|delete\|patch\)('/api" src/ 2>/dev/null | head -3
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ API calls: No double /api pattern${NC}"
fi

# =================================================================
# 7. ARRAY ACCESS SAFETY CHECK
# =================================================================
echo ""
echo "📝 [7/11] Checking for unsafe array access..."

# Check for direct array[0] access without length check
UNSAFE_ARRAY=$(grep -r "\[0\]" backend/src/routes/ 2>/dev/null | grep -v "if" | grep -v "length" | grep -v "//" | grep -v "node_modules" | wc -l)
if [ $UNSAFE_ARRAY -gt 10 ]; then
  echo -e "${YELLOW}⚠️  Potential unsafe array access detected${NC}"
  echo "   Always check array length before accessing elements"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ Array access: Safe patterns detected${NC}"
fi

# =================================================================
# 8. CONSOLE.LOG CHECK
# =================================================================
echo ""
echo "📝 [8/11] Checking for console.log statements..."

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
# 9. BACKUP FILES CHECK
# =================================================================
echo ""
echo "📝 [9/11] Checking for backup files..."

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
# 10. PRISMA SYNC CHECK
# =================================================================
echo ""
echo "📝 [10/11] Checking Prisma schema sync..."

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
# 11. DOCUMENTATION CHECK
# =================================================================
echo ""
echo "📝 [11/11] Checking documentation structure..."

# Check for unauthorized .md files in root
ROOT_MD=$(ls *.md 2>/dev/null | grep -v -E "^(README|ISTRUZIONI-PROGETTO|CHANGELOG|LEGGIMI-DOCUMENTAZIONE)\.md$")
if [ ! -z "$ROOT_MD" ]; then
  echo -e "${RED}❌ Unauthorized .md files found in root!${NC}"
  echo "   These files must be moved to DOCUMENTAZIONE/:"
  echo "$ROOT_MD" | sed 's/^/     - /'
  echo ""
  echo "   Move them to appropriate folder:"
  echo "     - Reports → DOCUMENTAZIONE/REPORT-SESSIONI/"
  echo "     - Active docs → DOCUMENTAZIONE/ATTUALE/"
  echo "     - Old docs → DOCUMENTAZIONE/ARCHIVIO/"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Documentation structure: OK${NC}"
fi

# Check if today's session has a report (warning only)
TODAY=$(date +%Y-%m-%d)
TODAY_REPORT=$(find DOCUMENTAZIONE/REPORT-SESSIONI -name "*$TODAY*.md" 2>/dev/null | head -1)
if [ -z "$TODAY_REPORT" ]; then
  echo -e "${YELLOW}⚠️  No report found for today ($TODAY)${NC}"
  echo "   Remember to create: DOCUMENTAZIONE/REPORT-SESSIONI/$TODAY-descrizione.md"
  WARNINGS=$((WARNINGS + 1))
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
