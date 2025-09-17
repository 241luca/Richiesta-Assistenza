#!/bin/bash

echo "🧪 TEST COMPLETO SISTEMA RICHIESTA ASSISTENZA"
echo "=============================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funzione per test endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $description - Status: $response"
        return 0
    else
        echo -e "${RED}✗${NC} $description - Status: $response (Expected: $expected_status)"
        return 1
    fi
}

# Test Frontend
echo -e "${BLUE}🎨 TEST FRONTEND (Porta 5193)${NC}"
echo "--------------------------------"
test_endpoint "http://localhost:5193" "200" "Frontend Homepage"
test_endpoint "http://localhost:5193/favicon.ico" "200" "Frontend Assets"
echo ""

# Test Backend
echo -e "${BLUE}⚙️ TEST BACKEND (Porta 3200)${NC}"
echo "--------------------------------"
test_endpoint "http://localhost:3200/health" "200" "Backend Health Check"
test_endpoint "http://localhost:3200/api/auth/login" "400" "Auth Endpoint (POST expected)"
echo ""

# Test Backend API Detail
echo -e "${BLUE}📡 TEST API DETTAGLIATO${NC}"
echo "--------------------------------"

# Health check con dettagli
echo "Health Check Response:"
curl -s http://localhost:3200/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  Backend non disponibile"
echo ""

# Test registrazione (solo verifica endpoint)
echo "Test Registration Endpoint:"
response=$(curl -s -X POST http://localhost:3200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('error', 'OK'))" 2>/dev/null)
echo "  Response: $response"
echo ""

# Verifica processi
echo -e "${YELLOW}📊 STATO PROCESSI${NC}"
echo "--------------------------------"

# Controlla frontend
frontend_pid=$(lsof -i :5193 -t 2>/dev/null | head -1)
if [ -n "$frontend_pid" ]; then
    echo -e "${GREEN}✓${NC} Frontend attivo - PID: $frontend_pid"
else
    echo -e "${RED}✗${NC} Frontend non attivo"
fi

# Controlla backend
backend_pid=$(lsof -i :3200 -t 2>/dev/null | head -1)
if [ -n "$backend_pid" ]; then
    echo -e "${GREEN}✓${NC} Backend attivo - PID: $backend_pid"
else
    echo -e "${RED}✗${NC} Backend non attivo"
fi

# Controlla database SQLite
if [ -f "/Users/lucamambelli/Desktop/richiesta-assistenza/backend/prisma/dev.db" ]; then
    size=$(du -h /Users/lucamambelli/Desktop/richiesta-assistenza/backend/prisma/dev.db | cut -f1)
    echo -e "${GREEN}✓${NC} Database SQLite presente - Size: $size"
else
    echo -e "${YELLOW}⚠${NC} Database SQLite non trovato"
fi

echo ""
echo -e "${BLUE}📦 VERSIONI INSTALLATE${NC}"
echo "--------------------------------"
cd /Users/lucamambelli/Desktop/richiesta-assistenza

# Frontend versions
echo "Frontend:"
echo -n "  Vite: "
npm list vite --depth=0 2>/dev/null | grep "vite@" | awk '{print $2}' || echo "non trovato"
echo -n "  React: "
npm list react --depth=0 2>/dev/null | grep "react@" | head -1 | awk '{print $2}' || echo "non trovato"
echo -n "  TypeScript: "
npm list typescript --depth=0 2>/dev/null | grep "typescript@" | awk '{print $2}' || echo "non trovato"

# Backend versions
echo "Backend:"
cd backend
echo -n "  Express: "
npm list express --depth=0 2>/dev/null | grep "express@" | awk '{print $2}' || echo "non trovato"
echo -n "  Prisma: "
npm list prisma --depth=0 2>/dev/null | grep "prisma@" | awk '{print $2}' || echo "non trovato"
echo -n "  Zod: "
npm list zod --depth=0 2>/dev/null | grep "zod@" | awk '{print $2}' || echo "non trovato"

echo ""
echo -e "${GREEN}✅ TEST COMPLETATO${NC}"
echo ""
echo -e "${YELLOW}📝 SUGGERIMENTI:${NC}"
if [ -z "$backend_pid" ]; then
    echo "• Backend non attivo: cd backend && npm run dev"
fi
if [ -z "$frontend_pid" ]; then
    echo "• Frontend non attivo: npm run dev (dalla root)"
fi
if [ ! -f "/Users/lucamambelli/Desktop/richiesta-assistenza/backend/prisma/dev.db" ]; then
    echo "• Database non inizializzato: cd backend && npx prisma db push"
fi
