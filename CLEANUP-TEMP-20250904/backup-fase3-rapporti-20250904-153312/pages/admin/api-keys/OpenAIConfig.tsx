import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CpuChipIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import ApiKeysLayout from './ApiKeysLayout';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

export default function OpenAIConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    configuration: {
      enabled: true,
      model: 'gpt-3.5-turbo',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      defaultSystemPrompt: 'Sei un assistente professionale per un sistema di richiesta assistenza tecnica. Rispondi in italiano in modo chiaro e professionale.',
      features: {
        chatAssistant: true,
        autoSuggestions: true,
        smartRouting: false,
        documentAnalysis: false
      },
      usageLimit: {
        daily: 1000,
        monthly: 30000
      }
    }
  });

  // Fetch OpenAI API key
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['api-key', 'OPENAI'],
    queryFn: async () => {
      const response = await api.get('/admin/api-keys/OPENAI');
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
        service: 'OPENAI',
        ...data
      });
    },
    onSuccess: () => {
      toast.success('OpenAI API key salvata con successo!');
      queryClient.invalidateQueries({ queryKey: ['api-key', 'OPENAI'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setFormData(prev => ({ ...prev, key: '' }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore nel salvataggio');
    }
  });

  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/api-keys/OPENAI/test');
    },
    onSuccess: (data) => {
      if (data.data.success) {
        toast.success('Connessione OpenAI funzionante!');
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
    
    if (!formData.key) {
      toast.error('Inserisci una API key valida');
      return;
    }

    if (!formData.key.startsWith('sk-')) {
      toast.error('Formato API key non valido. Deve iniziare con "sk-"');
      return;
    }

    saveMutation.mutate({
      key: formData.key,
      configuration: formData.configuration,
      isActive: true
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        features: {
          ...prev.configuration.features,
          [feature]: !prev.configuration.features[feature as keyof typeof prev.configuration.features]
        }
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
            <div className="bg-purple-100 p-3 rounded-lg">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">OpenAI API</h2>
              <p className="text-gray-600 mt-1">
                Configurazione per ChatGPT e assistenza AI
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
                OpenAI API Key *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showKey ? "text" : "password"}
                  id="api-key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder={apiKey?.key ? "Inserisci una nuova chiave per aggiornarla" : "sk-..."}
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
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Dashboard OpenAI
                </a>
              </p>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurazione Modello</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Modello AI
                </label>
                <select
                  id="model"
                  value={formData.configuration.model}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      model: e.target.value
                    }
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Economico)</option>
                  <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
                  <option value="gpt-4">GPT-4 (Avanzato)</option>
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo (Beta)</option>
                </select>
              </div>

              <div>
                <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="max-tokens"
                  value={formData.configuration.maxTokens}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      maxTokens: parseInt(e.target.value)
                    }
                  }))}
                  min="100"
                  max="4096"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Massimo numero di token per risposta (1 token ≈ 4 caratteri)
                </p>
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature ({formData.configuration.temperature})
                </label>
                <input
                  type="range"
                  id="temperature"
                  value={formData.configuration.temperature}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      temperature: parseFloat(e.target.value)
                    }
                  }))}
                  min="0"
                  max="2"
                  step="0.1"
                  className="mt-1 block w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Creatività delle risposte (0 = deterministico, 2 = molto creativo)
                </p>
              </div>

              <div>
                <label htmlFor="top-p" className="block text-sm font-medium text-gray-700">
                  Top P ({formData.configuration.topP})
                </label>
                <input
                  type="range"
                  id="top-p"
                  value={formData.configuration.topP}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      topP: parseFloat(e.target.value)
                    }
                  }))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="mt-1 block w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nucleus sampling (1 = considera tutte le parole)
                </p>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Prompt Default</h3>
            
            <div>
              <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700">
                Prompt di Sistema
              </label>
              <textarea
                id="system-prompt"
                value={formData.configuration.defaultSystemPrompt}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    defaultSystemPrompt: e.target.value
                  }
                }))}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Definisci il comportamento dell'assistente AI..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Questo prompt definisce il comportamento base dell'AI per tutti gli utenti
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Funzionalità AI</h3>
            
            <div className="space-y-3">
              {[
                { 
                  id: 'chatAssistant', 
                  name: 'Chat Assistant', 
                  description: 'Assistente chat per supporto clienti',
                  icon: SparklesIcon
                },
                { 
                  id: 'autoSuggestions', 
                  name: 'Suggerimenti Automatici', 
                  description: 'Suggerimenti AI per compilazione form',
                  icon: SparklesIcon
                },
                { 
                  id: 'smartRouting', 
                  name: 'Smart Routing', 
                  description: 'Assegnazione automatica richieste con AI',
                  icon: AdjustmentsHorizontalIcon
                },
                { 
                  id: 'documentAnalysis', 
                  name: 'Analisi Documenti', 
                  description: 'Analisi automatica documenti allegati',
                  icon: CpuChipIcon
                }
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <label key={feature.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.configuration.features[feature.id as keyof typeof formData.configuration.features]}
                      onChange={() => handleFeatureToggle(feature.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 text-purple-500 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Limiti di Utilizzo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="daily-limit" className="block text-sm font-medium text-gray-700">
                  Limite Giornaliero (richieste)
                </label>
                <input
                  type="number"
                  id="daily-limit"
                  value={formData.configuration.usageLimit.daily}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      usageLimit: {
                        ...prev.configuration.usageLimit,
                        daily: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="monthly-limit" className="block text-sm font-medium text-gray-700">
                  Limite Mensile (richieste)
                </label>
                <input
                  type="number"
                  id="monthly-limit"
                  value={formData.configuration.usageLimit.monthly}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      usageLimit: {
                        ...prev.configuration.usageLimit,
                        monthly: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Imposta limiti per controllare i costi di utilizzo dell'API
            </p>
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
                Come configurare OpenAI
              </h3>
              <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>Vai su <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                <li>Crea un account o accedi</li>
                <li>Vai nella sezione API Keys</li>
                <li>Crea una nuova secret key</li>
                <li>Imposta un budget di spesa mensile per evitare sorprese</li>
                <li>Copia la chiave qui sopra (inizia con "sk-")</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Attenzione ai costi:</strong> OpenAI addebita per token utilizzato. 
                  GPT-3.5 costa circa $0.002/1K tokens, GPT-4 circa $0.03/1K tokens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApiKeysLayout>
  );
}
