#!/bin/bash

# Script per rimuovere tutte le chiavi hardcoded dal frontend

FRONTEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/src"

# File da modificare
FILES=(
  "$FRONTEND_DIR/components/admin/whatsapp/WhatsAppManagerFixed.tsx"
  "$FRONTEND_DIR/components/admin/whatsapp/WhatsAppManagerV2.tsx"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Modifico: $FILE"
    
    # Backup
    cp "$FILE" "$FILE.backup-$(date +%Y%m%d-%H%M%S)"
    
    # Sostituisci le chiavi hardcoded con placeholder
    sed -i '' "s/68c575f3c2ff1/\*\*\*\*\*\*\*\*/g" "$FILE"
    sed -i '' "s/68C67956807C8/\*\*\*\*\*\*\*\*/g" "$FILE"
    sed -i '' "s/64833dfa[^'\"]**/\*\*\*\*\*\*\*\*/g" "$FILE"
    
    # Rimuovi riferimenti diretti
    sed -i '' "s/|| '68c575f3c2ff1'/|| ''/g" "$FILE"
    sed -i '' "s/|| '68C67956807C8'/|| ''/g" "$FILE"
  fi
done

echo "✅ Rimosse tutte le chiavi hardcoded dal frontend"

# Verifica finale
echo ""
echo "Verifica finale frontend:"
grep -r "68c575f3c2ff1\|68C67956807C8\|64833dfa" "$FRONTEND_DIR" --exclude-dir=node_modules --exclude='*.backup*' | grep -v '.backup-' || echo "✅ Nessuna chiave hardcoded trovata nel frontend!"
