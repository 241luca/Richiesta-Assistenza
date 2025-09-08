#!/bin/bash

echo "🚀 CREIAMO LA STRUTTURA PER 4 PAGINE SEPARATE"
echo "=============================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Creo le directory per i nuovi componenti:"
mkdir -p src/pages/admin/professionals/{competenze,tariffe,ai-settings,skills}

echo ""
echo "2. Creo il componente base per Competenze:"
cat > src/pages/admin/professionals/competenze/ProfessionalCompetenze.tsx << 'COMPONENT'
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  AcademicCapIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../../services/api';

export default function ProfessionalCompetenze() {
  const { professionalId } = useParams();

  const { data: competenze, isLoading } = useQuery({
    queryKey: ['professional-competenze', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/user/subcategories/${professionalId}`);
      return response.data.data;
    }
  });

  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/professionals/${professionalId}`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Competenze Professionali
            </h1>
            <p className="text-gray-600">
              {professional?.firstName} {professional?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Lista Competenze */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Sottocategorie Associate</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Competenza
          </button>
        </div>

        {competenze?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nessuna competenza associata
          </div>
        ) : (
          <div className="grid gap-4">
            {competenze?.map((comp: any) => (
              <div key={comp.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{comp.Subcategory?.name}</h3>
                  <p className="text-sm text-gray-600">{comp.Subcategory?.category?.name}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Livello: {comp.experienceLevel || 'Base'}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {comp.isActive ? 'Attiva' : 'Inattiva'}
                    </span>
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-800">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
COMPONENT

echo "✅ ProfessionalCompetenze.tsx creato"

echo ""
echo "3. Creo il componente per Tariffe:"
cat > src/pages/admin/professionals/tariffe/ProfessionalTariffe.tsx << 'COMPONENT'
import React from 'react';
import { useParams } from 'react-router-dom';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';

export default function ProfessionalTariffe() {
  const { professionalId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <CurrencyEuroIcon className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            Tariffe e Costi
          </h1>
        </div>
        
        <div className="space-y-6">
          {/* Tariffa oraria */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tariffa Oraria Base
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="50.00"
            />
          </div>

          {/* Costo trasferta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Costo Trasferta (€/km)
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="0.50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
COMPONENT

echo "✅ ProfessionalTariffe.tsx creato"

echo ""
echo "4. Creo il layout wrapper con navigazione:"
cat > src/pages/admin/professionals/ProfessionalLayout.tsx << 'COMPONENT'
import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { 
  AcademicCapIcon,
  CurrencyEuroIcon,
  CpuChipIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function ProfessionalLayout() {
  const { professionalId } = useParams();

  const navigation = [
    { name: 'Competenze', href: `/admin/professionals/${professionalId}/competenze`, icon: AcademicCapIcon },
    { name: 'Tariffe', href: `/admin/professionals/${professionalId}/tariffe`, icon: CurrencyEuroIcon },
    { name: 'AI Settings', href: `/admin/professionals/${professionalId}/ai-settings`, icon: CpuChipIcon },
    { name: 'Skills', href: `/admin/professionals/${professionalId}/skills`, icon: SparklesIcon },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm">
        <nav className="mt-5 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}
COMPONENT

echo "✅ ProfessionalLayout.tsx creato"

echo ""
echo "=============================================="
echo "STRUTTURA CREATA!"
echo ""
echo "Ora devi:"
echo "1. Aggiornare il routing in App.tsx per usare il nuovo layout"
echo "2. Aggiungere le route per le 4 sezioni"
echo "3. Rimuovere la vecchia pagina unificata"
echo ""
echo "Vuoi che proceda con l'integrazione?"
