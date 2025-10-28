import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TextArea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import smartDocsService, { Container, QueryResult } from '../../services/smartdocs.service';
import smartDocsAdvancedService from '../../services/smartdocs-advanced.service';
import ChunksViewer from '../../components/smartdocs/ChunksViewer';
import KnowledgeGraphViewer from '../../components/smartdocs/KnowledgeGraphViewer';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import {
  Search,
  Loader2,
  RefreshCw,
  Zap,
  CheckCircle,
  Microscope,
  Database,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

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

export default function SmartDocsTestLab() {
  const [containers, setContainers] = useState<SmartDocsContainer[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('');

  // Sync Test States
  const [syncContainerId, setSyncContainerId] = useState<string>('');
  const [customSyncContent, setCustomSyncContent] = useState<string>('');
  const [syncTesting, setSyncTesting] = useState(false);
  const [syncTestResult, setSyncTestResult] = useState<any>(null);
  const [syncDebugData, setSyncDebugData] = useState<any>(null);
  const [showSyncDebug, setShowSyncDebug] = useState(false);
  
  // Container Preview States
  const [containerStats, setContainerStats] = useState<any>(null);
  const [loadingContainerStats, setLoadingContainerStats] = useState(false);
  const [showContainerPreview, setShowContainerPreview] = useState(false);

  // Query Test States
  const [queryText, setQueryText] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [queryTesting, setQueryTesting] = useState(false);
  const [queryDebugData, setQueryDebugData] = useState<any>(null);
  const [showQueryDebug, setShowQueryDebug] = useState(false);

  // Advanced Analysis States
  const [advancedChunks, setAdvancedChunks] = useState<any[]>([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>({ entities: [], relationships: [] });
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      console.log('Loading containers from SmartDocs...');
      const response = await fetch('http://localhost:3500/api/containers');
      if (!response.ok) {
        console.error(`Failed to load containers: ${response.status}`);
        toast.error(`Errore caricamento containers: ${response.status}`);
        return;
      }
      const data = await response.json();
      console.log('Containers loaded:', data);
      
      if (data.success && data.data) {
        setContainers(data.data);
        toast.success(`${data.data.length} containers caricati`);
      } else if (Array.isArray(data.data)) {
        setContainers(data.data);
      } else {
        console.warn('Unexpected containers response format:', data);
      }
    } catch (err) {
      console.error('Failed to load containers:', err);
      toast.error('Errore connessione SmartDocs');
    }
  };

  const loadContainerStats = async (containerId: string) => {
    if (!containerId) return;
    
    setLoadingContainerStats(true);
    try {
      console.log('Loading stats for container:', containerId);
      const response = await fetch(`http://localhost:3500/api/containers/${containerId}/stats`);
      if (response.ok) {
        const data = await response.json();
        console.log('Container stats:', data);
        setContainerStats(data.data || data);
        setShowContainerPreview(true);
      } else {
        console.warn('Stats endpoint not available for container:', containerId);
        setShowContainerPreview(false);
      }
    } catch (error) {
      console.error('Failed to load container stats:', error);
      setShowContainerPreview(false);
    } finally {
      setLoadingContainerStats(false);
    }
  };

  const formatContainerOption = (container: SmartDocsContainer) => {
    const ownerType = container.external_owner_type === 'SYSTEM' ? '🏢 System' : `👤 ${container.external_owner_type}`;
    const isActive = container.ai_enabled || container.rag_enabled ? '🟢' : '🔴';
    const aiStatus = container.ai_enabled ? '🤖' : '';
    const ragStatus = container.rag_enabled ? '🔍' : '';
    return `${isActive} ${container.name} (${ownerType}) ${aiStatus}${ragStatus} - ${container.type}`;
  };

  const formatContainerDisplay = (container: SmartDocsContainer) => {
    const createdDate = new Date(container.created_at).toLocaleDateString();
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span className="font-medium">{container.name}</span>
          <Badge variant={container.ai_enabled || container.rag_enabled ? "default" : "secondary"}>
            {container.ai_enabled || container.rag_enabled ? "Attivo" : "Inattivo"}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {container.external_owner_type}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {createdDate}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {container.processed_docs} docs
          </span>
        </div>
        {container.description && (
          <div className="text-sm text-gray-600 mt-1">
            {container.description}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          {container.ai_enabled && (
            <Badge variant="outline" className="text-xs">
              🤖 AI: {container.ai_model || 'N/A'}
            </Badge>
          )}
          {container.rag_enabled && (
            <Badge variant="outline" className="text-xs">
              🔍 RAG
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const handleContainerChange = (containerId: string) => {
    setSyncContainerId(containerId);
    if (containerId) {
      loadContainerStats(containerId);
    } else {
      setContainerStats(null);
      setShowContainerPreview(false);
    }
  };

  const testSync = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    setSyncTesting(true);
    setSyncTestResult(null);
    setSyncDebugData(null);

    try {
      const testContent = customSyncContent || `Test content per SmartDocs - ${new Date().toISOString()}
      
      Questo è un contenuto di test per verificare il sistema di sincronizzazione e chunking di SmartDocs.
      
      ## Sezione 1: Introduzione
      Questa è un'introduzione al test di sincronizzazione che verifica come il sistema elabora e chunka i contenuti.
      
      ## Sezione 2: Dettagli Tecnici  
      Il sistema utilizza algoritmi avanzati per l'analisi semantica e il chunking intelligente dei documenti.
      
      ## Sezione 3: Test Features
      - Chunking semantico
      - Embedding generation  
      - Knowledge graph extraction
      - RAG capabilities
      
      ## Sezione 4: Conclusioni
      Il test dovrebbe dimostrare la corretta funzionalità dell'intero pipeline di processing.`;

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

      console.log('Sending sync request:', payload);

      const response = await fetch('http://localhost:3500/api/sync/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Sync response:', data);
      
      if (data.success) {
        setSyncTestResult(data.data);
        if (data.debug) {
          setSyncDebugData(data.debug);
          setShowSyncDebug(true);
        }
        
        toast.success('Test sync completato con successo!');
        
        // Ricarica stats del container
        await loadContainerStats(syncContainerId);
      } else {
        throw new Error(data.error || 'Test sync failed');
      }
    } catch (error: any) {
      console.error('Sync test failed:', error);
      toast.error(`Errore nel test sync: ${error.message}`);
    } finally {
      setSyncTesting(false);
    }
  };

  const testQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Inserisci una domanda');
      return;
    }

    setQueryTesting(true);
    setQueryResults(null);
    setQueryDebugData(null);

    try {
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

      console.log('Sending query request:', payload);

      const response = await fetch('http://localhost:3500/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Query response:', data);
      
      if (data.success) {
        setQueryResults(data.data);
        if (data.debug) {
          setQueryDebugData(data.debug);
          setShowQueryDebug(true);
        }
        toast.success('Query eseguita con successo!');
      } else {
        throw new Error(data.error || 'Query failed');
      }
    } catch (error: any) {
      console.error('Query test failed:', error);
      toast.error(`Errore nella query: ${error.message}`);
    } finally {
      setQueryTesting(false);
    }
  };

  const loadAdvancedAnalysis = async () => {
    if (!selectedContainer) {
      toast.error('Seleziona un container per l\'analisi avanzata');
      return;
    }

    setLoadingAdvanced(true);
    try {
      // Try to load advanced data if available
      toast.info('Funzionalità avanzata in sviluppo');
    } catch (error: any) {
      console.error('Failed to load advanced analysis:', error);
      toast.error(`Errore nel caricamento: ${error.message}`);
    } finally {
      setLoadingAdvanced(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Microscope className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SmartDocs Test Lab</h1>
          <p className="text-gray-600">Ambiente di testing per SmartDocs - Container Operativi</p>
        </div>
        <Button variant="outline" onClick={loadContainers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Ricarica Container
        </Button>
      </div>

      {/* Status Bar */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              🔗 <strong>SmartDocs API:</strong> http://localhost:3500 
              {containers.length > 0 ? 
                <span className="text-green-600 ml-2">✅ Connesso ({containers.length} containers)</span> : 
                <span className="text-red-600 ml-2">❌ Non connesso</span>
              }
            </span>
            <Button variant="outline" size="sm" onClick={loadContainers}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Test Connessione
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Container Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Container SmartDocs ({containers.length})
              </CardTitle>
              <CardDescription>
                Container operativi SmartDocs per testing e interrogazioni RAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {containers.map((container) => (
                  <div 
                    key={container.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      syncContainerId === container.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleContainerChange(container.id)}
                  >
                    {formatContainerDisplay(container)}
                  </div>
                ))}
                {containers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nessun container trovato</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={loadContainers}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Ricarica
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Container Preview */}
          {showContainerPreview && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  📦 Dettagli Container
                  {loadingContainerStats && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {containerStats ? (
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documenti:</span>
                      <Badge variant="secondary">{containerStats.totalDocuments || containerStats.documents_count || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chunks:</span>
                      <Badge variant="secondary">{containerStats.totalChunks || containerStats.chunks_count || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Embeddings:</span>
                      <Badge variant="secondary">{containerStats.totalEmbeddings || containerStats.embeddings_count || 0}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Info className="w-6 h-6 mx-auto mb-2" />
                    <p>Statistiche non disponibili</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="query" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Test Query RAG
              </TabsTrigger>
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Test Sync
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Microscope className="w-4 h-4" />
                Analisi Avanzata
              </TabsTrigger>
            </TabsList>

            {/* Query Test Tab */}
            <TabsContent value="query">
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Test Query RAG</CardTitle>
                  <CardDescription>
                    Testa interrogazioni RAG sui container SmartDocs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Container (opzionale)</Label>
                    <select
                      className="w-full p-3 border rounded-lg"
                      value={selectedContainer}
                      onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                      <option value="">Tutti i containers</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatContainerOption(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Domanda</Label>
                    <TextArea
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Inserisci la tua domanda per il sistema RAG..."
                      rows={3}
                    />
                  </div>

                  <details className="border rounded-lg">
                    <summary className="p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm">
                      🤖 System Prompt Custom (opzionale)
                    </summary>
                    <div className="p-4 space-y-2 border-t">
                      <TextArea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Prompt personalizzato per l'AI..."
                        rows={4}
                      />
                    </div>
                  </details>

                  <Button 
                    onClick={testQuery} 
                    disabled={queryTesting || !queryText.trim()}
                    className="w-full"
                  >
                    {queryTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Interrogazione in corso...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Esegui Query RAG
                      </>
                    )}
                  </Button>

                  {/* Query Results */}
                  {queryResults && (
                    <div className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <div className="space-y-3">
                            <div className="font-semibold">📝 Risposta AI:</div>
                            <div className="bg-white p-4 rounded border text-gray-800 whitespace-pre-wrap">
                              {queryResults.answer}
                            </div>
                            
                            {queryResults.sources && queryResults.sources.length > 0 && (
                              <div>
                                <div className="font-semibold mb-2">📚 Fonti ({queryResults.sources.length}):</div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {queryResults.sources.map((source: any, idx: number) => (
                                    <div key={idx} className="bg-white p-3 rounded border text-sm">
                                      <div className="font-medium text-blue-700">
                                        {source.title} 
                                        <Badge variant="secondary" className="ml-2">
                                          {(source.similarity * 100).toFixed(1)}%
                                        </Badge>
                                      </div>
                                      <div className="text-gray-600 mt-1 line-clamp-3">
                                        {source.chunk_text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {queryResults.metadata && (
                              <div className="text-sm">
                                <strong>Metadata:</strong> {queryResults.metadata.sourcesCount} fonti, 
                                threshold {queryResults.metadata.threshold}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Query Debug Data */}
                  {showQueryDebug && queryDebugData && (
                    <details className="border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm">
                        🔍 Dati Debug Query
                      </summary>
                      <div className="p-4 space-y-4 border-t bg-gray-50">
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-60">
                          {JSON.stringify(queryDebugData, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sync Test Tab */}
            <TabsContent value="sync">
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Test Sincronizzazione Container</CardTitle>
                  <CardDescription>
                    Testa il processo di ingest e sincronizzazione documenti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Container di destinazione</Label>
                    <select
                      className="w-full p-3 border rounded-lg"
                      value={syncContainerId}
                      onChange={(e) => handleContainerChange(e.target.value)}
                    >
                      <option value="">Seleziona container...</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatContainerOption(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contenuto Test (opzionale)</Label>
                    <TextArea
                      value={customSyncContent}
                      onChange={(e) => setCustomSyncContent(e.target.value)}
                      placeholder="Inserisci contenuto personalizzato per il test, altrimenti verrà usato contenuto di default..."
                      rows={6}
                    />
                  </div>

                  <Button 
                    onClick={testSync} 
                    disabled={syncTesting || !syncContainerId}
                    className="w-full"
                  >
                    {syncTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizzazione in corso...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Avvia Test Sync
                      </>
                    )}
                  </Button>

                  {/* Sync Results */}
                  {syncTestResult && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <div className="font-semibold">✅ Test Sync Completato!</div>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div>
                              <strong>Documento ID:</strong> {syncTestResult.document_id || 'N/A'}
                            </div>
                            <div>
                              <strong>Chunks Processati:</strong> {syncTestResult.chunks_count || 0}
                            </div>
                            <div>
                              <strong>Embeddings:</strong> {syncTestResult.embeddings_count || 0}
                            </div>
                          </div>
                          {syncTestResult.message && (
                            <div className="text-sm">
                              <strong>Messaggio:</strong> {syncTestResult.message}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Debug Data */}
                  {showSyncDebug && syncDebugData && (
                    <details className="border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm">
                        🔍 Dati Debug Sync
                      </summary>
                      <div className="p-4 space-y-4 border-t bg-gray-50">
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-60">
                          {JSON.stringify(syncDebugData, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Analysis Tab */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>🔬 Analisi Avanzata Container</CardTitle>
                  <CardDescription>
                    Visualizzazione avanzata dei dati SmartDocs (in sviluppo)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <select
                      className="flex-1 p-3 border rounded-lg"
                      value={selectedContainer}
                      onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                      <option value="">Seleziona container per analisi...</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatContainerOption(c)}
                        </option>
                      ))}
                    </select>
                    
                    <Button 
                      onClick={loadAdvancedAnalysis}
                      disabled={loadingAdvanced || !selectedContainer}
                    >
                      {loadingAdvanced ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Microscope className="w-4 h-4 mr-2" />
                      )}
                      Analizza
                    </Button>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold">🚧 Funzionalità in sviluppo</div>
                        <div className="text-sm">
                          Le funzionalità di analisi avanzata (chunks semantici, knowledge graph, ecc.) 
                          sono attualmente in fase di sviluppo e saranno disponibili in una versione futura.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
