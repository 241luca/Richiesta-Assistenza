#!/bin/bash

echo "🔍 VERIFICA FINALE E PULIZIA"
echo "============================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Verifica che tutte le pagine siano state create:"
echo "----------------------------------------"
for page in Competenze Tariffe AI Skills Layout; do
  if [ -f "src/pages/admin/professionals/Professional${page}.tsx" ]; then
    echo "✅ Professional${page}.tsx"
  else
    echo "❌ Professional${page}.tsx MANCANTE"
  fi
done

echo ""
echo "2. Rimuovo il vecchio ProfessionalSkillsPage problematico:"
echo "----------------------------------------"
if [ -f "src/pages/ProfessionalSkillsPage.tsx" ]; then
  mv src/pages/ProfessionalSkillsPage.tsx src/pages/ProfessionalSkillsPage.tsx.old-$(date +%Y%m%d-%H%M%S)
  echo "✅ Vecchio file rinominato come backup"
fi

echo ""
echo "3. Aggiorno eventuali riferimenti al vecchio file:"
echo "----------------------------------------"
# Cerca e sostituisci riferimenti al vecchio ProfessionalSkillsPage
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "ProfessionalSkillsPage" 2>/dev/null | while read file; do
  echo "Aggiorno: $file"
  sed -i '' 's|ProfessionalSkillsPage|ProfessionalLayout|g' "$file"
  sed -i '' 's|professional-skills|professionals/:professionalId|g' "$file"
done

echo ""
echo "4. Creo un link diretto nella lista professionisti:"
echo "----------------------------------------"

cat > src/components/admin/ProfessionalsListLink.tsx << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  CogIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

export function ProfessionalCard({ professional }: { professional: any }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserIcon className="h-10 w-10 text-gray-400 mr-4" />
          <div>
            <h3 className="text-lg font-semibold">
              {professional.firstName} {professional.lastName}
            </h3>
            <p className="text-sm text-gray-600">{professional.email}</p>
            <p className="text-sm text-gray-500">{professional.profession || 'Professionista'}</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/admin/professionals/${professional.id}/competenze`)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CogIcon className="h-5 w-5 mr-2" />
          Gestisci
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
EOF

echo "✅ Componente per link diretto creato"

echo ""
echo "5. Summary finale:"
echo "----------------------------------------"
echo "✅ Struttura creata:"
echo "   - 4 pagine separate (Competenze, Tariffe, AI, Skills)"
echo "   - Layout con menu laterale"
echo "   - Navigazione tra le sezioni"
echo ""
echo "📍 URL per accedere:"
echo "   /admin/professionals/:id/competenze"
echo "   /admin/professionals/:id/tariffe"
echo "   /admin/professionals/:id/ai"
echo "   /admin/professionals/:id/skills"
echo ""
echo "============================"
echo "RIAVVIA IL FRONTEND!"
echo ""
echo "La nuova struttura a 4 pagine con menu laterale"
echo "è pronta e molto più usabile!"
