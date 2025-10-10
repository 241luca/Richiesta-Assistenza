#!/bin/bash

# 🤖 AUTO-FIX TYPESCRIPT STRICT ERRORS
# =====================================
# Script principale che coordina tutti gli auto-fix

set -e  # Exit on error

PROJECT_ROOT="/Users/lucamambelli/Desktop/Richiesta-Assistenza"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$PROJECT_ROOT/backend/.auto-fix-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$PROJECT_ROOT/auto-fix-$TIMESTAMP.log"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "🤖 =================================================="
echo "   TYPESCRIPT AUTO-FIX TOOL"
echo "   Data: $(date)"
echo "===================================================${NC}"
echo ""

# Funzione per logging
log() {
    echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# Funzione per errori
error() {
    echo -e "${RED}❌ ERRORE: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Funzione per successo
success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

# Funzione per warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# 1. Verifica prerequisiti
log "Verifico prerequisiti..."
cd "$BACKEND_DIR" || error "Directory backend non trovata"

if [ ! -f "tsconfig.json" ]; then
    error "tsconfig.json non trovato"
fi

success "Prerequisiti OK"

# 2. Conta errori iniziali
log "Conto errori iniziali..."
INITIAL_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | xargs)
log "Errori iniziali: $INITIAL_ERRORS"

if [ "$INITIAL_ERRORS" -eq 0 ]; then
    success "Nessun errore trovato! 🎉"
    exit 0
fi

# 3. Crea backup completo
log "Creo backup completo del codice sorgente..."
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"
cp -r "$BACKEND_DIR/src" "$BACKUP_PATH"
success "Backup creato in: $BACKUP_PATH"

# 4. Esegui auto-fix
echo ""
echo -e "${BLUE}📝 Inizio Auto-Fix...${NC}"
echo ""

FIXED_COUNT=0

# Fix 1: Array implicitly any[]
log "Fix 1/4: Array senza tipo..."
bash "$PROJECT_ROOT/scripts/auto-fix-arrays.sh" | tee -a "$LOG_FILE"
ARRAYS_FIXED=$?
FIXED_COUNT=$((FIXED_COUNT + ARRAYS_FIXED))

# Fix 2: Parameters implicitly any
log "Fix 2/4: Parametri senza tipo..."
bash "$PROJECT_ROOT/scripts/auto-fix-parameters.sh" | tee -a "$LOG_FILE"
PARAMS_FIXED=$?
FIXED_COUNT=$((FIXED_COUNT + PARAMS_FIXED))

# Fix 3: Variables implicitly any
log "Fix 3/4: Variabili senza tipo..."
bash "$PROJECT_ROOT/scripts/auto-fix-variables.sh" | tee -a "$LOG_FILE"
VARS_FIXED=$?
FIXED_COUNT=$((FIXED_COUNT + VARS_FIXED))

# Fix 4: Type conversions
log "Fix 4/4: Conversioni tipo semplici..."
bash "$PROJECT_ROOT/scripts/auto-fix-conversions.sh" | tee -a "$LOG_FILE"
CONV_FIXED=$?
FIXED_COUNT=$((FIXED_COUNT + CONV_FIXED))

# 5. Verifica build post-fix
echo ""
log "Verifico che il codice compili ancora..."
if npm run build > /tmp/build-check.log 2>&1; then
    success "Build OK! Il codice compila correttamente"
else
    error "Build fallita! Ripristino backup..."
    rm -rf "$BACKEND_DIR/src"
    cp -r "$BACKUP_PATH" "$BACKEND_DIR/src"
    error "Backup ripristinato. Controlla i log."
fi

# 6. Conta errori finali
log "Conto errori finali..."
FINAL_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | xargs)
FIXED=$((INITIAL_ERRORS - FINAL_ERRORS))

# 7. Report finale
echo ""
echo -e "${BLUE}=================================================="
echo "             📊 REPORT FINALE"
echo "===================================================${NC}"
echo ""
echo "📈 Errori iniziali:  $INITIAL_ERRORS"
echo "📉 Errori finali:    $FINAL_ERRORS"
echo "✅ Errori fixati:    $FIXED"
echo ""
echo "🔧 Fix applicati:"
echo "   - Arrays tipizzati:     $ARRAYS_FIXED"
echo "   - Parametri tipizzati:  $PARAMS_FIXED"
echo "   - Variabili tipizzate:  $VARS_FIXED"
echo "   - Conversioni:          $CONV_FIXED"
echo ""

if [ "$FIXED" -gt 0 ]; then
    PERCENT=$((FIXED * 100 / INITIAL_ERRORS))
    echo -e "${GREEN}🎉 Successo! Fixati $FIXED errori ($PERCENT%)${NC}"
    echo ""
    echo "💾 Backup disponibile in:"
    echo "   $BACKUP_PATH"
    echo ""
    echo "📝 Log completo salvato in:"
    echo "   $LOG_FILE"
    echo ""
    echo "🚀 Prossimi passi:"
    echo "   1. Testa il sistema: npm run dev"
    echo "   2. Verifica che tutto funzioni"
    echo "   3. Commit le modifiche"
    echo "   4. Continua con fix manuali per i restanti $FINAL_ERRORS errori"
else
    warning "Nessun errore auto-fixabile trovato"
    echo "   Dovrai fixare manualmente i $INITIAL_ERRORS errori rimanenti"
fi

echo ""
echo -e "${BLUE}===================================================${NC}"
echo ""

# Salva report JSON
cat > "$PROJECT_ROOT/auto-fix-report-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "initial_errors": $INITIAL_ERRORS,
  "final_errors": $FINAL_ERRORS,
  "fixed": $FIXED,
  "breakdown": {
    "arrays": $ARRAYS_FIXED,
    "parameters": $PARAMS_FIXED,
    "variables": $VARS_FIXED,
    "conversions": $CONV_FIXED
  },
  "backup_path": "$BACKUP_PATH",
  "log_file": "$LOG_FILE"
}
EOF

success "Report salvato in: auto-fix-report-$TIMESTAMP.json"

exit 0
