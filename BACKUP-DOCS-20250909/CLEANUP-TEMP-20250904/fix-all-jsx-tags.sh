#!/bin/bash

echo "🔧 FIX COMPLETO TAG JSX NON BILANCIATI"
echo "======================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Mostra il contesto dell'errore (righe 290-300):"
sed -n '290,300p' src/pages/ProfessionalSkillsPage.tsx

echo ""
echo "2. Rimuovo il secondo </> problematico alla riga 296:"
sed -i '' '296s|</>||' src/pages/ProfessionalSkillsPage.tsx

echo "✅ Rimosso </> alla riga 296"

echo ""
echo "3. Verifica se ci sono altri </> orfani:"
grep -n "^[[:space:]]*</>$" src/pages/ProfessionalSkillsPage.tsx | head -10

echo ""
echo "4. Se ci sono ancora problemi, li rimuovo tutti:"
# Rimuovi tutti i </> che sono su una riga da soli con solo spazi prima
sed -i '' '/^[[:space:]]*<\/>$/d' src/pages/ProfessionalSkillsPage.tsx

echo "✅ Rimossi tutti i tag </> orfani"

echo ""
echo "5. Verifica finale del bilanciamento:"
echo "Fragment aperti <>: $(grep -o '<>' src/pages/ProfessionalSkillsPage.tsx | wc -l)"
echo "Fragment chiusi </>: $(grep -o '</>' src/pages/ProfessionalSkillsPage.tsx | wc -l)"

echo ""
echo "======================================"
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "I tag JSX dovrebbero ora essere bilanciati"
