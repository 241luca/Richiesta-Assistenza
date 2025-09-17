import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  Cog6ToothIcon,
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function SystemSettingsSimplePage() {
  console.log('🔍 SystemSettingsSimplePage rendered!');

  // Test React Query
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/system-settings'],
    queryFn: () => {
      console.log('🌐 Fetching settings data...');
      return apiClient.get('/admin/system-settings');
    },
    staleTime: 30 * 1000
  });

  console.log('🔍 Query state:', { isLoading, error, data: settingsData });

  const handleButtonClick = () => {
    console.log('🔥 Button clicked in SystemSettingsSimple!');
    alert('Button funziona nel componente semplificato!');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni di Sistema (Semplice)</h1>
        </div>
        <div className="bg-blue-100 p-4 rounded">
          <p>⏳ Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Query error:', error);
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 rounded p-4">
          <h2 className="text-red-800 font-bold">❌ Errore nel caricamento</h2>
          <p className="text-red-700">Error: {error.message}</p>
          <button 
            onClick={handleButtonClick}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            🧪 Test Button (dovrebbe funzionare)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni di Sistema (Semplice)</h1>
        </div>
        
        <Button
          onClick={handleButtonClick}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          🧪 Test Button
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800">✅ Componente Semplificato Funzionante</h3>
            <p className="text-sm text-green-700 mt-1">
              Questo componente usa gli stessi hook e servizi del componente originale.
            </p>
          </div>
        </div>
      </div>

      {/* Data Debug */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">🔍 Debug Dati</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Stato Query:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify({ isLoading, error: !!error }, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Dati Ricevuti:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-1 max-h-40 overflow-auto">
                {JSON.stringify(settingsData, null, 2)}
              </pre>
            </div>

            <button 
              onClick={handleButtonClick}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              🔥 Test Click Handler
            </button>
          </div>
        </div>
      </Card>

      {/* Test con dati reali */}
      {settingsData?.data && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">📊 Test con Dati Reali</h2>
            <p className="text-sm text-gray-600 mb-4">
              Se vedi questa sezione, significa che i dati sono arrivati correttamente.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settingsData.data).map(([category, settings]) => (
                <div key={category} className="border rounded p-3">
                  <h3 className="font-medium">{category}</h3>
                  <p className="text-sm text-gray-500">
                    {Array.isArray(settings) ? `${settings.length} impostazioni` : 'Dati non array'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
