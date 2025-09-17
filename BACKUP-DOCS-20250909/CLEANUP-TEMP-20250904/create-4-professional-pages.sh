#!/bin/bash

echo "🚀 CREAZIONE 4 PAGINE SEPARATE PER PROFESSIONISTI"
echo "================================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Ripristino ProfessionalSkillsPage originale (senza modifiche errate):"
BACKUP=$(ls -t src/pages/ProfessionalSkillsPage.tsx.backup-* 2>/dev/null | head -1)
if [ -n "$BACKUP" ]; then
  cp "$BACKUP" src/pages/ProfessionalSkillsPage.tsx
  echo "✅ Ripristinato da: $BACKUP"
fi

echo ""
echo "2. Creo la struttura delle 4 pagine separate:"

# 1. PAGINA COMPETENZE
cat > src/pages/admin/professionals/ProfessionalCompetenze.tsx << 'EOF'
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AcademicCapIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/api';

export default function ProfessionalCompetenze() {
  const { professionalId } = useParams();
  
  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/professionals/${professionalId}`);
      return response.data.data;
    }
  });

  const { data: subcategories } = useQuery({
    queryKey: ['professional-subcategories', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/user/subcategories/${professionalId}`);
      return response.data.data;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Competenze Professionali</h1>
              <p className="text-gray-600">{professional?.firstName} {professional?.lastName}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Competenza
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          {subcategories?.map((item: any) => (
            <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{item.Subcategory?.name}</h3>
                <p className="text-sm text-gray-600">{item.Subcategory?.category?.name}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Livello: {item.experienceLevel || 'Base'}
                  </span>
                  {item.isActive && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Attiva
                    </span>
                  )}
                </div>
              </div>
              <button className="text-red-600 hover:text-red-800">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          {(!subcategories || subcategories.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              Nessuna competenza configurata
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ ProfessionalCompetenze.tsx creato"

# 2. PAGINA TARIFFE
cat > src/pages/admin/professionals/ProfessionalTariffe.tsx << 'EOF'
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CurrencyEuroIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function ProfessionalTariffe() {
  const { professionalId } = useParams();
  const [tariffaOraria, setTariffaOraria] = useState('50.00');
  const [costoKm, setCostoKm] = useState('0.50');
  const [kmGratuiti, setKmGratuiti] = useState('10');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <CurrencyEuroIcon className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold">Tariffe e Costi</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tariffe Base */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tariffe Base</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tariffa Oraria (€/ora)
              </label>
              <input
                type="number"
                step="0.01"
                value={tariffaOraria}
                onChange={(e) => setTariffaOraria(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tariffa Minima Intervento (€)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="30.00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Costi Trasferta */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            Costi Trasferta
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Costo per Km (€/km)
              </label>
              <input
                type="number"
                step="0.01"
                value={costoKm}
                onChange={(e) => setCostoKm(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Km Gratuiti
              </label>
              <input
                type="number"
                value={kmGratuiti}
                onChange={(e) => setKmGratuiti(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Salva Tariffe
        </button>
      </div>
    </div>
  );
}
EOF

echo "✅ ProfessionalTariffe.tsx creato"

# 3. PAGINA AI SETTINGS
cat > src/pages/admin/professionals/ProfessionalAI.tsx << 'EOF'
import React from 'react';
import { useParams } from 'react-router-dom';
import { CpuChipIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ProfessionalAI() {
  const { professionalId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <CpuChipIcon className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-2xl font-bold">Impostazioni AI</h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 mb-6">
          <p className="text-sm text-yellow-700">
            Personalizza le risposte dell'assistente AI per ogni sottocategoria di competenza
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Modello AI</h3>
            <select className="w-full rounded-md border-gray-300">
              <option>GPT-3.5 Turbo (Veloce ed economico)</option>
              <option>GPT-4 (Più accurato)</option>
            </select>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Stile Risposte</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input type="radio" name="style" className="mr-2" defaultChecked />
                <span>Formale</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="style" className="mr-2" />
                <span>Informale</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="style" className="mr-2" />
                <span>Tecnico</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="style" className="mr-2" />
                <span>Educativo</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Knowledge Base Personale
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-3">
                Carica documenti per personalizzare le risposte AI
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Carica Documenti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ ProfessionalAI.tsx creato"

# 4. PAGINA SKILLS & CERTIFICAZIONI
cat > src/pages/admin/professionals/ProfessionalSkills.tsx << 'EOF'
import React from 'react';
import { useParams } from 'react-router-dom';
import { SparklesIcon, DocumentCheckIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function ProfessionalSkills() {
  const { professionalId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold">Skills e Certificazioni</h1>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Skills Tecniche</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Installazione impianti</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Esperto</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Manutenzione caldaie</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Avanzato</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Riparazione guasti</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Esperto</span>
            </div>
          </div>
        </div>

        {/* Certificazioni */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <DocumentCheckIcon className="h-5 w-5 mr-2" />
            Certificazioni
          </h2>
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <div className="font-medium">Certificazione F-GAS</div>
              <div className="text-sm text-gray-600">Valida fino al: 12/2025</div>
              <div className="text-xs text-green-600 mt-1">✓ Verificata</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-medium">Abilitazione DM 37/08</div>
              <div className="text-sm text-gray-600">Valida fino al: 06/2026</div>
              <div className="text-xs text-green-600 mt-1">✓ Verificata</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ ProfessionalSkills.tsx creato"

echo ""
echo "================================================"
echo "✅ 4 PAGINE CREATE CON SUCCESSO!"
echo ""
echo "Ora devi aggiornare il routing per navigare tra queste pagine."
echo "Vuoi che aggiunga anche la navigazione?"
