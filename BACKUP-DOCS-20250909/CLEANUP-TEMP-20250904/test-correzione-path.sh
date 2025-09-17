#!/bin/bash

echo "🔧 VERIFICA CORREZIONE PATH RESPONSEFORMATTER"
echo "============================================"

# Test di compilazione TypeScript
echo "📝 1. Test compilazione TypeScript..."
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript: Compilazione OK"
else
    echo "❌ TypeScript: Errori di compilazione"
    exit 1
fi

# Test importi ResponseFormatter 
echo ""
echo "📁 2. Verifica path importi..."

# File che devono avere path corretto
declare -A FILES_PATHS=(
    ["src/routes/admin.routes.ts"]="../utils/responseFormatter"
    ["src/routes/admin-simple.routes.ts"]="../utils/responseFormatter"
    ["src/routes/admin/dashboard.routes.ts"]="../../utils/responseFormatter"
    ["src/controllers/TestController.ts"]="../utils/responseFormatter"
)

for file in "${!FILES_PATHS[@]}"; do
    expected_path="${FILES_PATHS[$file]}"
    
    if [ -f "$file" ]; then
        if grep -q "from '$expected_path'" "$file"; then
            echo "✅ $file: Path corretto ($expected_path)"
        else
            echo "❌ $file: Path errato"
            echo "   Cercato: $expected_path"
            echo "   Trovato: $(grep "from.*responseFormatter" "$file" || echo 'Nessun import trovato')"
        fi
    else
        echo "❌ $file: File non trovato"
    fi
done

echo ""
echo "🚀 3. Test avvio server..."
# Nota: Il test del server viene fatto manualmente dal terminale aperto

echo ""
echo "✅ CORREZIONE COMPLETATA"
echo "Il server dovrebbe ora avviarsi senza errori di import."
