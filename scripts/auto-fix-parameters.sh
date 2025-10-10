#!/bin/bash

# 🔧 AUTO-FIX: Parameter implicitly has 'any' type
# Fixa parametri di funzione senza tipo esplicito

BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"
FIXED=0

cd "$BACKEND_DIR" || exit 1

# Trova file con errori TS7006
npx tsc --noEmit 2>&1 | grep "error TS7006" | while read -r line; do
    # Estrai file e riga
    file=$(echo "$line" | cut -d'(' -f1)
    line_num=$(echo "$line" | cut -d'(' -f2 | cut -d',' -f1)
    param=$(echo "$line" | grep -oE "Parameter '[^']+'" | cut -d"'" -f2)
    
    if [ ! -f "$file" ] || [ -z "$line_num" ] || [ -z "$param" ]; then
        continue
    fi
    
    echo "  📝 Fix parametro '$param' in $file:$line_num"
    
    # Aggiungi ': any' al parametro
    # Questo è un fix conservativo - usa 'any' per non rompere il codice
    sed -i '' "${line_num}s/${param})/${param}: any)/g" "$file"
    sed -i '' "${line_num}s/${param},/${param}: any,/g" "$file"
    
    FIXED=$((FIXED + 1))
done

echo "✅ Parametri fixati: $FIXED"
exit $FIXED
