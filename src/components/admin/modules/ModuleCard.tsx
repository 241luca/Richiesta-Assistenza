import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '../../../services/modules.api';
import { SystemModule } from '../../../types/modules.types';

interface ModuleCardProps {
  module: SystemModule;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        return await modulesApi.enable(module.code, reason || undefined);
      } else {
        return await modulesApi.disable(module.code, reason || undefined);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setShowConfirm(false);
      setReason('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Errore durante operazione');
    }
  });

  const handleToggleClick = () => {
    if (module.isCore) {
      alert('I moduli CORE non possono essere disabilitati');
      return;
    }

    if (module.isEnabled && module.requiredFor && module.requiredFor.length > 0) {
      alert(`Impossibile disabilitare. Richiesto da: ${module.requiredFor.join(', ')}`);
      return;
    }

    setShowConfirm(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow"
        style={{ borderColor: module.color }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-4xl">{module.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {module.name}
                </h3>
                {module.isCore && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    CORE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{module.description}</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleClick}
            disabled={module.isCore || toggleMutation.isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              module.isEnabled ? 'bg-green-600' : 'bg-gray-300'
            } ${
              module.isCore || toggleMutation.isPending
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                module.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Categoria</p>
            <p className="font-semibold text-gray-900">{module.category}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Settings</p>
            <p className="font-semibold text-gray-900">
              {module._count?.settings || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Stato</p>
            <p className={`font-semibold ${module.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {module.isEnabled ? 'Attivo' : 'Disattivo'}
            </p>
          </div>
        </div>

        {/* Dipendenze */}
        {module.dependsOn && module.dependsOn.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 mb-1 font-semibold">Dipende da:</p>
            <div className="flex flex-wrap gap-1">
              {module.dependsOn.map((dep) => (
                <span
                  key={dep}
                  className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modale Conferma */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {module.isEnabled ? 'Disabilita' : 'Abilita'} {module.name}
            </h3>

            <p className="text-gray-600 mb-4">
              {module.isEnabled
                ? 'Gli utenti non potranno più utilizzare questa funzionalità.'
                : 'La funzionalità sarà disponibile per tutti gli utenti.'}
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivazione (opzionale)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={toggleMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={() => toggleMutation.mutate(!module.isEnabled)}
                disabled={toggleMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  module.isEnabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {toggleMutation.isPending ? 'Attendere...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};