import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  CogIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { SaveIcon } from 'lucide-react';

interface KnowledgeBaseConfigProps {
  professionalId: string;
  subcategoryId: string;
  subcategoryName?: string;
}

interface KBConfig {
  maxPerDocument: number;
  maxTotalCharacters: number;
  searchKeywordMinLength: number;
  contextBeforeKeyword: number;
  contextAfterKeyword: number;
  defaultChunkSize: number;
  chunkOverlap: number;
  enableSmartSearch: boolean;
  enableAutoProcess: boolean;
  includeFullDocument: boolean;
  includeMetadata: boolean;
  includeFileName: boolean;
  customPromptPrefix?: string;
  customPromptSuffix?: string;
  cacheEnabled: boolean;
  cacheTTL: number;
}

export function KnowledgeBaseConfigPanel({ 
  professionalId, 
  subcategoryId,
  subcategoryName 
}: KnowledgeBaseConfigProps) {
  const [activeTab, setActiveTab] = useState<'professional' | 'client'>('professional');
  const queryClient = useQueryClient();

  // Carica configurazione esistente
  const { data: config, isLoading } = useQuery({
    queryKey: ['kb-config', professionalId, subcategoryId, activeTab],
    queryFn: async () => {
      const response = await api.get(`/knowledge-base/config/${professionalId}/${subcategoryId}/${activeTab}`);
      return response.data?.data;
    }
  });

  // Stati locali per il form
  const [formData, setFormData] = useState<KBConfig>({
    maxPerDocument: 4000,
    maxTotalCharacters: 8000,
    searchKeywordMinLength: 3,
    contextBeforeKeyword: 500,
    contextAfterKeyword: 500,
    defaultChunkSize: 1000,
    chunkOverlap: 100,
    enableSmartSearch: true,
    enableAutoProcess: false,
    includeFullDocument: false,
    includeMetadata: true,
    includeFileName: true,
    customPromptPrefix: '',
    customPromptSuffix: '',
    cacheEnabled: true,
    cacheTTL: 3600
  });

  // Aggiorna form quando i dati vengono caricati
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: async (data: KBConfig) => {
      return await api.post(`/knowledge-base/config/${professionalId}/${subcategoryId}/${activeTab}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-config'] });
      toast.success('Configurazione salvata con successo!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    // Valori di default basati sul target audience
    const defaults = activeTab === 'professional' 
      ? {
          maxPerDocument: 6000,
          maxTotalCharacters: 12000,
          searchKeywordMinLength: 3,
          contextBeforeKeyword: 500,
          contextAfterKeyword: 500,
          defaultChunkSize: 1500,
          chunkOverlap: 150,
          enableSmartSearch: true,
          enableAutoProcess: false,
          includeFullDocument: false,
          includeMetadata: true,
          includeFileName: true,
          customPromptPrefix: 'Usa terminologia tecnica precisa e dettagliata.',
          customPromptSuffix: 'Fornisci dettagli tecnici completi.',
          cacheEnabled: true,
          cacheTTL: 3600
        }
      : {
          maxPerDocument: 3000,
          maxTotalCharacters: 6000,
          searchKeywordMinLength: 3,
          contextBeforeKeyword: 300,
          contextAfterKeyword: 300,
          defaultChunkSize: 800,
          chunkOverlap: 80,
          enableSmartSearch: true,
          enableAutoProcess: false,
          includeFullDocument: false,
          includeMetadata: false,
          includeFileName: true,
          customPromptPrefix: 'Spiega in modo semplice e comprensibile, evitando tecnicismi.',
          customPromptSuffix: 'Usa un linguaggio accessibile a tutti.',
          cacheEnabled: true,
          cacheTTL: 3600
        };
    
    setFormData(defaults);
    toast.success('Configurazione ripristinata ai valori di default');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CogIcon className="h-5 w-5 text-purple-600" />
            <CardTitle>Configurazione Knowledge Base</CardTitle>
            {subcategoryName && (
              <span className="text-sm text-gray-500">- {subcategoryName}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reset Default
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <SaveIcon className="h-4 w-4 mr-1" />
              Salva
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab per target audience */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('professional')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'professional'
                ? 'bg-white shadow text-purple-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Configurazione Professionisti
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'client'
                ? 'bg-white shadow text-purple-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Configurazione Clienti
          </button>
        </div>

        {/* Sezione Limiti Caratteri */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Limiti Caratteri
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max per documento
              </label>
              <input
                type="number"
                value={formData.maxPerDocument}
                onChange={(e) => setFormData({ ...formData, maxPerDocument: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Massimo caratteri estratti da ogni documento
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max totale caratteri
              </label>
              <input
                type="number"
                value={formData.maxTotalCharacters}
                onChange={(e) => setFormData({ ...formData, maxTotalCharacters: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limite totale per il contesto AI
              </p>
            </div>
          </div>
        </div>

        {/* Sezione Ricerca Intelligente */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-4 w-4" />
            Ricerca Intelligente
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Abilita ricerca intelligente
              </label>
              <input
                type="checkbox"
                checked={formData.enableSmartSearch}
                onChange={(e) => setFormData({ ...formData, enableSmartSearch: e.target.checked })}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>

            {formData.enableSmartSearch && (
              <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-purple-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lunghezza min. keyword
                  </label>
                  <input
                    type="number"
                    value={formData.searchKeywordMinLength}
                    onChange={(e) => setFormData({ ...formData, searchKeywordMinLength: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contesto prima (caratteri)
                  </label>
                  <input
                    type="number"
                    value={formData.contextBeforeKeyword}
                    onChange={(e) => setFormData({ ...formData, contextBeforeKeyword: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contesto dopo (caratteri)
                  </label>
                  <input
                    type="number"
                    value={formData.contextAfterKeyword}
                    onChange={(e) => setFormData({ ...formData, contextAfterKeyword: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opzioni Avanzate */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Opzioni Avanzate</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Includi documento completo</label>
              <input
                type="checkbox"
                checked={formData.includeFullDocument}
                onChange={(e) => setFormData({ ...formData, includeFullDocument: e.target.checked })}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Includi metadata</label>
              <input
                type="checkbox"
                checked={formData.includeMetadata}
                onChange={(e) => setFormData({ ...formData, includeMetadata: e.target.checked })}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Includi nome file</label>
              <input
                type="checkbox"
                checked={formData.includeFileName}
                onChange={(e) => setFormData({ ...formData, includeFileName: e.target.checked })}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Processa automaticamente all'upload</label>
              <input
                type="checkbox"
                checked={formData.enableAutoProcess}
                onChange={(e) => setFormData({ ...formData, enableAutoProcess: e.target.checked })}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Prompts */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Personalizzazione Prompt</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefisso prompt (opzionale)
              </label>
              <textarea
                value={formData.customPromptPrefix || ''}
                onChange={(e) => setFormData({ ...formData, customPromptPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
                placeholder={activeTab === 'professional' 
                  ? "Es: Usa terminologia tecnica precisa..."
                  : "Es: Spiega in modo semplice..."
                }
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suffisso prompt (opzionale)
              </label>
              <textarea
                value={formData.customPromptSuffix || ''}
                onChange={(e) => setFormData({ ...formData, customPromptSuffix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
                placeholder="Aggiungi istruzioni finali per l'AI"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-2">
            ℹ️ Configurazione per: {activeTab === 'professional' ? 'Professionisti' : 'Clienti'}
          </h4>
          <p className="text-xs text-purple-700">
            {activeTab === 'professional' 
              ? 'Queste impostazioni vengono applicate quando un professionista usa l\'AI. I limiti sono più alti per fornire informazioni tecniche dettagliate.'
              : 'Queste impostazioni vengono applicate quando un cliente usa l\'AI. I limiti sono più bassi per fornire risposte semplici e dirette.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
