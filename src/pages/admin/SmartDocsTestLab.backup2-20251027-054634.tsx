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
  Calendar
} from 'lucide-react';

export default function SmartDocsTestLab() {
  const [containers, setContainers] = useState<Container[]>([]);
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
  const [containerDocuments, setContainerDocuments] = useState<any[]>([]);
  const [loadingContainerStats, setLoadingContainerStats] = useState(false);
  const [showContainerPreview, setShowContainerPreview] = useState(false);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [documentDetails, setDocumentDetails] = useState<Map<string, any>>(new Map());
  
  // Processing Timeline
  const [processingLogs, setProcessingLogs] = useState<any[]>([]);
  const [showProcessingTimeline, setShowProcessingTimeline] = useState(false);

  // Sync Test
  const [documentStructure, setDocumentStructure] = useState<any[]>([]);
  const [expandedStructure, setExpandedStructure] = useState<Set<string>>(new Set());

  // Query Test States
  const [queryText, setQueryText] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
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
      const response = await fetch('http://localhost:3500/api/container-instances');
      if (!response.ok) {
        toast.error(`Failed to load containers: ${response.status}`);
        return;
      }
      const data = await response.json();
      if (data.success && data.data) {
        setContainers(data.data);
      } else if (Array.isArray(data.data)) {
        setContainers(data.data);
      }
    } catch (err: any) {
      toast.error(`Failed to load containers: ${err.message}`);
    }
  };

  const loadContainerStats = async (containerId: string) => {
    if (!containerId) return;
    
    setLoadingContainerStats(true);
    try {
      // Load stats
      const statsResponse = await fetch(`http://localhost:3500/api/container-instances/${containerId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setContainerStats(statsData.data || statsData);
        setShowContainerPreview(true);
      }

      // 
      // ✅ CORREZIONE: Uso l'endpoint corretto per ottenere i documenti
      //
      const docsResponse = await fetch(`http://localhost:3500/api/documents?container_instance_id=${containerId}`);
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setContainerDocuments(docsData.data || docsData || []);
      }

    } catch (error: any) {
      toast.error(`Failed to load container stats: ${error.message}`);
    } finally {
      setLoadingContainerStats(false);
    }
  };

  const formatContainerOption = (container: any) => {
    const ownerType = container.owner_type === 'PROFESSIONAL' ? '👤 Prof' : '🏢 Admin';
    const isActive = container.is_active ? '🟢' : '🔴';
    return `${isActive} ${container.name} (${ownerType}) - ${container.template_code}`;
  };

  const formatContainerDisplay = (container: any) => {
    const createdDate = new Date(container.created_at).toLocaleDateString();
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span className="font-medium">{container.name}</span>
          <Badge variant={container.is_active ? "default" : "secondary"}>
            {container.is_active ? "Attivo" : "Inattivo"}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {container.owner_type}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {createdDate}
          </span>
        </div>
        {container.description && (
          <div className="text-sm text-gray-600 mt-1">
            {container.description}
          </div>
        )}
      </div>
    );
  };

  const handleContainerChange = (containerId: string) => {
    setSyncContainerId(containerId);
    if (containerId) {
      loadContainerStats(containerId);
    } else {
      setContainerStats(null);
      setContainerDocuments([]);
      setShowContainerPreview(false);
      setExpandedDocuments(new Set());
      setDocumentDetails(new Map());
    }
  };

  const loadDocumentAdvancedData = async (documentId: string) => {
    try {
      const analysis = await smartDocsAdvancedService.getDocumentAnalysis(documentId);
      setDocumentDetails(prev => new Map(prev.set(documentId, analysis)));
    } catch (error) {
      console.error('Failed to load document analysis:', error);
    }
  };

  const toggleDocumentExpansion = (documentId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
      if (!documentDetails.has(documentId)) {
        loadDocumentAdvancedData(documentId);
      }
    }
    setExpandedDocuments(newExpanded);
  };

  const testSync = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    setSyncTesting(true);
    setSyncTestResult(null);
    setSyncDebugData(null);
    setProcessingLogs([]);
    setShowProcessingTimeline(false);

    try {
      //
      // ✅ CORREZIONE: Uso l'endpoint corretto per il test e passo l'ID nel body
      //
      const response = await fetch(`http://localhost:3500/api/sync/test-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerId: syncContainerId,
          content: customSyncContent || `Test content per verificare il sistema di chunking semantic e la pipeline di processing completa.
          
          Questo testo include diverse sezioni:
          
          ## Sezione 1: Introduzione
          Questa è un'introduzione al test di sincronizzazione che verifica come il sistema elabora e chunka i contenuti.
          
          ## Sezione 2: Dettagli Tecnici  
          Il sistema utilizza algoritmi avanzati per l'analisi semantica e il chunking intelligente dei documenti.
          
          ## Sezione 3: Conclusioni
          Il test dovrebbe dimostrare la corretta funzionalità dell'intero pipeline di processing.`,
          debug: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSyncTestResult(data.data);
        if (data.debug) {
          setSyncDebugData(data.debug);
          setShowSyncDebug(true);
        }
        
        if (data.data.processingLogs) {
          setProcessingLogs(data.data.processingLogs);
          setShowProcessingTimeline(true);
        }

        toast.success('Test sync completato con successo!');
        await loadContainerStats(syncContainerId);
      } else {
        throw new Error(data.message || data.error || 'Test sync failed');
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
        payload.containerId = selectedContainer;
      }

      if (customPrompt.trim()) {
        payload.customPrompt = customPrompt;
      }

      const response = await fetch('http://localhost:3500/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
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
      // Load chunks
      const chunksResponse = await smartDocsAdvancedService.getContainerChunks(selectedContainer);
      setAdvancedChunks(chunksResponse);

      // Load knowledge graph  
      const kgResponse = await smartDocsAdvancedService.getContainerKnowledgeGraph(selectedContainer);
      setKnowledgeGraph(kgResponse);

      toast.success('Analisi avanzata caricata');
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
          <p className="text-gray-600">Ambiente di testing avanzato per SmartDocs - Istanze Container Operative</p>
        </div>
        <Button variant="outline" onClick={loadContainers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Ricarica Container
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Container Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Container Istanze ({containers.length})
              </CardTitle>
              <CardDescription>
                Istanze operative di container SmartDocs per testing e interrogazioni
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
          {showContainerPreview && containerStats && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  📦 Dettagli Container
                  {loadingContainerStats && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documenti:</span>
                    <Badge variant="secondary">{containerStats.totalDocuments || containerDocuments.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chunks:</span>
                    <Badge variant="secondary">{containerStats.totalChunks || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Embeddings:</span>
                    <Badge variant="secondary">{containerStats.totalEmbeddings || 0}</Badge>
                  </div>
                </div>
                
                {containerDocuments.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-medium text-sm mb-2">Documenti ({containerDocuments.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {containerDocuments.slice(0, 5).map((doc: any) => (
                        <div key={doc.id} className="text-xs p-2 bg-white rounded border">
                          <div className="font-medium truncate">{doc.title || doc.filename}</div>
                          <div className="text-gray-500">
                            {doc.type} • {doc.chunks_count || 0} chunks
                          </div>
                        </div>
                      ))}
                      {containerDocuments.length > 5 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{containerDocuments.length - 5} altri documenti
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="sync" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Test Sync
              </TabsTrigger>
              <TabsTrigger value="query" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Test Query
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Microscope className="w-4 h-4" />
                Analisi Avanzata
              </TabsTrigger>
            </TabsList>

            {/* Sync Test Tab */}
            <TabsContent value="sync">
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Test Sincronizzazione Container</CardTitle>
                  <CardDescription>
                    Testa il processo di sincronizzazione e chunking su un'istanza container specifica
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
                      <option value="">Seleziona container istanza...</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatContainerOption(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contenuto Custom (opzionale)</Label>
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
                        Testing in corso...
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
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Documento ID:</strong> {syncTestResult.documentId || 'N/A'}
                            </div>
                            <div>
                              <strong>Chunks Processati:</strong> {syncTestResult.chunksProcessed || 0}
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
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                          {JSON.stringify(syncDebugData, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Query Test Tab */}
            <TabsContent value="query">
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Test Query RAG</CardTitle>
                  <CardDescription>
                    Testa interrogazioni RAG su istanze container specifiche
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
                      placeholder="Inserisci la tua domanda..."
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
                        Esegui Query
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
                                  {queryResults.sources.map((source, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded border text-sm">
                                      <div className="font-medium text-blue-700">
                                        {source.title} 
                                        <Badge variant="secondary" className="ml-2">
                                          {(source.similarity * 100).toFixed(1)}%
                                        </Badge>
                                      </div>
                                      <div className="text-gray-600 mt-1 line-clamp-2">
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
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                          {JSON.stringify(queryDebugData, null, 2)}
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
                    Visualizzazione chunks semantici e knowledge graph delle istanze container
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

                  {/* Advanced Results */}
                  {(advancedChunks.length > 0 || knowledgeGraph.entities.length > 0) && (
                    <Tabs defaultValue="chunks" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="chunks">
                          Chunks Semantici ({advancedChunks.length})
                        </TabsTrigger>
                        <TabsTrigger value="knowledge-graph">
                          Knowledge Graph ({knowledgeGraph.entities.length} entità)
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="chunks">
                        <ChunksViewer chunks={advancedChunks} />
                      </TabsContent>

                      <TabsContent value="knowledge-graph">
                        <KnowledgeGraphViewer knowledgeGraph={knowledgeGraph} />
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
