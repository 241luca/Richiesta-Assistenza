#!/bin/bash
# Script per trovare TUTTI i file che fanno query Prisma con relazioni

echo "=== RICERCA DI TUTTI I FILE CHE USANO PRISMA CON RELAZIONI ==="
echo ""
echo "Cercando in backend/src..."
echo ""

# Cerca tutti i file che contengono "prisma" e "include" o "select"
grep -r "prisma\." /Users/lucamambelli/Desktop/richiesta-assistenza/backend/src --include="*.ts" | grep -E "(include|select):" | cut -d: -f1 | sort -u > /tmp/prisma-files.txt

echo "FILE CHE USANO PRISMA CON RELAZIONI:"
echo "======================================"
while IFS= read -r file; do
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  dirname_short=$(echo "$dirname" | sed 's|.*/backend/src/||')
  
  # Controlla se usa responseFormatter
  if grep -q "responseFormatter" "$file"; then
    echo "✅ $dirname_short/$filename"
  else
    echo "❌ $dirname_short/$filename - MANCA responseFormatter!"
  fi
done < /tmp/prisma-files.txt

echo ""
echo "=== ANALISI DETTAGLIATA ==="
echo ""

# Trova tutti i findMany, findUnique, findFirst con include
echo "Query con INCLUDE (che hanno relazioni):"
echo "----------------------------------------"
grep -r "\.find.*include:" /Users/lucamambelli/Desktop/richiesta-assistenza/backend/src --include="*.ts" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  dirname_short=$(echo "$dirname" | sed 's|.*/backend/src/||')
  
  if ! grep -q "responseFormatter" "$file"; then
    echo "❌ $dirname_short/$filename ha include ma NON USA responseFormatter"
  fi
done | sort -u