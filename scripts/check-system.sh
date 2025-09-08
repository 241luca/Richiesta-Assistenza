#!/bin/bash

# =================================================================
# 🔍 SYSTEM CHECK SCRIPT
# =================================================================
# Verifica lo stato del sistema prima di iniziare a lavorare
# Uso: ./scripts/check-system.sh
# =================================================================

echo ""
echo "======================================"
echo "🔍 SYSTEM STATUS CHECK"
echo "======================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =================================================================
# ENVIRONMENT INFO
# =================================================================
echo -e "${BLUE}📋 Environment Information${NC}"
echo "======================================"

# Node version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "Node.js: ${GREEN}$NODE_VERSION${NC}"
else
  echo -e "Node.js: ${RED}Not installed${NC}"
fi

# NPM version
NPM_VERSION=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "NPM: ${GREEN}$NPM_VERSION${NC}"
else
  echo -e "NPM: ${RED}Not installed${NC}"
fi

# Current directory
echo -e "Working Dir: ${BLUE}$(pwd)${NC}"

# Git branch
GIT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "Git Branch: ${GREEN}$GIT_BRANCH${NC}"
else
  echo -e "Git Branch: ${YELLOW}Not a git repository${NC}"
fi

# =================================================================
# DATABASE CHECK
# =================================================================
echo ""
echo -e "${BLUE}🗄️  Database Status${NC}"
echo "======================================"

cd backend 2>/dev/null
if [ $? -eq 0 ]; then
  # Test database connection
  npx prisma db pull --force > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "PostgreSQL: ${GREEN}✅ Connected${NC}"
    
    # Count tables
    TABLE_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | grep -o '[0-9]\+' | head -1)
    if [ ! -z "$TABLE_COUNT" ]; then
      echo -e "Tables: ${GREEN}$TABLE_COUNT tables found${NC}"
    fi
  else
    echo -e "PostgreSQL: ${RED}❌ Not connected${NC}"
    echo "  Check DATABASE_URL in backend/.env"
  fi
  cd ..
else
  echo -e "${YELLOW}⚠️  Backend directory not found${NC}"
fi

# =================================================================
# REDIS CHECK
# =================================================================
echo ""
echo -e "${BLUE}💾 Redis Status${NC}"
echo "======================================"

redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "Redis: ${GREEN}✅ Running${NC}"
  
  # Get Redis info
  REDIS_VERSION=$(redis-cli INFO server 2>/dev/null | grep redis_version | cut -d: -f2 | tr -d '\r')
  if [ ! -z "$REDIS_VERSION" ]; then
    echo -e "Version: ${GREEN}$REDIS_VERSION${NC}"
  fi
else
  echo -e "Redis: ${YELLOW}⚠️  Not running${NC}"
  echo "  Start with: redis-server"
fi

# =================================================================
# PORT AVAILABILITY
# =================================================================
echo ""
echo -e "${BLUE}🔌 Port Availability${NC}"
echo "======================================"

# Check backend port (3200)
lsof -i :3200 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  BACKEND_PID=$(lsof -t -i:3200)
  echo -e "Port 3200 (Backend): ${YELLOW}⚠️  In use (PID: $BACKEND_PID)${NC}"
else
  echo -e "Port 3200 (Backend): ${GREEN}✅ Available${NC}"
fi

# Check frontend port (5193)
lsof -i :5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  FRONTEND_PID=$(lsof -t -i:5193)
  echo -e "Port 5193 (Frontend): ${YELLOW}⚠️  In use (PID: $FRONTEND_PID)${NC}"
else
  echo -e "Port 5193 (Frontend): ${GREEN}✅ Available${NC}"
fi

# =================================================================
# FILE SYSTEM CHECK
# =================================================================
echo ""
echo -e "${BLUE}📁 Project Structure${NC}"
echo "======================================"

# Check critical directories
DIRS=("src" "backend" "backend/src" "backend/prisma" "scripts" "uploads")
MISSING_DIRS=0

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo -e "$dir/: ${GREEN}✅${NC}"
  else
    echo -e "$dir/: ${RED}❌ Missing${NC}"
    MISSING_DIRS=$((MISSING_DIRS + 1))
  fi
done

# Check critical files
echo ""
echo -e "${BLUE}📄 Critical Files${NC}"
echo "======================================"

FILES=("package.json" "backend/package.json" "backend/prisma/schema.prisma" "ISTRUZIONI-PROGETTO.md")
MISSING_FILES=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "$file: ${GREEN}✅${NC}"
  else
    echo -e "$file: ${RED}❌ Missing${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

# =================================================================
# DEPENDENCIES CHECK
# =================================================================
echo ""
echo -e "${BLUE}📦 Dependencies Status${NC}"
echo "======================================"

# Check if node_modules exists
if [ -d "node_modules" ]; then
  MODULE_COUNT=$(ls node_modules | wc -l)
  echo -e "Frontend modules: ${GREEN}$MODULE_COUNT packages${NC}"
else
  echo -e "Frontend modules: ${YELLOW}⚠️  Not installed${NC}"
  echo "  Run: npm install"
fi

if [ -d "backend/node_modules" ]; then
  BACKEND_MODULE_COUNT=$(ls backend/node_modules | wc -l)
  echo -e "Backend modules: ${GREEN}$BACKEND_MODULE_COUNT packages${NC}"
else
  echo -e "Backend modules: ${YELLOW}⚠️  Not installed${NC}"
  echo "  Run: cd backend && npm install"
fi

# =================================================================
# TYPESCRIPT CHECK
# =================================================================
echo ""
echo -e "${BLUE}📝 TypeScript Status${NC}"
echo "======================================"

cd backend 2>/dev/null
if [ $? -eq 0 ]; then
  npx tsc --noEmit 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "TypeScript: ${GREEN}✅ No errors${NC}"
  else
    ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
    echo -e "TypeScript: ${RED}❌ $ERROR_COUNT errors found${NC}"
    echo "  Run: cd backend && npx tsc --noEmit"
  fi
  cd ..
fi

# =================================================================
# GIT STATUS
# =================================================================
echo ""
echo -e "${BLUE}📊 Git Status${NC}"
echo "======================================"

# Check for uncommitted changes
CHANGED_FILES=$(git status --porcelain 2>/dev/null | wc -l)
if [ $? -eq 0 ]; then
  if [ $CHANGED_FILES -eq 0 ]; then
    echo -e "Working tree: ${GREEN}✅ Clean${NC}"
  else
    echo -e "Working tree: ${YELLOW}$CHANGED_FILES files modified${NC}"
    
    # Show first 5 changed files
    echo "  Changed files:"
    git status --porcelain 2>/dev/null | head -5 | while read line; do
      echo "    $line"
    done
  fi
fi

# =================================================================
# QUICK ACTIONS
# =================================================================
echo ""
echo "======================================"
echo -e "${BLUE}⚡ Quick Actions${NC}"
echo "======================================"

echo ""
echo "Start development:"
echo -e "${GREEN}  ./scripts/start-dev.sh${NC}"
echo ""
echo "Run checks:"
echo -e "${GREEN}  ./scripts/pre-commit-check.sh${NC}"
echo ""
echo "Fix TypeScript:"
echo -e "${GREEN}  cd backend && npx tsc --noEmit${NC}"
echo ""
echo "Update dependencies:"
echo -e "${GREEN}  npm install && cd backend && npm install${NC}"

echo ""
echo "======================================"
echo "✅ System check complete!"
echo "======================================"
