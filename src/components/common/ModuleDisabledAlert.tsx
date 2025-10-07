import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ModuleDisabledAlertProps {
  moduleName: string;
  message?: string;
}

export const ModuleDisabledAlert: React.FC<ModuleDisabledAlertProps> = ({
  moduleName,
  message
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <XCircleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Funzionalità Non Disponibile
        </h2>
        <p className="text-gray-700 mb-4">
          {message || `La funzionalità ${moduleName} non è attualmente attiva.`}
        </p>
        <p className="text-sm text-gray-600">
          Contatta l'amministratore del sistema per maggiori informazioni.
        </p>
      </div>
    </div>
  );
};