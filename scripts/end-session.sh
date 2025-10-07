#!/bin/bash

# 🛑 Script per terminare una sessione di sviluppo
# Uso: ./scripts/end-session.sh [task-id]

echo "🛑 TERMINAZIONE SESSIONE DI SVILUPPO"
echo "======================================"

TASK_ID=$1
if [ -z "$TASK_ID" ]; then
    echo "❌ Errore: Specificare task ID"
    echo "Uso: ./end-session.sh [task-id]"
    exit 1
fi

echo "📋 Task: $TASK_ID"
echo ""

# 1. Check modifiche non committate
echo "🔍 Controllo modifiche..."
git status --short

# 2. Commit automatico
echo ""
echo "💾 Vuoi committare le modifiche? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    echo "Inserisci messaggio di commit:"
    read -r commit_message
    git add .
    git commit -m "Task $TASK_ID: $commit_message"
    echo "✅ Commit completato"
fi

# 3. Push
echo ""
echo "📤 Vuoi pushare su GitHub? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    git push origin main
    echo "✅ Push completato"
fi

# 4. Aggiornamento report
DATE=$(date +%Y%m%d)
REPORT_FILE="REPORT-SESSIONI-CLAUDE/$(date +%Y-%m)-$(date +%B)/sessione-$DATE-task-$TASK_ID.md"

if [ -f "$REPORT_FILE" ]; then
    echo ""
    echo "📝 Report sessione: $REPORT_FILE"
    echo "Ora fine: $(date +%H:%M)" >> "$REPORT_FILE"
fi

# 5. Pulizia
echo ""
echo "🧹 Pulizia file temporanei..."
find . -name "*.backup-*" -type f -delete 2>/dev/null
find . -name "*.tmp" -type f -delete 2>/dev/null
echo "✅ Pulizia completata"

# 6. Stop servizi
echo ""
echo "⚠️  Ricorda di fermare i servizi:"
echo "  - Backend (Ctrl+C nel terminale)"
echo "  - Frontend (Ctrl+C nel terminale)"
echo "  - Redis (redis-cli shutdown)"
echo "  - PostgreSQL (se necessario)"

# 7. Summary
echo ""
echo "================================"
echo "📊 SESSIONE COMPLETATA"
echo "Task: $TASK_ID"
echo "Data: $(date +%Y-%m-%d)"
echo "Durata: Controlla nel report"
echo "================================"
echo ""
echo "📝 Prossimi step:"
echo "1. Aggiornare STATO-AVANZAMENTO.md"
echo "2. Verificare documentazione aggiornata"
echo "3. Pianificare prossima sessione"
echo ""
echo "✅ Sessione terminata con successo!"
