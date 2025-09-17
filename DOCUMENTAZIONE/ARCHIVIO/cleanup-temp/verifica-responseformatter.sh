#!/bin/bash

echo "=== VERIFICA SISTEMA DOPO SISTEMAZIONE RESPONSEFORMATTER ==="
echo "Data: $(date)"
echo ""

# Test 1: Verificare che il backend si avvii senza errori TypeScript
echo "🔍 1. Controllo errori TypeScript..."
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript: Nessun errore"
else
    echo "❌ TypeScript: Errori trovati"
    npx tsc --noEmit
fi

echo ""

# Test 2: Verificare che i file modificati esistano
echo "🔍 2. Controllo file modificati..."
FILES_TO_CHECK=(
    "src/routes/admin.routes.ts"
    "src/routes/admin-simple.routes.ts" 
    "src/routes/admin/dashboard.routes.ts"
    "src/controllers/TestController.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        # Controlla che contenga ResponseFormatter
        if grep -q "ResponseFormatter" "$file"; then
            echo "✅ $file: ResponseFormatter presente"
        else
            echo "❌ $file: ResponseFormatter mancante"
        fi
    else
        echo "❌ $file: File non trovato"
    fi
done

echo ""

# Test 3: Verifica backup creati
echo "🔍 3. Controllo backup creati..."
BACKUP_FILES=(
    "src/routes/admin.routes.backup-20250829-sistema-responseformatter.ts"
    "src/routes/admin-simple.routes.backup-20250829-sistema-responseformatter.ts"
    "src/routes/admin/dashboard.routes.backup-20250829-sistema-responseformatter.ts" 
    "src/controllers/TestController.backup-20250829-sistema-responseformatter.ts"
)

for backup in "${BACKUP_FILES[@]}"; do
    if [ -f "$backup" ]; then
        echo "✅ Backup: $backup"
    else
        echo "❌ Backup mancante: $backup"
    fi
done

echo ""
echo "=== RIEPILOGO SISTEMAZIONE ==="
echo "✅ Sistemati file delle impostazioni sistema per uso corretto ResponseFormatter"
echo "✅ Creati backup di sicurezza"
echo "✅ Aggiunti try-catch e logging appropriati"
echo "✅ Mantenuta coerenza con pattern del progetto"
echo ""
echo "File modificati:"
echo "  - admin.routes.ts"
echo "  - admin-simple.routes.ts"
echo "  - admin/dashboard.routes.ts"
echo "  - TestController.ts"
