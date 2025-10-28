import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  BeakerIcon,
  ServerIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  CubeIcon,
  CircleStackIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface SmartDocsContainer {
  id: string;
  name: string;
  description?: string;
  type: string;
  external_owner_id: string;
  external_owner_type: string;
  ai_enabled: boolean;
  ai_model?: string;
  ai_prompt?: string;
  rag_enabled: boolean;
  rag_chunk_size: number;
  rag_overlap: number;
  processed_docs: number;
  last_processed_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface ContainerStats {
  document_count: string;
  embedding_count: string;
  total_content_size: string;
}

interface SyncStats {
  auto_sync: {
    total_documents: number;
    total_chunks: number;
    total_tokens: string;
    storage_size_bytes: string;
  };
  manual: {
    total_documents: number;
    total_chunks: number;
    total_tokens: string;
    storage_size_bytes: string;
  };
  total: {
    total_documents: number;
    total_chunks: number;
    total_tokens: string;
    storage_size_bytes: string;
  };
interface DocumentDetail {
  id: string;
  container_id: string;
  title: string;
  file_name?: string;
  file_size?: number;
  status: string;
  upload_date: string;
  processed_date?: string;
  metadata?: {
    semantic_chunks?: number;
    entities_extracted?: number;
    relationships_extracted?: number;
    content_length?: number;
    processing_method?: string;
  };
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}  };
}


function DetailModal({ isOpen, onClose, title, children }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}export default function SmartDocsTestLab() {
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [syncContainerId, setSyncContainerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'query' | 'sync' | 'batch' | 'advanced'>('query');
  
  // Form states
  const [queryText, setQueryText] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customSyncContent, setCustomSyncContent] = useState<string>('');
  
  // UI states
  const [showQueryDebug, setShowQueryDebug] = useState(false);
  const [showSyncDebug, setShowSyncDebug] = useState(false);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const [containerStats, setContainerStats] = useState<ContainerStats | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [documents, setDocuments] = useState<DocumentDetail[]>([]);
  const [batchCount, setBatchCount] = useState<number>(5);
  
  // Modal states
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [showEmbeddingsModal, setShowEmbeddingsModal] = useState(false);
  // Load containers
  const { data: containers = [], isLoading: containersLoading, refetch: refetchContainers } = useQuery({
    queryKey: ['smartdocs-containers'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3500/api/containers');
      if (!response.ok) {
        throw new Error(`Failed to load containers: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    },
    staleTime: 30000, // 30 seconds
  });

  // Load container documents
  const loadContainerDocuments = async (containerId: string) => {
    if (!containerId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/documents/container/${containerId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.success ? data.data : []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };  // Load container stats
  const loadContainerStats = async (containerId: string) => {
    if (!containerId) return;
    
    try {
      const [statsResponse, syncStatsResponse] = await Promise.all([
        fetch(`http://localhost:3500/api/containers/${containerId}/stats`),
        fetch(`http://localhost:3500/api/sync/stats/${containerId}`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setContainerStats(statsData.success ? statsData.data : null);
      }

      if (syncStatsResponse.ok) {
        const syncStatsData = await syncStatsResponse.json();
        setSyncStats(syncStatsData.success ? syncStatsData.data : null);
      }
    } catch (error) {
      console.error('Failed to load container stats:', error);

      // Load documents
      await loadContainerDocuments(containerId);    }
  };

  // Query mutation
  const queryMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('http://localhost:3500/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Query failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Query eseguita con successo!');
    },
    onError: (error: any) => {
      toast.error(`Errore query: ${error.message}`);
    }
  });

  // Sync mutation  
  const syncMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('http://localhost:3500/api/sync/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Sync failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Sync completato con successo!');
      // Ricarica stats del container
      if (syncContainerId) {
        loadContainerStats(syncContainerId);
      }
    },
    onError: (error: any) => {
      toast.error(`Errore sync: ${error.message}`);
    }
  });

  // Batch sync mutation
  const batchSyncMutation = useMutation({
    mutationFn: async (payload: any) => {
      const results = [];
      for (let i = 0; i < batchCount; i++) {
        const batchPayload = {
          ...payload,
          entity_id: `batch-test-${Date.now()}-${i}`,
          title: `Batch Test ${i + 1}/${batchCount} - ${new Date().toLocaleString()}`,
          content: payload.content.replace("{{INDEX}}", (i + 1).toString())
        };
        
        const response = await fetch("http://localhost:3500/api/sync/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchPayload)
        });
        
        const data = await response.json();
        results.push({ index: i + 1, success: data.success, data: data.data, error: data.error });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter((r: any) => r.success).length;
      toast.success(`Batch completato: ${successful}/${batchCount} documenti processati`);
      if (syncContainerId) {
        loadContainerStats(syncContainerId);
      }
    },
    onError: (error: any) => {
      toast.error(`Errore batch: ${error.message}`);
    }
  });
  // Handle container selection
  const handleContainerChange = (containerId: string) => {
    setSyncContainerId(containerId);
    loadContainerStats(containerId);
  };

  // Execute query
  const executeQuery = () => {
    if (!queryText.trim()) {
      toast.error('Inserisci una domanda');
      return;
    }

    const payload: any = {
      question: queryText,
      debug: true
    };

    if (selectedContainer) {
      payload.container_id = selectedContainer;
    }

    if (customPrompt.trim()) {
      payload.custom_prompt = customPrompt;
    }

    queryMutation.mutate(payload);
  };

  // Execute sync
  const executeSync = () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    const testContent = customSyncContent.trim() || `Test SmartDocs - ${new Date().toISOString()}

Questo è un documento di test per verificare il sistema di sincronizzazione SmartDocs.

## Sezione Test 1: Introduzione
Il sistema SmartDocs gestisce documenti e permette interrogazioni RAG (Retrieval-Augmented Generation).

## Sezione Test 2: Funzionalità
- Chunking semantico intelligente
- Generazione embeddings vettoriali
- Knowledge graph extraction
- Query RAG con similarità semantica

## Sezione Test 3: Performance
Il sistema è ottimizzato per gestire grandi volumi di documenti con tempi di risposta rapidi.

## Sezione Test 4: Conclusioni
Questo test verifica l'integrazione completa del pipeline di processing.`;

    const payload = {
      container_id: syncContainerId,
      source_app: 'test-lab',
      entity_type: 'test_document',
      entity_id: `test-${Date.now()}`,
      title: `Test Lab - ${new Date().toLocaleString()}`,
      content: testContent,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'smartdocs-test-lab'
      }
    };

    syncMutation.mutate(payload);
  };

  // Execute batch sync
  const executeBatchSync = () => {
    if (!syncContainerId) {
      toast.error("Seleziona un container");
      return;
    }

    const batchTemplate = customSyncContent.trim() || `Batch Test Document {{INDEX}} - ${new Date().toISOString()}

Questo è il documento numero {{INDEX}} del test batch per SmartDocs.

## Sezione Batch {{INDEX}}.1: Introduzione
Documento di test numero {{INDEX}} per verificare la gestione di multiple operazioni di sync.

## Sezione Batch {{INDEX}}.2: Contenuto Variabile
- Documento ID: {{INDEX}}
- Timestamp: ${new Date().toISOString()}
- Container: ${containers.find((c: any) => c.id === syncContainerId)?.name || "Unknown"}

## Sezione Batch {{INDEX}}.3: Dati Test
Questo contenuto varia per ogni documento del batch per testare:
- Chunking semantico differenziato
- Embedding generation scalabile
- Performance del sistema con carichi multipli

## Sezione Batch {{INDEX}}.4: Conclusioni
Test batch documento {{INDEX}} completato.`;

    const payload = {
      container_id: syncContainerId,
      source_app: "batch-test-lab",
      entity_type: "batch_test_document",
      content: batchTemplate,
      metadata: {
        batch_test: true,
        batch_size: batchCount,
        timestamp: new Date().toISOString(),
        source: "smartdocs-batch-test-lab"
      }
    };

    batchSyncMutation.mutate(payload);
  };  const formatBytes = (bytes: string | number) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <BeakerIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SmartDocs Test Lab</h1>
                <p className="text-gray-600 mt-1">Ambiente di testing per container SmartDocs operativi</p>
              </div>
            </div>
            <button
              onClick={() => refetchContainers()}
              disabled={containersLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${containersLoading ? 'animate-spin' : ''}`} />
              <span>Ricarica</span>
            </button>
          </div>
        </header>

        {/* Status Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">SmartDocs API: http://localhost:3500</span>
              </div>
              {containers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ServerIcon className="w-4 h-4" />
                  <span>{containers.length} container{containers.length !== 1 ? 's' : ''} disponibili</span>
                </div>
              )}
            </div>
            <button
              onClick={() => refetchContainers()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Test Connessione
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Container List */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ServerIcon className="w-5 h-5" />
                  <span>Container ({containers.length})</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">Container operativi SmartDocs</p>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {containersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : containers.length === 0 ? (
                  <div className="text-center py-8">
                    <ServerIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nessun container trovato</p>
                    <button
                      onClick={() => refetchContainers()}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Riprova
                    </button>
                  </div>
                ) : (
                  containers.map((container: SmartDocsContainer) => (
                    <div
                      key={container.id}
                      onClick={() => handleContainerChange(container.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        syncContainerId === container.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">{container.name}</h4>
                            <div className={`w-2 h-2 rounded-full ${
                              container.ai_enabled || container.rag_enabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                          </div>
                          
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <UserIcon className="w-3 h-3" />
                              <span>{container.external_owner_type}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <DocumentTextIcon className="w-3 h-3" />
                              <span>{container.processed_docs} docs</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{new Date(container.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {container.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{container.description}</p>
                          )}

                          <div className="flex items-center space-x-1 mt-2">
                            {container.ai_enabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                🤖 AI
                              </span>
                            )}
                            {container.rag_enabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                🔍 RAG
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Container Stats */}
            {(containerStats || syncStats) && (
              <div className="mt-4 bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">📊 Statistiche</h3>
                </div>
                <div className="p-4 space-y-3">
                  {containerStats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Documenti:</span>
                        <button
                          onClick={() => setShowDocumentsModal(true)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          {containerStats.document_count}
                        </button>                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Embeddings:</span>
                        <button
                          onClick={() => setShowEmbeddingsModal(true)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                        >
                          <CircleStackIcon className="w-3 h-3 mr-1" />
                          {containerStats.embedding_count}
                        </button>                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Dimensione:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {formatBytes(containerStats.total_content_size)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {syncStats && (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Stats</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Tot Chunks:</span>
                            <button
                              onClick={() => setShowChunksModal(true)}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                            >
                              <CubeIcon className="w-3 h-3 mr-1" />
                              {syncStats.total.total_chunks}
                            </button>                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Tokens:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {parseInt(syncStats.total.total_tokens).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { key: 'query', label: 'Test Query RAG', icon: MagnifyingGlassIcon },
                    { key: 'sync', label: 'Test Sync', icon: BoltIcon },
                    { key: 'batch', label: 'Batch Test', icon: RocketLaunchIcon },
                    { key: 'advanced', label: 'Analisi Avanzata', icon: BeakerIcon }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 inline-flex items-center space-x-2 border-b-2 font-medium text-sm ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Query Tab */}
                {activeTab === 'query' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🔍 Test Query RAG</h3>
                      <p className="text-gray-600">Esegui interrogazioni RAG sui container SmartDocs</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="container-select" className="block text-sm font-medium text-gray-700 mb-2">
                          Container (opzionale)
                        </label>
                        <select
                          id="container-select"
                          value={selectedContainer}
                          onChange={(e) => setSelectedContainer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Tutti i container</option>
                          {containers.map((c: SmartDocsContainer) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="query-text" className="block text-sm font-medium text-gray-700 mb-2">
                          Domanda
                        </label>
                        <textarea
                          id="query-text"
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          rows={3}
                          placeholder="Inserisci la tua domanda per il sistema RAG..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          {showAdvancedPrompt ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  CubeIcon,
  CircleStackIcon,
  RocketLaunchIcon className="w-4 h-4" />
                          )}
                          <span>🤖 System Prompt Custom (opzionale)</span>
                        </button>
                        
                        {showAdvancedPrompt && (
                          <div className="mt-2">
                            <textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              rows={4}
                              placeholder="Prompt personalizzato per l'AI..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={executeQuery}
                        disabled={queryMutation.isPending || !queryText.trim()}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {queryMutation.isPending ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <MagnifyingGlassIcon className="w-5 h-5" />
                        )}
                        <span>{queryMutation.isPending ? 'Interrogazione in corso...' : 'Esegui Query RAG'}</span>
                      </button>

                      {/* Query Results */}
                      {queryMutation.data && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                            <h4 className="text-lg font-semibold text-blue-900">📝 Risposta AI</h4>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 mb-4">
                            <p className="text-gray-800 whitespace-pre-wrap">{queryMutation.data.data.answer}</p>
                          </div>

                          {queryMutation.data.data.sources && queryMutation.data.data.sources.length > 0 && (
                            <div>
                              <h5 className="text-md font-semibold text-blue-900 mb-2">
                                📚 Fonti ({queryMutation.data.data.sources.length})
                              </h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {queryMutation.data.data.sources.map((source: any, idx: number) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="font-medium text-blue-700 truncate">{source.title}</h6>
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {(source.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">{source.chunk_text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {queryMutation.data.debug && (
                            <div className="mt-4">
                              <button
                                onClick={() => setShowQueryDebug(!showQueryDebug)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                              >
                                {showQueryDebug ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  CubeIcon,
  CircleStackIcon,
  RocketLaunchIcon className="w-4 h-4" />
                                )}
                                <span>🔍 Dati Debug</span>
                              </button>
                              
                              {showQueryDebug && (
                                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                                  <pre className="text-xs overflow-x-auto max-h-64">
                                    {JSON.stringify(queryMutation.data.debug, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sync Tab */}
                {activeTab === 'sync' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Test Sincronizzazione</h3>
                      <p className="text-gray-600">Testa il processo di ingest e chunking documenti</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="sync-container-select" className="block text-sm font-medium text-gray-700 mb-2">
                          Container di destinazione
                        </label>
                        <select
                          id="sync-container-select"
                          value={syncContainerId}
                          onChange={(e) => handleContainerChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleziona container...</option>
                          {containers.map((c: SmartDocsContainer) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="sync-content" className="block text-sm font-medium text-gray-700 mb-2">
                          Contenuto Test (opzionale)
                        </label>
                        <textarea
                          id="sync-content"
                          value={customSyncContent}
                          onChange={(e) => setCustomSyncContent(e.target.value)}
                          rows={6}
                          placeholder="Inserisci contenuto personalizzato o lascia vuoto per usare il contenuto di default..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={executeSync}
                        disabled={syncMutation.isPending || !syncContainerId}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {syncMutation.isPending ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <BoltIcon className="w-5 h-5" />
                        )}
                        <span>{syncMutation.isPending ? 'Sincronizzazione in corso...' : 'Avvia Test Sync'}</span>
                      </button>

                      {/* Sync Results */}
                      {syncMutation.data && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <h4 className="text-lg font-semibold text-green-900">✅ Test Sync Completato</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Documento ID</div>
                              <div className="font-medium text-gray-900 truncate">
                                {syncMutation.data.data.document_id || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Chunks</div>
                              <div className="font-medium text-gray-900">
                                {syncMutation.data.data.chunks_count || 0}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Embeddings</div>
                              <div className="font-medium text-gray-900">
                                {syncMutation.data.data.embeddings_count || 0}
                              </div>
                            </div>
                          </div>

                          {syncMutation.data.debug && (
                            <div className="mt-4">
                              <button
                                onClick={() => setShowSyncDebug(!showSyncDebug)}
                                className="text-sm text-green-600 hover:text-green-800 flex items-center space-x-1"
                              >
                                {showSyncDebug ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  CubeIcon,
  CircleStackIcon,
  RocketLaunchIcon className="w-4 h-4" />
                                )}
                                <span>🔍 Dati Debug</span>
                              </button>
                              
                              {showSyncDebug && (
                                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                                  <pre className="text-xs overflow-x-auto max-h-64">
                                    {JSON.stringify(syncMutation.data.debug, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Batch Test Tab */}
                {activeTab === 'batch' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Batch Test</h3>
                      <p className="text-gray-600">Esegui test batch con múltipli documenti contemporaneamente</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="batch-container-select" className="block text-sm font-medium text-gray-700 mb-2">
                          Container di destinazione
                        </label>
                        <select
                          id="batch-container-select"
                          value={syncContainerId}
                          onChange={(e) => handleContainerChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleziona container...</option>
                          {containers.map((c: SmartDocsContainer) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="batch-count" className="block text-sm font-medium text-gray-700 mb-2">
                          Numero documenti da creare
                        </label>
                        <input
                          id="batch-count"
                          type="number"
                          min="1"
                          max="20"
                          value={batchCount}
                          onChange={(e) => setBatchCount(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="batch-content" className="block text-sm font-medium text-gray-700 mb-2">
                          Template Contenuto (usa {{INDEX}} per il numero documento)
                        </label>
                        <textarea
                          id="batch-content"
                          value={customSyncContent}
                          onChange={(e) => setCustomSyncContent(e.target.value)}
                          rows={8}
                          placeholder="Usa {{INDEX}} nel testo per inserire il numero del documento. Lascia vuoto per template di default..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={executeBatchSync}
                        disabled={batchSyncMutation.isPending || !syncContainerId}
                        className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {batchSyncMutation.isPending ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <RocketLaunchIcon className="w-5 h-5" />
                        )}
                        <span>
                          {batchSyncMutation.isPending
                            ? `Batch in corso... (${batchCount} docs)`
                            : `Avvia Batch Test (${batchCount} docs)`}
                        </span>
                      </button>

                      {/* Batch Results */}
                      {batchSyncMutation.data && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="w-5 h-5 text-orange-600" />
                            <h4 className="text-lg font-semibold text-orange-900">✅ Batch Test Completato</h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Documenti Processati</div>
                              <div className="font-medium text-gray-900">
                                {batchSyncMutation.data.filter((r: any) => r.success).length} / {batchCount}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Successi</div>
                              <div className="font-medium text-green-600">
                                {batchSyncMutation.data.filter((r: any) => r.success).length}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Errori</div>
                              <div className="font-medium text-red-600">
                                {batchSyncMutation.data.filter((r: any) => !r.success).length}
                              </div>
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            <h5 className="text-md font-semibold text-orange-900 mb-2">Dettagli Batch</h5>
                            <div className="space-y-2">
                              {batchSyncMutation.data.map((result: any, idx: number) => (
                                <div key={idx} className={`p-3 rounded-lg border ${
                                  result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Documento {result.index}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}>
                                      {result.success ? "✅ Successo" : "❌ Errore"}
                                    </span>
                                  </div>
                                  {result.success && result.data && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      Chunks: {result.data.chunks_count || 0} | Embeddings: {result.data.embeddings_count || 0}
                                    </div>
                                  )}
                                  {!result.success && result.error && (
                                    <div className="text-xs text-red-600 mt-1">
                                      {result.error}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🔬 Analisi Avanzata</h3>
                      <p className="text-gray-600">Funzionalità avanzate di analisi (in sviluppo)</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h4 className="text-lg font-semibold text-yellow-900">🚧 In Sviluppo</h4>
                          <p className="text-yellow-700 mt-1">
                            Le funzionalità di analisi avanzata (chunks semantici, knowledge graph, visualizzazioni) 
                            saranno disponibili in una versione futura.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

      {/* Modal per Documenti */}
      <DetailModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        title={`📄 Documenti Container (${documents.length})`}
      >
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessun documento trovato</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    doc.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Upload:</span>
                    <span className="ml-2">{new Date(doc.upload_date).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processato:</span>
                    <span className="ml-2">
                      {doc.processed_date ? new Date(doc.processed_date).toLocaleString() : "N/A"}
                    </span>
                  </div>
                </div>
                {doc.metadata && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Chunks</div>
                      <div className="font-medium">{doc.metadata.semantic_chunks || 0}</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Entities</div>
                      <div className="font-medium">{doc.metadata.entities_extracted || 0}</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Size</div>
                      <div className="font-medium">{doc.metadata.content_length || 0}b</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DetailModal>

      {/* Modal per Chunks */}
      <DetailModal
        isOpen={showChunksModal}
        onClose={() => setShowChunksModal(false)}
        title={`🧩 Chunks Dettaglio`}
      >
        <div className="space-y-3">
          {syncStats ? (
            <>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">📊 Statistiche Chunks</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Auto Sync:</div>
                    <div className="font-medium">{syncStats.auto_sync.total_chunks} chunks</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Manual:</div>
                    <div className="font-medium">{syncStats.manual.total_chunks} chunks</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Tokens:</div>
                    <div className="font-medium">{parseInt(syncStats.total.total_tokens).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Storage:</div>
                    <div className="font-medium">{formatBytes(syncStats.total.storage_size_bytes)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium mb-2">Breakdown per Tipo</h5>
                {syncStats.auto_sync.breakdown && Object.entries(syncStats.auto_sync.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">{key}:</span>
                    <span className="text-sm font-medium">{value.chunks} chunks</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Dati chunks non disponibili</p>
            </div>
          )}
        </div>
      </DetailModal>

      {/* Modal per Embeddings */}
      <DetailModal
        isOpen={showEmbeddingsModal}
        onClose={() => setShowEmbeddingsModal(false)}
        title={`🔮 Embeddings Dettaglio`}
      >
        <div className="space-y-3">
          {containerStats ? (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">📊 Statistiche Embeddings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Totale Embeddings:</div>
                    <div className="text-2xl font-bold text-green-600">{containerStats.embedding_count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Documenti:</div>
                    <div className="text-2xl font-bold text-blue-600">{containerStats.document_count}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Ratio Embeddings/Documenti:</div>
                  <div className="text-lg font-medium">
                    {containerStats.document_count > 0 
                      ? (parseInt(containerStats.embedding_count) / parseInt(containerStats.document_count)).toFixed(1)
                      : "0"} embeddings per documento
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium mb-2">💡 Info Tecniche</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gli embeddings sono rappresentazioni vettoriali del contenuto</li>
                  <li>• Utilizzati per la ricerca semantica e similarità</li>
                  <li>• Generati automaticamente durante il processing</li>
                  <li>• Ogni chunk di documento genera un embedding</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CircleStackIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Dati embeddings non disponibili</p>
            </div>
          )}
        </div>
      </DetailModal>}
