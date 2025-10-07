#!/bin/bash

# Script per rimuovere tutte le chiavi hardcoded dal file whatsapp.service.ts

FILE="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/services/whatsapp.service.ts"

# Backup del file
cp "$FILE" "$FILE.backup-$(date +%Y%m%d-%H%M%S)"

# Sostituisci tutte le occorrenze delle chiavi hardcoded
sed -i '' "s/'68c575f3c2ff1'/currentConfig.accessToken/g" "$FILE"
sed -i '' "s/'68C67956807C8'/currentConfig.instanceId/g" "$FILE"
sed -i '' "s/'64833dfa[^']*'/currentConfig.accessToken/g" "$FILE"

# Sostituisci pattern specifici
sed -i '' "s/instance_id: '68C67956807C8'/instance_id: currentConfig.instanceId || ''/g" "$FILE"
sed -i '' "s/access_token: '68c575f3c2ff1'/access_token: currentConfig.accessToken || ''/g" "$FILE"

echo "✅ Rimosse tutte le chiavi hardcoded"
echo "📝 Backup salvato con suffisso .backup-$(date +%Y%m%d-%H%M%S)"

# Verifica che non ci siano più chiavi hardcoded
echo ""
echo "Verifica finale:"
grep -n "68c575f3c2ff1\|68C67956807C8\|64833dfa" "$FILE" || echo "✅ Nessuna chiave hardcoded trovata!"
