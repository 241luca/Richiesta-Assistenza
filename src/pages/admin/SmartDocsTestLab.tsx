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
  RocketLaunchIcon,
  SparklesIcon,
  FunnelIcon,
  LinkIcon,
  ChartBarIcon,
  TrashIcon
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

interface ChunkDetail {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  tokens_count: number;
  embedding_id?: string;
  created_at: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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
}

// ðŸ†• NUOVO: Modal di conferma per Azzera Container
function ConfirmResetModal({ isOpen, onClose, onConfirm, containerName, isLoading }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <TrashIcon className="w-6 h-6 text-red-600" />
          </div>
          
          <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Azzera Container?</h3>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Stai per eliminare <strong>TUTTI</strong> i file del container:
            </p>
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-900">{containerName}</p>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              ⚠️ Questa azione è <strong>irreversibile</strong>. Tutti i documenti, chunk, embeddings e dati associati saranno eliminati.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  <span>Si, Azzera</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SmartDocsTestLab() {
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
  const [chunks, setChunks] = useState<ChunkDetail[]>([]);
  const [embeddingsData, setEmbeddingsData] = useState<any>(null);
  const [batchCount, setBatchCount] = useState<number>(5);
  const [knowledgeGraphData, setKnowledgeGraphData] = useState<any>({ entities: [], relationships: [] });
  const [systemStats, setSystemStats] = useState<any>(null);
  const [semanticSearchResults, setSemanticSearchResults] = useState<any[]>([]);  
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // ðŸ†• NUOVO: State per Azzera Container
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResettingContainer, setIsResettingContainer] = useState(false);
  
  // Modal states
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [showEmbeddingsModal, setShowEmbeddingsModal] = useState(false);

  // Advanced analysis states - NUOVO
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedModalType, setAdvancedModalType] = useState<'chunks' | 'embeddings' | 'graph' | 'stats'>('stats');
  const [selectedDocumentForChunks, setSelectedDocumentForChunks] = useState<string>('');
  const [advancedChunksData, setAdvancedChunksData] = useState<any[]>([]);
  const [advancedEmbeddingsData, setAdvancedEmbeddingsData] = useState<any>(null);
  const [advancedGraphData, setAdvancedGraphData] = useState<any>(null);
  const [advancedStatsData, setAdvancedStatsData] = useState<any>(null);
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false);

  // Carica documenti quando si apre la modale
  useEffect(() => {
    if (showDocumentsModal && syncContainerId) {
      loadContainerDocuments(syncContainerId);
    }
  }, [showDocumentsModal, syncContainerId]);

  // Carica chunks quando si apre la modale
  useEffect(() => {
    if (showChunksModal && syncContainerId) {
      loadContainerChunks(syncContainerId);
    }
  }, [showChunksModal, syncContainerId]);

  // Carica embeddings quando si apre la modale
  useEffect(() => {
    if (showEmbeddingsModal && syncContainerId) {
      loadContainerEmbeddings(syncContainerId);
    }
  }, [showEmbeddingsModal, syncContainerId]);

  // Load containers
  const { data: containers = [], isLoading: containersLoading, refetch: refetchContainers } = useQuery({
    queryKey: ['smartdocs-containers'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3500/api/containers');
        if (!response.ok) {
          throw new Error(`Failed to load containers: ${response.status}`);
        }
        const data = await response.json();
        return data.success ? data.data : [];
      } catch (error) {
        console.error('Error loading containers:', error);
        toast.error('Impossibile caricare i container. Verifica che SmartDocs sia attivo su http://localhost:3500');
        return [];
      }
    },
    staleTime: 30000,
  });

  // ðŸ†• NUOVO: Funzione per Azzera Container
  const handleResetContainer = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container prima');
      return;
    }

    setShowResetModal(true);
  };

  // ðŸ†• NUOVO: Conferma Azzera Container
  const confirmResetContainer = async () => {
    setIsResettingContainer(true);
    
    try {
      // Endpoint SmartDocs corretto per azzerare container
      const response = await fetch(`http://localhost:3500/api/container-instances/${syncContainerId}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Container azzerato con successo!');
        setShowResetModal(false);
        
        // Ricarica le statistiche
        await loadContainerStats(syncContainerId);
        
        // Pulisci i dati locali
        setDocuments([]);
        setChunks([]);
        setEmbeddingsData(null);
        setContainerStats(null);
        setSyncStats(null);
      } else {
        toast.error(`❌ Errore: ${data.error || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore azzeramento container:', error);
      toast.error(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setIsResettingContainer(false);
    }
  };

  // Load container documents
  const loadContainerDocuments = async (containerId: string) => {
    if (!containerId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/documents/container/${containerId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.success ? data.data : []);
      } else {
        console.warn('Failed to load documents:', response.status);
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    }
  };

  // Carica chunks di un container
  const loadContainerChunks = async (containerId: string) => {
    if (!containerId) return [];
    try {
      const response = await fetch(`http://localhost:3500/api/chunks/container/${containerId}`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
    } catch (error) {
      console.error("Failed to load container chunks:", error);
    }
    return [];
  };

  // Carica chunks di un documento specifico
  const loadDocumentChunks = async (documentId: string) => {
    if (!documentId) return [];
    try {
      const response = await fetch(`http://localhost:3500/api/chunks/document/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
    } catch (error) {
      console.error("Failed to load document chunks:", error);
    }
    return [];
  };

  // Carica embeddings di un documento
  const loadDocumentEmbeddings = async (documentId: string, includeVectors = false) => {
    if (!documentId) return [];
    try {
      const url = `http://localhost:3500/api/embeddings/document/${documentId}${includeVectors ? "?include_vector=true" : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
    } catch (error) {
      console.error("Failed to load document embeddings:", error);
    }
    return [];
  };

  // Carica knowledge graph di un documento
  const loadDocumentKnowledgeGraph = async (documentId: string) => {
    if (!documentId) return { entities: [], relationships: [] };
    try {
      const response = await fetch(`http://localhost:3500/api/knowledge-graph/document/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : { entities: [], relationships: [] };
      }
    } catch (error) {
      console.error("Failed to load document knowledge graph:", error);
    }
    return { entities: [], relationships: [] };
  };

  // Ricerca semantica
  const performSemanticSearch = async (query: string, containerId?: string) => {
    try {
      const params = new URLSearchParams({ query });
      if (containerId) params.append("container_id", containerId);
      
      const response = await fetch(`http://localhost:3500/api/search/semantic?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
    } catch (error) {
      console.error("Failed to perform semantic search:", error);
    }
    return [];
  };

  // Carica statistiche globali sistema
  const loadSystemStats = async () => {
    try {
      const response = await fetch(`http://localhost:3500/api/system/stats`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
    } catch (error) {
      console.error("Failed to load system stats:", error);
    }
    return null;
  };

  // Load container chunks
  const loadContainerChunks2 = async (containerId: string) => {
    if (!containerId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/chunks/container/${containerId}`);
      if (response.ok) {
        const data = await response.json();
        const chunksArray = Array.isArray(data.data) ? data.data : [];
        setChunks(data.success ? chunksArray : []);
      } else {
        console.warn('Failed to load chunks:', response.status);
        setChunks([]);
      }
    } catch (error) {
      console.error("Failed to load chunks:", error);
      setChunks([]);
    }
  };

  // Load container embeddings
  const loadContainerEmbeddings = async (containerId: string) => {
    if (!containerId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/embeddings/container/${containerId}`);
      if (response.ok) {
        const data = await response.json();
        setEmbeddingsData(data.success ? data.data : null);
      } else {
        console.warn('Failed to load embeddings:', response.status);
        setEmbeddingsData(null);
      }
    } catch (error) {
      console.error("Failed to load embeddings:", error);
      setEmbeddingsData(null);
    }
  };

  // NUOVO: Load chunks di un documento specifico
  const loadDocumentChunksAdvanced = async (documentId: string) => {
    if (!documentId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/chunks/document/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        const chunksArray = Array.isArray(data.data) ? data.data : [];
        setAdvancedChunksData(data.success ? chunksArray : []);
        toast.success(`✅ Chunk caricati: ${data.success ? chunksArray.length : 0}`);
      } else {
        toast.error(`❌ Errore: ${response.status}`);
        setAdvancedChunksData([]);
      }
    } catch (error) {
      console.error("Failed to load document chunks:", error);
      toast.error(`❌ Errore: ${error}`);
      setAdvancedChunksData([]);
    }
  };

  // NUOVO: Load embeddings di un documento specifico
  const loadDocumentEmbeddingsAdvanced = async (documentId: string) => {
    if (!documentId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/embeddings/document/${documentId}?include_vector=false`);
      if (response.ok) {
        const data = await response.json();
        const embeddingsData = data.success && data.data ? data.data : null;
        setAdvancedEmbeddingsData(embeddingsData);
        toast.success(`✅ Embeddings caricati`);
      } else {
        toast.error(`❌ Errore: ${response.status}`);
        setAdvancedEmbeddingsData(null);
      }
    } catch (error) {
      console.error("Failed to load embeddings:", error);
      toast.error(`❌ Errore: ${error}`);
      setAdvancedEmbeddingsData(null);
    }
  };

  // NUOVO: Load knowledge graph di un documento specifico
  const loadDocumentGraph = async (documentId: string) => {
    if (!documentId) return;
    
    try {
      const response = await fetch(`http://localhost:3500/api/knowledge-graph/document/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        const graphData = data.success && data.data ? data.data : null;
        setAdvancedGraphData(graphData);
        toast.success(`✅ Knowledge Graph caricato`);
      } else {
        toast.error(`❌ Errore: ${response.status}`);
        setAdvancedGraphData(null);
      }
    } catch (error) {
      console.error("Failed to load knowledge graph:", error);
      toast.error(`❌ Errore: ${error}`);
      setAdvancedGraphData(null);
    }
  };

  // NUOVO: Load statistiche globali
  const loadGlobalStats = async () => {
    try {
      const response = await fetch(`http://localhost:3500/api/system/stats`);
      if (response.ok) {
        const data = await response.json();
        const statsData = data.success && data.data ? data.data : null;
        setAdvancedStatsData(statsData);
        toast.success(`✅ Statistiche caricate`);
      } else {
        toast.error(`❌ Errore: ${response.status}`);
        setAdvancedStatsData(null);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error(`❌ Errore: ${error}`);
      setAdvancedStatsData(null);
    }
  };

  // Load container stats - VERSIONE MIGLIORATA
  const loadContainerStats = async (containerId: string) => {
    if (!containerId) return;
    
    setIsLoadingStats(true);
    setStatsError(null);
    
    try {
      console.log('📊 Caricando statistiche per container:', containerId);
      
      // Prova a caricare le statistiche
      const statsResponse = await fetch(`http://localhost:3500/api/containers/${containerId}/stats`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Stats caricati:', statsData);
        if (statsData.success && statsData.data) {
          setContainerStats(statsData.data);
        } else {
          setContainerStats(null);
        }
      } else {
        console.warn('⚠️ Stats response not OK:', statsResponse.status);
        setContainerStats(null);
      }

      // Carica sync stats se disponibile
      try {
        const syncStatsResponse = await fetch(`http://localhost:3500/api/sync/stats/${containerId}`);
        if (syncStatsResponse.ok) {
          const syncStatsData = await syncStatsResponse.json();
          console.log('✅ Sync stats caricati:', syncStatsData);
          if (syncStatsData.success && syncStatsData.data) {
            setSyncStats(syncStatsData.data);
          }
        }
      } catch (syncError) {
        console.log('ℹ️ Sync stats non disponibili');
      }

      // In parallelo, carica anche i dati del documento come fallback
      await loadContainerDocuments(containerId);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche:', error);
      setStatsError(`Errore nel caricamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      
      // Come fallback, carica almeno i documenti
      await loadContainerDocuments(containerId);
    } finally {
      setIsLoadingStats(false);
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

  // Batch sync mutation
  const batchSyncMutation = useMutation({
    mutationFn: async (payload: any) => {
      const results = [];
      for (let i = 0; i < batchCount; i++) {
        // Sostituisci {{INDEX}} con il numero (i+1)
        const indexNumber = (i + 1).toString();
        const contentWithIndex = payload.content.replace(/\{\{INDEX\}\}/g, indexNumber);
        
        const batchPayload = {
          ...payload,
          entity_id: `batch-test-${Date.now()}-${i}`,
          title: `Batch Test ${i + 1}/${batchCount} - ${new Date().toLocaleString()}`,
          content: contentWithIndex
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

  // Handle container selection - MIGLIORATO
  const handleContainerChange = (containerId: string) => {
    setSyncContainerId(containerId);
    setContainerStats(null); // Reset stats prima di caricare
    setSyncStats(null);
    setStatsError(null);
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

            {/* Container Stats - MIGLIORATO CON AZZERA */}
            <div className="mt-4 bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <span>📊 Statistiche</span>
                  {isLoadingStats && <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500" />}
                </h3>
              </div>

              {/* ðŸ†• NUOVO: Pulsante Azzera Container */}
              {syncContainerId && (
                <div className="p-4 border-b border-gray-200 bg-red-50">
                  <button
                    onClick={() => handleResetContainer()}
                    disabled={isResettingContainer}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>Azzera Container</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ Cancellerà TUTTI i file del container. Azione irreversibile!
                  </p>
                </div>
              )}

              <div className="p-4">
                {!syncContainerId ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Seleziona un container
                  </div>
                ) : statsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">❌ {statsError}</p>
                    <button
                      onClick={() => loadContainerStats(syncContainerId)}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Riprova a caricare
                    </button>
                  </div>
                ) : (containerStats || syncStats) ? (
                  <div className="space-y-3">
                    {containerStats && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Documenti:</span>
                          <button
                            onClick={async () => {
                              setShowDocumentsModal(true);
                              if (syncContainerId && documents.length === 0) {
                                await loadContainerDocuments(syncContainerId);
                              }
                            }}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            {containerStats.document_count}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Embeddings:</span>
                          <button
                            onClick={async () => {
                              setShowEmbeddingsModal(true);
                              if (syncContainerId && documents.length > 0) {
                                const allEmbeddings = [];
                                for (const doc of documents) {
                                  const embeddings = await loadDocumentEmbeddings(doc.id, false);
                                  allEmbeddings.push(...embeddings);
                                }
                                setEmbeddingsData({ embeddings: allEmbeddings, total: allEmbeddings.length });
                              }
                            }}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                          >
                            <CircleStackIcon className="w-3 h-3 mr-1" />
                            {containerStats.embedding_count}
                          </button>
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
                              <button
                                onClick={async () => {
                                setShowChunksModal(true);
                                if (syncContainerId) {
                                  const containerChunks = await loadContainerChunks(syncContainerId);
                                  setChunks(containerChunks || []);
                                }
                              }}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                              >
                                <CubeIcon className="w-3 h-3 mr-1" />
                                {syncStats.total.total_chunks}
                              </button>
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
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nessun dato disponibile
                  </div>
                )}
              </div>
            </div>
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
                    { key: 'advanced', label: '🆕 Analisi Avanzata', icon: BeakerIcon }
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
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🔬 Analisi Avanzata - 6 Endpoint Nuovi</h3>
                      <p className="text-gray-600">Test gli endpoint di analisi avanzata SmartDocs</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">📄 Seleziona Documento</h4>
                      {!syncContainerId ? (
                        <div className="bg-white border border-blue-300 rounded-lg p-4 mb-3">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">👈</div>
                            <div>
                              <h5 className="font-semibold text-gray-900">Prima seleziona un Container!</h5>
                              <p className="text-sm text-gray-600 mt-1">Nella sidebar a sinistra, clicca su un container per caricare i suoi documenti</p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex gap-3">
                        <select
                          value={selectedDocumentForChunks}
                          onChange={(e) => setSelectedDocumentForChunks(e.target.value)}
                          disabled={!syncContainerId}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="">-- Seleziona un documento --</option>
                          {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title} ({doc.status})
                            </option>
                          ))}
                        </select>
                        {!documents.length && syncContainerId && (
                          <button
                            onClick={() => loadContainerDocuments(syncContainerId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                          >
                            Carica Documenti
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <CubeIcon className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">1️⃣ Chunk Documento</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Visualizza tutti i chunk di uno specifico documento
                        </p>
                        <button
                          onClick={() => {
                            if (!selectedDocumentForChunks) {
                              toast.error('Seleziona un documento');
                              return;
                            }
                            setIsLoadingAdvanced(true);
                            loadDocumentChunksAdvanced(selectedDocumentForChunks).finally(() => setIsLoadingAdvanced(false));
                            setAdvancedModalType('chunks');
                            setShowAdvancedModal(true);
                          }}
                          disabled={!selectedDocumentForChunks || isLoadingAdvanced}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdvanced ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <EyeIcon className="w-4 h-4" />}
                          Visualizza Chunk
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <CircleStackIcon className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">2️⃣ Embeddings</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Visualizza i vettori numerici degli embeddings
                        </p>
                        <button
                          onClick={() => {
                            if (!selectedDocumentForChunks) {
                              toast.error('Seleziona un documento');
                              return;
                            }
                            setIsLoadingAdvanced(true);
                            loadDocumentEmbeddingsAdvanced(selectedDocumentForChunks).finally(() => setIsLoadingAdvanced(false));
                            setAdvancedModalType('embeddings');
                            setShowAdvancedModal(true);
                          }}
                          disabled={!selectedDocumentForChunks || isLoadingAdvanced}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdvanced ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CircleStackIcon className="w-4 h-4" />}
                          Visualizza Embeddings
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <LinkIcon className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">3️⃣ Knowledge Graph</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Visualizza le entità estratte e le relazioni
                        </p>
                        <button
                          onClick={() => {
                            if (!selectedDocumentForChunks) {
                              toast.error('Seleziona un documento');
                              return;
                            }
                            setIsLoadingAdvanced(true);
                            loadDocumentGraph(selectedDocumentForChunks).finally(() => setIsLoadingAdvanced(false));
                            setAdvancedModalType('graph');
                            setShowAdvancedModal(true);
                          }}
                          disabled={!selectedDocumentForChunks || isLoadingAdvanced}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdvanced ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                          Visualizza Grafo
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <FunnelIcon className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-gray-900">4️⃣ Chunk Container</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Visualizza TUTTI i chunk del container globale
                        </p>
                        <button
                          onClick={() => {
                            if (!syncContainerId) {
                              toast.error('Seleziona un container');
                              return;
                            }
                            setIsLoadingAdvanced(true);
                            loadContainerChunks2(syncContainerId).finally(() => setIsLoadingAdvanced(false));
                            setAdvancedModalType('chunks');
                            setShowAdvancedModal(true);
                          }}
                          disabled={!syncContainerId || isLoadingAdvanced}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdvanced ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <FunnelIcon className="w-4 h-4" />}
                          Visualizza Container Chunks
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <SparklesIcon className="w-5 h-5 text-indigo-600" />
                          <h4 className="font-semibold text-gray-900">5️⃣ Ricerca Semantica</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Testa la ricerca semantica nel container
                        </p>
                        <button
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          onClick={() => toast('🚧 Funzionalità in sviluppo - versione prossima')}
                        >
                          <SparklesIcon className="w-4 h-4" />
                          Ricerca Semantica
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-red-500 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <ChartBarIcon className="w-5 h-5 text-red-600" />
                          <h4 className="font-semibold text-gray-900">6️⃣ Statistiche Globali</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Visualizza statistiche globali del sistema
                        </p>
                        <button
                          onClick={() => {
                            setIsLoadingAdvanced(true);
                            loadGlobalStats().finally(() => setIsLoadingAdvanced(false));
                            setAdvancedModalType('stats');
                            setShowAdvancedModal(true);
                          }}
                          disabled={isLoadingAdvanced}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdvanced ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ChartBarIcon className="w-4 h-4" />}
                          Statistiche Globali
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
        title={`🧩 Chunks Dettaglio (${chunks.length})`}
      >
        <div className="space-y-3">
          {chunks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessun chunk trovato</p>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <div className="text-2xl font-bold text-purple-600">{chunks.length}</div>
                <div className="text-sm text-gray-600">Totale chunks nel container</div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Chunk #{chunk.chunk_index}</h4>
                        <p className="text-xs text-gray-500 mt-1">ID: {chunk.id.substring(0, 20)}...</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {chunk.tokens_count} tokens
                      </span>
                    </div>
                    
                    <div className="bg-white rounded p-3 mb-2">
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {chunk.chunk_text}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Doc ID</div>
                        <div className="font-mono text-gray-800 truncate">{chunk.document_id.substring(0, 12)}</div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Embedding</div>
                        <div className="font-mono text-gray-800">{chunk.embedding_id ? '✅' : '❌'}</div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Data</div>
                        <div className="font-mono text-gray-800">{new Date(chunk.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
          {!embeddingsData ? (
            <div className="text-center py-8 text-gray-500">
              <CircleStackIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Dati embeddings non disponibili</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">📊 Statistiche Embeddings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Totale Embeddings:</div>
                    <div className="text-2xl font-bold text-green-600">
                      {embeddingsData.total_count || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Modello Embedding:</div>
                    <div className="text-sm font-medium text-gray-900">
                      {embeddingsData.model || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold mb-3">📈 Dimensioni</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Dimensione Vettore:</div>
                    <div className="text-lg font-bold text-blue-600">
                      {embeddingsData.vector_dimension || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Storage Size:</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatBytes(embeddingsData.storage_size_bytes || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DetailModal>

      {/* Modal Avanzata per Analisi */}
      <DetailModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        title={
          advancedModalType === 'chunks'
            ? '🧩 Chunk Dettagliati'
            : advancedModalType === 'embeddings'
            ? '🔮 Embeddings Documento'
            : advancedModalType === 'graph'
            ? '🕸️ Knowledge Graph'
            : '📊 Statistiche Globali'
        }
      >
        {advancedModalType === 'chunks' && (
          <div className="space-y-3">
            {advancedChunksData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun chunk trovato</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-blue-600">{advancedChunksData.length}</div>
                  <div className="text-sm text-gray-600">Totale chunk estratti</div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {Array.isArray(advancedChunksData) && advancedChunksData.length > 0 ? (
                    advancedChunksData.slice(0, 10).map((chunk: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">Chunk #{chunk.chunk_index || idx + 1}</h5>
                            <p className="text-xs text-gray-500 mt-1">{chunk.tokens_count || 0} tokens</p>
                          </div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-sm text-gray-700 line-clamp-4">{chunk.chunk_text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nessun chunk disponibile</p>
                    </div>
                  )}
                </div>
                {Array.isArray(advancedChunksData) && advancedChunksData.length > 10 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    ... e altri {advancedChunksData.length - 10} chunk
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {advancedModalType === 'embeddings' && (
          <div className="space-y-3">
            {!advancedEmbeddingsData ? (
              <div className="text-center py-8 text-gray-500">
                <CircleStackIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun embedding trovato</p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📊 Info Embeddings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Totale:</span>
                      <span className="text-sm font-medium">{advancedEmbeddingsData.total_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Modello:</span>
                      <span className="text-sm font-medium">{advancedEmbeddingsData.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dimensioni:</span>
                      <span className="text-sm font-medium">{advancedEmbeddingsData.vector_dimension || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {advancedModalType === 'graph' && (
          <div className="space-y-3">
            {!advancedGraphData ? (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun knowledge graph trovato</p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📚 Entità e Relazioni</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entità:</span>
                      <span className="text-sm font-medium">{advancedGraphData.entities?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Relazioni:</span>
                      <span className="text-sm font-medium">{advancedGraphData.relationships?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {advancedGraphData.entities && advancedGraphData.entities.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Entità Estratte</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {advancedGraphData.entities.slice(0, 10).map((entity: any, idx: number) => (
                        <div key={idx} className="bg-white rounded p-2 text-sm">
                          <span className="font-medium">{entity.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({entity.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {advancedModalType === 'stats' && (
          <div className="space-y-3">
            {!advancedStatsData ? (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Impossibile caricare le statistiche</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">📊 Statistiche Globali Sistema</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-600">Documenti</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {advancedStatsData.total_documents || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-600">Chunk</div>
                      <div className="text-2xl font-bold text-green-600">
                        {advancedStatsData.total_chunks || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-600">Embeddings</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {advancedStatsData.total_embeddings || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-600">Tokens</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {(advancedStatsData.total_tokens || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {advancedStatsData.storage_size_bytes && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">💾 Storage</h5>
                    <div className="text-sm font-medium">
                      {formatBytes(advancedStatsData.storage_size_bytes)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DetailModal>

      {/* ðŸ†• NUOVO: Modal di conferma Azzera Container */}
      <ConfirmResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetContainer}
        containerName={containers.find((c: SmartDocsContainer) => c.id === syncContainerId)?.name || 'Sconosciuto'}
        isLoading={isResettingContainer}
      />
    </div>
  );
}
