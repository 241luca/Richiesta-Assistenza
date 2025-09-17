import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export function AiManagementLink() {
  return (
    <a
      href="/admin/ai"
      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors"
    >
      <SparklesIcon className="h-5 w-5 text-purple-600" />
      <span className="font-medium text-gray-700">Gestione AI</span>
      <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
        Attivo
      </span>
    </a>
  );
}
