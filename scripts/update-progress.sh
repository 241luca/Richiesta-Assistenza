#!/bin/bash

# 📊 Script per aggiornare stato avanzamento
# Uso: ./scripts/update-progress.sh [task-id] [percentage]

TASK_ID=$1
PERCENTAGE=$2

if [ -z "$TASK_ID" ] || [ -z "$PERCENTAGE" ]; then
    echo "❌ Errore: Parametri mancanti"
    echo "Uso: ./update-progress.sh [task-id] [percentage]"
    echo "Esempio: ./update-progress.sh 1.1 100"
    exit 1
fi

echo "📊 AGGIORNAMENTO STATO AVANZAMENTO"
echo "=================================="
echo "Task: $TASK_ID"
echo "Progresso: $PERCENTAGE%"
echo ""

# Backup file stato
cp STATO-AVANZAMENTO.md STATO-AVANZAMENTO.md.backup-$(date +%Y%m%d-%H%M%S)

# Aggiorna timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

# Aggiungi entry al changelog nel file
echo "" >> STATO-AVANZAMENTO.md
echo "### Update $(date +%Y-%m-%d)" >> STATO-AVANZAMENTO.md
echo "- Task $TASK_ID: Aggiornato a $PERCENTAGE%" >> STATO-AVANZAMENTO.md
echo "- Timestamp: $TIMESTAMP" >> STATO-AVANZAMENTO.md

echo "✅ Stato aggiornato!"
echo ""

# Calcola progresso generale
echo "📈 Calcolo progresso generale..."

# Qui andrebbero calcoli più sofisticati basati su peso dei task
# Per ora semplice media

TOTAL_TASKS=35
if [ "$PERCENTAGE" = "100" ]; then
    COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
fi

OVERALL=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))

echo "Progresso generale: $OVERALL%"
echo ""

# Git commit
echo "💾 Commit modifiche..."
git add STATO-AVANZAMENTO.md
git commit -m "📊 Update: Task $TASK_ID progresso $PERCENTAGE%"

echo "✅ Aggiornamento completato!"
