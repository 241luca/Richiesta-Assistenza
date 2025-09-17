import React from 'react';
import { CogIcon, BellIcon, ShieldCheckIcon, PaintBrushIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni Sistema</h1>
        <p className="text-gray-600 mt-1">Configura le impostazioni generali della piattaforma</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <CogIcon className="h-24 w-24 text-gray-400 animate-spin-slow" />
            <ShieldCheckIcon className="h-12 w-12 text-blue-500 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pannello Impostazioni in Costruzione
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Il pannello completo di configurazione del sistema sarà presto disponibile. 
          Potrai gestire tutte le impostazioni della piattaforma da un'unica interfaccia centralizzata.
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <CogIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Generali</h3>
            <p className="text-sm text-gray-600">
              Nome piattaforma, logo, informazioni aziendali
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <BellIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Notifiche</h3>
            <p className="text-sm text-gray-600">
              Template email, SMS, configurazione canali
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Sicurezza</h3>
            <p className="text-sm text-gray-600">
              2FA, policy password, sessioni attive
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <PaintBrushIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Personalizzazione</h3>
            <p className="text-sm text-gray-600">
              Tema, colori, layout interfaccia
            </p>
          </div>
        </div>

        <div className="mt-8">
          <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <CogIcon className="h-4 w-4 mr-2" />
            In sviluppo
          </span>
        </div>
      </div>
    </div>
  );
}
