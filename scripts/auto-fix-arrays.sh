#!/bin/bash

# 🔧 AUTO-FIX: Array implicitly has 'any[]' type
# Fixa array dichiarati senza tipo esplicito

BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"
FIXED=0

cd "$BACKEND_DIR" || exit 1

# Trova tutti i file TypeScript con errori TS7018
FILES=$(npx tsc --noEmit 2>&1 | grep "error TS7018" | cut -d'(' -f1 | sort -u)

if [ -z "$FILES" ]; then
    echo "Nessun array da fixare"
    exit 0
fi

for file in $FILES; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    echo "  📝 Processando: $file"
    
    # Pattern 1: const arr = []
    # Fix: const arr: any[] = []
    sed -i '' -E 's/const ([a-zA-Z_][a-zA-Z0-9_]*) = \[\]/const \1: any[] = []/g' "$file"
    
    # Pattern 2: let arr = []
    sed -i '' -E 's/let ([a-zA-Z_][a-zA-Z0-9_]*) = \[\]/let \1: any[] = []/g' "$file"
    
    # Pattern 3: property = []
    sed -i '' -E 's/([a-zA-Z_][a-zA-Z0-9_]*) = \[\]/\1: any[] = []/g' "$file"
    
    FIXED=$((FIXED + 1))
done

echo "✅ Array fixati: $FIXED file"
exit $FIXED
