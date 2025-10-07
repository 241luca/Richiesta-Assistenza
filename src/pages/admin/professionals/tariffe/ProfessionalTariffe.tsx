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
