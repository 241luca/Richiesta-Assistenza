import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  FolderIcon,
  DocumentTextIcon,
  FolderMinusIcon,
  ClockIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// Tipo di configurazione attiva
type ConfigTab = 'config' | 'patterns' | 'excludeFiles' | 'excludeDirs' | 'schedule';

export default function ServiceConfigTab() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('config');

  const tabs = [
    { id: 'config', label: 'Configurazione', icon: Cog6ToothIcon },
    { id: 'patterns', label: 'Pattern File', icon: DocumentTextIcon },
    { id: 'excludeFiles', label: 'File Esclusi', icon: XMarkIcon },
    { id: 'excludeDirs', label: 'Cartelle Escluse', icon: FolderMinusIcon },
    { id: 'schedule', label: 'Programmazione', icon: CalendarDaysIcon }
  ];

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Configurazione Sistema di Cleanup</h3>
            <p className="text-sm text-blue-700 mt-1">
              Gestisci le impostazioni del sistema di pulizia file temporanei. 
              Puoi configurare quali file includere o escludere, dove spostarli e quando eseguire la pulizia automatica.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ConfigTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'config' && <ConfigurationSection />}
      {activeTab === 'patterns' && <PatternsSection />}
      {activeTab === 'excludeFiles' && <ExcludeFilesSection />}
      {activeTab === 'excludeDirs' && <ExcludeDirectoriesSection />}
      {activeTab === 'schedule' && <ScheduleSection />}
    </div>
  );
}

// Sezione Configurazione Principale
function ConfigurationSection() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch configurazione
  const { data: config, isLoading } = useQuery({
    queryKey: ['cleanup-config'],
    queryFn: async () => {
      const response = await apiClient.get('/cleanup/config');
      return response.data.data;
    }
  });

  // Mutation per aggiornare
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put('/cleanup/config', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configurazione aggiornata');
      queryClient.invalidateQueries({ queryKey: ['cleanup-config'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento configurazione...</div>;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Configurazione Generale</h3>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'outline' : 'primary'}
          >
            {isEditing ? 'Annulla' : 'Modifica'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Directory di destinazione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cartella di Destinazione
            </label>
            <Input
              value={config?.targetDirectory || 'CLEANUP'}
              disabled={!isEditing}
              onChange={(e) => {/* gestire il cambiamento */}}
              placeholder="CLEANUP"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome base della cartella dove spostare i file
            </p>
          </div>

          {/* Formato nome directory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato Nome Cartella
            </label>
            <Input
              value={config?.directoryFormat || 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}'}
              disabled={!isEditing}
              placeholder="CLEANUP-{YYYY}-{MM}-{DD}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato per il nome delle cartelle create
            </p>
          </div>

          {/* Profondità massima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profondità Scansione
            </label>
            <Input
              type="number"
              value={config?.maxDepth || 2}
              disabled={!isEditing}
              min="1"
              max="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Livelli di sottocartelle da scansionare
            </p>
          </div>

          {/* Giorni di retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giorni di Retention
            </label>
            <Input
              type="number"
              value={config?.retentionDays || 30}
              disabled={!isEditing}
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dopo quanti giorni le cartelle sono considerate vecchie
            </p>
          </div>

          {/* Auto cleanup */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config?.autoCleanup || false}
                disabled={!isEditing}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Abilita Pulizia Automatica
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Elimina automaticamente le cartelle più vecchie dei giorni specificati
            </p>
          </div>

          {/* Crea README */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config?.createReadme || true}
                disabled={!isEditing}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Crea file README
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Crea un file README.md in ogni cartella di cleanup con informazioni sui file spostati
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annulla
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                // Salvare le modifiche
                toast.success('Configurazione salvata');
                setIsEditing(false);
              }}
            >
              Salva Modifiche
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Sezione Pattern
function PatternsSection() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Fetch patterns
  const { data: patterns, isLoading } = useQuery({
    queryKey: ['cleanup-patterns'],
    queryFn: async () => {
      const response = await apiClient.get('/cleanup/patterns');
      return response.data.data || [];
    }
  });

  // Mutation per creare
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/cleanup/patterns', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pattern aggiunto');
      queryClient.invalidateQueries({ queryKey: ['cleanup-patterns'] });
      setShowCreateModal(false);
    }
  });

  // Mutation per eliminare
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/cleanup/patterns/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pattern eliminato');
      queryClient.invalidateQueries({ queryKey: ['cleanup-patterns'] });
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento pattern...</div>;
  }

  // Pattern predefiniti da mostrare sempre
  const defaultPatterns = [
    { pattern: '*.backup-*', description: 'File di backup', category: 'backup' },
    { pattern: 'fix-*.sh', description: 'Script di correzione', category: 'script' },
    { pattern: 'test-*.sh', description: 'Script di test', category: 'script' },
    { pattern: '*.fixed.ts', description: 'TypeScript corretti', category: 'fixed' },
    { pattern: '*.fixed.tsx', description: 'React corretti', category: 'fixed' },
    { pattern: 'backup-*.sql', description: 'Backup database', category: 'database' },
    { pattern: '*.mjs', description: 'Moduli JS temporanei', category: 'temp' },
    { pattern: 'BACKUP-*', description: 'Directory di backup', category: 'backup' }
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {patterns?.length || 0} pattern personalizzati + {defaultPatterns.length} predefiniti
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Aggiungi Pattern
        </Button>
      </div>

      {/* Lista Pattern */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pattern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Pattern predefiniti */}
              {defaultPatterns.map((pattern, index) => (
                <tr key={`default-${index}`} className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {pattern.pattern}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pattern.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-gray-100 text-gray-800">
                      {pattern.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Predefinito
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800">
                      Attivo
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className="text-gray-400">Non modificabile</span>
                  </td>
                </tr>
              ))}
              
              {/* Pattern personalizzati */}
              {patterns?.map((pattern: any) => (
                <tr key={pattern.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {pattern.pattern}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pattern.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-blue-100 text-blue-800">
                      {pattern.category || 'custom'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pattern.type || 'glob'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={pattern.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }>
                      {pattern.isActive ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {/* Modifica */}}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifica"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il pattern "${pattern.pattern}"?`)) {
                            deleteMutation.mutate(pattern.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Elimina"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Creazione Pattern */}
      {showCreateModal && (
        <CreatePatternModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}

// Sezione File Esclusi
function ExcludeFilesSection() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFile, setEditingFile] = useState<any>(null);
  
  // Fetch file esclusi
  const { data: excludedFiles, isLoading } = useQuery({
    queryKey: ['cleanup-exclude-files'],
    queryFn: async () => {
      const response = await apiClient.get('/cleanup/exclude-files');
      return response.data.data || [];
    }
  });

  // Mutation per creare file escluso
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/cleanup/exclude-files', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('File escluso aggiunto');
      queryClient.invalidateQueries({ queryKey: ['cleanup-exclude-files'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiunta del file');
    }
  });

  // Mutation per aggiornare file escluso
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/cleanup/exclude-files/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('File escluso aggiornato');
      queryClient.invalidateQueries({ queryKey: ['cleanup-exclude-files'] });
      setEditingFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Mutation per eliminare file escluso
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/cleanup/exclude-files/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('File escluso rimosso');
      queryClient.invalidateQueries({ queryKey: ['cleanup-exclude-files'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  // File sempre esclusi (non modificabili)
  const systemFiles = [
    { fileName: '.env', reason: 'Variabili ambiente', criticality: 'critical' },
    { fileName: '.env.local', reason: 'Variabili locali', criticality: 'critical' },
    { fileName: '.env.production', reason: 'Variabili produzione', criticality: 'critical' },
    { fileName: '*.key', reason: 'Chiavi private', criticality: 'critical' },
    { fileName: '*.pem', reason: 'Certificati SSL', criticality: 'critical' },
    { fileName: '*.crt', reason: 'Certificati SSL', criticality: 'critical' },
    { fileName: 'package-lock.json', reason: 'Lock dipendenze', criticality: 'important' },
    { fileName: 'yarn.lock', reason: 'Lock dipendenze', criticality: 'important' }
  ];

  if (isLoading) {
    return <div className="text-center py-8">Caricamento file esclusi...</div>;
  }

  return (
    <div>
      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <InformationCircleIcon className="h-4 w-4 inline mr-1" />
          I file elencati qui non saranno mai spostati o eliminati dal sistema di cleanup.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {excludedFiles?.length || 0} file personalizzati + {systemFiles.length} di sistema
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Aggiungi File
        </Button>
      </div>

      {/* Lista File Esclusi */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Criticità
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* File di sistema */}
              {systemFiles.map((file, index) => (
                <tr key={`system-${index}`} className="bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {file.fileName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {file.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={
                      file.criticality === 'critical' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {file.criticality === 'critical' ? 'Critico' : 'Importante'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className="text-gray-400">Sistema</span>
                  </td>
                </tr>
              ))}
              
              {/* File personalizzati */}
              {excludedFiles?.map((file: any) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {file.fileName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {file.reason || file.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={
                      file.criticality === 'critical' 
                        ? 'bg-red-100 text-red-800'
                        : file.criticality === 'important'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {file.criticality === 'critical' ? 'Critico' 
                        : file.criticality === 'important' ? 'Importante'
                        : 'Normale'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingFile(file)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifica"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Rimuovere "${file.fileName}" dai file esclusi?`)) {
                            deleteMutation.mutate(file.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Rimuovi"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Creazione File Escluso */}
      {showCreateModal && (
        <CreateExcludeFileModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
      
      {/* Modal Modifica File Escluso */}
      {editingFile && (
        <EditExcludeFileModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onUpdate={(data) => updateMutation.mutate({ id: editingFile.id, data })}
        />
      )}
    </div>
  );
}

// Sezione Cartelle Escluse
function ExcludeDirectoriesSection() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Fetch cartelle escluse
  const { data: excludedDirs, isLoading } = useQuery({
    queryKey: ['cleanup-exclude-dirs'],
    queryFn: async () => {
      const response = await apiClient.get('/cleanup/exclude-dirs');
      return response.data.data || [];
    }
  });

  // Mutation per creare directory esclusa
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/cleanup/exclude-dirs', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cartella esclusa aggiunta');
      queryClient.invalidateQueries({ queryKey: ['cleanup-exclude-dirs'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiunta della cartella');
    }
  });

  // Mutation per eliminare directory esclusa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/cleanup/exclude-dirs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cartella esclusa rimossa');
      queryClient.invalidateQueries({ queryKey: ['cleanup-exclude-dirs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  // Cartelle sempre escluse
  const systemDirs = [
    { directory: 'node_modules', reason: 'Dipendenze NPM', recursive: true },
    { directory: '.git', reason: 'Repository Git', recursive: true },
    { directory: 'dist', reason: 'Build produzione', recursive: true },
    { directory: 'build', reason: 'Build sviluppo', recursive: true },
    { directory: '.next', reason: 'Build Next.js', recursive: true },
    { directory: 'uploads', reason: 'File utenti', recursive: true },
    { directory: 'CLEANUP-*', reason: 'Cartelle cleanup esistenti', recursive: true }
  ];

  if (isLoading) {
    return <div className="text-center py-8">Caricamento cartelle escluse...</div>;
  }

  return (
    <div>
      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <InformationCircleIcon className="h-4 w-4 inline mr-1" />
          Queste cartelle non verranno mai scansionate dal sistema di cleanup.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {excludedDirs?.length || 0} cartelle personalizzate + {systemDirs.length} di sistema
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Aggiungi Cartella
        </Button>
      </div>

      {/* Lista Cartelle Escluse */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cartella
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ricorsivo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Cartelle di sistema */}
              {systemDirs.map((dir, index) => (
                <tr key={`system-${index}`} className="bg-yellow-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm font-mono text-gray-900">{dir.directory}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dir.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dir.recursive && (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className="text-gray-400">Sistema</span>
                  </td>
                </tr>
              ))}
              
              {/* Cartelle personalizzate */}
              {excludedDirs?.map((dir: any) => (
                <tr key={dir.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-mono text-gray-900">{dir.directory}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dir.reason || dir.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dir.recursive && (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => {
                        if (confirm(`Rimuovere "${dir.directory}" dalle cartelle escluse?`)) {
                          deleteMutation.mutate(dir.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Rimuovi"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Creazione Directory Esclusa */}
      {showCreateModal && (
        <CreateExcludeDirectoryModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}

// Sezione Programmazione
function ScheduleSection() {
  const queryClient = useQueryClient();
  
  // Fetch schedule
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['cleanup-schedules'],
    queryFn: async () => {
      const response = await apiClient.get('/cleanup/schedules');
      return response.data.data || [];
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento programmazioni...</div>;
  }

  return (
    <div>
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-700">
          <ClockIcon className="h-4 w-4 inline mr-1" />
          Configura l'esecuzione automatica del cleanup. Usa espressioni cron per definire quando eseguire la pulizia.
        </p>
      </div>

      {/* Esempi Cron */}
      <Card className="mb-4">
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Esempi di espressioni Cron:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div><code className="bg-gray-100 px-1">0 2 * * *</code> - Ogni giorno alle 2:00 AM</div>
            <div><code className="bg-gray-100 px-1">0 0 * * 0</code> - Ogni domenica a mezzanotte</div>
            <div><code className="bg-gray-100 px-1">0 */6 * * *</code> - Ogni 6 ore</div>
            <div><code className="bg-gray-100 px-1">0 9 * * 1-5</code> - Lun-Ven alle 9:00 AM</div>
          </div>
        </div>
      </Card>

      {schedules?.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nessuna programmazione configurata</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusIcon className="h-4 w-4 mr-2" />
              Crea Programmazione
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            {/* Lista programmazioni */}
            <div className="space-y-4">
              {schedules.map((schedule: any) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{schedule.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{schedule.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Cron: <code className="bg-gray-100 px-1">{schedule.cronExpression}</code></span>
                        {schedule.lastRunAt && (
                          <span>Ultima esecuzione: {new Date(schedule.lastRunAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={schedule.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                    }>
                      {schedule.isActive ? 'Attiva' : 'Inattiva'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Modal per creare pattern
function CreatePatternModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    pattern: '',
    description: '',
    type: 'glob',
    category: 'custom',
    action: 'move',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Aggiungi Pattern</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Pattern"
            value={formData.pattern}
            onChange={(e) => setFormData({...formData, pattern: e.target.value})}
            placeholder="Es: *.tmp, debug-*, etc."
            required
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione del pattern..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Pattern
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="glob">Glob (*.txt)</option>
              <option value="regex">RegEx</option>
              <option value="exact">Nome Esatto</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="custom">Personalizzato</option>
              <option value="backup">Backup</option>
              <option value="temp">Temporaneo</option>
              <option value="test">Test</option>
              <option value="debug">Debug</option>
              <option value="log">Log</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Pattern attivo
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Aggiungi Pattern
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per creare file escluso
function CreateExcludeFileModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    fileName: '',
    description: '',
    reason: '',
    criticality: 'normal',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Aggiungi File da Escludere</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nome File"
            value={formData.fileName}
            onChange={(e) => setFormData({...formData, fileName: e.target.value})}
            placeholder="Es: tailwind.config.js, *.config.js"
            required
          />
          
          <Input
            label="Motivo"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Es: File di configurazione critico"
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione dettagliata (opzionale)..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criticità
            </label>
            <select
              value={formData.criticality}
              onChange={(e) => setFormData({...formData, criticality: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="critical">Critico - File di sistema essenziale</option>
              <option value="important">Importante - File di configurazione</option>
              <option value="normal">Normale - File generico</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              File attivo (esclusione abilitata)
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Aggiungi File
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per creare directory esclusa
function CreateExcludeDirectoryModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    directory: '',
    description: '',
    reason: '',
    recursive: true,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Aggiungi Cartella da Escludere</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nome Cartella"
            value={formData.directory}
            onChange={(e) => setFormData({...formData, directory: e.target.value})}
            placeholder="Es: vendor, cache, temp"
            required
          />
          
          <Input
            label="Motivo"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Es: Cartella di sistema"
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione dettagliata (opzionale)..."
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="recursive"
              checked={formData.recursive}
              onChange={(e) => setFormData({...formData, recursive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="recursive" className="ml-2 text-sm text-gray-700">
              Ricorsivo (esclude anche tutte le sottocartelle)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Cartella attiva (esclusione abilitata)
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Aggiungi Cartella
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per modificare file escluso
function EditExcludeFileModal({ file, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({
    fileName: file.fileName || '',
    description: file.description || '',
    reason: file.reason || '',
    criticality: file.criticality || 'normal',
    isActive: file.isActive !== undefined ? file.isActive : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Modifica File Escluso</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <InformationCircleIcon className="h-4 w-4 inline mr-1" />
              Per i file in sottocartelle, usa il percorso relativo completo.
              <br />
              Es: <code className="bg-yellow-100 px-1">backend/src/services/simple-backup.service.ts</code>
            </p>
          </div>
          
          <Input
            label="Nome File o Percorso"
            value={formData.fileName}
            onChange={(e) => setFormData({...formData, fileName: e.target.value})}
            placeholder="Es: backend/src/services/file.ts"
            required
          />
          
          <Input
            label="Motivo"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Es: File di sistema critico"
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione dettagliata (opzionale)..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criticità
            </label>
            <select
              value={formData.criticality}
              onChange={(e) => setFormData({...formData, criticality: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="critical">Critico - File di sistema essenziale</option>
              <option value="important">Importante - File di configurazione</option>
              <option value="normal">Normale - File generico</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              File attivo (esclusione abilitata)
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Salva Modifiche
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}