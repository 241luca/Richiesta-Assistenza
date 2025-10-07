import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { modulesApi } from '../../../services/modules.api';

export const ModulesStatusWidget: React.FC = () => {
  const { data: modules } = useQuery({
    queryKey: ['admin', 'modules', 'summary'],
    queryFn: async () => {
      const response = await modulesApi.getAll();
      return response.data.data;
    }
  });

  const critical = modules?.filter((m: any) => 
    !m.isEnabled && m.category === 'CORE'
  );
  
  const disabled = modules?.filter((m: any) => !m.isEnabled);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🔧 Stato Moduli
        </h3>
        <Link
          to="/admin/modules"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Gestisci →
        </Link>
      </div>

      {critical && critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold mb-2">
            ⚠️ Attenzione: {critical.length} moduli critici disabilitati
          </p>
          <ul className="text-sm text-red-700 space-y-1">
            {critical.map((m: any) => (
              <li key={m.code}>• {m.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">
            {modules?.filter((m: any) => m.isEnabled).length || 0}
          </p>
          <p className="text-sm text-gray-600">Attivi</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-3xl font-bold text-red-600">
            {disabled?.length || 0}
          </p>
          <p className="text-sm text-gray-600">Disattivi</p>
        </div>
      </div>

      {disabled && disabled.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Moduli disattivi:</p>
          <div className="flex flex-wrap gap-2">
            {disabled.slice(0, 5).map((m: any) => (
              <span
                key={m.code}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {m.name}
              </span>
            ))}
            {disabled.length > 5 && (
              <span className="text-xs text-gray-500">
                +{disabled.length - 5} altri
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};