import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CpuChipIcon, 
  UserGroupIcon,
  ChartBarIcon,
  BeakerIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  UserIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { DualConfigManager } from './DualConfigManager';
import { PhoneNumberManager } from './PhoneNumberManager';
import { KBEditor } from './KBEditor';
import { TestPlayground } from './TestPlayground';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { TemplateManager } from './TemplateManager';
import { toast } from 'react-hot-toast';

export function AIDualeDashboard() {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [activeTab, setActiveTab] = useState('templates');

  // Fetch lista professionisti
  const { data: professionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: async () => {
      const response = await api.get('/users/professionals');
      return response.data?.data || [];
    }
  });

  // Fetch sottocategorie del professionista selezionato
  const { data: professionalData, isLoading: loadingProfData } = useQuery({
    queryKey: ['professional-subcategories', selectedProfessional],
    queryFn: async () => {
      if (!selectedProfessional) return null;
      
      // Prendi le sottocategorie del professionista
      const subcategoriesResponse = await api.get(`/user/subcategories/${selectedProfessional}`);
      const subcategories = subcategoriesResponse.data?.data || [];
      
      // Prendi anche i dati completi del professionista dall'admin
      const userResponse = await api.get(`/admin/users/${selectedProfessional}`);
      const userData = userResponse.data?.data;
      
      console.log('AI Duale - Sottocategorie caricate:', subcategories);
      console.log('AI Duale - User data:', userData);
      console.log('AI Duale - Prima sottocategoria:', subcategories[0]);
      
      return {
        user: userData?.user || userData,
        subcategories: subcategories
      };
    },
    enabled: !!selectedProfessional
  });

  // Se non c'è un professionista selezionato, mostra la selezione
  if (!selectedProfessional) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CpuChipIcon className="h-8 w-8 text-purple-600" />
            Gestione AI - Sistema Duale
          </h1>
          <p className="text-gray-600 mt-2">
            Configura l'AI duale per ogni professionista: modalità tecnica per professionisti e modalità semplificata per clienti
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              Seleziona Professionista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfessionals ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Caricamento professionisti...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {professionals?.map((professional: any) => (
                  <button
                    key={professional.id}
                    onClick={() => setSelectedProfessional(professional.id)}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{professional.fullName}</p>
                        <p className="text-sm text-gray-600">{professional.email}</p>
                        {professional.profession && (
                          <p className="text-xs text-purple-600 mt-1">{professional.profession}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </button>
                ))}

                {(!professionals || professionals.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nessun professionista trovato nel sistema
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trova i dati del professionista selezionato
  const currentProfessional = professionals?.find((p: any) => p.id === selectedProfessional);

  return (
    <div className="p-6">
      {/* Header con info professionista */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
              Configurazione AI Duale
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-600">Professionista:</span>
              <span className="font-medium text-purple-600">
                {currentProfessional?.fullName || 'Caricamento...'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProfessional('')}
                className="ml-4"
              >
                Cambia Professionista
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert informativo */}
      <Alert className="mb-6 bg-purple-50 border-purple-200">
        <CpuChipIcon className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Sistema AI Duale:</strong> Configura risposte differenziate per professionisti (info tecniche complete) 
          e clienti (info semplificate). L'AI rileva automaticamente chi sta scrivendo e adatta la risposta.
        </AlertDescription>
      </Alert>

      {/* Verifica sottocategorie abilitate */}
      {loadingProfData ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento dati professionista...</p>
            </div>
          </CardContent>
        </Card>
      ) : !professionalData?.subcategories || professionalData.subcategories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Nessuna sottocategoria abilitata</p>
              <p className="text-sm mt-1">
                Questo professionista non ha sottocategorie abilitate. 
                Vai in "Gestione Professionisti" per abilitarle.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Tabs principali */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <DocumentDuplicateIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Template</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Numeri</span>
            </TabsTrigger>
            <TabsTrigger value="kb" className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4" />
              <span className="hidden sm:inline">KB</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <BeakerIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Test</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <TemplateManager 
              professionalId={selectedProfessional}
              subcategoryId={professionalData?.subcategories?.[0]?.subcategoryId || professionalData?.subcategories?.[0]?.id}
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <DualConfigManager 
              professionalId={selectedProfessional}
              subcategories={professionalData?.subcategories || []}
            />
          </TabsContent>

          <TabsContent value="numbers" className="mt-6">
            <PhoneNumberManager professionalId={selectedProfessional} />
          </TabsContent>

          <TabsContent value="kb" className="mt-6">
            <KBEditor 
              professionalId={selectedProfessional}
              subcategories={professionalData?.subcategories || []}
            />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <TestPlayground professionalId={selectedProfessional} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard professionalId={selectedProfessional} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
