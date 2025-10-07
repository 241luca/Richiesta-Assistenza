#!/bin/bash

# =================================================================
# 🚀 START DEVELOPMENT SCRIPT
# =================================================================
# Avvia l'ambiente di sviluppo completo
# Uso: ./scripts/start-dev.sh
# =================================================================

echo ""
echo "======================================"
echo "🚀 STARTING DEVELOPMENT ENVIRONMENT"
echo "======================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =================================================================
# CHECK SYSTEM FIRST
# =================================================================
echo -e "${BLUE}📋 Pre-flight checks...${NC}"
echo ""

# Check if ports are free
lsof -i :3200 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Port 3200 already in use${NC}"
  echo "Kill existing process? (y/n)"
  read -r KILL_BACKEND
  if [ "$KILL_BACKEND" = "y" ]; then
    kill -9 $(lsof -t -i:3200)
    echo -e "${GREEN}✅ Port 3200 freed${NC}"
  fi
fi

lsof -i :5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Port 5193 already in use${NC}"
  echo "Kill existing process? (y/n)"
  read -r KILL_FRONTEND
  if [ "$KILL_FRONTEND" = "y" ]; then
    kill -9 $(lsof -t -i:5193)
    echo -e "${GREEN}✅ Port 5193 freed${NC}"
  fi
fi

# =================================================================
# START REDIS
# =================================================================
echo ""
echo -e "${BLUE}💾 Starting Redis...${NC}"

redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Redis already running${NC}"
else
  echo "Starting Redis server..."
  redis-server > /dev/null 2>&1 &
  sleep 2
  redis-cli ping > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis started${NC}"
  else
    echo -e "${RED}❌ Failed to start Redis${NC}"
    echo "Please start Redis manually: redis-server"
  fi
fi

# =================================================================
# GENERATE PRISMA CLIENT
# =================================================================
echo ""
echo -e "${BLUE}🔧 Preparing database...${NC}"

cd backend
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Prisma client generated${NC}"
else
  echo -e "${YELLOW}⚠️  Failed to generate Prisma client${NC}"
fi
cd ..

# =================================================================
# START SERVICES
# =================================================================
echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""

# Function to open new terminal tab (macOS)
open_new_tab() {
  osascript -e 'tell application "Terminal" to activate' \
    -e 'tell application "System Events" to tell process "Terminal" to keystroke "t" using command down' \
    -e "tell application \"Terminal\" to do script \"$1\" in selected tab of the front window"
}

# Start Backend
echo -e "${GREEN}Starting Backend on port 3200...${NC}"
open_new_tab "cd $(pwd)/backend && npm run dev"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo -e "${GREEN}Starting Frontend on port 5193...${NC}"
open_new_tab "cd $(pwd) && npm run dev"

# =================================================================
# SHOW STATUS
# =================================================================
echo ""
echo "======================================"
echo -e "${GREEN}✅ DEVELOPMENT ENVIRONMENT STARTED${NC}"
echo "======================================"
echo ""
echo "Services running:"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:3200"
echo -e "  ${GREEN}Frontend:${NC} http://localhost:5193"
echo -e "  ${GREEN}Redis:${NC}    localhost:6379"
echo ""
echo "Useful commands:"
echo -e "  ${BLUE}Check logs:${NC}     See Terminal tabs"
echo -e "  ${BLUE}Stop all:${NC}       Ctrl+C in each tab"
echo -e "  ${BLUE}Check system:${NC}   ./scripts/check-system.sh"
echo -e "  ${BLUE}Validate work:${NC}  ./scripts/validate-work.sh"
echo ""
echo -e "${YELLOW}⚠️  Note: Services are starting in new Terminal tabs${NC}"
echo ""
echo "Happy coding! 🚀"
