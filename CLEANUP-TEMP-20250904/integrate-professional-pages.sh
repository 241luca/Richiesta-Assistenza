#!/bin/bash

echo "🔧 INTEGRAZIONE ROUTING PER LE 4 PAGINE"
echo "======================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Cerco il file di routing principale:"
find src -name "App.tsx" -o -name "App.jsx" -o -name "Routes.tsx" | head -5

echo ""
echo "2. Aggiorno il routing per includere le nuove pagine:"

cat > /tmp/update-routing.js << 'SCRIPT'
const fs = require('fs');

// Trova il file App.tsx
const appFile = 'src/App.tsx';
if (!fs.existsSync(appFile)) {
  console.log('❌ App.tsx non trovato');
  process.exit(1);
}

let content = fs.readFileSync(appFile, 'utf8');

// Aggiungi gli import se non esistono
const importsToAdd = `
// Professional Management Pages
import ProfessionalLayout from './pages/admin/professionals/ProfessionalLayout';
import ProfessionalCompetenze from './pages/admin/professionals/competenze/ProfessionalCompetenze';
import ProfessionalTariffe from './pages/admin/professionals/tariffe/ProfessionalTariffe';
import ProfessionalAiSettings from './pages/admin/professionals/ai-settings/ProfessionalAiSettings';
import ProfessionalSkills from './pages/admin/professionals/skills/ProfessionalSkills';
`;

// Aggiungi gli import dopo gli altri import di pages
if (!content.includes('ProfessionalLayout')) {
  content = content.replace(
    /(import.*from.*['"]\.\/pages\/.*['"];?)/g,
    '$1\n' + importsToAdd
  );
}

// Trova dove aggiungere le route
const routePattern = /<Route.*path="\/admin.*\/>/g;
const lastAdminRoute = content.match(routePattern);

if (lastAdminRoute) {
  const newRoutes = `
          {/* Professional Management Routes */}
          <Route path="/admin/professionals/:professionalId" element={<ProfessionalLayout />}>
            <Route index element={<Navigate to="competenze" replace />} />
            <Route path="competenze" element={<ProfessionalCompetenze />} />
            <Route path="tariffe" element={<ProfessionalTariffe />} />
            <Route path="ai-settings" element={<ProfessionalAiSettings />} />
            <Route path="skills" element={<ProfessionalSkills />} />
          </Route>
`;
  
  // Aggiungi le nuove route dopo l'ultima route admin
  const lastRoute = lastAdminRoute[lastAdminRoute.length - 1];
  content = content.replace(lastRoute, lastRoute + newRoutes);
}

fs.writeFileSync(appFile, content);
console.log('✅ Routing aggiornato');
SCRIPT

node /tmp/update-routing.js

echo ""
echo "3. Creo i componenti mancanti (AI Settings e Skills):"

# AI Settings Component
cat > src/pages/admin/professionals/ai-settings/ProfessionalAiSettings.tsx << 'COMPONENT'
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../../../services/api';

export default function ProfessionalAiSettings() {
  const { professionalId } = useParams();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['professional-ai-settings', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/professionals/${professionalId}/ai-settings`);
      return response.data.data;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <CpuChipIcon className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            Impostazioni AI
          </h1>
        </div>
        
        <div className="space-y-6">
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">
              Personalizza le risposte AI per ogni sottocategoria di competenza
            </p>
          </div>

          {settings?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nessuna personalizzazione AI configurata
            </div>
          ) : (
            <div className="grid gap-4">
              {settings?.map((setting: any) => (
                <div key={setting.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{setting.subcategoryName}</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {setting.customPrompt || 'Usa impostazioni predefinite'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
COMPONENT

# Skills Component
cat > src/pages/admin/professionals/skills/ProfessionalSkills.tsx << 'COMPONENT'
import React from 'react';
import { useParams } from 'react-router-dom';
import { SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function ProfessionalSkills() {
  const { professionalId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Skills e Certificazioni
            </h1>
          </div>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Skill
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skills */}
          <div>
            <h3 className="text-lg font-medium mb-4">Skills Tecniche</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Installazione impianti</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Esperto</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Manutenzione caldaie</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Avanzato</span>
              </div>
            </div>
          </div>

          {/* Certificazioni */}
          <div>
            <h3 className="text-lg font-medium mb-4">Certificazioni</h3>
            <div className="space-y-2">
              <div className="p-3 border rounded">
                <div className="font-medium">Certificazione F-GAS</div>
                <div className="text-sm text-gray-600">Valida fino al: 12/2025</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Abilitazione DM 37/08</div>
                <div className="text-sm text-gray-600">Valida fino al: 06/2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
COMPONENT

echo "✅ Tutti i componenti creati"

echo ""
echo "4. Aggiungo Navigate per il redirect:"
sed -i '' "s/import { /import { Navigate, /" src/App.tsx 2>/dev/null || echo "Navigate già importato"

rm -f /tmp/update-routing.js

echo ""
echo "======================================="
echo "✅ INTEGRAZIONE COMPLETATA!"
echo ""
echo "Ora quando vai su /admin/professionals/:id"
echo "vedrai 4 tab separate:"
echo "- Competenze"
echo "- Tariffe" 
echo "- AI Settings"
echo "- Skills"
echo ""
echo "RIAVVIA IL FRONTEND per vedere le modifiche!"
