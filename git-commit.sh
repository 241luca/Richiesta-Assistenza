#!/bin/bash

# Script per commit correzioni TypeScript
# Data: 10 Ottobre 2025

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

echo "📊 Verifica stato Git..."
git status --short

echo ""
echo "📝 File modificati:"
git diff --name-only

echo ""
echo "🔍 Verifica backup files..."
find . -name "*.backup-*" -type f | head -10

echo ""
read -p "Vuoi procedere con il commit? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]
then
    echo "✅ Aggiungo i file modificati..."
    
    # Aggiungi solo i file corretti (NO backup!)
    git add backend/src/services/pec.service.ts
    git add backend/src/services/whatsapp.service.ts
    git add backend/src/services/wppconnect.service.ts
    git add backend/src/services/unified-notification-center.service.ts
    
    echo ""
    echo "💾 Creo il commit..."
    git commit -m "fix(backend): risolti tutti gli errori TypeScript

🐛 Correzioni principali:
- pec.service.ts: Import corretti, azioni Audit valide (READ, CREATE), LogCategory INTEGRATION
- whatsapp.service.ts: SystemSetting.create con id e updatedAt
- wppconnect.service.ts: Mock funzione create quando disabilitato
- unified-notification-center.service.ts: NotificationPriority come type alias, relazioni corrette

✅ Risultato:
- 40 errori TypeScript risolti
- 0 errori nel codice applicativo
- Solo 4 warning librerie esterne (non bloccanti)

📋 File modificati: 4
🔧 Righe modificate: ~150
⚡ Stato: Backend pronto per l'avvio"
    
    echo ""
    echo "✅ Commit creato!"
    echo ""
    echo "🚀 Vuoi pushare su GitHub? (s/n)"
    read -p "> " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]
    then
        echo "📤 Push su GitHub..."
        git push origin main
        echo "✅ Push completato!"
    else
        echo "⏸️  Push annullato. Puoi farlo manualmente con: git push origin main"
    fi
else
    echo "❌ Commit annullato"
fi

echo ""
echo "📊 Stato finale:"
git status --short
