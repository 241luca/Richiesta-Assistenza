import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface BulkTemplateManagerProps {
  subcategoryId?: string;
}

export function BulkTemplateManager({ subcategoryId }: BulkTemplateManagerProps) {
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();

  // Fetch professionisti
  const { data: professionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ['professionals-for-bulk', subcategoryId],
    queryFn: async () => {
      const response = await api.get('/users/professionals');
      return response.data?.data || [];
    }
  });

  // Fetch templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates-for-bulk', subcategoryId],
    queryFn: async () => {
      const response = await api.get('/ai/templates', {
        params: { subcategoryId }
      });
      return response.data?.data || [];
    }
  });

  // Mutation per applicazione bulk
  const applyBulkMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/ai/templates/apply-bulk', data);
    },
    onSuccess: (response) => {
      const result = response.data?.data;
      toast.success(`Template applicato a ${result?.successCount || 0} professionisti`);
      if (result?.failedCount > 0) {
        toast.error(`Falliti: ${result.failedCount} professionisti`);
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      setSelectedProfessionals([]);
      setSelectedTemplate('');
    },
    onError: () => {
      toast.error('Errore nell\'applicazione bulk del template');
    }
  });

  // Toggle selezione professionista
  const toggleProfessional = (id: string) => {
    setSelectedProfessionals(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  // Seleziona tutti
  const selectAll = () => {
    setSelectedProfessionals(professionals?.map((p: any) => p.id) || []);
  };

  // Deseleziona tutti
  const deselectAll = () => {
    setSelectedProfessionals([]);
  };

  // Applica template
  const handleApplyBulk = async () => {
    if (!selectedTemplate || selectedProfessionals.length === 0) {
      toast.error('Seleziona un template e almeno un professionista');
      return;
    }

    if (!confirm(`Applicare il template a ${selectedProfessionals.length} professionisti?`)) {
      return;
    }

    setIsApplying(true);
    try {
      await applyBulkMutation.mutateAsync({
        templateId: selectedTemplate,
        professionalIds: selectedProfessionals
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Raggruppa professionisti per team/gruppo
  const professionalsByGroup = professionals?.reduce((acc: any, prof: any) => {
    const group = prof.teamName || 'Senza Team';
    if (!acc[group]) acc[group] = [];
    acc[group].push(prof);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" />
            Applicazione Template in Bulk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selezione Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Template da Applicare
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                disabled={loadingTemplates}
              >
                <option value="">-- Seleziona Template --</option>
                <optgroup label="Template Base">
                  {templates?.filter((t: any) => t.type === 'BASE').map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Template Aziendali">
                  {templates?.filter((t: any) => t.type === 'COMPANY').map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Template di Gruppo">
                  {templates?.filter((t: any) => t.type === 'GROUP').map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.groupName})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Azioni rapide selezione */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={loadingProfessionals}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Seleziona Tutti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={loadingProfessionals}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Deseleziona Tutti
              </Button>
              <span className="ml-auto text-sm text-gray-600 self-center">
                {selectedProfessionals.length} selezionati
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Professionisti */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Seleziona Professionisti</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProfessionals ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento professionisti...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(professionalsByGroup).map(([groupName, groupProfessionals]: [string, any]) => (
                <div key={groupName}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">{groupName}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const groupIds = groupProfessionals.map((p: any) => p.id);
                        const allSelected = groupIds.every((id: string) => 
                          selectedProfessionals.includes(id)
                        );
                        
                        if (allSelected) {
                          setSelectedProfessionals(prev => 
                            prev.filter(id => !groupIds.includes(id))
                          );
                        } else {
                          setSelectedProfessionals(prev => [
                            ...new Set([...prev, ...groupIds])
                          ]);
                        }
                      }}
                    >
                      Seleziona Gruppo
                    </Button>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {groupProfessionals.map((prof: any) => (
                      <label
                        key={prof.id}
                        className={`
                          flex items-center p-3 border rounded-lg cursor-pointer
                          transition-colors hover:bg-gray-50
                          ${selectedProfessionals.includes(prof.id) 
                            ? 'bg-purple-50 border-purple-300' 
                            : 'bg-white'
                          }
                        `}
                      >
                        <Checkbox
                          checked={selectedProfessionals.includes(prof.id)}
                          onCheckedChange={() => toggleProfessional(prof.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{prof.fullName}</p>
                          <p className="text-xs text-gray-600">{prof.email}</p>
                          {prof.profession && (
                            <p className="text-xs text-purple-600 mt-1">
                              {prof.profession}
                            </p>
                          )}
                        </div>
                        {prof.hasCustomConfig && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Config personalizzata
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Azioni */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-900">Riepilogo Applicazione</p>
              <p className="text-sm text-purple-700 mt-1">
                Template: {templates?.find((t: any) => t.id === selectedTemplate)?.name || 'Nessuno'}
              </p>
              <p className="text-sm text-purple-700">
                Professionisti selezionati: {selectedProfessionals.length}
              </p>
            </div>
            <Button
              onClick={handleApplyBulk}
              disabled={!selectedTemplate || selectedProfessionals.length === 0 || isApplying}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isApplying ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Applicazione in corso...
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Applica Template
                </>
              )}
            </Button>
          </div>

          {/* Avviso */}
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Attenzione:</strong> L'applicazione del template sovrascriverà 
              le configurazioni esistenti per i professionisti selezionati. 
              Le personalizzazioni individuali andranno perse.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {professionals?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Professionisti Totali</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {professionals?.filter((p: any) => p.hasCustomConfig).length || 0}
              </p>
              <p className="text-sm text-gray-600">Con Config Personalizzata</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(professionalsByGroup).length}
              </p>
              <p className="text-sm text-gray-600">Gruppi/Team</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
