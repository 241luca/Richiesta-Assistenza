#!/bin/bash

echo "🔍 DEBUG ROUTING PROFESSIONISTI"
echo "================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Verifica le route esistenti per professionals:"
grep -n "professionals" src/routes.tsx | head -20

echo ""
echo "2. Controlla se c'è un redirect che interferisce:"
grep -n "Navigate\|Redirect" src/routes.tsx | grep -i "dashboard" | head -10

echo ""
echo "3. Verifica l'ordine delle route (importante!):"
sed -n '/<Routes>/,/<\/Routes>/p' src/routes.tsx | grep -E "(path=|element=)" | head -30

echo ""
echo "4. Fix: Assicuriamoci che le route siano nell'ordine giusto:"

cat > /tmp/fix-routes-order.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes.tsx', 'utf8');

// Rimuovi eventuali route duplicate per professionals
content = content.replace(/\s*<Route path="\/admin\/professionals"[^>]*>.*?<\/Route>/gs, '');

// Trova dove inserire le route (dopo altre route admin ma prima di catch-all)
const routesSection = `
        {/* Professional Management */}
        <Route path="/admin/professionals" element={<ProfessionalsList />} />
        <Route path="/admin/professionals/:professionalId" element={<ProfessionalLayout />}>
          <Route index element={<Navigate to="competenze" replace />} />
          <Route path="competenze" element={<ProfessionalCompetenze />} />
          <Route path="tariffe" element={<ProfessionalTariffe />} />
          <Route path="ai" element={<ProfessionalAI />} />
          <Route path="skills" element={<ProfessionalSkills />} />
        </Route>`;

// Cerca un buon punto per inserire (dopo AdminLayout se esiste)
if (content.includes('</AdminLayout>')) {
  content = content.replace(
    /(<\/AdminLayout>\s*<\/Route>)/,
    '$1\n' + routesSection
  );
} else if (content.includes('path="/admin"')) {
  // Inserisci dopo la prima route admin
  content = content.replace(
    /(<Route path="\/admin".*?<\/Route>)/s,
    '$1\n' + routesSection
  );
} else {
  // Inserisci prima della chiusura di Routes
  content = content.replace(
    /(\s*<\/Routes>)/,
    routesSection + '$1'
  );
}

fs.writeFileSync('src/routes.tsx', content);
console.log('✅ Route riordinate');
SCRIPT

node /tmp/fix-routes-order.js
rm -f /tmp/fix-routes-order.js

echo ""
echo "5. Se ancora non funziona, creiamo un link diretto di test:"

cat > src/components/TestProfessionalLink.tsx << 'EOF'
import React from 'react';

export function TestProfessionalLink() {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <p className="text-sm mb-2">Test Links:</p>
      <div className="space-y-1">
        <a href="/admin/professionals" className="block underline hover:text-blue-200">
          → Lista Professionisti
        </a>
        <a href="/admin/professionals/1/competenze" className="block underline hover:text-blue-200">
          → Professional ID 1
        </a>
      </div>
    </div>
  );
}
EOF

echo "✅ Componente test creato"

echo ""
echo "================================"
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "Se ancora torna alla dashboard, probabilmente:"
echo "1. C'è un middleware che fa redirect"
echo "2. L'autenticazione non ha i permessi giusti"
echo "3. C'è un catch-all route che prende il controllo"
