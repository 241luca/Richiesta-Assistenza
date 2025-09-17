#!/bin/bash

echo "🚀 AVVIO SISTEMA CON SQLITE (SENZA DOCKER)"
echo "==========================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Directory
PROJECT_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📦 CONFIGURAZIONE SQLITE PER TEST LOCALE${NC}"
echo "----------------------------------------"

# Backup del .env originale
if [ ! -f "backend/.env.postgresql.backup" ]; then
    cp backend/.env backend/.env.postgresql.backup
    echo -e "${GREEN}✓${NC} Backup .env originale creato"
fi

# Usa la configurazione SQLite
cp backend/.env.sqlite backend/.env
echo -e "${GREEN}✓${NC} Configurazione SQLite attivata"

# Copia lo schema SQLite
cd backend
cp prisma/schema.sqlite.prisma prisma/schema.prisma
echo -e "${GREEN}✓${NC} Schema SQLite configurato"

# Genera Prisma Client per SQLite
echo ""
echo -e "${BLUE}🔄 Generazione Prisma Client per SQLite${NC}"
npx prisma generate

# Crea il database SQLite e applica lo schema
echo ""
echo -e "${BLUE}🗄️ Creazione database SQLite${NC}"
npx prisma db push --skip-seed

echo ""
echo -e "${GREEN}✅ CONFIGURAZIONE COMPLETATA!${NC}"
echo ""
echo -e "${YELLOW}📝 ORA PUOI AVVIARE IL SISTEMA:${NC}"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: npm run dev (dalla root)"
echo ""
echo -e "${BLUE}ℹ️ NOTE:${NC}"
echo "- Il sistema sta usando SQLite invece di PostgreSQL"
echo "- Redis non è richiesto per il test locale"
echo "- I dati sono salvati in backend/prisma/dev.db"
echo "- Per tornare a PostgreSQL: cp backend/.env.postgresql.backup backend/.env"
