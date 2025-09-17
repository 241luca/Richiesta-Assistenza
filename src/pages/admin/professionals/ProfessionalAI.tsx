import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CpuChipIcon, 
  DocumentTextIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/api';
import toast from 'react-hot-toast';

export default function ProfessionalAI() {
  const { professionalId } = useParams();
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    responseStyle: 'formal',
    detailLevel: 'intermediate',
    useKnowledgeBase: true,
    systemPrompt: ''
  });

  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      // Usa l'endpoint admin che ha più dati
      const response = await apiClient.get(`/admin/users/${professionalId}`);
      return response.data.data?.user || response.data.data || response.data;
    }
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['professional-subcategories', professionalId],
    queryFn: async () => {
      try {
        // Usa l'endpoint corretto per ottenere le competenze assegnate
        const response = await apiClient.get(`/user/subcategories/${professionalId}`);
        console.log('Sottocategorie caricate per AI:', response.data);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento sottocategorie:', error);
        return [];
      }
    },
    enabled: !!professionalId
  });

  const { data: currentSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['ai-settings', professionalId, selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return null;
      try {
        const response = await apiClient.get(`/professionals/${professionalId}/ai-settings/${selectedSubcategory}`);
        console.log('AI Settings loaded:', response.data);
        const data = response.data.data || response.data;
        if (data) {
          setAiSettings({
            model: data.modelName || 'gpt-3.5-turbo',
            temperature: data.temperature || 0.7,
            maxTokens: data.maxTokens || 2000,
            responseStyle: data.responseStyle || 'formal',
            detailLevel: data.detailLevel || 'intermediate',
            useKnowledgeBase: data.useKnowledgeBase !== false,
            systemPrompt: data.systemPrompt || ''
          });
        }
        return data;
      } catch (error) {
        console.error('Errore caricamento impostazioni AI:', error);
        return null;
      }
    },
    enabled: !!selectedSubcategory
  });

  const { data: kbDocuments = [] } = useQuery({
    queryKey: ['kb-documents', professionalId, selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return [];
      try {
        const response = await apiClient.get(`/kb-documents`, {
          params: {
            professionalId,
            subcategoryId: selectedSubcategory
          }
        });
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedSubcategory
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        modelName: aiSettings.model,
        temperature: aiSettings.temperature,
        maxTokens: aiSettings.maxTokens,
        responseStyle: aiSettings.responseStyle,
        detailLevel: aiSettings.detailLevel,
        useKnowledgeBase: aiSettings.useKnowledgeBase,
        systemPrompt: aiSettings.systemPrompt || ''
      };
      console.log('Saving AI settings with systemPrompt:', aiSettings.systemPrompt);
      console.log('Full payload:', JSON.stringify(payload));
      return apiClient.put(`/professionals/${professionalId}/ai-settings/${selectedSubcategory}`, payload);
    },
    onSuccess: (response) => {
      console.log('Save response:', response.data);
      toast.success('Impostazioni AI salvate');
      refetchSettings(); // Ricarica i dati
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('professionalId', professionalId!);
      formData.append('subcategoryId', selectedSubcategory);
      
      return apiClient.post('/kb-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      toast.success('Documento caricato con successo');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel caricamento');
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiClient.delete(`/kb-documents/${documentId}`);
    },
    onSuccess: () => {
      toast.success('Documento rimosso');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Impostazioni AI</h1>
              <p className="text-gray-600">{professional?.firstName} {professional?.lastName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selezione Sottocategoria */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleziona Sottocategoria da Configurare
        </label>
        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">-- Seleziona una sottocategoria --</option>
          {subcategories.map((sub: any) => {
            // Gestisci entrambi i formati: subcategory (minuscolo) o Subcategory (maiuscolo)
            const subcategory = sub.subcategory || sub.Subcategory;
            const subcategoryId = sub.subcategoryId || subcategory?.id;
            const subcategoryName = subcategory?.name || 'Nome non disponibile';
            const categoryName = subcategory?.category?.name || '';
            
            return (
              <option key={subcategoryId} value={subcategoryId}>
                {subcategoryName} {categoryName ? `(${categoryName})` : ''}
              </option>
            );
          })}
        </select>
        
        {subcategories.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Nessuna sottocategoria configurata. Aggiungi prima delle competenze nella sezione apposita.
          </p>
        )}
      </div>

      {selectedSubcategory && (
        <>
          {/* Configurazione AI */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
              Configurazione Assistente AI
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Prima colonna */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modello AI
                  </label>
                  <select 
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Veloce ed economico)</option>
                    <option value="gpt-4">GPT-4 (Più accurato)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Bilanciato)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stile Risposte
                  </label>
                  <select 
                    value={aiSettings.responseStyle}
                    onChange={(e) => setAiSettings({...aiSettings, responseStyle: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="formal">Formale</option>
                    <option value="informal">Informale</option>
                    <option value="technical">Tecnico</option>
                    <option value="educational">Educativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Livello di Dettaglio
                  </label>
                  <select 
                    value={aiSettings.detailLevel}
                    onChange={(e) => setAiSettings({...aiSettings, detailLevel: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="basic">Base</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzato</option>
                  </select>
                </div>
              </div>

              {/* Seconda colonna */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura (Creatività)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Preciso (0)</span>
                    <span>{aiSettings.temperature}</span>
                    <span>Creativo (1)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Massimi
                  </label>
                  <input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAiSettings({...aiSettings, maxTokens: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                    min="500"
                    max="4000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lunghezza massima delle risposte (500-4000)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useKb"
                    checked={aiSettings.useKnowledgeBase}
                    onChange={(e) => setAiSettings({...aiSettings, useKnowledgeBase: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="useKb" className="text-sm font-medium text-gray-700">
                    Usa Knowledge Base Personale
                  </label>
                </div>
              </div>
            </div>

            {/* Prompt di Sistema - Campo grande a tutta larghezza */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt di Sistema
                <span className="text-xs text-gray-500 ml-2">
                  (Istruzioni personalizzate per l'AI su come comportarsi e rispondere)
                </span>
              </label>
              <textarea
                value={aiSettings.systemPrompt}
                onChange={(e) => setAiSettings({...aiSettings, systemPrompt: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="Es: Sei un esperto elettricista con 20 anni di esperienza. Rispondi in modo professionale ma comprensibile, fornendo sempre consigli pratici e mettendo la sicurezza al primo posto. Quando possibile, suggerisci soluzioni temporanee e definitive."
              />
              <p className="text-xs text-gray-500 mt-1">
                Il prompt guida il comportamento dell'AI. Puoi specificare il tono, il livello di dettaglio, 
                le competenze specifiche e qualsiasi altra istruzione per personalizzare le risposte.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => saveSettingsMutation.mutate()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Salva Impostazioni AI
              </button>
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
              Knowledge Base Personale
            </h2>
            
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">
                  Carica documenti per personalizzare le risposte dell'AI
                </p>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                  Seleziona File
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formati supportati: PDF, DOC, DOCX, TXT (max 10MB)
                </p>
              </div>
            </div>

            {/* Lista Documenti */}
            {kbDocuments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Documenti Caricati ({kbDocuments.length})
                </h3>
                {kbDocuments.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          {doc.fileType} • {(doc.size / 1024).toFixed(1)} KB • 
                          Caricato il {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Rimuovere questo documento?')) {
                          deleteDocumentMutation.mutate(doc.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                Nessun documento caricato per questa sottocategoria
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
