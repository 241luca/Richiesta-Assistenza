#!/bin/bash

# ==============================================================================
# CHECK RESPONSEFORMATTER USAGE
# ==============================================================================
# Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino
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
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${CYAN}${BOLD}📋 CHECK RESPONSEFORMATTER USAGE${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

# Parse arguments
SHOW_CODE="true"
CHECK_SERVICES="true"

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-code)
      SHOW_CODE="false"
      shift
      ;;
    --no-services)
      CHECK_SERVICES="false"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${BLUE}📋 Parameters:${NC}"
echo -e "  • Show Code: ${YELLOW}$SHOW_CODE${NC}"
echo -e "  • Check Services: ${YELLOW}$CHECK_SERVICES${NC}"
echo ""

# Initialize counters
ROUTE_VIOLATIONS=0
SERVICE_VIOLATIONS=0
TOTAL_ROUTES=0
TOTAL_SERVICES=0

# Function to check routes
check_routes() {
    echo -e "${BOLD}${BLUE}🔍 CHECKING ROUTES${NC}"
    echo "----------------------------------------"
    
    # Find all .routes.ts files
    ROUTE_FILES=$(find "$BACKEND_DIR/src/routes" -name "*.routes.ts" 2>/dev/null | sort)
    
    if [ -z "$ROUTE_FILES" ]; then
        echo -e "${YELLOW}⚠️ No route files found${NC}"
        return
    fi
    
    # Count total routes
    TOTAL_ROUTES=$(echo "$ROUTE_FILES" | wc -l | tr -d ' ')
    echo -e "${BLUE}Found ${YELLOW}$TOTAL_ROUTES${BLUE} route files${NC}"
    echo ""
    
    # Check each route file
    for file in $ROUTE_FILES; do
        # Get relative path
        REL_PATH=${file#$BACKEND_DIR/}
        
        # Check for res.json or res.status without ResponseFormatter
        VIOLATIONS=$(grep -n "res\.\(json\|status\)" "$file" 2>/dev/null | grep -v "ResponseFormatter" | grep -v "//" | grep -v "\*" || true)
        
        if [ ! -z "$VIOLATIONS" ]; then
            ROUTE_VIOLATIONS=$((ROUTE_VIOLATIONS + 1))
            echo -e "${RED}❌ $REL_PATH${NC}"
            
            if [ "$SHOW_CODE" = "true" ]; then
                echo "$VIOLATIONS" | head -n 3 | while IFS= read -r line; do
                    LINE_NUM=$(echo "$line" | cut -d':' -f1)
                    CODE=$(echo "$line" | cut -d':' -f2- | sed 's/^[[:space:]]*//' | head -c 80)
                    echo -e "    ${YELLOW}Line $LINE_NUM:${NC} $CODE..."
                done
                
                VIOLATION_COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
                if [ "$VIOLATION_COUNT" -gt 3 ]; then
                    echo -e "    ${YELLOW}... and $((VIOLATION_COUNT - 3)) more violations${NC}"
                fi
            else
                VIOLATION_COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
                echo -e "    ${YELLOW}Found $VIOLATION_COUNT violations${NC}"
            fi
            echo ""
        fi
    done
    
    if [ "$ROUTE_VIOLATIONS" -eq 0 ]; then
        echo -e "${GREEN}✅ All routes use ResponseFormatter correctly!${NC}"
    else
        echo -e "${RED}Found violations in $ROUTE_VIOLATIONS route files${NC}"
    fi
}

# Function to check services
check_services() {
    if [ "$CHECK_SERVICES" != "true" ]; then
        return
    fi
    
    echo ""
    echo -e "${BOLD}${BLUE}🔍 CHECKING SERVICES${NC}"
    echo "----------------------------------------"
    
    # Find all .service.ts files
    SERVICE_FILES=$(find "$BACKEND_DIR/src/services" -name "*.service.ts" 2>/dev/null | sort)
    
    if [ -z "$SERVICE_FILES" ]; then
        echo -e "${YELLOW}⚠️ No service files found${NC}"
        return
    fi
    
    # Count total services
    TOTAL_SERVICES=$(echo "$SERVICE_FILES" | wc -l | tr -d ' ')
    echo -e "${BLUE}Found ${YELLOW}$TOTAL_SERVICES${BLUE} service files${NC}"
    echo ""
    
    # Check each service file
    for file in $SERVICE_FILES; do
        # Get relative path
        REL_PATH=${file#$BACKEND_DIR/}
        
        # Check for ResponseFormatter usage (should NOT be in services)
        VIOLATIONS=$(grep -n "ResponseFormatter" "$file" 2>/dev/null | grep -v "//" | grep -v "\*" || true)
        
        if [ ! -z "$VIOLATIONS" ]; then
            SERVICE_VIOLATIONS=$((SERVICE_VIOLATIONS + 1))
            echo -e "${RED}❌ $REL_PATH${NC}"
            echo -e "    ${YELLOW}ERROR: Service should NOT use ResponseFormatter${NC}"
            
            if [ "$SHOW_CODE" = "true" ]; then
                echo "$VIOLATIONS" | head -n 3 | while IFS= read -r line; do
                    LINE_NUM=$(echo "$line" | cut -d':' -f1)
                    CODE=$(echo "$line" | cut -d':' -f2- | sed 's/^[[:space:]]*//' | head -c 80)
                    echo -e "    ${YELLOW}Line $LINE_NUM:${NC} $CODE..."
                done
                
                VIOLATION_COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
                if [ "$VIOLATION_COUNT" -gt 3 ]; then
                    echo -e "    ${YELLOW}... and $((VIOLATION_COUNT - 3)) more violations${NC}"
                fi
            else
                VIOLATION_COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
                echo -e "    ${YELLOW}Found $VIOLATION_COUNT violations${NC}"
            fi
            echo ""
        fi
    done
    
    if [ "$SERVICE_VIOLATIONS" -eq 0 ]; then
        echo -e "${GREEN}✅ No services use ResponseFormatter (correct)!${NC}"
    else
        echo -e "${RED}Found ResponseFormatter in $SERVICE_VIOLATIONS service files (should be removed)${NC}"
    fi
}

# Run checks
check_routes
check_services

# Final Summary
echo ""
echo -e "${CYAN}===============================================${NC}"
echo -e "${BOLD}${MAGENTA}📊 RIEPILOGO${NC}"
echo -e "${CYAN}===============================================${NC}"

echo -e "${BLUE}📂 File controllati:${NC}"
echo -e "  • Route files: ${YELLOW}$TOTAL_ROUTES${NC}"
if [ "$CHECK_SERVICES" = "true" ]; then
    echo -e "  • Service files: ${YELLOW}$TOTAL_SERVICES${NC}"
fi

echo ""
echo -e "${BLUE}⚠️ Violazioni trovate:${NC}"
echo -e "  • Routes senza ResponseFormatter: ${RED}$ROUTE_VIOLATIONS${NC}"
if [ "$CHECK_SERVICES" = "true" ]; then
    echo -e "  • Services con ResponseFormatter: ${RED}$SERVICE_VIOLATIONS${NC}"
fi

TOTAL_VIOLATIONS=$((ROUTE_VIOLATIONS + SERVICE_VIOLATIONS))
echo ""
echo -e "${MAGENTA}📈 Totale violazioni: ${RED}$TOTAL_VIOLATIONS${NC}"
echo -e "${CYAN}===============================================${NC}"

# Suggestions for fixes
if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 COME CORREGGERE:${NC}"
    
    if [ "$ROUTE_VIOLATIONS" -gt 0 ]; then
        echo ""
        echo -e "${BLUE}Per le ROUTES:${NC}"
        echo -e "  ${RED}❌ SBAGLIATO:${NC} res.json({ data })"
        echo -e "  ${GREEN}✅ CORRETTO:${NC}  res.json(ResponseFormatter.success(data, 'Success'))"
    fi
    
    if [ "$SERVICE_VIOLATIONS" -gt 0 ]; then
        echo ""
        echo -e "${BLUE}Per i SERVICES:${NC}"
        echo -e "  ${RED}❌ SBAGLIATO:${NC} return ResponseFormatter.success(data)"
        echo -e "  ${GREEN}✅ CORRETTO:${NC}  return data  // Solo i dati, senza formatter"
    fi
    
    echo ""
    echo -e "${MAGENTA}Ricorda: ResponseFormatter va SOLO nelle routes, MAI nei services!${NC}"
else
    echo ""
    echo -e "${GREEN}✨ Perfetto! Tutte le routes usano correttamente ResponseFormatter!${NC}"
    if [ "$CHECK_SERVICES" = "true" ]; then
        echo -e "${GREEN}✨ Nessun service usa ResponseFormatter (corretto)!${NC}"
    fi
fi

# Exit with error if violations found
if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
    exit 1
else
    exit 0
fi
