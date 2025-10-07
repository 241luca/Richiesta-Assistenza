import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import ApiKeysLayout from './ApiKeysLayout';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

export default function GoogleMapsConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(''); // Separate state for new key input
  const [isNewKey, setIsNewKey] = useState(false); // Track if entering new key
  const [formData, setFormData] = useState({
    key: '',
    configuration: {
      enabled: true,
      apis: ['maps', 'geocoding', 'places'],
      restrictions: {
        allowedReferrers: ['http://localhost:5193', 'https://yourdomain.com']
      }
    }
  });

  // Fetch Google Maps API key
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['api-key', 'GOOGLE_MAPS'],
    queryFn: async () => {
      const response = await api.get('/admin/api-keys/GOOGLE_MAPS');
      return response.data.data;
    },
    retry: false
  });

  // Update form when data is loaded
  useEffect(() => {
    if (apiKey) {
      console.log('API Key loaded from backend:', apiKey.key); // Debug log
      setFormData({
        key: apiKey.key || '', // Show the masked key from backend
        configuration: apiKey.configuration || {
          enabled: true,
          apis: ['maps', 'geocoding', 'places'],
          restrictions: {
            allowedReferrers: ['http://localhost:5193', 'https://yourdomain.com']
          }
        }
      });
      setIsNewKey(false); // Not a new key, just loaded from backend
    }
  }, [apiKey]);

  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/api-keys', {
        service: 'GOOGLE_MAPS',
        ...data
      });
    },
    onSuccess: (response) => {
      toast.success('Google Maps API key salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-key', 'GOOGLE_MAPS'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // Keep the masked key visible after saving
      if (response.data?.data?.key) {
        setFormData(prev => ({ ...prev, key: response.data.data.key }));
      }
      setKeyInput(''); // Clear only the input field for new keys
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error 
        ? (typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : error.response.data.error.message || JSON.stringify(error.response.data.error))
        : 'Errore nel salvataggio';
      toast.error(errorMsg);
    }
  });

  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/api-keys/GOOGLE_MAPS/test');
    },
    onSuccess: (data) => {
      if (data.data.success) {
        toast.success('Connessione Google Maps funzionante!');
      } else {
        toast.error(`Test fallito: ${data.data.message}`);
      }
    },
    onError: () => {
      toast.error('Errore durante il test della connessione');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se la chiave è mascherata (contiene ...), non salvare
    if (formData.key.includes('...')) {
      toast.error('Inserisci una chiave API completa, non quella mascherata');
      return;
    }
    
    // Only validate if entering a new key
    if (isNewKey) {
      if (!formData.key) {
        toast.error('Inserisci una API key valida');
        return;
      }

      if (!formData.key.startsWith('AIza')) {
        toast.error('Formato API key non valido. Deve iniziare con "AIza"');
        return;
      }
    } else if (!formData.key) {
      toast.error('Nessuna chiave da salvare');
      return;
    }

    saveMutation.mutate({
      key: formData.key,
      configuration: formData.configuration,
      isActive: true
    });
  };

  const handleApiToggle = (api: string) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        apis: prev.configuration?.apis?.includes(api)
          ? prev.configuration.apis.filter(a => a !== api)
          : [...(prev.configuration?.apis || []), api]
      }
    }));
  };

  if (isLoading) {
    return (
      <ApiKeysLayout>
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </ApiKeysLayout>
    );
  }

  return (
    <ApiKeysLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <MapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Google Maps API</h2>
              <p className="text-gray-600 mt-1">
                Configurazione per geocoding, mappe e servizi di localizzazione
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            {apiKey?.isActive && apiKey?.key ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Configurata e Attiva
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Non Configurata
              </div>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key Input */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Key</h3>
            
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                Google Maps API Key * {apiKey?.key && <span className="text-green-600">(Configurata)</span>}
              </label>
              <div className="mt-1 relative">
                <input
                  type={showKey ? "text" : "password"}
                  id="api-key"
                  value={formData.key}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, key: e.target.value }));
                    setIsNewKey(true);
                  }}
                  placeholder={apiKey?.key ? `Chiave configurata: ${apiKey.key}` : "AIza..."}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showKey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {apiKey?.key ? (
                  <span className="text-amber-600 font-medium">
                    ⚠️ Chiave già configurata. Per modificarla, cancella il campo e inserisci la nuova chiave completa.
                  </span>
                ) : (
                  <>
                    La chiave deve iniziare con "AIza". Ottienila dalla{' '}
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Google Cloud Console
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* API Services */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Servizi API Abilitati</h3>
            
            <div className="space-y-3">
              {[
                { id: 'maps', name: 'Maps JavaScript API', description: 'Per visualizzare mappe interattive' },
                { id: 'geocoding', name: 'Geocoding API', description: 'Conversione indirizzi in coordinate' },
                { id: 'places', name: 'Places API', description: 'Autocompletamento indirizzi' },
                { id: 'directions', name: 'Directions API', description: 'Calcolo percorsi e direzioni' },
                { id: 'distance', name: 'Distance Matrix API', description: 'Calcolo distanze e tempi' }
              ].map((api) => (
                <label key={api.id} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.configuration?.apis?.includes(api.id) || false}
                    onChange={() => handleApiToggle(api.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">{api.name}</span>
                    <p className="text-sm text-gray-500">{api.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed Referrers */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Domini Autorizzati</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                HTTP Referrers (uno per riga)
              </label>
              <textarea
                value={formData.configuration.restrictions?.allowedReferrers?.join('\n') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    restrictions: {
                      ...prev.configuration.restrictions,
                      allowedReferrers: e.target.value.split('\n').filter(r => r.trim())
                    }
                  }
                }))}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="http://localhost:5193&#10;https://yourdomain.com"
              />
              <p className="mt-2 text-sm text-gray-500">
                Specifica i domini autorizzati a utilizzare questa API key
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => testMutation.mutate()}
              disabled={!apiKey?.key || testMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testMutation.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Test Connessione
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending || !formData.key}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Salva Configurazione
                </>
              )}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Come ottenere una Google Maps API Key
              </h3>
              <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>Vai alla <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                <li>Crea un nuovo progetto o seleziona uno esistente</li>
                <li>Abilita le API necessarie (Maps JavaScript, Geocoding, Places)</li>
                <li>Vai su "Credenziali" e crea una nuova API key</li>
                <li>Configura le restrizioni per maggiore sicurezza</li>
                <li>Copia la chiave e incollala qui sopra</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </ApiKeysLayout>
  );
}
