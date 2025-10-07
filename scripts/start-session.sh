#!/bin/bash

# 🚀 Script per iniziare una nuova sessione di sviluppo
# Uso: ./scripts/start-session.sh [task-id]

echo "🚀 INIZIALIZZAZIONE SESSIONE DI SVILUPPO"
echo "========================================"

TASK_ID=$1
if [ -z "$TASK_ID" ]; then
    echo "❌ Errore: Specificare task ID (es: 1.1)"
    echo "Uso: ./start-session.sh [task-id]"
    exit 1
fi

echo "📋 Task: $TASK_ID"
echo ""

# 1. Check prerequisiti
echo "🔍 Controllo prerequisiti..."

# Check Git status
if [ -n "$(git status --porcelain)" ]; then 
    echo "⚠️  Warning: Ci sono modifiche non committate"
    echo "Vuoi continuare? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

# 2. Pull ultimi aggiornamenti
echo "📥 Pulling ultimi aggiornamenti..."
git pull origin main

# 3. Backup automatico
echo "💾 Creazione backup pre-sessione..."
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/session-$DATE"
mkdir -p $BACKUP_DIR

# Backup file critici
cp -r backend/prisma/schema.prisma "$BACKUP_DIR/"
cp -r src/components "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/src/routes "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/src/services "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup creato in: $BACKUP_DIR"

# 4. Check servizi
echo ""
echo "🔧 Controllo servizi..."

# Check PostgreSQL
if pg_isready -q; then
    echo "✅ PostgreSQL: Attivo"
else
    echo "❌ PostgreSQL: Non attivo"
    echo "Avviare PostgreSQL? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        brew services start postgresql
    fi
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Attivo"
else
    echo "❌ Redis: Non attivo"
    echo "Avviare Redis? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        redis-server --daemonize yes
    fi
fi

# 5. Install dependencies se necessario
echo ""
echo "📦 Controllo dipendenze..."

# Backend dependencies
cd backend
if [ package.json -nt node_modules ]; then
    echo "📦 Installazione dipendenze backend..."
    npm install
fi
cd ..

# Frontend dependencies
if [ package.json -nt node_modules ]; then
    echo "📦 Installazione dipendenze frontend..."
    npm install
fi

# 6. Mostra istruzioni task
echo ""
echo "📋 ISTRUZIONI PER TASK $TASK_ID"
echo "================================"

# Estrai istruzioni dal file PROMPT
if grep -q "SESSIONE $TASK_ID:" PROMPT-SESSIONI-CLAUDE.md; then
    sed -n "/SESSIONE $TASK_ID:/,/^###/p" PROMPT-SESSIONI-CLAUDE.md | head -20
else
    echo "⚠️  Nessuna istruzione trovata per task $TASK_ID"
fi

# 7. Crea file report sessione
echo ""
echo "📝 Preparazione report sessione..."
REPORT_DIR="REPORT-SESSIONI-CLAUDE/$(date +%Y-%m)-$(date +%B)"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/sessione-$(date +%Y%m%d)-task-$TASK_ID.md"

cat > "$REPORT_FILE" << EOF
# REPORT SESSIONE - $(date +%Y-%m-%d) - Task $TASK_ID

## 📋 INFORMAZIONI SESSIONE
- **Data**: $(date +%Y-%m-%d)
- **Ora inizio**: $(date +%H:%M)
- **Task**: $TASK_ID
- **Developer**: [NOME]

## ✅ OBIETTIVI
[DA COMPLETARE]

## 📁 FILE MODIFICATI/CREATI
[DA COMPLETARE]

## 🧪 TEST EFFETTUATI
[DA COMPLETARE]

## 📝 NOTE
[DA COMPLETARE]

---
Report in progress...
EOF

echo "✅ Report creato: $REPORT_FILE"

# 8. Apri VS Code
echo ""
echo "💻 Apertura VS Code..."
code . "$REPORT_FILE" STATO-AVANZAMENTO.md

# 9. Start development servers
echo ""
echo "🚀 AVVIO SERVIZI SVILUPPO"
echo "========================"
echo ""
echo "Aprire 3 terminali ed eseguire:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Prisma Studio:"
echo "  cd backend && npx prisma studio"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:5193"
echo "  Backend:  http://localhost:3200"
echo "  Database: http://localhost:5555"
echo ""
echo "================================"
echo "🎯 SESSIONE PRONTA!"
echo "Task: $TASK_ID"
echo "Backup: $BACKUP_DIR"
echo "Report: $REPORT_FILE"
echo "================================"
