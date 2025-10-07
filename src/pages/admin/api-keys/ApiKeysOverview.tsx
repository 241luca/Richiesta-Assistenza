import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  KeyIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import ApiKeysLayout from './ApiKeysLayout';
import { apiClient } from '../../../services/api';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  service: string;
  key: string;
  isActive: boolean;
  isConfigured: boolean;
  configuration: any;
  lastValidatedAt: string | null;
  updatedAt: string;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function ApiKeysOverview() {
  const queryClient = useQueryClient();

  // Fetch all API keys
  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/api-keys');
      return response.data.data as ApiKey[];
    }
  });

  // Test API key mutation
  const testKeyMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiClient.post(`/admin/api-keys/${service}/test`);
      return response.data;
    },
    onSuccess: (data, service) => {
      if (data.success) {
        toast.success(`${service} API key è valida e funzionante!`);
      } else {
        toast.error(`${service} API key non valida: ${data.message}`);
      }
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      toast.error('Errore durante il test della chiave');
    }
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiClient.delete(`/admin/api-keys/${service}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('API Key eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      toast.error('Errore durante l\'eliminazione della chiave');
    }
  });

  const handleDelete = (apiKey: ApiKey) => {
    if (window.confirm(`Sei sicuro di voler eliminare la chiave ${getServiceInfo(apiKey.service).name}?`)) {
      deleteKeyMutation.mutate(apiKey.service);
    }
  };

  const getServiceInfo = (service: string) => {
    switch (service) {
      case 'GOOGLE_MAPS':
        return {
          name: 'Google Maps',
          description: 'Geocoding, mappe e localizzazione',
          color: 'bg-green-100 text-green-800',
          icon: '🗺️'
        };
      case 'BREVO':
        return {
          name: 'Brevo (SendinBlue)',
          description: 'Servizio email transazionali',
          color: 'bg-blue-100 text-blue-800',
          icon: '📧'
        };
      case 'OPENAI':
        return {
          name: 'OpenAI',
          description: 'ChatGPT e assistenza AI',
          color: 'bg-purple-100 text-purple-800',
          icon: '🤖'
        };
      case 'TINYMCE':
        return {
          name: 'TinyMCE',
          description: 'Editor WYSIWYG professionale',
          color: 'bg-purple-100 text-purple-800',
          icon: '✏️'
        };
      case 'STRIPE':
        return {
          name: 'Stripe',
          description: 'Pagamenti online',
          color: 'bg-indigo-100 text-indigo-800',
          icon: '💳'
        };
      case 'whatsapp':
        return {
          name: 'WhatsApp',
          description: 'Messaggistica con SendApp Cloud',
          color: 'bg-green-100 text-green-800',
          icon: '💬'
        };
      default:
        return {
          name: service,
          description: '',
          color: 'bg-gray-100 text-gray-800',
          icon: '🔑'
        };
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Mai validata';
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (error) {
    return (
      <ApiKeysLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900">Errore nel caricamento</h3>
          <p className="text-red-700 mt-2">Impossibile caricare le API keys</p>
        </div>
      </ApiKeysLayout>
    );
  }

  return (
    <ApiKeysLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Stato API Keys
          </h2>
          <p className="text-gray-600">
            Panoramica di tutte le integrazioni configurate nel sistema.
            Clicca su una specifica integrazione per configurarla o modificarla.
          </p>
        </div>

        {/* API Keys Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apiKeys?.map((apiKey) => {
            const info = getServiceInfo(apiKey.service);
            const isConfigured = apiKey.isConfigured || (apiKey.key && apiKey.key !== '***MASKED***');
            
            return (
              <div
                key={apiKey.service}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header con pulsante elimina */}
                <div className={`px-6 py-4 ${info.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{info.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{info.name}</h3>
                        <p className="text-sm opacity-75">{info.description}</p>
                      </div>
                    </div>
                    {/* Pulsante Elimina */}
                    <button
                      onClick={() => handleDelete(apiKey)}
                      className="p-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Elimina API Key"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Stato:</span>
                    <div className="flex items-center">
                      {apiKey.isActive && isConfigured ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                          <span className="text-sm text-green-700 font-medium">Attiva</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                          <span className="text-sm text-red-700 font-medium">
                            {!isConfigured ? 'Non configurata' : 'Disattivata'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Chiave API:</span>
                    <div className="mt-1 font-mono text-xs bg-gray-100 p-2 rounded break-all">
                      {apiKey.key || 'Non configurata'}
                    </div>
                  </div>

                  {/* Last Validated */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Ultima validazione:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(apiKey.lastValidatedAt)}
                    </p>
                  </div>

                  {/* Updated By */}
                  {apiKey.updatedBy && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Modificato da:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {apiKey.updatedBy.firstName} {apiKey.updatedBy.lastName}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testKeyMutation.mutate(apiKey.service)}
                      disabled={!isConfigured || testKeyMutation.isPending}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {testKeyMutation.isPending ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        'Test Connessione'
                      )}
                    </button>
                    <a
                      href={`/admin/api-keys/${apiKey.service.toLowerCase().replace('_', '-')}`}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 text-center transition-colors"
                    >
                      Configura
                    </a>
                  </div>
                </div>

                {/* Configuration Details */}
                {apiKey.configuration && Object.keys(apiKey.configuration).length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700">
                        Configurazione
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                        {JSON.stringify(apiKey.configuration, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Come configurare le API Keys
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Clicca su "Configura" per la specifica integrazione</li>
            <li>Inserisci la chiave API ottenuta dal fornitore del servizio</li>
            <li>Configura i parametri aggiuntivi richiesti</li>
            <li>Testa la connessione per verificare che tutto funzioni</li>
            <li>Salva le modifiche</li>
          </ol>
        </div>
      </div>
    </ApiKeysLayout>
  );
}