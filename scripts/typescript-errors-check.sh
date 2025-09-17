#!/bin/bash

# ==============================================================================
# TYPESCRIPT ERRORS CHECK
# ==============================================================================
# Controlla errori TypeScript in backend e frontend, ordinati per numero di errori
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

echo -e "${CYAN}${BOLD}🔍 TYPESCRIPT ERRORS CHECK${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

# Parse arguments
AREA="all"
SHOW_DETAILS="true"
LIMIT=20

while [[ $# -gt 0 ]]; do
  case $1 in
    --area)
      AREA="$2"
      shift 2
      ;;
    --no-details)
      SHOW_DETAILS="false"
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${BLUE}📋 Parameters:${NC}"
echo -e "  • Area: ${YELLOW}$AREA${NC}"
echo -e "  • Show Details: ${YELLOW}$SHOW_DETAILS${NC}"
echo -e "  • Limit: ${YELLOW}$LIMIT${NC}"
echo ""

# Function to check TypeScript errors
check_typescript() {
    local dir=$1
    local name=$2
    
    echo -e "${BLUE}📦 Checking $name...${NC}"
    
    cd "$dir"
    
    # Run tsc and capture output
    if npx tsc --noEmit --pretty false 2>&1 | tee /tmp/tsc_output.txt; then
        echo -e "${GREEN}✅ No TypeScript errors in $name${NC}"
        return 0
    else
        # Parse and count errors by file
        echo -e "${YELLOW}⚠️ TypeScript errors found in $name:${NC}"
        
        # Extract unique files with errors and count
        cat /tmp/tsc_output.txt | grep -E "\.tsx?.*:" | sed 's/([0-9]*,[0-9]*):.*//' | sort | uniq -c | sort -rn | head -n "$LIMIT" | while read count file; do
            # Clean up the output
            file_clean=$(echo "$file" | sed 's/^[[:space:]]*//')
            if [ ! -z "$file_clean" ]; then
                echo -e "  ${RED}$count errors${NC} in ${CYAN}$file_clean${NC}"
                
                if [ "$SHOW_DETAILS" = "true" ] && [ "$count" -gt 0 ]; then
                    # Show first 3 errors for this file
                    grep "$file_clean" /tmp/tsc_output.txt | head -n 3 | while IFS= read -r line; do
                        echo -e "    ${YELLOW}→${NC} $line"
                    done
                fi
            fi
        done
        
        # Count total errors
        local total_errors=$(cat /tmp/tsc_output.txt | grep -c "error TS" || true)
        local total_files=$(cat /tmp/tsc_output.txt | grep -E "\.tsx?.*:" | sed 's/([0-9]*,[0-9]*):.*//' | sort -u | wc -l | tr -d ' ')
        
        echo ""
        echo -e "${MAGENTA}📊 $name Summary: ${RED}$total_errors errors${NC} in ${CYAN}$total_files files${NC}"
        
        return 1
    fi
}

# Initialize counters
BACKEND_ERRORS=0
BACKEND_FILES=0
FRONTEND_ERRORS=0
FRONTEND_FILES=0

# Check Backend
if [ "$AREA" = "all" ] || [ "$AREA" = "backend" ]; then
    echo -e "${BOLD}${BLUE}🔧 BACKEND CHECK${NC}"
    echo "----------------------------------------"
    
    if [ -d "$PROJECT_ROOT/backend" ]; then
        cd "$PROJECT_ROOT/backend"
        
        if npx tsc --noEmit --pretty false 2>&1 > /tmp/backend_tsc.txt; then
            echo -e "${GREEN}✅ No TypeScript errors in Backend${NC}"
        else
            # Count and display errors
            BACKEND_ERRORS=$(grep -c "error TS" /tmp/backend_tsc.txt || echo "0")
            BACKEND_FILES=$(grep -E "\.tsx?.*:" /tmp/backend_tsc.txt | sed 's/([0-9]*,[0-9]*):.*//' | sort -u | wc -l | tr -d ' ')
            
            echo -e "${YELLOW}⚠️ Backend TypeScript Errors:${NC}"
            echo ""
            
            # Show files with most errors
            grep -E "\.tsx?.*:" /tmp/backend_tsc.txt | sed 's/([0-9]*,[0-9]*):.*//' | sort | uniq -c | sort -rn | head -n "$LIMIT" | while read count file; do
                file_clean=$(echo "$file" | sed 's/^[[:space:]]*//')
                if [ ! -z "$file_clean" ]; then
                    printf "  ${RED}%3d errors${NC} → ${CYAN}%s${NC}\n" "$count" "$file_clean"
                    
                    if [ "$SHOW_DETAILS" = "true" ]; then
                        # Show first 2 errors for this file
                        grep "$file_clean" /tmp/backend_tsc.txt | head -n 2 | while IFS= read -r line; do
                            # Extract just the error message
                            error_msg=$(echo "$line" | sed 's/.*: error TS[0-9]*: //')
                            echo -e "      ${YELLOW}•${NC} $error_msg"
                        done
                    fi
                fi
            done
        fi
    else
        echo -e "${RED}❌ Backend directory not found${NC}"
    fi
    echo ""
fi

# Check Frontend
if [ "$AREA" = "all" ] || [ "$AREA" = "frontend" ]; then
    echo -e "${BOLD}${BLUE}🎨 FRONTEND CHECK${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_ROOT"
    
    # Frontend è nella root, ma dobbiamo filtrare solo /src
    if npx tsc --noEmit --pretty false 2>&1 | grep -E "src/.*\.tsx?" > /tmp/frontend_tsc.txt; then
        if [ ! -s /tmp/frontend_tsc.txt ]; then
            echo -e "${GREEN}✅ No TypeScript errors in Frontend${NC}"
        else
            FRONTEND_ERRORS=$(grep -c "error TS" /tmp/frontend_tsc.txt || echo "0")
            FRONTEND_FILES=$(grep -E "\.tsx?.*:" /tmp/frontend_tsc.txt | sed 's/([0-9]*,[0-9]*):.*//' | sort -u | wc -l | tr -d ' ')
            
            echo -e "${YELLOW}⚠️ Frontend TypeScript Errors:${NC}"
            echo ""
            
            # Show files with most errors
            grep -E "\.tsx?.*:" /tmp/frontend_tsc.txt | sed 's/([0-9]*,[0-9]*):.*//' | sort | uniq -c | sort -rn | head -n "$LIMIT" | while read count file; do
                file_clean=$(echo "$file" | sed 's/^[[:space:]]*//')
                if [ ! -z "$file_clean" ]; then
                    printf "  ${RED}%3d errors${NC} → ${CYAN}%s${NC}\n" "$count" "$file_clean"
                    
                    if [ "$SHOW_DETAILS" = "true" ]; then
                        # Show first 2 errors for this file
                        grep "$file_clean" /tmp/frontend_tsc.txt | head -n 2 | while IFS= read -r line; do
                            # Extract just the error message
                            error_msg=$(echo "$line" | sed 's/.*: error TS[0-9]*: //')
                            echo -e "      ${YELLOW}•${NC} $error_msg"
                        done
                    fi
                fi
            done
        fi
    else
        FRONTEND_ERRORS=0
        FRONTEND_FILES=0
        echo -e "${GREEN}✅ No TypeScript errors in Frontend${NC}"
    fi
    echo ""
fi

# Final Summary
echo -e "${CYAN}===============================================${NC}"
echo -e "${BOLD}${MAGENTA}📊 RIEPILOGO TOTALE${NC}"
echo -e "${CYAN}===============================================${NC}"

# Calculate totals
TOTAL_ERRORS=$((BACKEND_ERRORS + FRONTEND_ERRORS))
TOTAL_FILES=$((BACKEND_FILES + FRONTEND_FILES))

echo -e "${BLUE}🔧 Backend:${NC}  ${RED}$BACKEND_ERRORS errori${NC} in ${CYAN}$BACKEND_FILES file${NC}"
echo -e "${BLUE}🎨 Frontend:${NC} ${RED}$FRONTEND_ERRORS errori${NC} in ${CYAN}$FRONTEND_FILES file${NC}"
echo -e "${MAGENTA}📈 Totale:${NC}   ${RED}$TOTAL_ERRORS errori${NC} in ${CYAN}$TOTAL_FILES file${NC}"
echo -e "${CYAN}===============================================${NC}"

# Suggestions
if [ "$TOTAL_ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 SUGGERIMENTI:${NC}"
    echo -e "  1. Inizia correggendo i file con più errori"
    echo -e "  2. Molti errori potrebbero essere correlati"
    echo -e "  3. Controlla se ci sono import mancanti"
    echo -e "  4. Usa 'npx tsc --noEmit' per dettagli"
else
    echo ""
    echo -e "${GREEN}✨ Ottimo! Nessun errore TypeScript trovato!${NC}"
fi

# Clean up temp files
rm -f /tmp/tsc_output.txt /tmp/backend_tsc.txt /tmp/frontend_tsc.txt

# Exit with error if errors found
if [ "$TOTAL_ERRORS" -gt 0 ]; then
    exit 1
else
    exit 0
fi
