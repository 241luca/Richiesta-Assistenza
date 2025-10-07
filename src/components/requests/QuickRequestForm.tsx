import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowRightIcon,
  SparklesIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// CORRETTO: Usa l'API service strutturato (senza /api)
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useAISuggestion } from '../../hooks/useAISuggestion';

// Schema di validazione per il form veloce
const quickRequestSchema = z.object({
  description: z.string().min(20, 'Descrizione troppo breve (min 20 caratteri)').max(500, 'Descrizione troppo lunga (max 500 caratteri)'),
  address: z.string().min(5, 'Inserisci un indirizzo valido'),
  requestedDate: z.string().optional(),
});

type QuickRequestFormData = z.infer<typeof quickRequestSchema>;

interface AiSuggestion {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedDuration: number;
  confidence: number;
  reason: string;
}

export function QuickRequestForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<QuickRequestFormData & { aiSuggestion?: AiSuggestion }>({
    description: '',
    address: '',
    requestedDate: '',
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<QuickRequestFormData>({
    resolver: zodResolver(quickRequestSchema),
    defaultValues: formData,
  });

  const watchDescription = watch('description');

  // AI Suggestion hook - suggerimenti in tempo reale
  const { 
    suggestion: aiSuggestionRealtime, 
    loading: aiLoading, 
    error: aiError,
    acceptSuggestion,
    dismissSuggestion,
    hasSuggestion
  } = useAISuggestion(watchDescription || '', {
    enabled: true,
    minLength: 30, // Attiva dopo 30 caratteri per evitare troppe chiamate
    debounceMs: 2000, // Aspetta 2 secondi di pausa
    confidenceThreshold: 0.75 // Mostra solo suggerimenti con alta confidenza
  });

  // Mutation per categorizzazione AI
  const categorizeMutation = useMutation({
    mutationFn: async (description: string) => {
      // CORRETTO: Usa API service senza /api prefix
      const response = await api.post('/ai/categorize-request', { description });
      return response.data.data; // ResponseFormatter
    },
    onSuccess: (data: AiSuggestion) => {
      setFormData(prev => ({ ...prev, aiSuggestion: data }));
      setStep(2);
      toast.success('✨ Categorizzazione completata!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore AI. Procedi manualmente.';
      toast.error(errorMessage);
      
      // Se l'AI fallisce, vai comunque al passo 2 senza suggerimenti
      setStep(2);
    }
  });

  // Mutation per creare richiesta
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // CORRETTO: Usa API service senza /api prefix
      const response = await api.post('/requests', data);
      const responseData = response.data?.data || response.data;
      return responseData?.request || responseData;
    },
    onSuccess: async (data) => {
      toast.success('🎉 Richiesta creata con successo!', { duration: 5000 });
      
      // Invalida le query per aggiornare i dati
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['requests'] }),
        queryClient.invalidateQueries({ queryKey: ['user-requests'] }),
      ]);
      
      // Naviga alla richiesta creata
      setTimeout(() => {
        navigate(`/requests/${data.id}`);
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante la creazione della richiesta';
      toast.error(errorMessage);
    }
  });

  // Gestione submit step 1 (descrizione)
  const handleStep1Submit = (data: QuickRequestFormData) => {
    setFormData(prev => ({ ...prev, description: data.description }));
    categorizeMutation.mutate(data.description);
  };

  // Gestione submit step 2 (indirizzo + conferma)
  const handleStep2Submit = (data: QuickRequestFormData) => {
    const { aiSuggestion } = formData;
    
    if (!aiSuggestion) {
      toast.error('Categorizzazione AI non disponibile. Usa la modalità standard.');
      return;
    }

    // Prepara i dati per la creazione della richiesta
    const requestData = {
      title: generateTitle(data.description, aiSuggestion),
      description: data.description,
      categoryId: aiSuggestion.categoryId,
      subcategoryId: aiSuggestion.subcategoryId,
      priority: aiSuggestion.priority,
      address: data.address,
      city: extractCityFromAddress(data.address), // Helper function
      province: 'IT', // Default o da estrarre dall'indirizzo
      postalCode: '00100', // Default o da estrarre dall'indirizzo
      requestedDate: data.requestedDate ? new Date(data.requestedDate).toISOString() : undefined,
      notes: `Richiesta creata con modalità veloce. Durata stimata: ${aiSuggestion.estimatedDuration} min. Confidenza AI: ${Math.round(aiSuggestion.confidence * 100)}%`,
    };

    createMutation.mutate(requestData);
  };

  // Helper per generare un titolo dalla descrizione
  const generateTitle = (description: string, aiSuggestion: AiSuggestion): string => {
    const words = description.split(' ').slice(0, 6);
    const shortDesc = words.join(' ');
    return `${aiSuggestion.categoryName}: ${shortDesc}${description.length > shortDesc.length ? '...' : ''}`;
  };

  // Helper per estrarre la città dall'indirizzo (versione semplificata)
  const extractCityFromAddress = (address: string): string => {
    // Versione semplificata - in un caso reale useresti l'API di geocoding
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : 'Roma';
  };

  // Calcola il progresso
  const progress = (step / 2) * 100;

  // Helper per formattare la priorità
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-gray-600 bg-gray-100';
      case 'MEDIUM': return 'text-blue-600 bg-blue-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'URGENT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Bassa';
      case 'MEDIUM': return 'Media'; 
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
      default: return 'Media';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header con progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 mr-3 text-purple-600" />
            ⚡ Richiesta Veloce
          </h1>
          <button
            onClick={() => navigate('/requests')}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Annulla
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Modalità semplificata con intelligenza artificiale per creare rapidamente una richiesta
        </p>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="flex mb-2">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Step {step} di 2</div>
            </div>
            <div className="text-xs text-gray-500">{Math.round(progress)}% completato</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: Descrizione */}
      {step === 1 && (
        <form onSubmit={handleSubmit(handleStep1Submit)} className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              🗣️ Di cosa hai bisogno?
            </label>
            <textarea
              {...register('description')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Esempio: Ho una perdita d'acqua sotto il lavandino della cucina. L'acqua gocciola costantemente anche con i rubinetti chiusi. Il problema è iniziato ieri sera e ora si sta formando una pozza sul pavimento..."
              className="w-full h-40 border-2 border-gray-300 rounded-xl p-4 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                {watchDescription?.length || 0}/500 caratteri
              </p>
              <div className="flex items-center gap-2 text-purple-600">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {watchDescription && watchDescription.length >= 30 
                    ? (aiLoading ? 'AI sta analizzando...' : (hasSuggestion ? 'Suggerimento AI disponibile!' : 'AI pronta (scrivi di più per suggerimenti)'))
                    : 'L\'AI ti aiuterà in tempo reale (dopo 30 caratteri)'
                  }
                </span>
              </div>
            </div>
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* AI Suggestion Real-time */}
          {watchDescription && watchDescription.length >= 30 && (
            <div className="mb-4">
              {aiLoading && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                    <span className="text-sm text-purple-700 font-medium">
                      🤖 L'AI sta analizzando la tua descrizione...
                    </span>
                  </div>
                </div>
              )}

              {hasSuggestion && aiSuggestionRealtime && !aiLoading && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-1.5">
                      <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        ✨ Suggerimento AI in tempo reale
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-purple-700 font-medium">Categoria:</span>
                          <div className="text-purple-900">{aiSuggestionRealtime.categoryName}</div>
                        </div>
                        <div>
                          <span className="text-purple-700 font-medium">Priorità:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${getPriorityColor(aiSuggestionRealtime.priority)}`}>
                            {getPriorityLabel(aiSuggestionRealtime.priority)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-purple-600">
                        Confidenza: <span className="font-bold">{Math.round(aiSuggestionRealtime.confidence * 100)}%</span>
                        {' • '}
                        Durata stimata: <span className="font-bold">{aiSuggestionRealtime.estimatedDuration} min</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const accepted = acceptSuggestion();
                            if (accepted) {
                              setFormData(prev => ({ ...prev, aiSuggestion: accepted }));
                              toast.success('✨ Suggerimento AI applicato!');
                            }
                          }}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full transition-colors"
                        >
                          Usa suggerimento
                        </button>
                        <button
                          type="button"
                          onClick={dismissSuggestion}
                          className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 transition-colors"
                        >
                          Ignora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>AI temporaneamente non disponibile: {aiError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <SparklesIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">
                  🤖 AI Real-time + Suggerimenti per una descrizione efficace:
                </h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• <strong>L'AI analizza mentre scrivi!</strong> Dopo 30 caratteri vedrai suggerimenti</li>
                  <li>• Descrivi il problema in modo dettagliato per migliori suggerimenti</li>
                  <li>• Indica quando è iniziato e dove si trova (cucina, bagno...)</li>
                  <li>• Menziona cosa hai già provato - l'AI lo considererà</li>
                  <li>• Più dettagli = suggerimenti AI più precisi ✨</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!watchDescription || watchDescription.length < 20 || categorizeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {categorizeMutation.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                </svg>
                <SparklesIcon className="h-5 w-5" />
                Analisi AI in corso...
              </>
            ) : (
              <>
                Avanti con l'AI
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Indirizzo + Conferma AI */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* AI Suggestion Card */}
          {formData.aiSuggestion && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-2">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">
                    🎯 L'AI suggerisce:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-purple-700">Categoria:</span>
                      <div className="text-purple-900 font-medium">{formData.aiSuggestion.categoryName}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Sottocategoria:</span>
                      <div className="text-purple-900 font-medium">{formData.aiSuggestion.subcategoryName}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Priorità:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.aiSuggestion.priority)}`}>
                        {getPriorityLabel(formData.aiSuggestion.priority)}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Durata stimata:</span>
                      <div className="text-purple-900 font-medium">{formData.aiSuggestion.estimatedDuration} minuti</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white/60 rounded-lg">
                    <span className="font-semibold text-purple-700">Motivazione:</span>
                    <p className="text-purple-900 italic mt-1">{formData.aiSuggestion.reason}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-purple-600">
                      Confidenza AI: <span className="font-bold">{Math.round(formData.aiSuggestion.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      ✨ Powered by AI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Indirizzo Form */}
          <form onSubmit={handleSubmit(handleStep2Submit)} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                <MapPinIcon className="h-6 w-6 inline mr-2 text-green-600" />
                Dove ti serve l'intervento?
              </label>
              <input
                type="text"
                {...register('address')}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Via Roma 123, Milano MI"
                className="w-full border-2 border-gray-300 rounded-xl p-4 text-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Inserisci l'indirizzo completo per calcolare i costi di trasferta
              </p>
              {errors.address && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Data Preferita (Opzionale) */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                <CalendarIcon className="h-6 w-6 inline mr-2 text-blue-600" />
                Quando preferiresti l'intervento? 
                <span className="text-sm text-gray-500 font-normal ml-1">(opzionale)</span>
              </label>
              <input
                type="datetime-local"
                {...register('requestedDate')}
                value={formData.requestedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border-2 border-gray-300 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <p className="text-sm text-gray-500 mt-2">
                Il professionista confermerà la disponibilità per la data scelta
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Indietro
              </button>
              <button
                type="submit"
                disabled={!formData.address || createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                    </svg>
                    Creazione...
                  </>
                ) : (
                  <>
                    Crea Richiesta
                    <CheckCircleIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State per tutto il form */}
      {(categorizeMutation.isPending || createMutation.isPending) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <div className="mb-4">
                <SparklesIcon className="h-12 w-12 mx-auto text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {categorizeMutation.isPending ? '🤖 Analisi AI in corso...' : '🚀 Creazione richiesta...'}
              </h3>
              <p className="text-gray-600 text-sm">
                {categorizeMutation.isPending 
                  ? 'L\'intelligenza artificiale sta analizzando la tua richiesta' 
                  : 'Stiamo preparando la tua richiesta di assistenza'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
