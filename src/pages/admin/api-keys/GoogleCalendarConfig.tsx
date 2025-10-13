import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  CalendarIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

export default function GoogleCalendarConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    apiKey: ''
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Verifica configurazione esistente
  const { data: configStatus, isLoading } = useQuery({
    queryKey: ['google-calendar-config'],
    queryFn: async () => {
      try {
        // Prima verifica lo stato della configurazione
        const response = await api.get('/calendar/google/check-config');
        const status = response.data?.data;

        // Se configurato, prova a ottenere le credenziali mascherate
        if (status?.configured) {
          // Cerca nelle API Keys esistenti
          const keysResponse = await api.get('/apikeys');
          const keys = keysResponse.data?.data || [];
          const googleCalendarKey = keys.find((k: any) => k.service === 'google_calendar');
          
          if (googleCalendarKey) {
            try {
              // Le credenziali potrebbero essere in formato JSON
              const credentials = JSON.parse(googleCalendarKey.key);
              return {
                configured: true,
                hasCredentials: true,
                maskedClientId: credentials.clientId ? `${credentials.clientId.substring(0, 10)}...` : null
              };
            } catch {
              return {
                configured: true,
                hasCredentials: true,
                maskedClientId: 'Configurato'
              };
            }
          }
        }

        return status;
      } catch (error) {
        console.error('Error checking config:', error);
        return { configured: false };
      }
    }
  });

  // Mutation per salvare le credenziali
  const saveCredentialsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await api.post('/calendar/google/configure', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-config'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] }); // Refresh health status
      toast.success('Credenziali Google Calendar salvate con successo!');
      setFormData({ clientId: '', clientSecret: '', apiKey: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvare le credenziali');
    }
  });

  // Mutation per eliminare la configurazione
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      return await api.delete('/calendar/google/configure');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-config'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] }); // Refresh health status
      toast.success('Configurazione Google Calendar eliminata con successo!');
      setFormData({ clientId: '', clientSecret: '', apiKey: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminare la configurazione');
    }
  });

  // Test connessione
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await api.get('/calendar/google/check-config');
      const status = response.data?.data;
      
      if (status?.configured) {
        toast.success('✅ Google Calendar è configurato correttamente!');
      } else {
        toast.error('❌ Google Calendar non è configurato');
      }
    } catch (error) {
      toast.error('Errore nel test di connessione');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare la configurazione Google Calendar? Questa azione non può essere annullata.')) {
      deleteConfigMutation.mutate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.clientSecret) {
      toast.error('Client ID e Client Secret sono obbligatori');
      return;
    }

    saveCredentialsMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti!');
  };

  const callbackUrl = `${window.location.origin.replace('5193', '3200')}/api/calendar/google/callback`;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Google Calendar</h2>
              <p className="text-gray-600 mt-1">Configurazione OAuth 2.0 per sincronizzazione calendario</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {configStatus?.configured ? (
              <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Configurato
              </span>
            ) : (
              <span className="flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                Non configurato
              </span>
            )}
          </div>
        </div>

        {/* Test Connection Button */}
        {configStatus?.configured && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
              Test Connessione
            </button>
          </div>
        )}
      </div>

      {/* Istruzioni */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <InformationCircleIcon className="h-6 w-6 mr-2" />
          Come ottenere le credenziali OAuth 2.0
        </h3>
        
        <ol className="space-y-3 text-sm text-blue-800">
          <li className="flex">
            <span className="font-semibold mr-2">1.</span>
            <div>
              Vai su 
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 font-medium text-blue-600 hover:text-blue-700 underline inline-flex items-center"
              >
                Google Cloud Console
                <LinkIcon className="h-3 w-3 ml-1" />
              </a>
            </div>
          </li>
          
          <li className="flex">
            <span className="font-semibold mr-2">2.</span>
            <span>Crea un nuovo progetto o seleziona uno esistente</span>
          </li>
          
          <li className="flex">
            <span className="font-semibold mr-2">3.</span>
            <div>
              <span>Abilita l'API:</span>
              <ul className="ml-4 mt-1 list-disc">
                <li>Vai su "API e servizi" → "Libreria"</li>
                <li>Cerca "Google Calendar API"</li>
                <li>Clicca su "Abilita"</li>
              </ul>
            </div>
          </li>
          
          <li className="flex">
            <span className="font-semibold mr-2">4.</span>
            <div>
              <span>Crea le credenziali OAuth 2.0:</span>
              <ul className="ml-4 mt-1 list-disc">
                <li>Vai su "Credenziali"</li>
                <li>Clicca "Crea credenziali" → "ID client OAuth"</li>
                <li>Tipo applicazione: "Applicazione Web"</li>
                <li>Nome: "Richiesta Assistenza Calendar"</li>
              </ul>
            </div>
          </li>
          
          <li className="flex">
            <span className="font-semibold mr-2">5.</span>
            <div>
              <span>Aggiungi l'URI di reindirizzamento autorizzato:</span>
              <div className="mt-2 flex items-center bg-white border border-blue-300 rounded px-3 py-2">
                <code className="text-xs flex-1">{callbackUrl}</code>
                <button
                  onClick={() => copyToClipboard(callbackUrl)}
                  className="ml-2 text-blue-600 hover:text-blue-700"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
          
          <li className="flex">
            <span className="font-semibold mr-2">6.</span>
            <span>Copia Client ID e Client Secret e inseriscili qui sotto</span>
          </li>
        </ol>
      </div>

      {/* Form Configurazione */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credenziali OAuth 2.0</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID *
            </label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="123456789-abc.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Il Client ID identifica la tua applicazione presso Google
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret *
            </label>
            <div className="relative">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={formData.clientSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="GOCSPX-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSecrets ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Il Client Secret è la password della tua applicazione (mantienilo segreto!)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key (opzionale)
            </label>
            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              L'API Key è opzionale, serve per alcune funzionalità aggiuntive
            </p>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <div>
              {configStatus?.configured && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteConfigMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteConfigMutation.isPending ? 'Eliminazione...' : 'Elimina Configurazione'}
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {configStatus?.configured && (
                <button
                  type="button"
                  onClick={() => setFormData({ clientId: '', clientSecret: '', apiKey: '' })}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset Form
                </button>
              )}
              <button
                type="submit"
                disabled={saveCredentialsMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                {saveCredentialsMutation.isPending ? 'Salvataggio...' : 'Salva Credenziali'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-amber-800">Note importanti</h4>
            <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
              <li>Le credenziali sono salvate in modo sicuro nel database</li>
              <li>Ogni professionista dovrà autorizzare individualmente l'accesso al proprio Google Calendar</li>
              <li>Per ambienti di produzione, configura gli URI di reindirizzamento corretti</li>
              <li>Non condividere mai il Client Secret con nessuno</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
