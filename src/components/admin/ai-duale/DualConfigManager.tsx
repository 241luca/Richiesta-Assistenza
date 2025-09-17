import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { KnowledgeBaseConfigPanel } from './KnowledgeBaseConfigPanel';
import { AITestModal } from './AITestModal';
import { 
  Cog6ToothIcon,
  UserIcon,
  WrenchIcon,
  SparklesIcon,
  DocumentTextIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface DualConfigManagerProps {
  professionalId: string;
  subcategories: any[];
}

interface AISettings {
  modelName: string;
  temperature: number;
  maxTokens: number;
  responseStyle: string;
  detailLevel: string;
  systemPrompt: string;
  useKnowledgeBase: boolean;
}

export function DualConfigManager({ professionalId, subcategories }: DualConfigManagerProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'professional' | 'client'>('professional');
  const [showTestModal, setShowTestModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch impostazioni AI per professionista
  const { data: professionalSettings, isLoading: loadingProfSettings } = useQuery({
    queryKey: ['professional-ai-settings', professionalId, selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return null;
      try {
        const response = await api.get(`/professionals/${professionalId}/ai-settings/${selectedSubcategory}`);
        return response.data?.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Se non esistono impostazioni, ritorna i default
          return {
            modelName: 'gpt-4',
            temperature: 0.3,
            maxTokens: 3000,
            responseStyle: 'technical',
            detailLevel: 'advanced',
            systemPrompt: 'Sei un assistente AI tecnico che supporta professionisti esperti. Fornisci informazioni dettagliate, tecniche e complete.',
            useKnowledgeBase: true
          };
        }
        throw error;
      }
    },
    enabled: !!selectedSubcategory
  });

  // Fetch impostazioni AI per cliente
  const { data: clientSettings, isLoading: loadingClientSettings } = useQuery({
    queryKey: ['client-ai-settings', professionalId, selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return null;
      try {
        const response = await api.get(`/client-settings/${professionalId}/${selectedSubcategory}`);
        return response.data?.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Se non esistono impostazioni cliente, ritorna i default
          return {
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1500,
            responseStyle: 'friendly',
            detailLevel: 'basic',
            systemPrompt: 'Sei un assistente cordiale e professionale. Spiega in modo semplice e chiaro, evitando tecnicismi non necessari.',
            useKnowledgeBase: true
          };
        }
        throw error;
      }
    },
    enabled: !!selectedSubcategory
  });

  // Mutation per salvare impostazioni professionista
  const saveProfessionalSettings = useMutation({
    mutationFn: async (data: AISettings) => {
      return api.put(`/professionals/${professionalId}/ai-settings/${selectedSubcategory}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-ai-settings', professionalId, selectedSubcategory] });
      toast.success('Impostazioni AI professionista salvate con successo!');
    },
    onError: () => {
      toast.error('Errore nel salvataggio delle impostazioni');
    }
  });

  // Mutation per salvare impostazioni cliente
  const saveClientSettings = useMutation({
    mutationFn: async (data: AISettings) => {
      return api.put(`/client-settings/${professionalId}/${selectedSubcategory}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-ai-settings', professionalId, selectedSubcategory] });
      toast.success('Impostazioni AI cliente salvate con successo!');
    },
    onError: () => {
      toast.error('Errore nel salvataggio delle impostazioni');
    }
  });

  const renderAISettingsForm = (settings: AISettings | null, mode: 'professional' | 'client') => {
    if (!settings) return null;

    const handleSave = () => {
      if (mode === 'professional') {
        saveProfessionalSettings.mutate(settings);
      } else {
        saveClientSettings.mutate(settings);
      }
    };

    const updateSettings = (updates: Partial<AISettings>) => {
      if (mode === 'professional') {
        queryClient.setQueryData(
          ['professional-ai-settings', professionalId, selectedSubcategory], 
          (old: any) => ({ ...old, ...updates })
        );
      } else {
        queryClient.setQueryData(
          ['client-ai-settings', professionalId, selectedSubcategory], 
          (old: any) => ({ ...old, ...updates })
        );
      }
    };

    return (
      <div className="space-y-6">
        {/* Modello AI e parametri base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CpuChipIcon className="inline h-4 w-4 mr-1" />
              Modello AI
            </label>
            <Select
              value={settings.modelName}
              onValueChange={(value) => updateSettings({ modelName: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Veloce)</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (Più intelligente)</SelectItem>
                <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo (Veloce e intelligente)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'professional' 
                ? 'Usa GPT-4 per risposte tecniche più accurate'
                : 'GPT-3.5 è sufficiente per risposte ai clienti'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SparklesIcon className="inline h-4 w-4 mr-1" />
              Temperatura (Creatività)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-center font-mono text-sm">{settings.temperature}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Preciso (0)</span>
              <span>Creativo (1)</span>
            </div>
          </div>
        </div>

        {/* Token massimi e stile risposta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Massimi
            </label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="500"
              max="4000"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lunghezza massima delle risposte (500-4000)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stile Risposte
            </label>
            <Select
              value={settings.responseStyle}
              onValueChange={(value) => updateSettings({ responseStyle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mode === 'professional' ? (
                  <>
                    <SelectItem value="technical">Tecnico</SelectItem>
                    <SelectItem value="formal">Formale</SelectItem>
                    <SelectItem value="educational">Educativo</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="friendly">Amichevole</SelectItem>
                    <SelectItem value="formal">Formale</SelectItem>
                    <SelectItem value="informal">Informale</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Livello di dettaglio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Livello di Dettaglio
          </label>
          <Select
            value={settings.detailLevel}
            onValueChange={(value) => updateSettings({ detailLevel: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Base - Informazioni essenziali</SelectItem>
              <SelectItem value="intermediate">Intermedio - Spiegazioni moderate</SelectItem>
              <SelectItem value="advanced">Avanzato - Dettagli completi</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'professional' 
              ? 'I professionisti ricevono informazioni tecniche dettagliate'
              : 'I clienti ricevono spiegazioni semplificate e comprensibili'}
          </p>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            Prompt di Sistema
          </label>
          <textarea
            value={settings.systemPrompt || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              const cursorPosition = e.target.selectionStart;
              
              updateSettings({ systemPrompt: newValue });
              
              // Ripristina la posizione del cursore dopo il re-render
              setTimeout(() => {
                if (e.target) {
                  e.target.selectionStart = cursorPosition;
                  e.target.selectionEnd = cursorPosition;
                }
              }, 0);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={6}
            placeholder={mode === 'professional' 
              ? "Definisci come l'AI deve comportarsi con i professionisti..."
              : "Definisci come l'AI deve comportarsi con i clienti..."}
          />
          <p className="text-xs text-gray-500 mt-1">
            Istruzioni specifiche per l'AI quando interagisce con {mode === 'professional' ? 'professionisti' : 'clienti'}
          </p>
        </div>

        {/* Knowledge Base */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Usa Knowledge Base
            </label>
            <input
              type="checkbox"
              checked={settings.useKnowledgeBase}
              onChange={(e) => updateSettings({ useKnowledgeBase: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Integra documenti e informazioni dalla knowledge base
          </p>
        </div>

        {/* Pulsanti salva e test */}
        <div className="flex justify-between">
          <Button
            onClick={() => setShowTestModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
            Test AI {mode === 'professional' ? 'Professionista' : 'Cliente'}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={mode === 'professional' ? saveProfessionalSettings.isPending : saveClientSettings.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {(mode === 'professional' ? saveProfessionalSettings.isPending : saveClientSettings.isPending) ? (
              <>Salvataggio...</>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Salva Impostazioni {mode === 'professional' ? 'Professionista' : 'Cliente'}
              </>
            )}
          </Button>
        </div>

        {/* Knowledge Base Manager */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <KnowledgeBaseManager
            professionalId={professionalId}
            subcategoryId={selectedSubcategory}
            targetAudience={mode}
          />
        </div>

        {/* Knowledge Base Configuration Panel */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <KnowledgeBaseConfigPanel
            professionalId={professionalId}
            subcategoryId={selectedSubcategory}
            subcategoryName={subcategories?.find(s => s.subcategoryId === selectedSubcategory || s.id === selectedSubcategory)?.subcategory?.name || subcategories?.find(s => s.subcategoryId === selectedSubcategory || s.id === selectedSubcategory)?.name}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selezione sottocategoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-purple-600" />
            Configurazione AI Duale per Sottocategoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Sottocategoria
              </label>
              <Select
                value={selectedSubcategory}
                onValueChange={setSelectedSubcategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Seleziona una sottocategoria --" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories?.map((subcat) => (
                    <SelectItem 
                      key={subcat.subcategoryId || subcat.id} 
                      value={subcat.subcategoryId || subcat.id}
                    >
                      {subcat.subcategory?.name || subcat.name || 'Nome non disponibile'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedSubcategory && (
              <Alert>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  Seleziona una sottocategoria per configurare le impostazioni AI duali
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurazioni duali */}
      {selectedSubcategory && (
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni AI</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'professional' | 'client')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <WrenchIcon className="h-4 w-4" />
                  Professionista
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="professional" className="mt-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Modalità Professionista:</strong> L'AI fornirà risposte tecniche dettagliate, 
                    dati specifici, margini, costi fornitori e informazioni complete per supportare il lavoro del professionista.
                  </p>
                </div>
                {loadingProfSettings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Caricamento impostazioni...</p>
                  </div>
                ) : (
                  renderAISettingsForm(professionalSettings, 'professional')
                )}
              </TabsContent>

              <TabsContent value="client" className="mt-6">
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Modalità Cliente:</strong> L'AI fornirà risposte semplificate, 
                    comprensibili e professionali, evitando tecnicismi non necessari e informazioni sensibili come margini o costi interni.
                  </p>
                </div>
                {loadingClientSettings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Caricamento impostazioni...</p>
                  </div>
                ) : (
                  renderAISettingsForm(clientSettings, 'client')
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Modal Test AI */}
      {showTestModal && selectedSubcategory && (
        <AITestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          professionalId={professionalId}
          subcategoryId={selectedSubcategory}
          mode={activeTab}
          subcategoryName={subcategories?.find(s => s.subcategoryId === selectedSubcategory || s.id === selectedSubcategory)?.subcategory?.name || subcategories?.find(s => s.subcategoryId === selectedSubcategory || s.id === selectedSubcategory)?.name}
        />
      )}
    </div>
  );
}
