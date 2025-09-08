#!/bin/bash

# Run All Health Checks
# Esegue tutti i controlli di sistema e genera un report completo

echo "🏥 RUN ALL HEALTH CHECKS"
echo "========================"
echo ""
echo "Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory degli script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Array per tracciare risultati
declare -A RESULTS
declare -A SCORES

# Lista script da eseguire in ordine di priorità
SCRIPTS=(
    "auth-system-check.sh:🔐 Autenticazione"
    "database-health-check.sh:📊 Database"
    "notification-system-check.sh:📨 Notifiche"
    "backup-system-check.sh:💾 Backup"
    "chat-system-check.sh:💬 Chat"
    "payment-system-check.sh:💳 Pagamenti"
    "ai-system-check.sh:🤖 AI"
    "request-system-check.sh:📋 Richieste"
)

echo "📍 Directory progetto: $PROJECT_DIR"
echo "📂 Directory script: $SCRIPT_DIR"
echo ""
echo "=================="
echo "INIZIO CONTROLLI"
echo "=================="
echo ""

# Contatori globali
TOTAL_CHECKS=0
TOTAL_PASSED=0
TOTAL_WARNINGS=0
TOTAL_ERRORS=0

# Esegui ogni script
for script_info in "${SCRIPTS[@]}"; do
    IFS=':' read -r script_name module_name <<< "$script_info"
    script_path="$SCRIPT_DIR/$script_name"
    
    echo "▶️  Esecuzione: $module_name"
    echo "-------------------------------------------"
    
    if [ -f "$script_path" ]; then
        # Rendi eseguibile se non lo è
        chmod +x "$script_path"
        
        # Esegui lo script e cattura output
        OUTPUT=$($script_path 2>&1)
        EXIT_CODE=$?
        
        # Estrai metriche dall'output
        if echo "$OUTPUT" | grep -q "Health Score:"; then
            SCORE=$(echo "$OUTPUT" | grep "Health Score:" | sed 's/.*Health Score: \([0-9]*\).*/\1/')
            SCORES["$module_name"]=$SCORE
        else
            SCORES["$module_name"]=0
        fi
        
        # Conta errori e warning
        ERRORS=$(echo "$OUTPUT" | grep -c "❌" || echo "0")
        WARNINGS=$(echo "$OUTPUT" | grep -c "⚠️" || echo "0")
        PASSED=$(echo "$OUTPUT" | grep -c "✅" || echo "0")
        
        # Aggiorna contatori globali
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))
        TOTAL_WARNINGS=$((TOTAL_WARNINGS + WARNINGS))
        TOTAL_PASSED=$((TOTAL_PASSED + PASSED))
        TOTAL_CHECKS=$((TOTAL_CHECKS + PASSED + WARNINGS + ERRORS))
        
        # Determina stato
        if [ $EXIT_CODE -eq 0 ] && [ $ERRORS -eq 0 ]; then
            STATUS="${GREEN}✅ HEALTHY${NC}"
            RESULTS["$module_name"]="HEALTHY"
        elif [ $ERRORS -gt 2 ]; then
            STATUS="${RED}❌ CRITICAL${NC}"
            RESULTS["$module_name"]="CRITICAL"
        else
            STATUS="${YELLOW}⚠️ WARNING${NC}"
            RESULTS["$module_name"]="WARNING"
        fi
        
        echo -e "   Stato: $STATUS"
        echo "   Score: ${SCORES[$module_name]}/100"
        echo "   ✅ Passati: $PASSED | ⚠️ Warning: $WARNINGS | ❌ Errori: $ERRORS"
        
        # Mostra solo errori critici
        if [ $ERRORS -gt 0 ]; then
            echo ""
            echo "   Errori rilevati:"
            echo "$OUTPUT" | grep "❌" | head -3 | sed 's/^/      /'
        fi
    else
        echo -e "   ${RED}❌ Script non trovato: $script_path${NC}"
        RESULTS["$module_name"]="NOT_FOUND"
        SCORES["$module_name"]=0
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
    
    echo ""
done

echo "=================="
echo "📊 REPORT FINALE"
echo "=================="
echo ""

# Calcola score totale
TOTAL_SCORE=0
MODULES_COUNT=0
for module in "${!SCORES[@]}"; do
    TOTAL_SCORE=$((TOTAL_SCORE + ${SCORES[$module]}))
    MODULES_COUNT=$((MODULES_COUNT + 1))
done

if [ $MODULES_COUNT -gt 0 ]; then
    OVERALL_SCORE=$((TOTAL_SCORE / MODULES_COUNT))
else
    OVERALL_SCORE=0
fi

# Mostra tabella riepilogativa
echo "MODULO                  STATO         SCORE"
echo "--------------------------------------------"
for script_info in "${SCRIPTS[@]}"; do
    IFS=':' read -r script_name module_name <<< "$script_info"
    
    # Formatta output
    printf "%-20s " "$module_name"
    
    STATUS="${RESULTS[$module_name]}"
    case $STATUS in
        "HEALTHY")
            printf "${GREEN}%-12s${NC} " "✅ HEALTHY"
            ;;
        "WARNING")
            printf "${YELLOW}%-12s${NC} " "⚠️ WARNING"
            ;;
        "CRITICAL")
            printf "${RED}%-12s${NC} " "❌ CRITICAL"
            ;;
        *)
            printf "${RED}%-12s${NC} " "❌ ERROR"
            ;;
    esac
    
    printf "%3d/100\n" "${SCORES[$module_name]}"
done

echo ""
echo "--------------------------------------------"
echo ""

# Statistiche globali
echo "📈 STATISTICHE GLOBALI"
echo "----------------------"
echo "Controlli totali eseguiti: $TOTAL_CHECKS"
echo -e "${GREEN}✅ Passati: $TOTAL_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warning: $TOTAL_WARNINGS${NC}"
echo -e "${RED}❌ Errori: $TOTAL_ERRORS${NC}"
echo ""

# Health Score globale con grafico
echo "🏥 OVERALL HEALTH SCORE: $OVERALL_SCORE/100"
echo ""

# Barra di progresso
echo -n "["
for i in {1..20}; do
    if [ $((i * 5)) -le $OVERALL_SCORE ]; then
        if [ $OVERALL_SCORE -ge 80 ]; then
            echo -n -e "${GREEN}█${NC}"
        elif [ $OVERALL_SCORE -ge 60 ]; then
            echo -n -e "${YELLOW}█${NC}"
        else
            echo -n -e "${RED}█${NC}"
        fi
    else
        echo -n "░"
    fi
done
echo "]"
echo ""

# Stato generale del sistema
if [ $OVERALL_SCORE -ge 80 ]; then
    echo -e "${GREEN}✅ SISTEMA IN SALUTE${NC}"
    echo "Il sistema è operativo e funzionante correttamente."
elif [ $OVERALL_SCORE -ge 60 ]; then
    echo -e "${YELLOW}⚠️ SISTEMA CON PROBLEMI MINORI${NC}"
    echo "Il sistema funziona ma necessita di alcuni interventi."
else
    echo -e "${RED}❌ SISTEMA CRITICO${NC}"
    echo "Il sistema ha problemi critici che richiedono intervento immediato."
fi

echo ""

# Raccomandazioni prioritarie
if [ $TOTAL_ERRORS -gt 0 ] || [ $TOTAL_WARNINGS -gt 0 ]; then
    echo "📋 AZIONI RICHIESTE"
    echo "-------------------"
    
    # Trova moduli critici
    CRITICAL_MODULES=""
    WARNING_MODULES=""
    
    for module in "${!RESULTS[@]}"; do
        if [ "${RESULTS[$module]}" = "CRITICAL" ]; then
            CRITICAL_MODULES="$CRITICAL_MODULES\n  - $module"
        elif [ "${RESULTS[$module]}" = "WARNING" ]; then
            WARNING_MODULES="$WARNING_MODULES\n  - $module"
        fi
    done
    
    if [ -n "$CRITICAL_MODULES" ]; then
        echo -e "${RED}PRIORITÀ ALTA (risolvere immediatamente):${NC}"
        echo -e "$CRITICAL_MODULES"
        echo ""
    fi
    
    if [ -n "$WARNING_MODULES" ]; then
        echo -e "${YELLOW}PRIORITÀ MEDIA (pianificare intervento):${NC}"
        echo -e "$WARNING_MODULES"
        echo ""
    fi
    
    echo "Esegui gli script individuali per dettagli specifici:"
    echo "  ./scripts/health-checks/shell/[nome-modulo]-check.sh"
fi

echo ""
echo "=================="
echo "✅ Health check completo!"
echo "Report generato: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Exit con codice appropriato
if [ $OVERALL_SCORE -lt 60 ]; then
    exit 2  # Critical
elif [ $OVERALL_SCORE -lt 80 ]; then
    exit 1  # Warning
else
    exit 0  # Healthy
fi
