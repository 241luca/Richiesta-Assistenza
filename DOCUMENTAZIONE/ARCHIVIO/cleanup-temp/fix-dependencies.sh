#!/bin/bash

echo "🔧 FIX DIPENDENZE E COMPLETAMENTO AGGIORNAMENTO"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directory
PROJECT_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📦 FIX BACKEND - Risoluzione conflitto Zod${NC}"
echo "----------------------------------------"
cd backend

# Rimuovi zod e reinstalla la versione compatibile con OpenAI
echo "Reinstallazione Zod versione compatibile..."
npm uninstall zod
npm install zod@^3.23.8

echo -e "${GREEN}✓${NC} Zod downgrade completato"

# Ora completa l'installazione delle dipendenze di sviluppo con --legacy-peer-deps
echo ""
echo "Completamento dipendenze sviluppo backend..."
npm install typescript@latest \
    @types/node@latest \
    @types/express@latest \
    @types/cors@latest \
    @types/bcrypt@latest \
    @types/compression@latest \
    @types/cookie-parser@latest \
    @types/jsonwebtoken@latest \
    @types/morgan@latest \
    @types/multer@latest \
    @types/nodemailer@latest \
    @types/qrcode@latest \
    @types/speakeasy@latest \
    nodemon@latest \
    ts-node@latest \
    prettier@latest \
    vitest@latest \
    @vitest/ui@latest \
    supertest@latest --save-dev --legacy-peer-deps

# Aggiorna anche ESLint con versioni compatibili
npm install @typescript-eslint/eslint-plugin@^7.0.0 \
    @typescript-eslint/parser@^7.0.0 \
    eslint@^8.57.0 --save-dev --legacy-peer-deps

echo -e "${GREEN}✓${NC} Dipendenze sviluppo backend completate"

echo ""
echo -e "${BLUE}🔄 RIGENERAZIONE PRISMA CLIENT${NC}"
echo "----------------------------------------"
npx prisma generate

echo ""
echo -e "${YELLOW}🔍 AUDIT E FIX VULNERABILITÀ${NC}"
echo "----------------------------------------"

# Fix vulnerabilità frontend
cd "$PROJECT_DIR"
echo "Fix vulnerabilità frontend..."
npm audit fix --legacy-peer-deps

# Fix vulnerabilità backend
cd backend
echo "Fix vulnerabilità backend..."
npm audit fix --legacy-peer-deps

echo ""
echo -e "${GREEN}✅ FIX COMPLETATO!${NC}"
echo "================================"

# Verifica versioni finali
echo ""
echo -e "${BLUE}📊 VERSIONI INSTALLATE:${NC}"
echo "------------------------"
cd "$PROJECT_DIR"
echo -n "Frontend - Vite: "
npm list vite --depth=0 2>/dev/null | grep "vite@" | awk '{print $2}' || echo "non trovato"
echo -n "Frontend - React: "
npm list react --depth=0 2>/dev/null | grep "react@" | head -1 | awk '{print $2}' || echo "non trovato"
echo -n "Frontend - TypeScript: "
npm list typescript --depth=0 2>/dev/null | grep "typescript@" | awk '{print $2}' || echo "non trovato"

cd backend
echo -n "Backend - Prisma: "
npm list prisma --depth=0 2>/dev/null | grep "prisma@" | awk '{print $2}' || echo "non trovato"
echo -n "Backend - Express: "
npm list express --depth=0 2>/dev/null | grep "express@" | awk '{print $2}' || echo "non trovato"
echo -n "Backend - TypeScript: "
npm list typescript --depth=0 2>/dev/null | grep "typescript@" | awk '{print $2}' || echo "non trovato"
echo -n "Backend - Zod: "
npm list zod --depth=0 2>/dev/null | grep "zod@" | awk '{print $2}' || echo "non trovato"

echo ""
echo -e "${YELLOW}📝 PROSSIMI PASSI:${NC}"
echo "1. Verifica che il backend parta: cd backend && npm run dev"
echo "2. Verifica che il frontend funzioni: npm run dev (dalla root)"
echo "3. Testa le funzionalità principali"
