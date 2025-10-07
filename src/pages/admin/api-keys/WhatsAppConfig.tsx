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
  InformationCircleIcon,
  RocketLaunchIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    configuration: {
      enabled: true,
      provider: 'evolution',
      // Evolution config
      baseURL: 'http://37.27.89.35:8080',
      apiKey: 'evolution_key_luca_2025_secure_21806',
      instanceName: 'main',
      webhookUrl: 'http://37.27.89.35:3201/api/whatsapp/webhook'
    }
  });

  // Fetch WhatsApp API key dal sistema unificato
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['api-key', 'whatsapp'],
    queryFn: async () => {
      try {
        const response = await api.get('/apikeys/whatsapp');
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false
  });

  // Update form quando i dati sono caricati
  useEffect(() => {
    if (apiKey && apiKey.configuration) {
      setFormData({
        configuration: {
          enabled: apiKey.configuration.enabled !== false,
          provider: 'evolution',
          baseURL: apiKey.configuration.baseURL || 'http://37.27.89.35:8080',
          apiKey: apiKey.key || apiKey.configuration.apiKey || 'evolution_key_luca_2025_secure_21806',
          instanceName: apiKey.configuration.instanceName || 'main',
          webhookUrl: apiKey.configuration.webhookUrl || 'http://37.27.89.35:3201/api/whatsapp/webhook'
        }
      });
    }
  }, [apiKey]);

  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/apikeys', {
        service: 'whatsapp',
        key: data.configuration.apiKey, // La chiave API di Evolution
        configuration: {
          provider: 'evolution',
          version: '2.3.3',
          baseURL: data.configuration.baseURL,
          instanceName: data.configuration.instanceName,
          webhookUrl: data.configuration.webhookUrl,
          enabled: true,
          features: {
            sendMessage: true,
            receiveMessage: true,
            sendMedia: true,
            receiveMedia: true,
            groupSupport: true,
            statusSupport: true,
            qrCodeGeneration: true
          },
          settings: {
            autoReconnect: true,
            maxRetries: 3,
            retryDelay: 5000,
            webhookEnabled: true,
            storeMessages: true,
            storeContacts: true
          }
        },
        isActive: true
      });
    },
    onSuccess: () => {
      toast.success('Evolution API configurata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-key', 'whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error: any) => {
      const errorMessage = typeof error.response?.data?.error === 'string' 
        ? error.response.data.error 
        : error.response?.data?.message || 'Errore nel salvataggio';
      toast.error(errorMessage);
    }
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      // Test Evolution API
      const response = await fetch(formData.configuration.baseURL);
      if (!response.ok) throw new Error('Evolution API non raggiungibile');
      const data = await response.json();
      return { success: true, data };
    },
    onSuccess: (data) => {
      if (data.data?.version) {
        toast.success(`Evolution API v${data.data.version} connessa e funzionante!`);
      } else {
        toast.success('Evolution API connessa e funzionante!');
      }
    },
    onError: (error: any) => {
      const errorMessage = typeof error === 'string' 
        ? error 
        : error.message || 'Errore durante il test';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!formData.configuration.baseURL) {
      toast.error('URL Evolution API richiesto');
      return;
    }
    if (!formData.configuration.apiKey) {
      toast.error('API Key richiesta');
      return;
    }
    if (!formData.configuration.instanceName) {
      toast.error('Nome istanza richiesto');
      return;
    }
    
    saveMutation.mutate({
      configuration: formData.configuration
    });
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
                <h2 className="text-xl font-bold text-gray-900">WhatsApp Integration</h2>
                <p className="text-sm text-gray-600">
                  Evolution API Self-hosted - Messaggi illimitati gratuiti
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {apiKey ? (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Evolution API Configurata
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Non configurato
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Evolution API Provider Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <RocketLaunchIcon className="h-10 w-10 text-green-600 mt-1" />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-green-900">Evolution API v2.3.3</h3>
              <p className="text-sm text-green-700 mt-1">
                Sistema self-hosted per integrazione WhatsApp Business
              </p>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Messaggi illimitati</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Gruppi e broadcast</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Zero costi mensili</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form di configurazione */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurazione Evolution API
            </h3>
            
            <div className="space-y-4">
              {/* API URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                  Evolution API URL
                </label>
                <input
                  type="url"
                  value={formData.configuration.baseURL}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, baseURL: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="http://37.27.89.35:8080"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL del tuo server Evolution API (VPS)
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyIcon className="inline h-4 w-4 mr-1" />
                  Evolution API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={formData.configuration.apiKey}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, apiKey: e.target.value }
                    })}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="evolution_key_..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Instance Name - NUOVO CAMPO! */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="inline h-4 w-4 mr-1" />
                  Nome Istanza WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.configuration.instanceName}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, instanceName: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="main"
                  required
                  pattern="[a-z0-9]+"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nome univoco per l'istanza (solo lettere minuscole e numeri, es: main, prova, assistenza)
                </p>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BoltIcon className="inline h-4 w-4 mr-1" />
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.configuration.webhookUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, webhookUrl: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="http://37.27.89.35:3201/api/whatsapp/webhook"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL per ricevere messaggi in entrata (opzionale)
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center"
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
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

        {/* Info Box con stato attuale */}
        {apiKey && apiKey.configuration && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-3 text-blue-900">
              <InformationCircleIcon className="inline h-5 w-5 mr-1" />
              Configurazione Attuale
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Server:</span> {apiKey.configuration.baseURL}
                </div>
                <div>
                  <span className="font-medium">Istanza:</span> {apiKey.configuration.instanceName || 'main'}
                </div>
                <div>
                  <span className="font-medium">Versione:</span> {apiKey.configuration.version || '2.3.3'}
                </div>
                <div>
                  <span className="font-medium">Stato:</span> {apiKey.isActive ? 'Attivo' : 'Disattivo'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prossimi passi */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-3 text-green-900">
            ✅ Prossimi Passi
          </h3>
          <ol className="space-y-2 text-sm text-green-800">
            <li>1. Clicca su "Test Connessione" per verificare che Evolution API sia raggiungibile</li>
            <li>2. Salva la configurazione con il tasto "Salva Configurazione"</li>
            <li>3. Vai su <a href="/admin/whatsapp" className="underline font-medium">WhatsApp Manager</a> per creare l'istanza e connettere WhatsApp</li>
            <li>4. Scansiona il QR code con WhatsApp per completare la connessione</li>
          </ol>
        </div>
      </div>
    </ApiKeysLayout>
  );
}
