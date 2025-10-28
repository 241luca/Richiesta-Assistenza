#!/bin/bash

# SmartDocs Quick Start Script
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     🧠 SmartDocs - Quick Start            ║"
echo "║     Standalone AI Document Management     ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY${NC}"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit and edit .env..."
fi

# Check Docker
if ! docker --version > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not installed or not running${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check Docker Compose
if ! docker-compose --version > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is installed${NC}"
echo ""

# Start services
echo -e "${BLUE}🚀 Starting SmartDocs services...${NC}"
echo ""

docker-compose up -d

echo ""
echo -e "${GREEN}✓ Services started!${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check health
echo -e "${BLUE}🔍 Checking service health...${NC}"
echo ""

# Check API
if curl -s http://localhost:3500/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ SmartDocs API${NC} - http://localhost:3500"
else
    echo -e "${YELLOW}⚠️  SmartDocs API${NC} - Starting up..."
fi

# Check Admin UI
if curl -s http://localhost:3501 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Admin UI${NC} - http://localhost:3501"
else
    echo -e "${YELLOW}⚠️  Admin UI${NC} - Starting up..."
fi

# Check MinIO
if curl -s http://localhost:9001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MinIO Console${NC} - http://localhost:9001"
else
    echo -e "${YELLOW}⚠️  MinIO Console${NC} - Starting up..."
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🎉 SmartDocs is Ready!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Access Points:${NC}"
echo ""
echo "   🌐 Admin UI:      http://localhost:3501"
echo "   🔌 API:           http://localhost:3500"
echo "   📊 Health:        http://localhost:3500/health"
echo "   💾 MinIO:         http://localhost:9001"
echo "   📁 Qdrant:        http://localhost:6333/dashboard"
echo ""
echo -e "${GREEN}🐳 Docker Services:${NC}"
echo ""
docker-compose ps
echo ""
echo -e "${BLUE}📖 Useful Commands:${NC}"
echo ""
echo "   View logs:        docker-compose logs -f"
echo "   Stop all:         docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   Rebuild:          docker-compose up -d --build"
echo ""
echo -e "${YELLOW}💡 Tip: Check logs if services are still starting up:${NC}"
echo "   docker-compose logs -f smartdocs-api"
echo ""
