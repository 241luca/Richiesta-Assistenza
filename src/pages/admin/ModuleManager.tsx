import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '../../services/modules.api';
import { ModuleCard } from '../../components/admin/modules/ModuleCard';
import { SystemModule } from '../../types/modules.types';

const CATEGORIES = {
  CORE: { name: 'Core', color: '#EF4444' },
  BUSINESS: { name: 'Business', color: '#10B981' },
  COMMUNICATION: { name: 'Comunicazione', color: '#3B82F6' },
  ADVANCED: { name: 'Avanzate', color: '#8B5CF6' },
  AUTOMATION: { name: 'Automazione', color: '#F59E0B' },
  INTEGRATIONS: { name: 'Integrazioni', color: '#06B6D4' },
  REPORTING: { name: 'Reportistica', color: '#EC4899' },
  ADMIN: { name: 'Amministrazione', color: '#6366F1' }
};

export const ModuleManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: async () => {
      const response = await modulesApi.getAll();
      return response.data.data as SystemModule[];
    }
  });

  // Raggruppa per categoria
  const modulesByCategory = modules?.reduce((acc: any, module: SystemModule) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {}) || {};

  // Statistiche
  const stats = {
    total: modules?.length || 0,
    enabled: modules?.filter((m) => m.isEnabled).length || 0,
    disabled: modules?.filter((m) => !m.isEnabled).length || 0,
    core: modules?.filter((m) => m.isCore).length || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento moduli...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Errore Caricamento</h2>
          <p className="text-red-700">Impossibile caricare i moduli del sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 Gestione Moduli Sistema
        </h1>
        <p className="text-gray-600">
          Abilita o disabilita le funzionalità del sistema
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-700 text-sm mb-1">Totali</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-700 text-sm mb-1">Attivi</p>
          <p className="text-3xl font-bold text-green-900">{stats.enabled}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-700 text-sm mb-1">Disattivi</p>
          <p className="text-3xl font-bold text-red-900">{stats.disabled}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-700 text-sm mb-1">Core</p>
          <p className="text-3xl font-bold text-purple-900">{stats.core}</p>
        </div>
      </div>

      {/* Filtro Categorie */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-semibold ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutte ({stats.total})
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedCategory === key
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategory === key ? cat.color : undefined
            }}
          >
            {cat.name} ({modulesByCategory[key]?.length || 0})
          </button>
        ))}
      </div>

      {/* Lista Moduli */}
      {Object.entries(modulesByCategory)
        .filter(([category]) => !selectedCategory || category === selectedCategory)
        .map(([category, categoryModules]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span
                className="w-1 h-6 rounded"
                style={{ backgroundColor: CATEGORIES[category as keyof typeof CATEGORIES].color }}
              />
              {CATEGORIES[category as keyof typeof CATEGORIES].name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(categoryModules as SystemModule[]).map((module) => (
                <ModuleCard key={module.code} module={module} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};