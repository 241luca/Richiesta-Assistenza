/**
 * API Keys Management Page
 * Solo per SUPER_ADMIN - Gestione delle API keys dei servizi esterni
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  KeyIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CogIcon,
  MapIcon,
  EnvelopeIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/use-auth';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  service: string;
  apiKey: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'valid' | 'invalid';
  lastVerifiedAt: string | null;
  usageCount: number;
  currentMonthUsage: number;
  monthlyLimit: number | null;
  lastUsedAt: string | null;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

const serviceIcons = {
  google_maps: MapIcon,
  brevo: EnvelopeIcon,
  openai: CpuChipIcon
};

const serviceNames = {
  google_maps: 'Google Maps',
  brevo: 'Brevo (Email)',
  openai: 'OpenAI (ChatGPT)'
};

const serviceDescriptions = {
  google_maps: 'Servizio di mappe, geocoding e autocompletamento indirizzi',
  brevo: 'Servizio di invio email transazionali e marketing',
  openai: 'Intelligenza artificiale per assistenza e automazione'
};

export function ApiKeysPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Verifica che l'utente sia SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600">Solo il Super Admin può accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  // Query per ottenere tutte le API keys
  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/admin/api-keys')
  });

  // Mutation per verificare una API key
  const verifyMutation = useMutation({
    mutationFn: (service: string) => api.post(`/admin/api-keys/${service}/verify`),
    onSuccess: (data, service) => {
      const isValid = data.data.isValid;
      toast.success(
        isValid 
          ? `${serviceNames[service as keyof typeof serviceNames]} API key verificata con successo!`
          : `${serviceNames[service as keyof typeof serviceNames]} API key non valida!`,
        {
          icon: isValid ? '✅' : '❌'
        }
      );
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      toast.error('Errore durante la verifica');
    }
  });

  // Query per le statistiche di utilizzo
  const { data: usageStats } = useQuery({
    queryKey: ['api-keys-usage'],
    queryFn: () => api.get('/admin/api-keys/stats/usage')
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Valida
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Non valida
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Da verificare
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <KeyIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestione API Keys</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura le chiavi API per i servizi esterni
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Importante</h3>
              <p className="text-sm text-blue-700 mt-1">
                Le API keys sono criptate nel database. Assicurati di conservare una copia sicura delle chiavi originali.
                Dopo il salvataggio, le chiavi saranno mascherate per sicurezza.
              </p>
            </div>
          </div>
        </div>

        {/* Grid dei servizi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['google_maps', 'brevo', 'openai'].map((service) => {
            const Icon = serviceIcons[service as keyof typeof serviceIcons];
            const apiKey = apiKeys?.data?.find((k: ApiKey) => k.service === service);
            const stats = usageStats?.data?.find((s: any) => s.service === service);
            
            return (
              <div key={service} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-10 w-10 text-blue-600" />
                    {apiKey && getStatusBadge(apiKey.verificationStatus)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {serviceNames[service as keyof typeof serviceNames]}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {serviceDescriptions[service as keyof typeof serviceDescriptions]}
                  </p>

                  {/* Statistiche di utilizzo */}
                  {stats && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Utilizzo totale:</span>
                          <p className="font-semibold">{stats.usageCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Questo mese:</span>
                          <p className="font-semibold">
                            {stats.currentMonthUsage}
                            {stats.monthlyLimit && ` / ${stats.monthlyLimit}`}
                          </p>
                        </div>
                      </div>
                      {stats.lastUsedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Ultimo utilizzo: {new Date(stats.lastUsedAt).toLocaleDateString('it-IT')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status della chiave */}
                  {apiKey && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        API Key: <span className="font-mono text-xs">{apiKey.apiKey}</span>
                      </p>
                      {apiKey.lastVerifiedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Verificata: {new Date(apiKey.lastVerifiedAt).toLocaleDateString('it-IT')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Azioni */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/api-keys/${service}`}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      <CogIcon className="h-4 w-4 inline mr-1" />
                      Configura
                    </Link>
                    
                    {apiKey && (
                      <button
                        onClick={() => verifyMutation.mutate(service)}
                        disabled={verifyMutation.isPending}
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {verifyMutation.isPending ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistiche globali */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Globali</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">API Keys Configurate</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiKeys?.data?.filter((k: ApiKey) => k.apiKey !== '***').length || 0} / 3
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">API Keys Valide</p>
              <p className="text-2xl font-bold text-green-600">
                {apiKeys?.data?.filter((k: ApiKey) => k.verificationStatus === 'valid').length || 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Utilizzo Totale</p>
              <p className="text-2xl font-bold text-blue-600">
                {usageStats?.data?.reduce((acc: number, s: any) => acc + s.usageCount, 0) || 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Utilizzo Mensile</p>
              <p className="text-2xl font-bold text-purple-600">
                {usageStats?.data?.reduce((acc: number, s: any) => acc + s.currentMonthUsage, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
