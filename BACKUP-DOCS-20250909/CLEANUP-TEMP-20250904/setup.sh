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
echo "   SISTEMA RICHIESTA ASSISTENZA - SETUP"
echo "=================================================="
echo -e "${NC}"

# Check if Docker is running
echo -e "${YELLOW}🐳 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start Docker containers
echo -e "${YELLOW}🚀 Starting PostgreSQL and Redis...${NC}"
docker-compose up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U assistenza_user > /dev/null 2>&1; do
    echo -e "${CYAN}   Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run prisma:generate

# Push schema to database
echo -e "${YELLOW}📊 Creating database schema...${NC}"
npm run prisma:push

# Seed database
echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"
npm run prisma:seed

# Go back to root
cd ..

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

echo -e "${MAGENTA}"
echo "=================================================="
echo "   ✅ SETUP COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo -e "${NC}"

echo -e "${GREEN}📋 USER CREDENTIALS:${NC}"
echo "─────────────────────────────────────────"
echo -e "${CYAN}SUPER ADMIN:${NC}"
echo "  Email: admin@sistema-assistenza.it"
echo "  Password: Password123!"
echo "─────────────────────────────────────────"
echo -e "${CYAN}PROFESSIONAL:${NC}"
echo "  Email: professionista@esempio.it"
echo "  Password: Password123!"
echo "─────────────────────────────────────────"
echo -e "${CYAN}CLIENT:${NC}"
echo "  Email: cliente@esempio.it"
echo "  Password: Password123!"
echo "─────────────────────────────────────────"

echo -e "\n${YELLOW}🚀 TO START THE APPLICATION:${NC}"
echo -e "${CYAN}Terminal 1 - Backend:${NC}"
echo "  cd backend && npm run dev"
echo -e "${CYAN}Terminal 2 - Frontend:${NC}"
echo "  npm run dev"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo "  Frontend: http://localhost:5193"
echo "  Backend:  http://localhost:3200"
echo "  Prisma Studio: cd backend && npm run prisma:studio"
echo ""
echo -e "${MAGENTA}=================================================="
echo -e "   Happy coding! 🎉"
echo -e "==================================================${NC}"
