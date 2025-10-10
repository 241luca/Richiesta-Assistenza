#!/bin/bash

echo "📈 PROGRESSO STRICT MODE"
echo "========================"
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Conta errori
TOTAL_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | xargs)
INITIAL_ERRORS=648
FIXED=$((INITIAL_ERRORS - TOTAL_ERRORS))
PERCENT=$((FIXED * 100 / INITIAL_ERRORS))

echo "📊 Stato Attuale:"
echo "   Errori iniziali: $INITIAL_ERRORS"
echo "   Errori correnti: $TOTAL_ERRORS"
echo "   Errori sistemati: $FIXED"
echo "   Progresso: $PERCENT%"
echo ""

# Barra di progresso
BAR_LENGTH=50
FILLED=$((PERCENT * BAR_LENGTH / 100))
BAR=$(printf "%${FILLED}s" | tr ' ' '█')
EMPTY=$(printf "%$((BAR_LENGTH - FILLED))s" | tr ' ' '░')

echo "   [$BAR$EMPTY] $PERCENT%"
echo ""

# Salva log
echo "$(date): $TOTAL_ERRORS errori ($PERCENT% completato)" >> .ts-strict-progress.log

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo "🎉 COMPLIMENTI! Tutti gli errori sono stati sistemati!"
    echo "   Ora puoi attivare 'strict: true' completo!"
fi
