/**
 * Brevo API Key Configuration Page
 * Configurazione della chiave API di Brevo (SendinBlue) per invio email
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  UserIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

// Schema di validazione
const brevoSchema = z.object({
  apiKey: z.string().min(20, 'La API key deve essere almeno 20 caratteri'),
  senderEmail: z.string().email('Email non valida'),
  senderName: z.string().min(2, 'Il nome del mittente deve essere almeno 2 caratteri'),
  replyToEmail: z.string().email('Email non valida').optional().or(z.literal('')),
  templates: z.object({
    welcome: z.string().optional(),
    passwordReset: z.string().optional(),
    requestNotification: z.string().optional(),
    quoteReceived: z.string().optional(),
    paymentConfirmation: z.string().optional(),
  }),
  monthlyLimit: z.number().optional(),
});

type BrevoFormData = z.infer<typeof brevoSchema>;

export function BrevoConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Query per ottenere la configurazione corrente
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['api-key-brevo'],
    queryFn: () => api.get('/admin/api-keys/brevo')
  });

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<BrevoFormData>({
    resolver: zodResolver(brevoSchema),
    defaultValues: {
      apiKey: '',
      senderEmail: 'noreply@assistenza.it',
      senderName: 'Sistema Assistenza',
      replyToEmail: '',
      templates: {
        welcome: '',
        passwordReset: '',
        requestNotification: '',
        quoteReceived: '',
        paymentConfirmation: '',
      }
    }
  });

  // Popola il form con i dati esistenti
  useEffect(() => {
    if (currentConfig?.data) {
      const settings = currentConfig.data.settings || {};
      if (settings.senderEmail) {
        setValue('senderEmail', settings.senderEmail);
      }
      if (settings.senderName) {
        setValue('senderName', settings.senderName);
      }
      if (settings.replyToEmail) {
        setValue('replyToEmail', settings.replyToEmail);
      }
      if (settings.templates) {
        setValue('templates', settings.templates);
      }
      if (currentConfig.data.monthlyLimit) {
        setValue('monthlyLimit', currentConfig.data.monthlyLimit);
      }
    }
  }, [currentConfig, setValue]);

  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: (data: BrevoFormData) => {
      const settings = {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        replyToEmail: data.replyToEmail || data.senderEmail,
        templates: data.templates,
      };

      return api.post('/admin/api-keys', {
        service: 'brevo',
        apiKey: data.apiKey,
        settings,
        monthlyLimit: data.monthlyLimit
      });
    },
    onSuccess: () => {
      toast.success('Configurazione Brevo salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-key-brevo'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Verifica la API key
  const verifyKey = async () => {
    setIsVerifying(true);
    try {
      const response = await api.post('/admin/api-keys/brevo/verify');
      const isValid = response.data.isValid;
      
      toast.success(
        isValid 
          ? 'API key Brevo valida!' 
          : 'API key Brevo non valida o non funzionante',
        { icon: isValid ? '✅' : '❌' }
      );
    } catch (error) {
      toast.error('Errore durante la verifica');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = (data: BrevoFormData) => {
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
                <EnvelopeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Brevo Email API</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura il servizio di invio email transazionali
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
                  Brevo API Key *
                </label>
                <input
                  type="password"
                  {...register('apiKey')}
                  placeholder="xkeysib-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Ottieni la tua API key da <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Brevo Dashboard</a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Funzionalità:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Email transazionali illimitate</li>
                      <li>Template personalizzabili</li>
                      <li>Tracking aperture e click</li>
                      <li>Gestione contatti e liste</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Configuration */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <UserIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              Configurazione Mittente
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Mittente *
                  </label>
                  <input
                    type="email"
                    {...register('senderEmail')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.senderEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.senderEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Mittente *
                  </label>
                  <input
                    type="text"
                    {...register('senderName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.senderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.senderName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email di Risposta (opzionale)
                </label>
                <input
                  type="email"
                  {...register('replyToEmail')}
                  placeholder="support@assistenza.it"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.replyToEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.replyToEmail.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Se vuoto, userà l'email del mittente
                </p>
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <AtSymbolIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              Template ID (opzionale)
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Inserisci gli ID dei template creati in Brevo per personalizzare le email
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Benvenuto
                  </label>
                  <input
                    type="text"
                    {...register('templates.welcome')}
                    placeholder="Template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Reset Password
                  </label>
                  <input
                    type="text"
                    {...register('templates.passwordReset')}
                    placeholder="Template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Nuova Richiesta
                  </label>
                  <input
                    type="text"
                    {...register('templates.requestNotification')}
                    placeholder="Template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Preventivo Ricevuto
                  </label>
                  <input
                    type="text"
                    {...register('templates.quoteReceived')}
                    placeholder="Template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Conferma Pagamento
                  </label>
                  <input
                    type="text"
                    {...register('templates.paymentConfirmation')}
                    placeholder="Template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite mensile email
                  </label>
                  <input
                    type="number"
                    {...register('monthlyLimit', { valueAsNumber: true })}
                    placeholder="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
            <li>Registrati su <a href="https://www.brevo.com/" target="_blank" className="text-blue-600 hover:text-blue-800">Brevo.com</a> (ex SendinBlue)</li>
            <li>Vai nelle Impostazioni → API Keys</li>
            <li>Crea una nuova API key con permessi SMTP</li>
            <li>Verifica il dominio del mittente in "Senders & IP"</li>
            <li>Crea i template email nel dashboard Brevo</li>
            <li>Copia gli ID dei template e inseriscili qui</li>
            <li>Salva e verifica che la chiave sia valida</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
