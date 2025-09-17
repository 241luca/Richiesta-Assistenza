#!/bin/bash

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}"
echo "=================================================="
echo "   SISTEMA RICHIESTA ASSISTENZA - START"
echo "=================================================="
echo -e "${NC}"

# Check if Docker is running
echo -e "${YELLOW}🐳 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if containers are running
if [ ! "$(docker ps -q -f name=assistenza_postgres)" ] || [ ! "$(docker ps -q -f name=assistenza_redis)" ]; then
    echo -e "${YELLOW}🚀 Starting PostgreSQL and Redis...${NC}"
    docker-compose up -d
    sleep 5
else
    echo -e "${GREEN}✅ PostgreSQL and Redis are already running${NC}"
fi

echo -e "${GREEN}"
echo "=================================================="
echo "   ✅ SERVICES READY!"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}📋 USER CREDENTIALS:${NC}"
echo "─────────────────────────────────────────"
echo "ADMIN: admin@sistema-assistenza.it"
echo "PROFESSIONAL: professionista@esempio.it"
echo "CLIENT: cliente@esempio.it"
echo "Password (all): Password123!"
echo "─────────────────────────────────────────"

echo -e "\n${YELLOW}🚀 NOW START THE APPLICATION:${NC}"
echo ""
echo -e "${CYAN}Terminal 1 - Backend:${NC}"
echo "  cd backend && npm run dev"
echo ""
echo -e "${CYAN}Terminal 2 - Frontend:${NC}"
echo "  npm run dev"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo "  Frontend: http://localhost:5193"
echo "  Backend:  http://localhost:3200"
echo "  Health Check: http://localhost:3200/health"
echo ""
echo -e "${YELLOW}Optional Tools:${NC}"
echo "  Prisma Studio: cd backend && npm run prisma:studio"
echo "  Reset Database: cd backend && npm run db:reset"
echo ""
echo -e "${MAGENTA}=================================================="
echo -e "   Press Ctrl+C to stop Docker containers"
echo -e "==================================================${NC}"

# Keep script running to maintain Docker containers
trap 'echo -e "\n${YELLOW}Stopping Docker containers...${NC}"; docker-compose down; echo -e "${GREEN}Goodbye!${NC}"; exit' INT TERM

# Keep the script running
while true; do
    sleep 1
done
