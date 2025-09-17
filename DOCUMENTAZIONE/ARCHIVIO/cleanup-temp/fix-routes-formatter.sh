#!/bin/bash

echo "🔧 CORREZIONE AUTOMATICA ROUTES - ResponseFormatter"
echo "=================================================="

# Lista dei file ROUTES che NON usano ResponseFormatter
FILES=(
    "backend/src/routes/subcategory.routes.ts"
    "backend/src/routes/apiKeys.routes.ts" 
    "backend/src/routes/maps-simple.routes.ts"
    "backend/src/routes/maps.routes.ts"
    "backend/src/routes/geocoding.routes.ts"
    "backend/src/routes/attachment.routes.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 Aggiornando: $file"
        
        # 1. Aggiungi import di ResponseFormatter se non c'è
        if ! grep -q "ResponseFormatter" "$file"; then
            # Trova la linea dove aggiungere l'import
            if grep -q "import.*from.*responseFormatter" "$file"; then
                # Se c'è già un import da responseFormatter, aggiungilo
                sed -i '' 's/import { \([^}]*\) } from .*responseFormatter/import { \1, ResponseFormatter } from '\''..\/utils\/responseFormatter'\''/g' "$file"
            else
                # Aggiungi nuovo import dopo gli altri import
                awk '/^import/ && !added {print; getline; print "import { ResponseFormatter } from '\''../utils/responseFormatter'\'';"; added=1; print; next} 1' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            fi
        fi
        
        # 2. Sostituisci pattern comuni di res.json senza ResponseFormatter
        
        # Pattern: res.json({ success: true, ... })
        sed -i '' 's/res\.json({ success: true, data: \([^}]*\) })/res.json(ResponseFormatter.success(\1, '\''Operation completed successfully'\''))/g' "$file"
        
        # Pattern: res.json({ categories })
        sed -i '' 's/res\.json({ \([a-zA-Z]*\) })/res.json(ResponseFormatter.success(\1, '\''\u\1 retrieved successfully'\''))/g' "$file"
        
        # Pattern: res.json({ message: '...' })
        sed -i '' 's/res\.json({ message: '\''\([^'\'']*\)'\'' })/res.json(ResponseFormatter.success(null, '\''\1'\''))/g' "$file"
        
        # Pattern: res.status(404).json({ error: '...' })
        sed -i '' 's/res\.status(404)\.json({ error: '\''\([^'\'']*\)'\'' })/res.json(ResponseFormatter.error('\''\1'\'', '\''NOT_FOUND'\''))/g' "$file"
        
        # Pattern: res.status(500).json({ ...error... })
        sed -i '' 's/res\.status(500)\.json({ success: false, message: '\''\([^'\'']*\)'\'', error: \([^}]*\) })/res.json(ResponseFormatter.error('\''\1'\'', '\''INTERNAL_ERROR'\'', \2))/g' "$file"
        
        echo "  ✅ Aggiornato"
    else
        echo "  ❌ File non trovato: $file"
    fi
done

echo ""
echo "🎯 Correzioni automatiche completate!"
echo "⚠️  IMPORTANTE: Controlla manualmente i file per pattern complessi!"
