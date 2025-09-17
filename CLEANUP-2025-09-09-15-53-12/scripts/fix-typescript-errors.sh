#!/bin/bash
# Script per correggere gli errori TypeScript nel progetto
# Data: 2025-01-11

echo "🔧 Correzione errori TypeScript nel progetto..."
echo "========================================="

# Backup directory
BACKUP_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backups/2025-01-11-typescript-fix"
PROJECT_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza"
BACKEND_DIR="$PROJECT_DIR/backend"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANTE: Questo script correggerà i nomi delle relazioni Prisma${NC}"
echo "Il sistema usa nomi lunghi generati automaticamente per le relazioni."
echo ""

# Funzione per correggere i nomi delle relazioni
fix_relation_names() {
    local file=$1
    echo "📝 Correggendo: $(basename $file)"
    
    # Crea backup
    cp "$file" "$BACKUP_DIR/$(basename $file).backup" 2>/dev/null
    
    # Sostituzioni per AssistanceRequest includes
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$file"
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$file"
    sed -i '' 's/Professional: {/User_AssistanceRequest_professionalIdToUser: {/g' "$file"
    sed -i '' 's/SubCategory: true/Subcategory: true/g' "$file"
    
    # Sostituzioni per accesso alle proprietà
    sed -i '' 's/\.client\./\.User_AssistanceRequest_clientIdToUser\./g' "$file"
    sed -i '' 's/\.professional\./\.User_AssistanceRequest_professionalIdToUser\./g' "$file"
    sed -i '' 's/\.subcategory\./\.Subcategory\./g' "$file"
    sed -i '' 's/\.category\./\.Category\./g' "$file"
    
    # Sostituzioni per where conditions
    sed -i '' 's/Client: {/User_AssistanceRequest_clientIdToUser: {/g' "$file"
    sed -i '' 's/Professional: {/User_AssistanceRequest_professionalIdToUser: {/g' "$file"
}

# Lista dei file da correggere (basata sugli errori trovati)
FILES_TO_FIX=(
    "$BACKEND_DIR/src/routes/request.routes.ts"
    "$BACKEND_DIR/src/routes/quote.routes.ts"
    "$BACKEND_DIR/src/routes/professional.routes.ts"
    "$BACKEND_DIR/src/routes/dashboard/user-dashboard.routes.ts"
    "$BACKEND_DIR/src/routes/admin/dashboard.routes.ts"
    "$BACKEND_DIR/src/services/request.service.ts"
    "$BACKEND_DIR/src/services/quote.service.ts"
)

echo -e "${GREEN}📁 Creando backup dei file...${NC}"
mkdir -p "$BACKUP_DIR"

# Correggi ogni file
for file in "${FILES_TO_FIX[@]}"; do
    if [ -f "$file" ]; then
        fix_relation_names "$file"
    else
        echo -e "${RED}❌ File non trovato: $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Correzioni applicate!${NC}"
echo ""
echo "🔍 Verifica errori TypeScript..."
cd "$BACKEND_DIR"
npx tsc --noEmit 2>&1 | head -20

echo ""
echo -e "${YELLOW}📋 Prossimi passi:${NC}"
echo "1. Verifica che il sistema funzioni correttamente"
echo "2. Se ci sono ancora errori, esegui: cd backend && npx tsc --noEmit"
echo "3. I backup sono salvati in: $BACKUP_DIR"
