#!/bin/bash

# Script per correggere automaticamente tutti i res.json e res.status senza ResponseFormatter

echo "🔧 Correzione automatica ResponseFormatter in routes..."

# Directory delle routes
ROUTES_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes"

# File già corretti
CORRECTED="auth.routes.ts request.routes.ts quote.routes.ts health.routes.ts"

# Funzione per aggiungere import se manca
add_import_if_missing() {
    local file=$1
    if ! grep -q "import.*ResponseFormatter" "$file"; then
        echo "  → Aggiungendo import ResponseFormatter in $file"
        # Trova la prima riga di import e aggiungi dopo
        sed -i '' "1a\\
import { ResponseFormatter } from '../utils/responseFormatter';\\
" "$file"
    fi
}

# Funzione per correggere un file
fix_file() {
    local file=$1
    local filename=$(basename "$file")
    
    echo "📝 Correggendo $filename..."
    
    # Aggiungi import se manca
    add_import_if_missing "$file"
    
    # Fix patterns comuni
    
    # 1. res.json({ ... }) → res.json(ResponseFormatter.success({ ... }, 'Success'))
    perl -i -pe 's/(\s+)res\.json\(\s*\{/\1return res.json(ResponseFormatter.success({/g' "$file"
    perl -i -pe 's/\}\s*\);$/}, '"'"'Success'"'"'));/g if /ResponseFormatter\.success/' "$file"
    
    # 2. res.status(XXX).json({ ... }) con error
    perl -i -pe 's/(\s+)res\.status\((\d+)\)\.json\(\s*\{\s*error:\s*'"'"'([^'"'"']*)'"'"'/\1return res.status(\2).json(ResponseFormatter.error('"'"'\3'"'"', '"'"'ERROR'"'"'/g' "$file"
    
    # 3. res.status(200).json({ ... }) → res.status(200).json(ResponseFormatter.success({ ... }))
    perl -i -pe 's/(\s+)res\.status\(200\)\.json\(\s*\{/\1return res.status(200).json(ResponseFormatter.success({/g' "$file"
    
    # 4. res.status(201).json({ ... }) → res.status(201).json(ResponseFormatter.success({ ... }))
    perl -i -pe 's/(\s+)res\.status\(201\)\.json\(\s*\{/\1return res.status(201).json(ResponseFormatter.success({/g' "$file"
    
    # 5. res.status(4XX/5XX).json({ ... }) → res.status(XXX).json(ResponseFormatter.error(...))
    perl -i -pe 's/(\s+)res\.status\((4\d\d|5\d\d)\)\.json\(\s*\{/\1return res.status(\2).json(ResponseFormatter.error(/g' "$file"
    
    # 6. Aggiungi return dove manca
    perl -i -pe 's/^(\s+)res\.json\(ResponseFormatter/\1return res.json(ResponseFormatter/g' "$file"
    perl -i -pe 's/^(\s+)res\.status\((\d+)\)\.json\(ResponseFormatter/\1return res.status(\2).json(ResponseFormatter/g' "$file"
    
    echo "  ✅ Completato"
}

# Correggi tutti i file delle routes
for file in "$ROUTES_DIR"/**/*.routes.ts "$ROUTES_DIR"/*.routes.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Salta i file già corretti
        if [[ " $CORRECTED " =~ " $filename " ]]; then
            echo "⏭️  Saltando $filename (già corretto)"
            continue
        fi
        
        # Controlla se il file ha problemi
        if grep -q 'res\.json\|res\.status' "$file" | grep -v 'ResponseFormatter'; then
            fix_file "$file"
        else
            echo "✅ $filename è già corretto"
        fi
    fi
done

echo ""
echo "🎉 Correzione completata!"
echo ""
echo "⚠️ NOTA: Alcuni pattern complessi potrebbero richiedere correzione manuale."
echo "Esegui ./check-response-formatter.sh per verificare"
