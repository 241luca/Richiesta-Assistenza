#!/bin/bash
# Script di correzione rapida per errori TypeScript
# Opzione A: Adatta il codice ai nomi esistenti nel database
# Data: 2025-01-11

echo "🔧 CORREZIONE RAPIDA ERRORI TYPESCRIPT"
echo "======================================"
echo ""

# Directory
BACKUP_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backups/2025-01-11-typescript-fix"
PROJECT_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza"
BACKEND_DIR="$PROJECT_DIR/backend/src"

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📋 Questa correzione adatterà il codice ai nomi esistenti nel database${NC}"
echo "   Non modificheremo il database, solo il codice TypeScript"
echo ""

# Crea directory backup se non esiste
mkdir -p "$BACKUP_DIR"

echo "📦 Creando backup dei file principali..."

# Lista dei file con più errori (dalla nostra analisi)
FILES=(
    "routes/request.routes.ts"
    "routes/quote.routes.ts"
    "routes/professional.routes.ts"
    "routes/dashboard/user-dashboard.routes.ts"
    "routes/admin/dashboard.routes.ts"
    "services/request.service.ts"
    "services/quote.service.ts"
    "services/ai-professional.service.ts"
)

# Backup dei file
for file in "${FILES[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        cp "$BACKEND_DIR/$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "  ✓ Backup: $(basename $file)"
    fi
done

echo ""
echo "🔄 Applicando correzioni..."
echo ""

# CORREZIONE 1: Fix include statements nelle routes
echo "1. Correggendo gli include statements..."

# request.routes.ts
if [ -f "$BACKEND_DIR/routes/request.routes.ts" ]; then
    # Sostituisci Client con User_AssistanceRequest_clientIdToUser
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/routes/request.routes.ts"
    sed -i '' 's/Client: {/User_AssistanceRequest_clientIdToUser: {/g' "$BACKEND_DIR/routes/request.routes.ts"
    
    # Sostituisci Professional con User_AssistanceRequest_professionalIdToUser  
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/routes/request.routes.ts"
    sed -i '' 's/Professional: {/User_AssistanceRequest_professionalIdToUser: {/g' "$BACKEND_DIR/routes/request.routes.ts"
    
    # Fix SubCategory -> Subcategory
    sed -i '' 's/SubCategory/Subcategory/g' "$BACKEND_DIR/routes/request.routes.ts"
    
    echo "  ✓ request.routes.ts"
fi

# quote.routes.ts
if [ -f "$BACKEND_DIR/routes/quote.routes.ts" ]; then
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/routes/quote.routes.ts"
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/routes/quote.routes.ts"
    echo "  ✓ quote.routes.ts"
fi

# professional.routes.ts
if [ -f "$BACKEND_DIR/routes/professional.routes.ts" ]; then
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/routes/professional.routes.ts"
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/routes/professional.routes.ts"
    echo "  ✓ professional.routes.ts"
fi

# dashboard routes
if [ -f "$BACKEND_DIR/routes/dashboard/user-dashboard.routes.ts" ]; then
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/routes/dashboard/user-dashboard.routes.ts"
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/routes/dashboard/user-dashboard.routes.ts"
    echo "  ✓ user-dashboard.routes.ts"
fi

# admin dashboard
if [ -f "$BACKEND_DIR/routes/admin/dashboard.routes.ts" ]; then
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/routes/admin/dashboard.routes.ts"
    echo "  ✓ admin/dashboard.routes.ts"
fi

echo ""
echo "2. Correggendo i services..."

# request.service.ts
if [ -f "$BACKEND_DIR/services/request.service.ts" ]; then
    sed -i '' 's/Client: true/User_AssistanceRequest_clientIdToUser: true/g' "$BACKEND_DIR/services/request.service.ts"
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/services/request.service.ts"
    echo "  ✓ request.service.ts"
fi

# quote.service.ts
if [ -f "$BACKEND_DIR/services/quote.service.ts" ]; then
    sed -i '' 's/Professional: true/User_AssistanceRequest_professionalIdToUser: true/g' "$BACKEND_DIR/services/quote.service.ts"
    echo "  ✓ quote.service.ts"
fi

echo ""
echo "3. Correggendo l'accesso alle proprietà..."

# Correggi l'accesso alle proprietà (request.client -> request.User_AssistanceRequest_clientIdToUser)
for file in "${FILES[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        # Correggi accesso proprietà .client
        sed -i '' 's/\.client\([^I]\)/\.User_AssistanceRequest_clientIdToUser\1/g' "$BACKEND_DIR/$file"
        
        # Correggi accesso proprietà .professional  
        sed -i '' 's/\.professional\([^I]\)/\.User_AssistanceRequest_professionalIdToUser\1/g' "$BACKEND_DIR/$file"
        
        # Correggi accesso proprietà .category e .subcategory (mantieni maiuscole)
        sed -i '' 's/\.category\([^I]\)/\.Category\1/g' "$BACKEND_DIR/$file"
        sed -i '' 's/\.subcategory\([^I]\)/\.Subcategory\1/g' "$BACKEND_DIR/$file"
    fi
done

echo "  ✓ Accesso proprietà corretto"

echo ""
echo "4. Correggendo errori di tipo number/string..."

# Fix ResponseFormatter con status code numerici invece di stringhe
for file in "${FILES[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        # Correggi status(400) -> status('400')
        sed -i '' "s/\.status(400)/\.status('400')/g" "$BACKEND_DIR/$file"
        sed -i '' "s/\.status(401)/\.status('401')/g" "$BACKEND_DIR/$file"
        sed -i '' "s/\.status(403)/\.status('403')/g" "$BACKEND_DIR/$file"
        sed -i '' "s/\.status(404)/\.status('404')/g" "$BACKEND_DIR/$file"
        sed -i '' "s/\.status(500)/\.status('500')/g" "$BACKEND_DIR/$file"
    fi
done

echo "  ✓ Tipi corretti"

echo ""
echo -e "${GREEN}✅ Correzioni applicate!${NC}"
echo ""
echo "📊 Verifica risultati..."
echo ""

# Conta errori rimanenti
cd "$PROJECT_DIR/backend"
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)

echo "Errori TypeScript rimanenti: $ERROR_COUNT (erano 582)"
echo ""

if [ $ERROR_COUNT -lt 582 ]; then
    echo -e "${GREEN}✨ Miglioramento! Ridotti di $((582 - ERROR_COUNT)) errori${NC}"
else
    echo -e "${YELLOW}⚠️  Alcuni errori potrebbero richiedere correzione manuale${NC}"
fi

echo ""
echo "📁 Backup salvati in: $BACKUP_DIR"
echo ""
echo "Per vedere gli errori rimanenti:"
echo "  cd backend && npx tsc --noEmit"
