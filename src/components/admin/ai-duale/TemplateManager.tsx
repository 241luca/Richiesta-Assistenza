import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { 
  DocumentDuplicateIcon,
  FolderIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { BulkTemplateManager } from './BulkTemplateManager';

interface TemplateManagerProps {
  professionalId?: string;
  subcategoryId?: string;
  onApplyTemplate?: (template: any) => void;
}

export function TemplateManager({ professionalId, subcategoryId, onApplyTemplate }: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('actions');
  const queryClient = useQueryClient();

  // Fetch templates disponibili
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['ai-templates', subcategoryId],
    queryFn: async () => {
      try {
        const response = await api.get('/ai/templates', {
          params: { subcategoryId }
        });
        return response.data?.data || [];
      } catch (err: any) {
        // Se l'endpoint non esiste ancora, ritorna array vuoto senza loggare errore
        if (err.response?.status === 404) {
          // Rimosso il console.log per non inquinare la console
          // Funzionalità templates non ancora implementata
          return [];
        }
        throw err;
      }
    },
    // Disabilita il retry per 404
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false; // Non riprovare se è 404
      }
      return failureCount < 3;
    }
  });

  // Fetch azioni personalizzate del professional
  const { data: customActions } = useQuery({
    queryKey: ['ai-custom-actions', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      try {
        const response = await api.get(`/professionals/${professionalId}/ai-actions`);
        return response.data?.data || [];
      } catch (err: any) {
        // Stessa logica - non loggare se non esiste
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!professionalId,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Mutation per applicare un template
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post('/ai/templates/apply', {
        templateId,
        professionalId,
        subcategoryId
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Template applicato con successo');
      queryClient.invalidateQueries({ queryKey: ['ai-custom-actions', professionalId] });
      if (onApplyTemplate) {
        onApplyTemplate(data.data);
      }
    },
    onError: (error: any) => {
      // Gestione errore più user-friendly
      if (error.response?.status === 404) {
        toast.error('Funzionalità template non ancora disponibile');
      } else {
        toast.error('Errore nell\'applicazione del template');
      }
    }
  });

  // Se non ci sono templates e non sta caricando, mostra un messaggio informativo
  if (!isLoading && (!templates || templates.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentDuplicateIcon className="h-5 w-5" />
            Gestione Template AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="mb-2">I template AI saranno presto disponibili</p>
            <p className="text-sm">Questa funzionalità è in fase di sviluppo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DocumentDuplicateIcon className="h-5 w-5" />
          Gestione Template AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions">
              <CubeIcon className="h-4 w-4 mr-2" />
              Azioni
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FolderIcon className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <UsersIcon className="h-4 w-4 mr-2" />
              Applicazione Multipla
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Azioni Personalizzate</h3>
              {customActions && customActions.length > 0 ? (
                <div className="grid gap-3">
                  {customActions.map((action: any) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{action.name}</p>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessuna azione personalizzata configurata</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Template Disponibili</h3>
              {isLoading ? (
                <p>Caricamento template...</p>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-3">
                  {templates.map((template: any) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {template.scope === 'category' && <FolderIcon className="h-4 w-4 text-blue-500" />}
                            {template.scope === 'professional' && <UserGroupIcon className="h-4 w-4 text-green-500" />}
                            {template.scope === 'company' && <BuildingOfficeIcon className="h-4 w-4 text-purple-500" />}
                            <p className="font-medium">{template.name}</p>
                          </div>
                          <p className="text-sm text-gray-500">{template.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {template.actionsCount} azioni • {template.usageCount || 0} utilizzi
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyTemplateMutation.mutate(template.id)}
                          disabled={applyTemplateMutation.isPending}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Applica
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessun template disponibile per questa sottocategoria</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <BulkTemplateManager subcategoryId={subcategoryId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
