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
