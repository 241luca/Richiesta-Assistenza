#!/bin/bash

echo "🔍 ANALISI STRUTTURA JSX COMPLETA"
echo "================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Mostra le ultime 20 righe del componente (280-300):"
sed -n '280,300p' src/pages/ProfessionalSkillsPage.tsx

echo ""
echo "2. Conta tutti i tag di apertura e chiusura:"
echo "Div aperti: $(grep -o '<div' src/pages/ProfessionalSkillsPage.tsx | wc -l)"
echo "Div chiusi: $(grep -o '</div>' src/pages/ProfessionalSkillsPage.tsx | wc -l)"

echo ""
echo "3. Mostra il return statement del componente (cerca 'return'):"
grep -n "return (" src/pages/ProfessionalSkillsPage.tsx | head -1

echo ""
echo "4. Ripristino dal backup più recente se esiste:"
LATEST_BACKUP=$(ls -t src/pages/ProfessionalSkillsPage.tsx.backup-* 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
  echo "Trovato backup: $LATEST_BACKUP"
  cp "$LATEST_BACKUP" src/pages/ProfessionalSkillsPage.tsx
  echo "✅ File ripristinato dal backup"
  
  echo ""
  echo "5. Ora commento correttamente TravelCostDisplay:"
  # Trova la riga con TravelCostDisplay e commentala correttamente
  sed -i '' '/<TravelCostDisplay/,/\/>/s/^/\/\/ /' src/pages/ProfessionalSkillsPage.tsx
  echo "✅ TravelCostDisplay commentato correttamente"
else
  echo "❌ Nessun backup trovato"
  echo ""
  echo "5. Aggiungo i tag di chiusura mancanti alla fine:"
  # Aggiungi tag di chiusura prima della parentesi di chiusura
  sed -i '' '298s|</div>|</div></div>|' src/pages/ProfessionalSkillsPage.tsx
  echo "✅ Aggiunto tag di chiusura"
fi

echo ""
echo "================================="
echo "RIAVVIA IL FRONTEND!"
