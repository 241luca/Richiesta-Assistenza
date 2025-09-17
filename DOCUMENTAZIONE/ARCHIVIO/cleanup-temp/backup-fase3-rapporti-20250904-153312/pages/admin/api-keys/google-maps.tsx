/**
 * Google Maps API Key Configuration Page
 * Configurazione della chiave API di Google Maps
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

// Schema di validazione
const googleMapsSchema = z.object({
  apiKey: z.string().min(20, 'La API key deve essere almeno 20 caratteri'),
  apis: z.object({
    mapsJavascript: z.boolean(),
    geocoding: z.boolean(),
    places: z.boolean(),
    distanceMatrix: z.boolean(),
    directions: z.boolean(),
  }),
  restrictions: z.object({
    httpReferrers: z.string(),
    ipAddresses: z.string().optional(),
  }),
  monthlyLimit: z.number().optional(),
});

type GoogleMapsFormData = z.infer<typeof googleMapsSchema>;

export function GoogleMapsConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Query per ottenere la configurazione corrente
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['api-key-google-maps'],
    queryFn: () => api.get('/admin/api-keys/google_maps')
  });

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<GoogleMapsFormData>({
    resolver: zodResolver(googleMapsSchema),
    defaultValues: {
      apiKey: '',
      apis: {
        mapsJavascript: true,
        geocoding: true,
        places: true,
        distanceMatrix: false,
        directions: false,
      },
      restrictions: {
        httpReferrers: 'http://localhost:*\nhttps://yourdomain.com/*',
        ipAddresses: '',
      }
    }
  });

  // Popola il form con i dati esistenti
  useEffect(() => {
    if (currentConfig?.data) {
      const settings = currentConfig.data.settings || {};
      if (settings.apis) {
        setValue('apis', settings.apis);
      }
      if (settings.restrictions) {
        setValue('restrictions', settings.restrictions);
      }
      if (currentConfig.data.monthlyLimit) {
        setValue('monthlyLimit', currentConfig.data.monthlyLimit);
      }
    }
  }, [currentConfig, setValue]);

  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: (data: GoogleMapsFormData) => {
      const settings = {
        apis: data.apis,
        restrictions: data.restrictions,
      };

      return api.post('/admin/api-keys', {
        service: 'google_maps',
        apiKey: data.apiKey,
        settings,
        monthlyLimit: data.monthlyLimit
      });
    },
    onSuccess: () => {
      toast.success('Configurazione Google Maps salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-key-google-maps'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Verifica la API key
  const verifyKey = async () => {
    setIsVerifying(true);
    try {
      const response = await api.post('/admin/api-keys/google_maps/verify');
      const isValid = response.data.isValid;
      
      toast.success(
        isValid 
          ? 'API key Google Maps valida!' 
          : 'API key Google Maps non valida o non funzionante',
        { icon: isValid ? '✅' : '❌' }
      );
    } catch (error) {
      toast.error('Errore durante la verifica');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = (data: GoogleMapsFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Caricamento configurazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin/api-keys')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <MapIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Google Maps API</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura la chiave API per i servizi di mappe e geocoding
                  </p>
                </div>
              </div>
              {currentConfig?.data?.verificationStatus && (
                <div>
                  {currentConfig.data.verificationStatus === 'valid' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Verificata
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Non verificata
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* API Key Input */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <KeyIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              API Key
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps API Key *
                </label>
                <input
                  type="password"
                  {...register('apiKey')}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Ottieni la tua API key dalla <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Google Cloud Console</a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">API richieste:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Maps JavaScript API (visualizzazione mappe)</li>
                      <li>Geocoding API (conversione indirizzi)</li>
                      <li>Places API (autocompletamento)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APIs Configuration */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <GlobeAltIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              APIs Abilitate
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('apis.mapsJavascript')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Maps JavaScript API <span className="text-red-500">*</span>
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('apis.geocoding')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Geocoding API <span className="text-red-500">*</span>
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('apis.places')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Places API <span className="text-red-500">*</span>
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('apis.distanceMatrix')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Distance Matrix API (opzionale)
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('apis.directions')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Directions API (opzionale)
                </span>
              </label>
            </div>
          </div>

          {/* Restrictions */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <DocumentTextIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              Restrizioni di Sicurezza
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Referrers (uno per riga)
                </label>
                <textarea
                  {...register('restrictions.httpReferrers')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="http://localhost:*&#10;https://yourdomain.com/*"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Limita l'uso della API key a questi domini
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Addresses (opzionale, uno per riga)
                </label>
                <textarea
                  {...register('restrictions.ipAddresses')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="192.168.1.1&#10;10.0.0.1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Limita l'uso a specifici indirizzi IP (per backend)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite mensile (opzionale)
                </label>
                <input
                  type="number"
                  {...register('monthlyLimit', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Numero massimo di richieste al mese
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={verifyKey}
              disabled={isVerifying || !currentConfig?.data?.apiKey}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 inline mr-2 animate-spin" />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                  Verifica API Key
                </>
              )}
            </button>

            <div className="space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/api-keys')}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Salvataggio...' : 'Salva Configurazione'}
              </button>
            </div>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            📚 Guida Rapida
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
            <li>Vai su <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 hover:text-blue-800">Google Cloud Console</a></li>
            <li>Crea un nuovo progetto o seleziona quello esistente</li>
            <li>Abilita le APIs richieste (Maps JavaScript, Geocoding, Places)</li>
            <li>Crea una nuova API key in "Credenziali"</li>
            <li>Configura le restrizioni HTTP referrer per sicurezza</li>
            <li>Copia la API key e incollala qui sopra</li>
            <li>Salva e verifica che sia valida</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
