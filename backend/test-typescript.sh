#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
echo "=== Test compilazione TypeScript ===" > /tmp/typescript-check.txt
npx tsc --noEmit src/services/unified-notification-center.service.ts src/services/whatsapp-session-manager.ts src/services/wppconnect.service.ts >> /tmp/typescript-check.txt 2>&1
if [ $? -eq 0 ]; then
    echo "" >> /tmp/typescript-check.txt
    echo "✅ COMPILAZIONE RIUSCITA! Nessun errore TypeScript!" >> /tmp/typescript-check.txt
else
    echo "" >> /tmp/typescript-check.txt
    echo "❌ Ci sono ancora errori TypeScript da correggere" >> /tmp/typescript-check.txt
fi
cat /tmp/typescript-check.txt
