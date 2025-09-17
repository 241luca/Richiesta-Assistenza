import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import ApiKeysLayout from './ApiKeysLayout';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

export default function BrevoConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    configuration: {
      enabled: true,
      senderEmail: '',
      senderName: '',
      replyToEmail: '',
      dailyLimit: 300,
      testMode: false
    }
  });

  // Fetch Brevo API key
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['api-key', 'BREVO'],
    queryFn: async () => {
      const response = await api.get('/admin/api-keys/BREVO');
      return response.data.data;
    },
    retry: false
  });

  // Update form when data is loaded
  useEffect(() => {
    if (apiKey) {
      setFormData({
        key: '', // Don't show the actual key
        configuration: apiKey.configuration || formData.configuration
      });
    }
  }, [apiKey]);

  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/api-keys', {
        service: 'BREVO',
        ...data
      });
    },
    onSuccess: () => {
      toast.success('Brevo API key salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-key', 'BREVO'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setFormData(prev => ({ ...prev, key: '' }));
    },
    onError: (error: any) => {
      const errorMessage = typeof error.response?.data?.error === 'string' 
        ? error.response.data.error 
        : error.response?.data?.error?.details 
        || error.response?.data?.message 
        || 'Errore nel salvataggio';
      toast.error(errorMessage);
    }
  });

  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/api-keys/BREVO/test');
    },
    onSuccess: (data) => {
      if (data.data.success) {
        toast.success('Connessione Brevo funzionante!');
      } else {
        toast.error(`Test fallito: ${data.data.message}`);
      }
    },
    onError: (error: any) => {
      const errorMessage = typeof error?.response?.data?.error === 'string'
        ? error.response.data.error
        : error?.response?.data?.error?.details
        || error?.response?.data?.message
        || 'Errore durante il test della connessione';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key) {
      toast.error('Inserisci una API key valida');
      return;
    }

    if (!formData.key.includes('xkeysib-')) {
      toast.error('Formato API key non valido. Deve contenere "xkeysib-"');
      return;
    }

    if (!formData.configuration.senderEmail) {
      toast.error('Email mittente obbligatoria');
      return;
    }

    saveMutation.mutate({
      key: formData.key,
      configuration: formData.configuration,
      isActive: true
    });
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
            <div className="bg-blue-100 p-3 rounded-lg">
              <EnvelopeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Brevo (SendinBlue) API</h2>
              <p className="text-gray-600 mt-1">
                Configurazione per l'invio di email transazionali
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
                Brevo API Key *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showKey ? "text" : "password"}
                  id="api-key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder={apiKey?.key ? "Inserisci una nuova chiave per aggiornarla" : "xkeysib-..."}
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
                Ottieni la tua API key dalla{' '}
                <a 
                  href="https://app.brevo.com/settings/keys/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Dashboard Brevo
                </a>
              </p>
            </div>
          </div>

          {/* Sender Configuration */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurazione Mittente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sender-email" className="block text-sm font-medium text-gray-700">
                  Email Mittente *
                </label>
                <div className="mt-1 relative">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
                  <input
                    type="email"
                    id="sender-email"
                    value={formData.configuration.senderEmail}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      configuration: {
                        ...prev.configuration,
                        senderEmail: e.target.value
                      }
                    }))}
                    placeholder="noreply@tuodominio.it"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sender-name" className="block text-sm font-medium text-gray-700">
                  Nome Mittente
                </label>
                <div className="mt-1 relative">
                  <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    id="sender-name"
                    value={formData.configuration.senderName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      configuration: {
                        ...prev.configuration,
                        senderName: e.target.value
                      }
                    }))}
                    placeholder="Sistema Assistenza"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="reply-to" className="block text-sm font-medium text-gray-700">
                  Email Risposta (Reply-To)
                </label>
                <div className="mt-1 relative">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
                  <input
                    type="email"
                    id="reply-to"
                    value={formData.configuration.replyToEmail}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      configuration: {
                        ...prev.configuration,
                        replyToEmail: e.target.value
                      }
                    }))}
                    placeholder="support@tuodominio.it"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Impostazioni</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="daily-limit" className="block text-sm font-medium text-gray-700">
                  Limite Giornaliero Email
                </label>
                <input
                  type="number"
                  id="daily-limit"
                  value={formData.configuration.dailyLimit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      dailyLimit: parseInt(e.target.value)
                    }
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Brevo offre 300 email/giorno nel piano gratuito
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={formData.configuration.testMode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      testMode: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="test-mode" className="ml-2 block text-sm text-gray-900">
                  Modalità Test (le email non verranno inviate realmente)
                </label>
              </div>
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
                Come configurare Brevo
              </h3>
              <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>Registrati su <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="underline">Brevo.com</a></li>
                <li>Vai su Settings → SMTP & API</li>
                <li>Crea una nuova API key</li>
                <li>Verifica il dominio mittente per migliorare la deliverability</li>
                <li>Crea i template email nella dashboard Brevo</li>
                <li>Copia gli ID dei template nei campi sopra</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </ApiKeysLayout>
  );
}
