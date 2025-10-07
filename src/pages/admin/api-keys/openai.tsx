/**
 * OpenAI API Key Configuration Page
 * Configurazione della chiave API di OpenAI per ChatGPT
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CpuChipIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

// Schema di validazione
const openAISchema = z.object({
  apiKey: z.string().min(20, 'La API key deve essere almeno 20 caratteri'),
  model: z.enum(['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini']),
  maxTokens: z.number().min(100).max(8000),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2),
  monthlyLimit: z.number().optional(),
  systemPrompt: z.string().optional(),
});

type OpenAIFormData = z.infer<typeof openAISchema>;

const modelInfo = {
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', cost: '$0.002/1K tokens', context: '4K tokens' },
  'gpt-3.5-turbo-16k': { name: 'GPT-3.5 Turbo 16K', cost: '$0.004/1K tokens', context: '16K tokens' },
  'gpt-4': { name: 'GPT-4', cost: '$0.03/1K tokens', context: '8K tokens' },
  'gpt-4-turbo-preview': { name: 'GPT-4 Turbo', cost: '$0.01/1K tokens', context: '128K tokens' },
  'gpt-4o': { name: 'GPT-4o', cost: '$0.005/1K tokens', context: '128K tokens' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', cost: '$0.00015/1K tokens', context: '128K tokens' },
};

export function OpenAIConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Query per ottenere la configurazione corrente
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['api-key-openai'],
    queryFn: () => api.get('/admin/api-keys/openai')
  });

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<OpenAIFormData>({
    resolver: zodResolver(openAISchema),
    defaultValues: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: 'Sei un assistente AI professionale per un sistema di richiesta assistenza tecnica. Fornisci risposte chiare, accurate e utili.',
    }
  });

  const selectedModel = watch('model');
  const temperature = watch('temperature');

  // Popola il form con i dati esistenti
  useEffect(() => {
    if (currentConfig?.data) {
      const settings = currentConfig.data.settings || {};
      if (settings.model) {
        setValue('model', settings.model);
      }
      if (settings.maxTokens) {
        setValue('maxTokens', settings.maxTokens);
      }
      if (settings.temperature !== undefined) {
        setValue('temperature', settings.temperature);
      }
      if (settings.topP !== undefined) {
        setValue('topP', settings.topP);
      }
      if (settings.frequencyPenalty !== undefined) {
        setValue('frequencyPenalty', settings.frequencyPenalty);
      }
      if (settings.presencePenalty !== undefined) {
        setValue('presencePenalty', settings.presencePenalty);
      }
      if (settings.systemPrompt) {
        setValue('systemPrompt', settings.systemPrompt);
      }
      if (currentConfig.data.monthlyLimit) {
        setValue('monthlyLimit', currentConfig.data.monthlyLimit);
      }
    }
  }, [currentConfig, setValue]);

  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: (data: OpenAIFormData) => {
      const settings = {
        model: data.model,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        topP: data.topP,
        frequencyPenalty: data.frequencyPenalty,
        presencePenalty: data.presencePenalty,
        systemPrompt: data.systemPrompt,
      };

      return api.post('/admin/api-keys', {
        service: 'openai',
        apiKey: data.apiKey,
        settings,
        monthlyLimit: data.monthlyLimit
      });
    },
    onSuccess: () => {
      toast.success('Configurazione OpenAI salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-key-openai'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Verifica la API key
  const verifyKey = async () => {
    setIsVerifying(true);
    try {
      const response = await api.post('/admin/api-keys/openai/verify');
      const isValid = response.data.isValid;
      
      toast.success(
        isValid 
          ? 'API key OpenAI valida!' 
          : 'API key OpenAI non valida o non funzionante',
        { icon: isValid ? '✅' : '❌' }
      );
    } catch (error) {
      toast.error('Errore durante la verifica');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = (data: OpenAIFormData) => {
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
                <CpuChipIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">OpenAI API</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura ChatGPT per l'assistenza AI
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
                  OpenAI API Key *
                </label>
                <input
                  type="password"
                  {...register('apiKey')}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Ottieni la tua API key da <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">OpenAI Platform</a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Funzionalità:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Assistenza AI per clienti e professionisti</li>
                      <li>Generazione automatica di risposte</li>
                      <li>Analisi e categorizzazione richieste</li>
                      <li>Suggerimenti e consigli tecnici</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <SparklesIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              Modello AI
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modello GPT *
                </label>
                <select
                  {...register('model')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(modelInfo).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.name} - {info.cost} - {info.context}
                    </option>
                  ))}
                </select>
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                )}
              </div>

              {selectedModel && (
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {modelInfo[selectedModel as keyof typeof modelInfo].name}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Costo:</span>
                      <p className="font-medium">{modelInfo[selectedModel as keyof typeof modelInfo].cost}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Context Window:</span>
                      <p className="font-medium">{modelInfo[selectedModel as keyof typeof modelInfo].context}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Parameters */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <AdjustmentsHorizontalIcon className="h-5 w-5 inline mr-2 text-blue-600" />
              Parametri del Modello
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens ({watch('maxTokens')})
                  </label>
                  <input
                    type="range"
                    {...register('maxTokens', { valueAsNumber: true })}
                    min="100"
                    max="8000"
                    step="100"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lunghezza massima della risposta
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature ({temperature})
                  </label>
                  <input
                    type="range"
                    {...register('temperature', { valueAsNumber: true })}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {temperature < 0.5 ? 'Più deterministico' : temperature > 1.5 ? 'Più creativo' : 'Bilanciato'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top P ({watch('topP')})
                  </label>
                  <input
                    type="range"
                    {...register('topP', { valueAsNumber: true })}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nucleus sampling
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency Penalty ({watch('frequencyPenalty')})
                  </label>
                  <input
                    type="range"
                    {...register('frequencyPenalty', { valueAsNumber: true })}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Riduce le ripetizioni
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presence Penalty ({watch('presencePenalty')})
                  </label>
                  <input
                    type="range"
                    {...register('presencePenalty', { valueAsNumber: true })}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Aumenta la varietà dei temi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite mensile richieste
                  </label>
                  <input
                    type="number"
                    {...register('monthlyLimit', { valueAsNumber: true })}
                    placeholder="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  {...register('systemPrompt')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Inserisci il prompt di sistema per guidare il comportamento dell'AI..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Definisce il comportamento e il tono dell'assistente AI
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
            <li>Vai su <a href="https://platform.openai.com/" target="_blank" className="text-blue-600 hover:text-blue-800">OpenAI Platform</a></li>
            <li>Accedi o crea un account</li>
            <li>Vai nella sezione "API keys"</li>
            <li>Crea una nuova secret key</li>
            <li>Copia immediatamente la chiave (non sarà più visibile)</li>
            <li>Imposta un budget mensile nelle impostazioni di billing</li>
            <li>Incolla la chiave qui e salva</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded-md">
            <p className="text-sm font-medium text-yellow-900">💡 Suggerimenti:</p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-1">
              <li>GPT-3.5 Turbo è più economico e veloce per uso generale</li>
              <li>GPT-4 offre risposte più accurate per questioni complesse</li>
              <li>Temperature bassa (0.3-0.7) per risposte più consistenti</li>
              <li>Temperature alta (1.0-1.5) per più creatività</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
