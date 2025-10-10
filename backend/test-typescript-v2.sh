#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
echo "=== Test compilazione TypeScript ===" > typescript-check-result.txt
npx tsc --noEmit src/services/unified-notification-center.service.ts src/services/whatsapp-session-manager.ts src/services/wppconnect.service.ts >> typescript-check-result.txt 2>&1
if [ $? -eq 0 ]; then
    echo "" >> typescript-check-result.txt
    echo "✅ COMPILAZIONE RIUSCITA! Nessun errore TypeScript!" >> typescript-check-result.txt
else
    echo "" >> typescript-check-result.txt
    echo "❌ Ci sono ancora errori TypeScript da correggere" >> typescript-check-result.txt
fi
echo "Risultato salvato in typescript-check-result.txt"
