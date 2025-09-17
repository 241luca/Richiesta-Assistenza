#!/bin/bash

echo "🔧 FIX ERRORE JSX IN ProfessionalSkillsPage"
echo "=========================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Cerco il file con l'errore:"
find src -name "ProfessionalSkillsPage.tsx" | head -1

echo ""
echo "2. Verifica le righe intorno all'errore (265-270):"
sed -n '265,270p' src/pages/ProfessionalSkillsPage.tsx

echo ""
echo "3. Conta i tag di apertura e chiusura nel file:"
echo "Tag <div> aperti: $(grep -o '<div' src/pages/ProfessionalSkillsPage.tsx | wc -l)"
echo "Tag </div> chiusi: $(grep -o '</div>' src/pages/ProfessionalSkillsPage.tsx | wc -l)"

echo ""
echo "4. Cerco il problema intorno alla riga 268:"
sed -n '260,275p' src/pages/ProfessionalSkillsPage.tsx

echo ""
echo "5. Probabile fix - rimuovo il </> extra alla riga 268:"
# Backup
cp src/pages/ProfessionalSkillsPage.tsx src/pages/ProfessionalSkillsPage.tsx.backup-jsx-$(date +%Y%m%d-%H%M%S)

# Rimuovi il </> problematico alla riga 268
sed -i '' '268s|</>||' src/pages/ProfessionalSkillsPage.tsx

echo "✅ Rimosso </> extra alla riga 268"

echo ""
echo "=========================================="
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "Se l'errore persiste, potrebbe esserci"
echo "un altro tag non bilanciato nel file"
