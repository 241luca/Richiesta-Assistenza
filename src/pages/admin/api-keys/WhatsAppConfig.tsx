import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import ApiKeysLayout from './ApiKeysLayout';
import toast from 'react-hot-toast';
import {
  ChatBubbleBottomCenterTextIcon,
  KeyIcon,
  GlobeAltIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    configuration: {
      enabled: true,
      baseURL: 'https://app.sendapp.cloud/api',
      instanceId: '',
      webhookUrl: ''
    }
  });

  // Fetch WhatsApp API key dal sistema unificato
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['api-key', 'whatsapp'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/api-keys/whatsapp');
        return response.data.data;
      } catch (error) {
        // Se non esiste, ritorna null
        return null;
      }
    },
    retry: false
  });

  // Update form quando i dati sono caricati
  useEffect(() => {
    if (apiKey) {
      setFormData({
        key: '', // Non mostriamo la key attuale per sicurezza
        configuration: {
          enabled: apiKey.permissions?.enabled !== false,
          baseURL: apiKey.permissions?.baseURL || 'https://app.sendapp.cloud/api',
          instanceId: apiKey.permissions?.instanceId || '',
          webhookUrl: apiKey.permissions?.webhookUrl || ''
        }
      });
    }
  }, [apiKey]);

  // Save API key mutation - usa lo stesso endpoint delle altre API
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/api-keys', {
        service: 'whatsapp',
        key: data.key,
        configuration: data.configuration,
        isActive: true
      });
    },
    onSuccess: () => {
      toast.success('WhatsApp API key salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-key', 'whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setFormData(prev => ({ ...prev, key: '' }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore nel salvataggio');
    }
  });

  // Test API key mutation - usa l'endpoint standard
  const testMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/api-keys/whatsapp/test');
    },
    onSuccess: (data) => {
      if (data.data.success) {
        toast.success('WhatsApp configurato correttamente!');
      } else {
        toast.error(`Test fallito: ${data.data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante il test');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se non c'è una nuova key e esiste già una configurazione, salva solo la config
    if (!formData.key && !apiKey) {
      toast.error('Inserisci un Access Token di SendApp');
      return;
    }

    // Se c'è una key, salva tutto
    if (formData.key || apiKey) {
      saveMutation.mutate({
        key: formData.key || undefined, // Se vuoto, mantiene quella esistente
        configuration: formData.configuration
      });
    }
  };

  if (isLoading) {
    return (
      <ApiKeysLayout>
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </ApiKeysLayout>
    );
  }

  return (
    <ApiKeysLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">WhatsApp API</h2>
                <p className="text-sm text-gray-600">
                  Configurazione per messaggistica WhatsApp via SendApp Cloud
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {apiKey ? (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Configurata e Attiva
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Non configurata
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form di configurazione */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Key</h3>
            
            <div className="space-y-4">
              {/* Access Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyIcon className="inline h-4 w-4 mr-1" />
                  SendApp Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder={apiKey ? "Lascia vuoto per mantenere il token esistente" : "Inserisci il token di SendApp"}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ottieni il token dalla dashboard di SendApp Cloud
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurazione</h3>
            
            <div className="space-y-4">
              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                  Base URL API
                </label>
                <input
                  type="url"
                  value={formData.configuration.baseURL}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, baseURL: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="https://app.sendapp.cloud/api"
                />
              </div>

              {/* Instance ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BoltIcon className="inline h-4 w-4 mr-1" />
                  Instance ID (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.configuration.instanceId}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, instanceId: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Verrà generato automaticamente se vuoto"
                />
                <p className="mt-1 text-xs text-gray-500">
                  L'Instance ID viene generato automaticamente alla prima connessione
                </p>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                  Webhook URL (opzionale)
                </label>
                <input
                  type="url"
                  value={formData.configuration.webhookUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, webhookUrl: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="https://tuodominio.com/api/whatsapp/webhook"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL per ricevere messaggi in entrata (configurare in produzione)
                </p>
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Servizio Attivo
                  </label>
                  <p className="text-xs text-gray-500">
                    Abilita o disabilita l'integrazione WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, enabled: !formData.configuration.enabled }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.configuration.enabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.configuration.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => testMutation.mutate()}
                disabled={!apiKey || testMutation.isPending}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {testMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Test Connessione
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saveMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Salva Configurazione
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Come configurare SendApp
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex">
              <span className="font-medium mr-2">1.</span>
              <span>Vai su <a href="https://app.sendapp.cloud" target="_blank" rel="noopener noreferrer" className="underline">app.sendapp.cloud</a></span>
            </li>
            <li className="flex">
              <span className="font-medium mr-2">2.</span>
              <span>Crea un account o effettua il login</span>
            </li>
            <li className="flex">
              <span className="font-medium mr-2">3.</span>
              <span>Crea una nuova istanza WhatsApp</span>
            </li>
            <li className="flex">
              <span className="font-medium mr-2">4.</span>
              <span>Copia l'Access Token dalla dashboard</span>
            </li>
            <li className="flex">
              <span className="font-medium mr-2">5.</span>
              <span>Incolla il token qui sopra e salva</span>
            </li>
            <li className="flex">
              <span className="font-medium mr-2">6.</span>
              <span>Usa "Test Connessione" per verificare il funzionamento</span>
            </li>
          </ol>
        </div>
      </div>
    </ApiKeysLayout>
  );
}
