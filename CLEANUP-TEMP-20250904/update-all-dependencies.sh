#!/bin/bash

echo "🚀 AGGIORNAMENTO COMPLETO SISTEMA RICHIESTA ASSISTENZA"
echo "======================================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory del progetto
PROJECT_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza"
cd "$PROJECT_DIR"

# Funzione per creare backup
backup_file() {
    local file=$1
    local backup_name="${file}.backup-$(date +%Y%m%d-%H%M%S)"
    cp "$file" "$backup_name"
    echo -e "${GREEN}✓${NC} Backup creato: $backup_name"
}

# Funzione per verificare successo comando
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1 completato con successo"
    else
        echo -e "${RED}✗${NC} Errore in $1"
        exit 1
    fi
}

echo -e "${YELLOW}📦 FASE 1: BACKUP DEI FILE CRITICI${NC}"
echo "----------------------------------------"
backup_file "package.json"
backup_file "package-lock.json"
backup_file "backend/package.json"
backup_file "backend/package-lock.json"
echo ""

echo -e "${BLUE}🎨 FASE 2: AGGIORNAMENTO FRONTEND${NC}"
echo "----------------------------------------"

# Aggiorna Vite all'ultima versione
echo "Aggiornamento Vite e plugin React..."
npm install vite@latest @vitejs/plugin-react@latest --save-dev
check_success "Vite update"

# Aggiorna React all'ultima versione
echo "Aggiornamento React core..."
npm install react@latest react-dom@latest
npm install @types/react@latest @types/react-dom@latest --save-dev
check_success "React update"

# Aggiorna React Query all'ultima versione
echo "Aggiornamento React Query..."
npm install @tanstack/react-query@latest @tanstack/react-query-devtools@latest
check_success "React Query update"

# Aggiorna React Router
echo "Aggiornamento React Router..."
npm install react-router-dom@latest
check_success "React Router update"

# Aggiorna Tailwind CSS e PostCSS
echo "Aggiornamento Tailwind CSS..."
npm install tailwindcss@latest postcss@latest autoprefixer@latest --save-dev
check_success "Tailwind CSS update"

# Aggiorna TypeScript
echo "Aggiornamento TypeScript..."
npm install typescript@latest --save-dev
check_success "TypeScript update"

# Aggiorna altre dipendenze principali
echo "Aggiornamento altre dipendenze frontend..."
npm install @heroicons/react@latest \
    @hookform/resolvers@latest \
    axios@latest \
    clsx@latest \
    date-fns@latest \
    react-hook-form@latest \
    react-hot-toast@latest \
    socket.io-client@latest \
    tailwind-merge@latest \
    zod@latest \
    zustand@latest
check_success "Altre dipendenze frontend"

# Aggiorna dipendenze di sviluppo
echo "Aggiornamento dipendenze sviluppo frontend..."
npm install @typescript-eslint/eslint-plugin@latest \
    @typescript-eslint/parser@latest \
    eslint@latest \
    eslint-plugin-react-hooks@latest \
    eslint-plugin-react-refresh@latest \
    prettier@latest \
    @playwright/test@latest \
    vitest@latest \
    @vitest/ui@latest --save-dev
check_success "DevDependencies frontend"

echo ""
echo -e "${BLUE}⚙️ FASE 3: AGGIORNAMENTO BACKEND${NC}"
echo "----------------------------------------"
cd backend

# Aggiorna Prisma all'ultima versione
echo "Aggiornamento Prisma..."
npm install prisma@latest @prisma/client@latest
check_success "Prisma update"

# Aggiorna Express e middleware
echo "Aggiornamento Express e middleware..."
npm install express@latest \
    cors@latest \
    helmet@latest \
    morgan@latest \
    compression@latest \
    cookie-parser@latest \
    express-rate-limit@latest \
    express-validator@latest
check_success "Express update"

# Aggiorna autenticazione e sicurezza
echo "Aggiornamento moduli sicurezza..."
npm install jsonwebtoken@latest \
    bcrypt@latest \
    speakeasy@latest \
    qrcode@latest
check_success "Security modules update"

# Aggiorna Socket.io
echo "Aggiornamento Socket.io..."
npm install socket.io@latest
check_success "Socket.io update"

# Aggiorna Bull e Redis
echo "Aggiornamento Bull Queue e Redis..."
npm install bull@latest ioredis@latest
check_success "Bull and Redis update"

# Aggiorna servizi esterni
echo "Aggiornamento servizi esterni..."
npm install openai@latest \
    stripe@latest \
    nodemailer@latest \
    @sendinblue/client@latest
check_success "External services update"

# Aggiorna utility
echo "Aggiornamento utility..."
npm install multer@latest \
    sharp@latest \
    winston@latest \
    winston-daily-rotate-file@latest \
    dotenv@latest \
    zod@latest
check_success "Utilities update"

# Aggiorna TypeScript e dipendenze di sviluppo
echo "Aggiornamento dipendenze sviluppo backend..."
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
    eslint@latest \
    prettier@latest \
    vitest@latest \
    @vitest/ui@latest \
    supertest@latest --save-dev
check_success "DevDependencies backend"

echo ""
echo -e "${GREEN}🔄 FASE 4: RIGENERAZIONE PRISMA CLIENT${NC}"
echo "----------------------------------------"
npx prisma generate
check_success "Prisma generate"

echo ""
echo -e "${YELLOW}📋 FASE 5: VERIFICA VULNERABILITÀ${NC}"
echo "----------------------------------------"
cd "$PROJECT_DIR"
echo "Controllo vulnerabilità frontend..."
npm audit --audit-level=moderate

echo ""
echo "Controllo vulnerabilità backend..."
cd backend
npm audit --audit-level=moderate

echo ""
echo -e "${GREEN}✅ AGGIORNAMENTO COMPLETATO!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 PROSSIMI PASSI:${NC}"
echo "1. Riavvia il backend: cd backend && npm run dev"
echo "2. Riavvia il frontend: npm run dev (dalla root)"
echo "3. Testa che tutto funzioni correttamente"
echo "4. Se ci sono problemi, ripristina dai backup creati"
echo ""
echo -e "${BLUE}🔍 VERSIONI AGGIORNATE:${NC}"
echo "- Vite: $(npm list vite --depth=0 2>/dev/null | grep vite | awk '{print $2}')"
echo "- React: $(npm list react --depth=0 2>/dev/null | grep react | awk '{print $2}' | head -1)"
echo "- TypeScript: $(npm list typescript --depth=0 2>/dev/null | grep typescript | awk '{print $2}')"
echo "- Prisma: $(cd backend && npm list prisma --depth=0 2>/dev/null | grep prisma | awk '{print $2}' | head -1)"
echo ""
echo "📁 Backup salvati con timestamp: $(date +%Y%m%d-%H%M%S)"
