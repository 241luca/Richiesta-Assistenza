#!/bin/bash

# Backup System Health Check
# Verifica completa del sistema di backup

echo "💾 BACKUP SYSTEM CHECK"
echo "====================="
echo ""

# Debug: mostra dove siamo
echo "Debug: PWD = $(pwd)"
echo "Debug: Script location = $0"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori
ERRORS=0
WARNINGS=0
CHECKS=0

# Trova la directory del progetto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKUP_DIR="$PROJECT_DIR/database-backups"

echo "📍 Directory progetto: $PROJECT_DIR"
echo "📍 Backend dir: $BACKEND_DIR"
echo "📍 Backup dir: $BACKUP_DIR"
echo ""

# Verifica che siamo nella directory giusta
if [ ! -d "$PROJECT_DIR/backend" ]; then
    echo "❌ ERRORE: Directory backend non trovata in $PROJECT_DIR"
    echo "   Contenuto directory:"
    ls -la "$PROJECT_DIR" 2>&1 | head -10
    exit 1
fi

# Funzione per incrementare contatori
check_pass() {
    CHECKS=$((CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

check_warn() {
    CHECKS=$((CHECKS + 1))
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_fail() {
    CHECKS=$((CHECKS + 1))
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verifica directory backup
echo "📂 VERIFICA DIRECTORY BACKUP"
echo "----------------------------"

if [ -d "$BACKUP_DIR" ]; then
    check_pass "Directory backup esistente: $BACKUP_DIR"
    
    # Conta backup esistenti - metodo semplice
    BACKUP_COUNT=0
    for file in "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.tar.gz "$BACKUP_DIR"/*.zip; do
        [ -e "$file" ] && BACKUP_COUNT=$((BACKUP_COUNT + 1))
    done
    
    echo "   Backup trovati: $BACKUP_COUNT"
    
    if [ $BACKUP_COUNT -eq 0 ]; then
        check_warn "Nessun backup trovato nella directory"
    else
        check_pass "$BACKUP_COUNT backup trovati"
    fi
else
    check_fail "Directory backup NON ESISTENTE"
    # Crea la directory
    mkdir -p "$BACKUP_DIR" 2>&1
    if [ $? -eq 0 ]; then
        echo "   Directory creata: $BACKUP_DIR"
    else
        echo "   Errore creazione directory: $!"
    fi
fi

echo ""

# 2. Verifica ultimo backup
echo "⏰ VERIFICA ULTIMO BACKUP"
echo "-------------------------"

LATEST_BACKUP=""
LATEST_TIME=0

if [ -d "$BACKUP_DIR" ]; then
    for file in "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.tar.gz "$BACKUP_DIR"/*.zip; do
        if [ -f "$file" ]; then
            # Ottieni timestamp del file
            if command -v stat >/dev/null 2>&1; then
                FILE_TIME=$(stat -f "%m" "$file" 2>/dev/null || stat -c "%Y" "$file" 2>/dev/null || echo "0")
                if [ "$FILE_TIME" -gt "$LATEST_TIME" ]; then
                    LATEST_TIME=$FILE_TIME
                    LATEST_BACKUP="$file"
                fi
            fi
        fi
    done
    
    if [ -n "$LATEST_BACKUP" ] && [ "$LATEST_TIME" -gt 0 ]; then
        CURRENT_TIME=$(date +%s)
        AGE_SECONDS=$((CURRENT_TIME - LATEST_TIME))
        AGE_HOURS=$((AGE_SECONDS / 3600))
        
        echo "   Ultimo backup: $(basename "$LATEST_BACKUP")"
        echo "   Età: $AGE_HOURS ore"
        
        if [ $AGE_HOURS -lt 24 ]; then
            check_pass "Backup recente (< 24 ore)"
        elif [ $AGE_HOURS -lt 72 ]; then
            check_warn "Backup vecchio di $AGE_HOURS ore (> 24 ore)"
        else
            check_fail "Backup molto vecchio: $AGE_HOURS ore"
        fi
    else
        check_fail "Nessun backup trovato"
    fi
else
    check_fail "Directory backup non accessibile"
fi

echo ""

# 3. Verifica script di backup
echo "📜 VERIFICA SCRIPT BACKUP"
echo "-------------------------"

BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-all.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    check_pass "Script backup-all.sh presente"
    
    # Verifica se eseguibile
    if [ -x "$BACKUP_SCRIPT" ]; then
        check_pass "Script backup eseguibile"
    else
        check_warn "Script backup non eseguibile"
        chmod +x "$BACKUP_SCRIPT" 2>/dev/null && echo "   Script reso eseguibile"
    fi
else
    check_fail "Script backup-all.sh MANCANTE"
fi

echo ""

# 4. Verifica spazio su disco
echo "💾 VERIFICA SPAZIO DISCO"
echo "------------------------"

# Usa df in modo compatibile
DF_OUTPUT=$(df -h "$PROJECT_DIR" 2>/dev/null | tail -1)
if [ -n "$DF_OUTPUT" ]; then
    # Estrai percentuale usata (compatibile macOS/Linux)
    USED_PERCENT=$(echo "$DF_OUTPUT" | awk '{for(i=1;i<=NF;i++) if($i ~ /%$/) {gsub(/%/,"",$i); print $i; exit}}')
    
    if [ -n "$USED_PERCENT" ] && [ "$USED_PERCENT" -eq "$USED_PERCENT" ] 2>/dev/null; then
        echo "   Utilizzo disco: ${USED_PERCENT}%"
        
        if [ "$USED_PERCENT" -lt 80 ]; then
            check_pass "Spazio disco sufficiente"
        elif [ "$USED_PERCENT" -lt 90 ]; then
            check_warn "Spazio disco limitato (${USED_PERCENT}% utilizzato)"
        else
            check_fail "Spazio disco critico (${USED_PERCENT}% utilizzato)"
        fi
    else
        check_warn "Impossibile determinare utilizzo disco"
    fi
else
    check_warn "Impossibile verificare spazio disco"
fi

echo ""

# 5. Test creazione backup
echo "🧪 TEST CREAZIONE BACKUP"
echo "------------------------"

# Prima assicurati che la directory esista
[ ! -d "$BACKUP_DIR" ] && mkdir -p "$BACKUP_DIR" 2>/dev/null

TEST_FILE="$BACKUP_DIR/test-$(date +%Y%m%d-%H%M%S).test"

if echo "Test backup $(date)" > "$TEST_FILE" 2>/dev/null; then
    check_pass "Scrittura nella directory backup OK"
    rm -f "$TEST_FILE" 2>/dev/null
else
    check_fail "Impossibile scrivere nella directory backup"
fi

echo ""

# 6. Verifica configurazione database per backup
echo "🗄️ VERIFICA CONFIGURAZIONE DATABASE"
echo "------------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "DATABASE_URL" "$PROJECT_DIR/.env" 2>/dev/null; then
        check_pass "DATABASE_URL configurato"
    else
        check_fail "DATABASE_URL non configurato in .env"
    fi
else
    check_fail "File .env non trovato in $PROJECT_DIR"
fi

echo ""

# 7. Summary e raccomandazioni
echo "📊 RIEPILOGO"
echo "============"
echo ""
echo "Controlli eseguiti: $CHECKS"
echo -e "${GREEN}✅ Passati: $((CHECKS - WARNINGS - ERRORS))${NC}"
echo -e "${YELLOW}⚠️  Warning: $WARNINGS${NC}"
echo -e "${RED}❌ Errori: $ERRORS${NC}"
echo ""

# Calcola health score
SCORE=$((100 - (ERRORS * 20) - (WARNINGS * 5)))
if [ $SCORE -lt 0 ]; then
    SCORE=0
fi

echo "🏥 Health Score: $SCORE/100"
echo ""

# Raccomandazioni
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI"
    echo "=================="
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}CRITICHE (da risolvere subito):${NC}"
        [ ! -d "$BACKUP_DIR" ] && echo "  - Creare directory backup"
        [ -z "$LATEST_BACKUP" ] && echo "  - Eseguire primo backup del database"
        [ ! -f "$BACKUP_SCRIPT" ] && echo "  - Creare script di backup"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Schedulare backup automatici giornalieri"
        echo "  - Implementare retention policy (30 giorni)"
        echo "  - Testare restore procedure"
        echo "  - Configurare backup offsite/cloud"
    fi
fi

echo ""
echo "✅ Backup System Check completato!"

# Exit sempre con 0 per non causare errori nel backend
exit 0
