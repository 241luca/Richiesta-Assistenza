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
