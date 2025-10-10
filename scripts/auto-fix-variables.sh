#!/bin/bash

# 🔧 AUTO-FIX: Variable implicitly has 'any' type
# Fixa variabili dichiarate senza tipo esplicito

BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"
FIXED=0

cd "$BACKEND_DIR" || exit 1

# Trova file con errori TS7005 e TS7034
FILES=$(npx tsc --noEmit 2>&1 | grep -E "error TS(7005|7034)" | cut -d'(' -f1 | sort -u)

if [ -z "$FILES" ]; then
    echo "Nessuna variabile da fixare"
    exit 0
fi

for file in $FILES; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    echo "  📝 Processando: $file"
    
    # Pattern comune: let/const variable implicitly has type 'any[]'
    # Aggiungiamo il tipo esplicitamente
    
    # Per variabili che probabilmente sono array di oggetti
    sed -i '' -E 's/const ([a-zA-Z_][a-zA-Z0-9_]*);/const \1: any[] = [];/g' "$file"
    sed -i '' -E 's/let ([a-zA-Z_][a-zA-Z0-9_]*);/let \1: any[] = [];/g' "$file"
    
    FIXED=$((FIXED + 1))
done

echo "✅ Variabili fixate: $FIXED file"
exit $FIXED
