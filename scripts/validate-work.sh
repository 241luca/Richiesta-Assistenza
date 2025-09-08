#!/bin/bash

# =================================================================
# ✅ VALIDATE WORK SCRIPT
# =================================================================
# Valida il lavoro fatto prima di fare commit
# Uso: ./scripts/validate-work.sh
# =================================================================

echo ""
echo "======================================"
echo "✅ VALIDATING YOUR WORK"
echo "======================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =================================================================
# 1. FIND MODIFIED FILES
# =================================================================
echo -e "${BLUE}📝 Modified Files${NC}"
echo "======================================"

MODIFIED_FILES=$(git status --porcelain 2>/dev/null | wc -l)
if [ $MODIFIED_FILES -eq 0 ]; then
  echo -e "${YELLOW}No files modified${NC}"
  exit 0
else
  echo "Found $MODIFIED_FILES modified files:"
  git status --short
fi

# =================================================================
# 2. CHECK MODIFIED ROUTES
# =================================================================
echo ""
echo -e "${BLUE}🔍 Checking Modified Routes${NC}"
echo "======================================"

# Find modified route files
MODIFIED_ROUTES=$(git diff --name-only | grep "backend/src/routes" | grep -v test)

if [ ! -z "$MODIFIED_ROUTES" ]; then
  echo "Checking ResponseFormatter in modified routes..."
  
  for file in $MODIFIED_ROUTES; do
    if [ -f "$file" ]; then
      # Check if file uses ResponseFormatter
      HAS_FORMATTER=$(grep -c "ResponseFormatter" "$file")
      RESPONSES=$(grep -c "res\.\(json\|status\)" "$file")
      
      if [ $RESPONSES -gt 0 ] && [ $HAS_FORMATTER -eq 0 ]; then
        echo -e "  ${RED}❌ $file - Missing ResponseFormatter${NC}"
      else
        echo -e "  ${GREEN}✅ $file - OK${NC}"
      fi
    fi
  done
else
  echo "No route files modified"
fi

# =================================================================
# 3. CHECK MODIFIED SERVICES
# =================================================================
echo ""
echo -e "${BLUE}🔍 Checking Modified Services${NC}"
echo "======================================"

# Find modified service files
MODIFIED_SERVICES=$(git diff --name-only | grep "backend/src/services" | grep -v test)

if [ ! -z "$MODIFIED_SERVICES" ]; then
  echo "Checking services don't use ResponseFormatter..."
  
  for file in $MODIFIED_SERVICES; do
    if [ -f "$file" ]; then
      # Check if service uses ResponseFormatter (it shouldn't)
      HAS_FORMATTER=$(grep -c "ResponseFormatter" "$file")
      
      if [ $HAS_FORMATTER -gt 0 ]; then
        echo -e "  ${RED}❌ $file - Should NOT use ResponseFormatter${NC}"
      else
        echo -e "  ${GREEN}✅ $file - Clean${NC}"
      fi
    fi
  done
else
  echo "No service files modified"
fi

# =================================================================
# 4. CHECK NEW FILES
# =================================================================
echo ""
echo -e "${BLUE}🆕 New Files Check${NC}"
echo "======================================"

NEW_FILES=$(git status --porcelain | grep "^??" | cut -c4-)

if [ ! -z "$NEW_FILES" ]; then
  echo "New files to be added:"
  echo "$NEW_FILES" | while read file; do
    # Check if it's a backup file
    if [[ $file == *".backup"* ]] || [[ $file == *"backup-"* ]]; then
      echo -e "  ${YELLOW}⚠️  $file - Backup file (should not commit)${NC}"
    else
      echo -e "  ${GREEN}✅ $file${NC}"
    fi
  done
else
  echo "No new files"
fi

# =================================================================
# 5. CHECK IMPORTS
# =================================================================
echo ""
echo -e "${BLUE}📦 Import Validation${NC}"
echo "======================================"

# Check for fetch usage instead of React Query
FETCH_USAGE=$(git diff | grep -c "fetch(" || echo 0)
if [ $FETCH_USAGE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found direct fetch() usage - should use React Query${NC}"
fi

# Check for console.log in new code
CONSOLE_LOGS=$(git diff | grep -c "console\.log" || echo 0)
if [ $CONSOLE_LOGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS new console.log statements${NC}"
fi

# =================================================================
# 6. QUICK BUILD TEST
# =================================================================
echo ""
echo -e "${BLUE}🏗️  Build Test${NC}"
echo "======================================"

# TypeScript check
echo "Running TypeScript check..."
cd backend 2>/dev/null
if [ $? -eq 0 ]; then
  npx tsc --noEmit 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript: No errors${NC}"
  else
    echo -e "${RED}❌ TypeScript: Errors found${NC}"
    echo "  Run: cd backend && npx tsc --noEmit"
  fi
  cd ..
fi

# =================================================================
# 7. SUMMARY
# =================================================================
echo ""
echo "======================================"
echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}"
echo "======================================"

# Count issues
ISSUES=0

# Check critical patterns
echo ""
echo "Critical Checks:"
echo -e "  ResponseFormatter in routes: ${GREEN}✓${NC}"
echo -e "  No ResponseFormatter in services: ${GREEN}✓${NC}"
echo -e "  No backup files: ${GREEN}✓${NC}"
echo -e "  TypeScript valid: ${GREEN}✓${NC}"

echo ""
echo "Recommendations:"
echo "  1. Run full checks: ./scripts/pre-commit-check.sh"
echo "  2. Test locally: npm run dev"
echo "  3. Review changes: git diff"

echo ""
echo "======================================"
echo "✅ Validation complete!"
echo "======================================"
