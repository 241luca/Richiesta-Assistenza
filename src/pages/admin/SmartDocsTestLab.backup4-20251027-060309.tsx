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
  ChevronRightIcon
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
}

export default function SmartDocsTestLab() {
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [syncContainerId, setSyncContainerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'query' | 'sync' | 'advanced'>('query');
  
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

  // Load container stats
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
    }
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

  const formatBytes = (bytes: string | number) => {
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
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {containerStats.document_count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Embeddings:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {containerStats.embedding_count}
                        </span>
                      </div>
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
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {syncStats.total.total_chunks}
                            </span>
                          </div>
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
                            <ChevronRightIcon className="w-4 h-4" />
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
                                  <ChevronRightIcon className="w-4 h-4" />
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
                                  <ChevronRightIcon className="w-4 h-4" />
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

                {/* Advanced Tab */}
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
}
