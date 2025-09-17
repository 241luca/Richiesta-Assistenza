import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SparklesIcon,
  CogIcon,
  XMarkIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface ProfessionalAiCustomization {
  id: string;
  professionalId: string;
  subcategoryId: string;
  subcategory?: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  customSystemPrompt?: string;
  customKnowledgeBase?: any;
  customTone?: string;
  customInitialMessage?: string;
  customTemperature?: number;
  customMaxTokens?: number;
  preferredExamples?: any;
  avoidTopics?: any;
  specializations?: any;
  isActive: boolean;
}

interface Props {
  professionalId: string;
  professionalName?: string;
  isAdmin?: boolean;
}

export function ProfessionalAiSettings({ professionalId, professionalName, isAdmin = false }: Props) {
  const queryClient = useQueryClient();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fetch professional's subcategories with AI settings
  const { data: subcategoriesData, isLoading } = useQuery({
    queryKey: ['professional-ai-settings', professionalId],
    queryFn: async () => {
      const response = await api.get(`/professionals/${professionalId}/ai-settings`);
      return response.data.data;
    },
    enabled: !!professionalId,
  });

  const subcategories = subcategoriesData || [];

  const handleOpenConfig = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setShowConfigModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Personalizzazione AI {isAdmin && professionalName ? `- ${professionalName}` : ''}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configura le impostazioni AI personalizzate per ogni sottocategoria
              </p>
            </div>
          </div>
        </div>

        {subcategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>Nessuna sottocategoria assegnata</p>
            <p className="text-sm mt-1">
              {isAdmin 
                ? 'Assegna prima delle sottocategorie a questo professionista' 
                : 'Assegna prima delle sottocategorie al professionista'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subcategories.map((item: any) => (
              <div
                key={item.subcategoryId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.subcategory?.name || 'Sottocategoria'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.subcategory?.category?.name || 'Categoria'}
                    </p>
                    
                    {item.customization ? (
                      <div className="mt-2 space-y-1">
                        {item.customization.customTone && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Tono: {item.customization.customTone}
                          </span>
                        )}
                        {item.customization.customTemperature && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                            Temp: {item.customization.customTemperature}
                          </span>
                        )}
                        {item.customization.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-1">
                            Attivo
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">
                        Usa impostazioni predefinite
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleOpenConfig(item.subcategoryId)}
                    className="ml-3 p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Configura AI"
                  >
                    <CogIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedSubcategory && (
        <AiCustomizationModal
          professionalId={professionalId}
          subcategoryId={selectedSubcategory}
          subcategory={subcategories.find((s: any) => s.subcategoryId === selectedSubcategory)}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedSubcategory(null);
          }}
          onSuccess={() => {
            setShowConfigModal(false);
            setSelectedSubcategory(null);
            queryClient.invalidateQueries({ queryKey: ['professional-ai-settings', professionalId] });
          }}
        />
      )}
    </div>
  );
}

// Modal Component for AI Customization
function AiCustomizationModal({
  professionalId,
  subcategoryId,
  subcategory,
  onClose,
  onSuccess
}: {
  professionalId: string;
  subcategoryId: string;
  subcategory: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    customSystemPrompt: '',
    customTone: 'professional',
    customInitialMessage: '',
    customTemperature: 0.7,
    customMaxTokens: 2048,
    preferredExamples: '',
    avoidTopics: '',
    specializations: '',
    useKnowledgeBase: false,
    isActive: true
  });
  
  const [kbDocuments, setKbDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load existing customization if exists
  useEffect(() => {
    if (subcategory?.customization) {
      setFormData({
        customSystemPrompt: subcategory.customization.customSystemPrompt || '',
        customTone: subcategory.customization.customTone || 'professional',
        customInitialMessage: subcategory.customization.customInitialMessage || '',
        customTemperature: subcategory.customization.customTemperature || 0.7,
        customMaxTokens: subcategory.customization.customMaxTokens || 2048,
        preferredExamples: subcategory.customization.preferredExamples?.join('\n') || '',
        avoidTopics: subcategory.customization.avoidTopics?.join('\n') || '',
        specializations: subcategory.customization.specializations?.join('\n') || '',
        useKnowledgeBase: subcategory.customization.useKnowledgeBase ?? false,
        isActive: subcategory.customization.isActive ?? true
      });
      
      // Load existing KB documents
      if (subcategory.customization.kbDocuments) {
        setKbDocuments(subcategory.customization.kbDocuments);
      }
    }
  }, [subcategory]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/professionals/${professionalId}/ai-settings/${subcategoryId}`, {
        ...data,
        preferredExamples: data.preferredExamples ? data.preferredExamples.split('\n').filter(Boolean) : [],
        avoidTopics: data.avoidTopics ? data.avoidTopics.split('\n').filter(Boolean) : [],
        specializations: data.specializations ? data.specializations.split('\n').filter(Boolean) : []
      });
    },
    onSuccess: () => {
      toast.success('Personalizzazione AI salvata con successo');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Personalizzazione AI - {subcategory?.subcategory?.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Configura parametri AI personalizzati per questo professionista
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* System Prompt Personalizzato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Prompt Personalizzato
              </label>
              <textarea
                value={formData.customSystemPrompt}
                onChange={(e) => setFormData({ ...formData, customSystemPrompt: e.target.value })}
                rows={4}
                placeholder="Es: Sei un esperto elettricista con 20 anni di esperienza, specializzato in impianti domotici..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lascia vuoto per usare il prompt predefinito della sottocategoria
              </p>
            </div>

            {/* Tono e Stile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tono Conversazione
                </label>
                <select
                  value={formData.customTone}
                  onChange={(e) => setFormData({ ...formData, customTone: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
                >
                  <option value="professional">Professionale</option>
                  <option value="friendly">Amichevole</option>
                  <option value="technical">Tecnico</option>
                  <option value="educational">Educativo</option>
                  <option value="casual">Informale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature ({formData.customTemperature})
                </label>
                <input
                  type="range"
                  value={formData.customTemperature}
                  onChange={(e) => setFormData({ ...formData, customTemperature: parseFloat(e.target.value) })}
                  min="0"
                  max="2"
                  step="0.1"
                  className="block w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Preciso</span>
                  <span>Bilanciato</span>
                  <span>Creativo</span>
                </div>
              </div>
            </div>

            {/* Messaggio Iniziale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Messaggio di Benvenuto Personalizzato
              </label>
              <textarea
                value={formData.customInitialMessage}
                onChange={(e) => setFormData({ ...formData, customInitialMessage: e.target.value })}
                rows={2}
                placeholder="Es: Ciao! Sono Mario, elettricista specializzato. Come posso aiutarti oggi?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
            </div>

            {/* Specializzazioni */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specializzazioni (una per riga)
              </label>
              <textarea
                value={formData.specializations}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                rows={3}
                placeholder="Impianti domotici&#10;Pannelli fotovoltaici&#10;Sistemi di sicurezza"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
            </div>

            {/* Esempi Preferiti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Esempi da Utilizzare (uno per riga)
              </label>
              <textarea
                value={formData.preferredExamples}
                onChange={(e) => setFormData({ ...formData, preferredExamples: e.target.value })}
                rows={3}
                placeholder="Ho risolto un problema simile installando...&#10;Nel mio ultimo intervento ho utilizzato..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
            </div>

            {/* Argomenti da Evitare */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Argomenti da Evitare (uno per riga)
              </label>
              <textarea
                value={formData.avoidTopics}
                onChange={(e) => setFormData({ ...formData, avoidTopics: e.target.value })}
                rows={2}
                placeholder="Prezzi specifici&#10;Marche concorrenti"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
            </div>

            {/* Knowledge Base Section */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="useKnowledgeBase"
                  checked={formData.useKnowledgeBase}
                  onChange={(e) => setFormData({ ...formData, useKnowledgeBase: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="useKnowledgeBase" className="ml-2 text-sm font-medium text-gray-700">
                  Usa Knowledge Base Personalizzata
                </label>
              </div>
              
              {formData.useKnowledgeBase && (
                <div className="mt-3 border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Documenti Knowledge Base</h4>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                      {uploadingFile ? 'Caricamento...' : 'Upload File'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setUploadingFile(true);
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('professionalId', professionalId);
                        formData.append('subcategoryId', subcategoryId);
                        
                        try {
                          const response = await api.post(
                            `/professionals/${professionalId}/kb-documents/upload`, 
                            formData, 
                            { headers: { 'Content-Type': 'multipart/form-data' } }
                          );
                          
                          setKbDocuments(prev => [...prev, response.data.data]);
                          toast.success('File caricato con successo');
                        } catch (error: any) {
                          toast.error(error.response?.data?.error || 'Errore durante il caricamento');
                        } finally {
                          setUploadingFile(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }}
                    />
                  </div>
                  
                  {kbDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {kbDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                              <p className="text-xs text-gray-500">
                                {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.delete(
                                  `/professionals/${professionalId}/kb-documents/${doc.id}`
                                );
                                setKbDocuments(prev => prev.filter(d => d.id !== doc.id));
                                toast.success('Documento rimosso');
                              } catch (error) {
                                toast.error('Errore durante la rimozione');
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nessun documento caricato. Clicca su "Upload File" per aggiungere documenti personalizzati.
                    </p>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      <strong>Nota:</strong> Questi documenti saranno utilizzati dall'AI solo per questo professionista 
                      e questa sottocategoria, in aggiunta alla knowledge base generale.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens (lunghezza risposta)
              </label>
              <input
                type="number"
                value={formData.customMaxTokens}
                onChange={(e) => setFormData({ ...formData, customMaxTokens: parseInt(e.target.value) })}
                min="100"
                max="4096"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 border"
              />
            </div>

            {/* Attivazione */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Personalizzazione AI Attiva
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva Personalizzazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
