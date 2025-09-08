#!/bin/bash

echo "🔧 DISABILITA TEMPORANEAMENTE TRAVEL COST"
echo "========================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Commenta TravelCostDisplay nel frontend:"

# Trova il file che usa TravelCostDisplay
if [ -f "src/pages/admin/professionals/ProfessionalSkillsPage.tsx" ]; then
  echo "Trovato ProfessionalSkillsPage.tsx"
  
  # Backup
  cp src/pages/admin/professionals/ProfessionalSkillsPage.tsx src/pages/admin/professionals/ProfessionalSkillsPage.tsx.backup-$(date +%Y%m%d-%H%M%S)
  
  # Commenta il componente problematico
  sed -i '' 's|<TravelCostDisplay|{/* <TravelCostDisplay|g' src/pages/admin/professionals/ProfessionalSkillsPage.tsx
  sed -i '' 's|/>|/> */}|g' src/pages/admin/professionals/ProfessionalSkillsPage.tsx
  
  echo "✅ TravelCostDisplay commentato"
else
  echo "File non trovato, cerco in altre posizioni..."
  find src -name "*.tsx" -exec grep -l "TravelCostDisplay" {} \; | while read file; do
    echo "Trovato in: $file"
    cp "$file" "$file.backup-$(date +%Y%m%d-%H%M%S)"
    sed -i '' 's|<TravelCostDisplay|{/* TEMPORANEAMENTE DISABILITATO <TravelCostDisplay|g' "$file"
    sed -i '' 's|professionalId={professionalId} />|professionalId={professionalId} /> */}|g' "$file"
  done
fi

echo ""
echo "2. Alternativa - Crea componente mock:"
cat > src/components/admin/professionals/TravelCostDisplay-mock.tsx << 'MOCK'
import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function TravelCostDisplay({ professionalId }: { professionalId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Costi di Trasferta</h3>
      </div>
      <div className="text-gray-500 text-center py-8">
        <p>Sistema tariffe temporaneamente non disponibile</p>
        <p className="text-sm mt-2">Funzionalità in manutenzione</p>
      </div>
    </div>
  );
}
MOCK

echo "✅ Componente mock creato"

echo ""
echo "========================================"
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "Il componente problematico è stato disabilitato."
echo "La pagina dovrebbe ora caricarsi senza timeout."
echo ""
echo "Per riabilitarlo in futuro, rimuovi i commenti {/* */}"
