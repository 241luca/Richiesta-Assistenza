import React from 'react';
import { UserGroupIcon, UserPlusIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function UsersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
        <p className="text-gray-600 mt-1">Gestisci tutti gli utenti registrati sulla piattaforma</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <UserGroupIcon className="h-24 w-24 text-gray-400" />
            <ShieldCheckIcon className="h-12 w-12 text-green-500 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Gestione Utenti in Sviluppo
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Il pannello completo di gestione utenti sarà presto disponibile. 
          Potrai visualizzare, modificare e gestire tutti gli utenti della piattaforma.
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Lista Utenti</h3>
            <p className="text-sm text-gray-600">
              Visualizza e filtra tutti gli utenti registrati
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <UserPlusIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Aggiungi Utenti</h3>
            <p className="text-sm text-gray-600">
              Crea nuovi account e invita utenti via email
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <ChartBarIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Statistiche</h3>
            <p className="text-sm text-gray-600">
              Analytics dettagliate su attività e engagement
            </p>
          </div>
        </div>

        <div className="mt-8">
          <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Disponibile a breve
          </span>
        </div>
      </div>
    </div>
  );
}
