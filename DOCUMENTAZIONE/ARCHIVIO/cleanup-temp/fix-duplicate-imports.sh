#!/bin/bash

echo "🔧 FIX IMPORT DUPLICATO IN ROUTES.TSX"
echo "====================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Rimuovo gli import duplicati:"

# Backup del file
cp src/routes.tsx src/routes.tsx.backup-$(date +%Y%m%d-%H%M%S)

# Rimuovi il vecchio import di ProfessionalLayout (riga 37)
sed -i '' '37d' src/routes.tsx

echo "✅ Rimosso vecchio import alla riga 37"

echo ""
echo "2. Verifica se ci sono altri import duplicati:"
grep -n "import.*Professional" src/routes.tsx | head -10

echo ""
echo "3. Aggiungo gli import corretti se mancano:"

cat > /tmp/fix-professional-imports.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes.tsx', 'utf8');

// Rimuovi tutti i vecchi import di Professional*
content = content.replace(/import ProfessionalLayout from '\.\/pages\/ProfessionalLayout';?\n?/g, '');

// Aggiungi gli import corretti solo se non esistono
if (!content.includes("from './pages/admin/professionals/ProfessionalLayout'")) {
  // Trova dove aggiungere (dopo gli altri import di pages)
  const importSection = `
// Professional Management Pages
import ProfessionalLayout from './pages/admin/professionals/ProfessionalLayout';
import ProfessionalCompetenze from './pages/admin/professionals/ProfessionalCompetenze';
import ProfessionalTariffe from './pages/admin/professionals/ProfessionalTariffe';
import ProfessionalAI from './pages/admin/professionals/ProfessionalAI';
import ProfessionalSkills from './pages/admin/professionals/ProfessionalSkills';
`;

  // Aggiungi dopo l'ultimo import from './pages
  content = content.replace(
    /(import.*from '\.\/pages[^']*';)/g,
    (match, p1, offset, string) => {
      // Controlla se questo è l'ultimo import from './pages
      const afterMatch = string.substring(offset + match.length);
      if (!afterMatch.match(/import.*from '\.\/pages/)) {
        return match + importSection;
      }
      return match;
    }
  );
}

// Aggiungi anche l'import di Navigate se manca
if (!content.includes('Navigate')) {
  content = content.replace(
    "import { Routes, Route",
    "import { Routes, Route, Navigate"
  );
}

fs.writeFileSync('src/routes.tsx', content);
console.log('✅ Import sistemati');
SCRIPT

node /tmp/fix-professional-imports.js
rm -f /tmp/fix-professional-imports.js

echo ""
echo "4. Verifica finale degli import:"
grep -n "ProfessionalLayout" src/routes.tsx | head -5

echo ""
echo "====================================="
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "Gli import duplicati sono stati rimossi"
