import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AiConfigPanel } from '../../components/admin/ai/AiConfigPanel';

export function AiConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Configurazione Sistema AI
            </h1>
          </div>
          
          <AiConfigPanel />
        </div>
      </div>
    </div>
  );
}
