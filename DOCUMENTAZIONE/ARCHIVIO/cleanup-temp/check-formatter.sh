#!/bin/bash
# Script per verificare l'uso del responseFormatter in tutti i file routes

echo "=== Verifica uso responseFormatter nei file routes ==="
echo ""

for file in /Users/lucamambelli/Desktop/richiesta-assistenza/backend/src/routes/*.ts; do
  if [[ -f "$file" && ! "$file" =~ "backup" ]]; then
    filename=$(basename "$file")
    
    # Controlla se il file importa responseFormatter
    if grep -q "responseFormatter" "$file"; then
      echo "✅ $filename - USA responseFormatter"
    else
      # Controlla se il file ha query Prisma con include
      if grep -q "include:" "$file"; then
        echo "❌ $filename - NON USA responseFormatter ma ha relazioni Prisma"
      else
        echo "➖ $filename - Non usa responseFormatter (potrebbe non servire)"
      fi
    fi
  fi
done