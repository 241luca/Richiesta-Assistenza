import React from 'react';
import { 
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  LanguageIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni Sistema</h1>
        <p className="mt-2 text-gray-600">
          Gestisci le impostazioni generali del sistema
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Impostazioni Account</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Modifica password</p>
            <p>• Autenticazione a due fattori</p>
            <p>• Email di recupero</p>
            <p>• Sessioni attive</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Gestisci Account
          </button>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold">Notifiche</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Email di notifica</p>
            <p>• Notifiche push</p>
            <p>• SMS</p>
            <p>• Preferenze orarie</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Configura Notifiche
          </button>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold">Privacy e Sicurezza</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Visibilità profilo</p>
            <p>• Condivisione dati</p>
            <p>• Cronologia accessi</p>
            <p>• Backup dati</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Gestisci Privacy
          </button>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <PaintBrushIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold">Aspetto</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Tema chiaro/scuro</p>
            <p>• Dimensione testo</p>
            <p>• Colori accent</p>
            <p>• Layout compatto</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Personalizza Aspetto
          </button>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <LanguageIcon className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold">Lingua e Regione</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Lingua: Italiano</p>
            <p>• Fuso orario: Europa/Roma</p>
            <p>• Formato data: DD/MM/YYYY</p>
            <p>• Valuta: EUR (€)</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Cambia Lingua
          </button>
        </div>

        {/* Legal Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold">Termini e Condizioni</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Termini di servizio</p>
            <p>• Privacy policy</p>
            <p>• Cookie policy</p>
            <p>• GDPR compliance</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Visualizza Documenti
          </button>
        </div>
      </div>
    </div>
  );
}
