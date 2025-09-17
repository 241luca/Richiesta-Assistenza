#!/bin/bash

# ==============================================================================
# CHECK PRISMA RELATIONS - VERSIONE CORRETTA
# ==============================================================================
# Analizza schema.prisma per trovare TUTTE le relazioni con e senza @relation
# ==============================================================================

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
SCHEMA_FILE="$PROJECT_ROOT/backend/prisma/schema.prisma"

echo -e "${CYAN}${BOLD}🔍 PRISMA RELATIONS CHECK${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

# Verifica che il file schema.prisma esista
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ File schema.prisma non trovato!${NC}"
    echo -e "   Percorso atteso: $SCHEMA_FILE"
    exit 1
fi

echo -e "${BLUE}📋 Analizzando: ${YELLOW}$SCHEMA_FILE${NC}"
echo ""

# Temporary files
TEMP_DIR="/tmp/prisma_check_$$"
mkdir -p "$TEMP_DIR"

# Clean up on exit
trap "rm -rf $TEMP_DIR" EXIT

# Extract all model names
echo -e "${BLUE}📦 Estrazione modelli...${NC}"
MODELS=$(grep "^model " "$SCHEMA_FILE" | awk '{print $2}')
TOTAL_MODELS=$(echo "$MODELS" | wc -l | tr -d ' ')
echo -e "   Trovati ${YELLOW}$TOTAL_MODELS${NC} modelli"
echo ""

# Initialize counters
TOTAL_WITH_RELATION=0
TOTAL_WITHOUT_RELATION=0
MODELS_WITH_ISSUES=""

echo -e "${BOLD}${BLUE}📊 ANALISI PER MODELLO${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Process each model
for model in $MODELS; do
    if [ -z "$model" ]; then
        continue
    fi
    
    # Extract model content (from "model Name {" to "}")
    MODEL_CONTENT=$(awk "/^model $model {/,/^}/" "$SCHEMA_FILE")
    
    # Clear temp files for this model
    > "$TEMP_DIR/model_with.txt"
    > "$TEMP_DIR/model_without.txt"
    
    # Process each line in the model
    while IFS= read -r line; do
        # Skip the model declaration line and closing brace
        if [[ "$line" =~ ^model ]] || [[ "$line" == "}" ]]; then
            continue
        fi
        
        # Skip lines that are comments or empty
        if [[ "$line" =~ ^[[:space:]]*// ]] || [[ -z "$(echo "$line" | tr -d '[:space:]')" ]]; then
            continue
        fi
        
        # Skip lines with @ directives that are not fields (like @@index, @@unique, etc)
        if [[ "$line" =~ ^[[:space:]]*@@ ]]; then
            continue
        fi
        
        # CORRECTED PATTERN: Handle multiple spaces between field name and type
        # Pattern: whitespace + field_name + one or more spaces + ModelName (with optional [] or ?)
        if echo "$line" | grep -qE '^[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]+[A-Z][a-zA-Z0-9_]*(\[\]|\?)?([[:space:]]|$)'; then
            # Extract field name (first word after initial spaces)
            FIELD_NAME=$(echo "$line" | sed 's/^[[:space:]]*//' | awk '{print $1}')
            
            # Extract field type (second word, could be far from field name)
            # Remove leading spaces, then get everything after field name
            REMAINDER=$(echo "$line" | sed 's/^[[:space:]]*//' | sed "s/^${FIELD_NAME}[[:space:]]*//")
            FIELD_TYPE=$(echo "$REMAINDER" | awk '{print $1}')
            
            # Skip if it's a scalar type (String, Int, Boolean, DateTime, etc.)
            if [[ "$FIELD_TYPE" =~ ^(String|Int|Float|Boolean|DateTime|Decimal|Json|BigInt|Bytes) ]]; then
                continue
            fi
            
            # Skip enum types - check if the base type (without [] or ?) exists as enum
            BASE_TYPE=$(echo "$FIELD_TYPE" | sed 's/\[\]$//' | sed 's/\?$//')
            if grep -q "^enum $BASE_TYPE" "$SCHEMA_FILE" 2>/dev/null; then
                continue
            fi
            
            # This is a relation field - check if it has @relation
            if echo "$line" | grep -q "@relation"; then
                # Has @relation - extract the relation name if present
                RELATION_NAME=""
                if echo "$line" | grep -qo '@relation("[^"]*")'; then
                    # Extract relation name from @relation("name")
                    RELATION_NAME=$(echo "$line" | grep -o '@relation("[^"]*")' | sed 's/@relation("//' | sed 's/")//')
                elif echo "$line" | grep -qo '@relation([^)]*)'; then
                    # Extract from @relation(fields: [...])
                    RELATION_NAME=$(echo "$line" | grep -o '@relation([^)]*)' | head -1)
                    RELATION_NAME=${RELATION_NAME#@relation(}
                    RELATION_NAME=${RELATION_NAME%)}
                else
                    RELATION_NAME="(defined)"
                fi
                echo "${FIELD_NAME}:${FIELD_TYPE}:${RELATION_NAME}" >> "$TEMP_DIR/model_with.txt"
            else
                # Missing @relation
                echo "${FIELD_NAME}:${FIELD_TYPE}" >> "$TEMP_DIR/model_without.txt"
            fi
        fi
    done <<< "$MODEL_CONTENT"
    
    # Count results for this model
    MODEL_WITH=0
    MODEL_WITHOUT=0
    
    if [ -s "$TEMP_DIR/model_with.txt" ]; then
        MODEL_WITH=$(wc -l < "$TEMP_DIR/model_with.txt" | tr -d ' ')
    fi
    
    if [ -s "$TEMP_DIR/model_without.txt" ]; then
        MODEL_WITHOUT=$(wc -l < "$TEMP_DIR/model_without.txt" | tr -d ' ')
    fi
    
    # Print model results if it has relations
    if [ $MODEL_WITH -gt 0 ] || [ $MODEL_WITHOUT -gt 0 ]; then
        echo -e "${BOLD}${MAGENTA}📁 Model: ${model}${NC}"
        echo -e "   ${BLUE}Relazioni totali: $((MODEL_WITH + MODEL_WITHOUT))${NC}"
        
        if [ $MODEL_WITH -gt 0 ]; then
            echo -e "   ${GREEN}Con @relation: $MODEL_WITH${NC}"
            while IFS=: read -r field type relation; do
                if [ ! -z "$relation" ]; then
                    # Clean up the relation name display
                    CLEAN_RELATION=$(echo "$relation" | sed 's/""/"/g')
                    echo -e "      ${GREEN}✅${NC} ${field}: ${type} ${CYAN}@relation(${CLEAN_RELATION})${NC}"
                else
                    echo -e "      ${GREEN}✅${NC} ${field}: ${type} ${CYAN}@relation${NC}"
                fi
            done < "$TEMP_DIR/model_with.txt"
        fi
        
        if [ $MODEL_WITHOUT -gt 0 ]; then
            echo -e "   ${RED}Senza @relation: $MODEL_WITHOUT${NC}"
            while IFS=: read -r field type; do
                echo -e "      ${RED}❌${NC} ${field}: ${type} ${YELLOW}(missing @relation)${NC}"
            done < "$TEMP_DIR/model_without.txt"
            MODELS_WITH_ISSUES="$MODELS_WITH_ISSUES $model"
        fi
        
        echo ""
        
        TOTAL_WITH_RELATION=$((TOTAL_WITH_RELATION + MODEL_WITH))
        TOTAL_WITHOUT_RELATION=$((TOTAL_WITHOUT_RELATION + MODEL_WITHOUT))
    fi
done

# Summary section
echo -e "${CYAN}===============================================${NC}"
echo -e "${BOLD}${MAGENTA}📊 RIEPILOGO TOTALE${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

TOTAL_RELATIONS=$((TOTAL_WITH_RELATION + TOTAL_WITHOUT_RELATION))
if [ $TOTAL_RELATIONS -gt 0 ]; then
    PERCENTAGE_CORRECT=$(echo "scale=1; $TOTAL_WITH_RELATION * 100 / $TOTAL_RELATIONS" | bc)
else
    PERCENTAGE_CORRECT=0
fi

echo -e "${BLUE}📈 Statistiche:${NC}"
echo -e "   ${CYAN}Relazioni totali:${NC} ${YELLOW}$TOTAL_RELATIONS${NC}"
echo -e "   ${GREEN}✅ Con @relation:${NC} ${GREEN}$TOTAL_WITH_RELATION${NC}"
echo -e "   ${RED}❌ Senza @relation:${NC} ${RED}$TOTAL_WITHOUT_RELATION${NC}"
if [ $TOTAL_RELATIONS -gt 0 ]; then
    echo -e "   ${MAGENTA}📊 Percentuale corrette:${NC} ${YELLOW}${PERCENTAGE_CORRECT}%${NC}"
fi
echo ""

# Health score
if [ $TOTAL_RELATIONS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ ATTENZIONE:${NC} Nessuna relazione trovata nello schema!"
    EXIT_CODE=1
elif [ $TOTAL_WITHOUT_RELATION -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✨ PERFETTO!${NC} Tutte le ${GREEN}$TOTAL_WITH_RELATION${NC} relazioni hanno @relation!"
    EXIT_CODE=0
elif [ $TOTAL_WITHOUT_RELATION -le 5 ]; then
    echo -e "${YELLOW}⚠️ ATTENZIONE:${NC} Ci sono ${RED}$TOTAL_WITHOUT_RELATION${NC} relazioni senza @relation"
    EXIT_CODE=1
else
    echo -e "${RED}❌ CRITICO:${NC} Ci sono ${RED}$TOTAL_WITHOUT_RELATION${NC} relazioni senza @relation!"
    EXIT_CODE=1
fi

# Suggestions
if [ $TOTAL_WITHOUT_RELATION -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 SUGGERIMENTI:${NC}"
    echo -e "   1. Aggiungi @relation a tutte le relazioni per stabilità"
    echo -e "   2. Usa nomi espliciti: @relation(\"UserPosts\")"
    echo -e "   3. Definisci fields e references per relazioni complesse"
    echo -e "   4. Mantieni consistenza nei nomi delle relazioni"
    echo ""
    echo -e "${BLUE}📝 Esempio di correzione:${NC}"
    echo -e "${RED}   ❌ Prima:${NC}  posts Post[]"
    echo -e "${GREEN}   ✅ Dopo:${NC}   posts Post[] @relation(\"UserPosts\")"
fi

# List of models with issues - with accurate count
if [ $TOTAL_WITHOUT_RELATION -gt 0 ] && [ ! -z "$MODELS_WITH_ISSUES" ]; then
    echo ""
    echo -e "${CYAN}===============================================${NC}"
    echo -e "${BOLD}${RED}🔧 MODELLI DA CORREGGERE${NC}"
    echo -e "${CYAN}===============================================${NC}"
    echo ""
    
    # Create summary with unique models
    echo "$MODELS_WITH_ISSUES" | tr ' ' '\n' | sort -u | while read model; do
        if [ ! -z "$model" ]; then
            # Re-count for this specific model
            MODEL_CONTENT=$(awk "/^model $model {/,/^}/" "$SCHEMA_FILE")
            COUNT=0
            
            while IFS= read -r line; do
                # Skip comments, empty lines, model declaration, directives
                if [[ "$line" =~ ^[[:space:]]*// ]] || \
                   [[ -z "$(echo "$line" | tr -d '[:space:]')" ]] || \
                   [[ "$line" =~ ^[[:space:]]*@@ ]] || \
                   [[ "$line" =~ ^model ]] || \
                   [[ "$line" == "}" ]]; then
                    continue
                fi
                
                # Check for relations without @relation
                if echo "$line" | grep -qE '^[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]+[A-Z][a-zA-Z0-9_]*(\[\]|\?)?([[:space:]]|$)'; then
                    REMAINDER=$(echo "$line" | sed 's/^[[:space:]]*//' | sed 's/^[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*//')
                    FIELD_TYPE=$(echo "$REMAINDER" | awk '{print $1}')
                    BASE_TYPE=$(echo "$FIELD_TYPE" | sed 's/\[\]$//' | sed 's/\?$//')
                    
                    # Skip scalar types and enums
                    if [[ ! "$FIELD_TYPE" =~ ^(String|Int|Float|Boolean|DateTime|Decimal|Json|BigInt|Bytes) ]]; then
                        if ! grep -q "^enum $BASE_TYPE" "$SCHEMA_FILE" 2>/dev/null; then
                            if ! echo "$line" | grep -q "@relation"; then
                                COUNT=$((COUNT + 1))
                            fi
                        fi
                    fi
                fi
            done <<< "$MODEL_CONTENT"
            
            if [ $COUNT -gt 0 ]; then
                echo -e "   ${YELLOW}•${NC} ${BOLD}$model${NC}: ${RED}$COUNT relazioni da correggere${NC}"
            fi
        fi
    done
fi

echo ""
echo -e "${CYAN}===============================================${NC}"

# Debug mode to show what's being detected
if [ "$1" == "--debug" ]; then
    echo ""
    echo -e "${BLUE}🔍 DEBUG: Esempio di relazioni trovate${NC}"
    echo ""
    
    # Show example from User model
    echo "Esempio dal modello User:"
    awk '/^model User {/,/^}/' "$SCHEMA_FILE" | grep -E '^[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]+[A-Z]' | head -5
fi

# Optional: Save detailed report
if [ "$1" == "--save-report" ] || [ "$2" == "--save-report" ]; then
    REPORT_FILE="$PROJECT_ROOT/prisma-relations-report-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "PRISMA RELATIONS REPORT"
        echo "======================="
        echo "Date: $(date)"
        echo ""
        echo "SUMMARY:"
        echo "- Total Models: $TOTAL_MODELS"
        echo "- Total Relations: $TOTAL_RELATIONS"
        echo "- With @relation: $TOTAL_WITH_RELATION"
        echo "- Without @relation: $TOTAL_WITHOUT_RELATION"
        if [ $TOTAL_RELATIONS -gt 0 ]; then
            echo "- Percentage Correct: ${PERCENTAGE_CORRECT}%"
        fi
        echo ""
        echo "MODELS WITH ISSUES:"
        for model in $MODELS_WITH_ISSUES; do
            echo "  - $model"
        done
    } > "$REPORT_FILE"
    
    echo -e "${GREEN}📄 Report salvato in: ${YELLOW}$REPORT_FILE${NC}"
fi

exit $EXIT_CODE
