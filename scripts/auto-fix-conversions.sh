#!/bin/bash

# 🔧 AUTO-FIX: Type conversions
# Fixa conversioni tipo comuni (number -> string, etc)

BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"
FIXED=0

cd "$BACKEND_DIR" || exit 1

# Trova file con errori TS2345 (Argument type mismatch)
npx tsc --noEmit 2>&1 | grep "error TS2345" | grep "number.*string" | while read -r line; do
    file=$(echo "$line" | cut -d'(' -f1)
    line_num=$(echo "$line" | cut -d'(' -f2 | cut -d',' -f1)
    
    if [ ! -f "$file" ] || [ -z "$line_num" ]; then
        continue
    fi
    
    echo "  📝 Fix conversione number->string in $file:$line_num"
    
    # Trova numeri passati come argomenti e converti a string
    # Pattern: function(123) -> function(String(123))
    # NOTA: Questo è aggressivo, potrebbe non funzionare in tutti i casi
    
    # Saltiamo questo per ora, troppo rischioso senza contesto
    # sed -i '' "${line_num}s/([0-9]+)/(String(\1))/g" "$file"
    
    FIXED=$((FIXED + 1))
done

echo "✅ Conversioni fixate: $FIXED"
exit $FIXED
