import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TextArea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import smartDocsService, { Container, QueryResult } from '../../services/smartdocs.service';
import smartDocsAdvancedService from '../../services/smartdocs-advanced.service';
import ContainerCategoryManager from '../../components/smartdocs/ContainerCategoryManager';
import ContainerForm from '../../components/smartdocs/ContainerForm';
import ContainerList from '../../components/smartdocs/ContainerList';
import ContainerViewModal from '../../components/smartdocs/ContainerViewModal';
import DeleteConfirmModal from '../../components/smartdocs/DeleteConfirmModal';
import ChunksViewer from '../../components/smartdocs/ChunksViewer';
import KnowledgeGraphViewer from '../../components/smartdocs/KnowledgeGraphViewer';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import {
  Database,
  FileText,
  Search,
  Upload,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  BarChart3,
  Settings,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function SmartDocsPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, any[]>>({});
  
  // Filtri container
  const [searchContainer, setSearchContainer] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Edit/View/Delete container
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [viewingContainer, setViewingContainer] = useState<Container | null>(null);
  const [deletingContainer, setDeletingContainer] = useState<{ id: string; name: string } | null>(null);
  
  // Loading states granulari
  const [loadingStates, setLoadingStates] = useState({
    creating: false,
    updating: false,
    deleting: false,
    querying: false,
    ingesting: false,
    batchIngesting: false,
    syncTesting: false,
    batchSyncTesting: false
  });

  // Sync Test - Advanced
  const [syncTestResult, setSyncTestResult] = useState<any>(null);
  const [syncContainerId, setSyncContainerId] = useState<string>('');
  const [showSyncDebug, setShowSyncDebug] = useState(false);
  const [syncDebugData, setSyncDebugData] = useState<any>(null);
  const [batchSyncProgress, setBatchSyncProgress] = useState<{current: number; total: number} | null>(null);
  const [batchSyncResults, setBatchSyncResults] = useState<any[]>([]);
  
  // ✅ NEW: Advanced Sync Test States
  const [customSyncPrompt, setCustomSyncPrompt] = useState<string>('');
  const [showChunksViewer, setShowChunksViewer] = useState(false);
  const [generatedChunks, setGeneratedChunks] = useState<any[]>([]);
  const [extractedEntities, setExtractedEntities] = useState<any[]>([]);
  const [extractedRelationships, setExtractedRelationships] = useState<any[]>([]);
  const [showKGGraph, setShowKGGraph] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Container form
  // Rimosso - ora gestito dal componente ContainerForm

  // Ingest form
  const [ingestData, setIngestData] = useState({
    title: '',
    content: '',
    type: 'manual'
  });

  // Query form - Chat Style with Advanced Features
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryThreshold, setQueryThreshold] = useState(0.5);
  const [showQueryDebug, setShowQueryDebug] = useState(false);
  const [queryDebugData, setQueryDebugData] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string; timestamp: Date}>>([]);
  
  // ✅ NEW: Advanced Query States
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>('');
  const [showEmbeddingViewer, setShowEmbeddingViewer] = useState(false);
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [detailedSources, setDetailedSources] = useState<any[]>([]);
  const [tokenCount, setTokenCount] = useState<{prompt: number; completion: number; total: number} | null>(null);

  // Batch ingest
  const [batchResult, setBatchResult] = useState<any>(null);

  useEffect(() => {
    loadHealthStatus();
    loadContainers();
    loadCategories();
  }, []);

  const loadHealthStatus = async () => {
    try {
      const status = await smartDocsService.healthCheck();
      setHealthStatus(status);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setHealthStatus({ enabled: false, error: err.message });
    }
  };

  const loadContainers = async () => {
    try {
      // Use the correct API endpoint for containers
      const response = await api.get('/smartdocs/containers');
      if (response.data.success) {
        setContainers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load containers:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/smartdocs/container-categories/grouped');
      if (response.data.success) {
        setGroupedCategories(response.data.data);
        // Flatten per select
        const allCats: any[] = [];
        Object.values(response.data.data).forEach((cats: any) => {
          allCats.push(...cats);
        });
        setCategories(allCats);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleUpdateContainer = async (formData: any) => {
    if (!editingContainer) return;

    setLoadingStates(prev => ({ ...prev, updating: true }));
    setError(null);

    try {
      await smartDocsService.updateContainer(editingContainer.id, {
        name: formData.name,
        description: formData.description,
        ai_prompt: formData.ai_prompt
      });
      setEditingContainer(null);
      await loadContainers();
      toast.success('Container aggiornato con successo!');
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante l\'aggiornamento del container';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteContainer = async () => {
    if (!deletingContainer) return;

    setLoadingStates(prev => ({ ...prev, deleting: true }));
    setError(null);

    try {
      await smartDocsService.deleteContainer(deletingContainer.id);
      await loadContainers();
      toast.success('Container eliminato con successo!');
      setDeletingContainer(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante l\'eliminazione del container';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }));
    }
  };

  const confirmDeleteContainer = (id: string, name: string) => {
    setDeletingContainer({ id, name });
  };



  const handleCreateContainer = async (formData: any) => {
    setLoadingStates(prev => ({ ...prev, creating: true }));
    setError(null);

    try {
      await smartDocsService.createContainer(formData);
      await loadContainers();
      toast.success('Container creato con successo!');
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante la creazione del container';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err; // Re-throw per permettere al form di gestire l'errore
    } finally {
      setLoadingStates(prev => ({ ...prev, creating: false }));
    }
  };

  const handleIngestManual = async () => {
    if (!ingestData.title || !ingestData.content) {
      toast.error('Titolo e contenuto richiesti');
      return;
    }

    setLoadingStates(prev => ({ ...prev, ingesting: true }));
    setError(null);

    try {
      const result = await smartDocsService.ingestManual(ingestData);
      setIngestData({ title: '', content: '', type: 'manual' });
      toast.success(`Documento ingerito! Chunks: ${result.chunksProcessed}`);
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante l\'ingest del documento';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, ingesting: false }));
    }
  };

  const handleQuery = async () => {
    if (!queryText) {
      toast.error('Inserisci una domanda');
      return;
    }

    setLoadingStates(prev => ({ ...prev, querying: true }));
    setError(null);
    // ✅ Non resettare queryResult per mantenere lo storico visibile
    setQueryDebugData(null);  // ✅ Reset debug data

    try {
      // ✅ Include conversation history for chat continuity
      const requestBody: any = {
        question: queryText,
        containerId: selectedContainer || undefined,
        limit: 5,
        threshold: queryThreshold,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      // ✅ Add custom system prompt if provided
      if (customSystemPrompt.trim().length > 0) {
        requestBody.systemPrompt = customSystemPrompt;
      }

      const debugInfo: any = {
        timestamp: new Date().toISOString(),
        request: {
          url: 'http://localhost:3500/api/query',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        }
      };

      console.log('[Query Debug] Request:', requestBody);

      const response = await fetch('http://localhost:3500/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('[Query Debug] Response:', result);

      debugInfo.response = {
        status: response.status,
        statusText: response.statusText,
        body: result
      };

      // ✅ Save complete debug information including AI prompt
      if (result.success && result.data && result.data.debug) {
        debugInfo.aiDebug = result.data.debug;  // This contains messages, context, etc.
      }

      setQueryDebugData(debugInfo);  // ✅ Save debug data

      if (result.success && result.data) {
        setQueryResult(result.data);
        
        // ✅ Add to conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user', content: queryText, timestamp: new Date() },
          { role: 'assistant', content: result.data.answer, timestamp: new Date() }
        ];
        setConversationHistory(newHistory);
        
        // ✅ Clear input for next question
        setQueryText('');
        
        if (result.data.sources && result.data.sources.length > 0) {
          toast.success(`Query completata! ${result.data.sources.length} fonti trovate`);
        } else {
          toast.warning('Query completata ma nessuna fonte trovata. Prova con threshold più basso o termini diversi.');
        }
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante la query';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[Query Error]', err);
      
      // ✅ Add error to debug
      if (queryDebugData) {
        setQueryDebugData({
          ...queryDebugData,
          error: {
            message: errorMsg,
            stack: err.stack
          }
        });
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, querying: false }));
    }
  };

  const handleBatchIngest = async () => {
    setLoadingStates(prev => ({ ...prev, batchIngesting: true }));
    setError(null);
    setBatchResult(null);

    try {
      const result = await smartDocsService.batchIngestInterventionReports({
        limit: 100,
        offset: 0
      });
      setBatchResult(result);
      toast.success(`Batch completato! ${result.succeeded}/${result.processed} documenti caricati`);
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante il batch ingest';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, batchIngesting: false }));
    }
  };

  // ✅ NEW: Carica dati avanzati del documento (chunks + KG)
  const loadDocumentAdvancedData = async (documentId: string) => {
    try {
      const analysis = await smartDocsAdvancedService.getDocumentAnalysis(documentId);
      
      setGeneratedChunks(analysis.chunks);
      setExtractedEntities(analysis.entities);
      setExtractedRelationships(analysis.relationships);
      
      console.log('[SmartDocs] Analysis loaded:', {
        chunks: analysis.chunks.length,
        entities: analysis.entities.length,
        relationships: analysis.relationships.length
      });
    } catch (err: any) {
      console.error('[SmartDocs] Error loading advanced data:', err);
      // Non mostriamo errore all'utente, i dati avanzati sono opzionali
    }
  };

  const handleTestSync = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    setLoadingStates(prev => ({ ...prev, syncTesting: true }));
    setError(null);
    setSyncTestResult(null);
    setSyncDebugData(null);

    try {
      // ✅ Usa custom prompt se presente, altrimenti genera dati di test
      const useCustom = customSyncPrompt.trim().length > 0;
      
      const testData = {
        container_id: syncContainerId,
        source_app: 'richiesta_assistenza',
        source_type: 'auto_sync' as const,
        entity_type: 'request',
        entity_id: `test-request-${Date.now()}`,
        title: useCustom 
          ? `Custom Test - ${new Date().toLocaleString('it-IT')}`
          : `Richiesta Test - ${new Date().toLocaleString('it-IT')}`,
        content: useCustom 
          ? customSyncPrompt
          : `RICHIESTA ASSISTENZA TEST
Cliente: Test Cliente ${Math.floor(Math.random() * 1000)}
Categoria: Elettrico
Descrizione: Test di sincronizzazione automatica da Richiesta Assistenza
Nota: Questo è un test del sistema di sync SmartDocs
Data: ${new Date().toISOString()}

CHAT:
[Cliente]: Ho bisogno di assistenza per un problema con l'impianto
[Professionista]: Certo, posso aiutarti. Quando sei disponibile?
[Cliente]: Domani mattina alle 10

PREVENTIVO:
Totale: €150.00
Descrizione: Intervento standard + materiali
Stato: Inviato`,
        metadata: {
          status: 'test',
          client_name: useCustom ? 'Custom Test' : 'Cliente Test',
          created_at: new Date().toISOString(),
          test: true,
          custom_content: useCustom
        }
      };

      const debugInfo: any = {
        timestamp: new Date().toISOString(),
        request: {
          url: 'http://localhost:3500/api/sync/ingest',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: testData
        }
      };

      // Chiama l'API di sync direttamente
      const response = await fetch('http://localhost:3500/api/sync/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      debugInfo.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: result
      };

      setSyncDebugData(debugInfo);

      if (result.success) {
        setSyncTestResult(result.data);
        toast.success(`Sync test completato! ${result.data.chunksCreated} chunks creati`);
        
        // ✅ NEW: Carica dati avanzati (chunks + KG)
        if (result.data.documentId) {
          setSelectedDocumentId(result.data.documentId);
          await loadDocumentAdvancedData(result.data.documentId);
        }
        
        // Ricarica i container per aggiornare le stats
        await loadContainers();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante il sync test';
      setError(errorMsg);
      toast.error(errorMsg);
      
      // Aggiungi errore al debug
      if (syncDebugData) {
        setSyncDebugData({
          ...syncDebugData,
          error: {
            message: errorMsg,
            stack: err.stack
          }
        });
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, syncTesting: false }));
    }
  };

  const handleBatchTestSync = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    if (!confirm('Generare 20 richieste di test con clienti, professionisti, chat, preventivi e rapporti?')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, batchSyncTesting: true }));
    setError(null);
    setBatchSyncResults([]);
    setBatchSyncProgress({ current: 0, total: 20 });

    const clienti = [
      { nome: 'Mario Rossi', email: 'mario.rossi@email.it', telefono: '335-1234567' },
      { nome: 'Laura Bianchi', email: 'laura.bianchi@email.it', telefono: '348-2345678' },
      { nome: 'Giuseppe Verdi', email: 'giuseppe.verdi@email.it', telefono: '347-3456789' },
      { nome: 'Anna Ferrari', email: 'anna.ferrari@email.it', telefono: '339-4567890' },
      { nome: 'Paolo Esposito', email: 'paolo.esposito@email.it', telefono: '340-5678901' }
    ];

    const professionisti = [
      { nome: 'Elettricista Marco', specializzazione: 'Elettrico' },
      { nome: 'Idraulico Giovanni', specializzazione: 'Idraulico' },
      { nome: 'Tecnico Climatizzazione Sara', specializzazione: 'Climatizzazione' },
      { nome: 'Tuttofare Roberto', specializzazione: 'Manutenzione Generale' }
    ];

    const problemi = [
      'Non funziona il citofono',
      'Perdita acqua dal rubinetto',
      'Caldaia non si accende',
      'Interruttore differenziale scatta',
      'Condizionatore non raffredda',
      'Tapparelle bloccate',
      'WC perde acqua',
      'Prese elettriche non funzionano',
      'Termosifoni freddi',
      'Lampade che lampeggiano',
      'Scarico lavandino intasato',
      'Termostato rotto',
      'Finestra non si chiude',
      'Serratura porta bloccata',
      'Vetro rotto',
      'Infiltrazioni dal soffitto',
      'Interruttore rotto',
      'Boiler acqua calda guasto',
      'Piastrelle staccate',
      'Porta blindata cigola'
    ];

    const results = [];

    try {
      for (let i = 0; i < 20; i++) {
        const cliente = clienti[i % clienti.length];
        const professionista = professionisti[i % professionisti.length];
        const problema = problemi[i];
        
        const chatMessages = [
          `[${cliente.nome}]: Buongiorno, ho un problema: ${problema}`,
          `[${professionista.nome}]: Buongiorno ${cliente.nome}, capisco. Quando sarebbe disponibile per un sopralluogo?`,
          `[${cliente.nome}]: ${i % 2 === 0 ? 'Domani mattina alle 10' : 'Dopodomani pomeriggio alle 15'}`,
          `[${professionista.nome}]: Perfetto, ci vediamo allora. Le manderò un preventivo dopo il sopralluogo.`,
          `[${cliente.nome}]: Grazie mille!`
        ];

        const preventivo = {
          totale: Math.floor(Math.random() * 500) + 100,
          dettaglio: [
            `Manodopera: €${Math.floor(Math.random() * 200) + 50}`,
            `Materiali: €${Math.floor(Math.random() * 300) + 50}`
          ],
          stato: i % 3 === 0 ? 'Accettato' : (i % 3 === 1 ? 'In attesa' : 'Rifiutato')
        };

        const rapporto = i % 2 === 0 ? {
          dataIntervento: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          durata: `${Math.floor(Math.random() * 3) + 1} ore`,
          descrizione: `Intervento completato con successo. ${problema}. Problema risolto sostituendo componente difettoso.`,
          note: 'Cliente soddisfatto. Rilasciata garanzia 12 mesi.'
        } : null;

        const testData = {
          container_id: syncContainerId,
          source_app: 'richiesta_assistenza',
          source_type: 'auto_sync',
          entity_type: 'request',
          entity_id: `batch-request-${Date.now()}-${i}`,
          title: `Richiesta #${i + 1} - ${problema}`,
          content: `RICHIESTA ASSISTENZA #${i + 1}

CLIENTE:
Nome: ${cliente.nome}
Email: ${cliente.email}
Telefono: ${cliente.telefono}

PROFESSIONISTA:
Nome: ${professionista.nome}
Specializzazione: ${professionista.specializzazione}

PROBLEMA:
${problema}

CATEGORIA: ${professionista.specializzazione}
STATO: ${rapporto ? 'Completato' : 'In corso'}
DATA RICHIESTA: ${new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()}

CHAT (${chatMessages.length} messaggi):
${chatMessages.join('\n')}

PREVENTIVO:
Totale: €${preventivo.totale}
${preventivo.dettaglio.join('\n')}
Stato: ${preventivo.stato}
${rapporto ? `

RAPPORTO INTERVENTO:
Data: ${rapporto.dataIntervento}
Durata: ${rapporto.durata}
Descrizione: ${rapporto.descrizione}
Note: ${rapporto.note}` : ''}`,
          metadata: {
            status: rapporto ? 'completed' : 'in_progress',
            client_name: cliente.nome,
            professional_name: professionista.nome,
            category: professionista.specializzazione,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            batch_test: true,
            batch_index: i
          }
        };

        try {
          const response = await fetch('http://localhost:3500/api/sync/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
          });

          const result = await response.json();

          if (result.success) {
            results.push({
              index: i + 1,
              success: true,
              title: testData.title,
              documentId: result.data.documentId,
              chunks: result.data.chunksCreated
            });
          } else {
            results.push({
              index: i + 1,
              success: false,
              title: testData.title,
              error: result.error
            });
          }
        } catch (err: any) {
          results.push({
            index: i + 1,
            success: false,
            title: testData.title,
            error: err.message
          });
        }

        setBatchSyncProgress({ current: i + 1, total: 20 });
        setBatchSyncResults([...results]);

        // Pausa di 500ms tra le richieste per non sovraccaricare
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successCount = results.filter(r => r.success).length;
      toast.success(`Batch completato! ${successCount}/20 richieste sincronizzate`);
      
      // Ricarica i container per aggiornare le stats
      await loadContainers();

    } catch (err: any) {
      const errorMsg = err.message || 'Errore durante il batch sync test';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, batchSyncTesting: false }));
      setBatchSyncProgress(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SmartDocs Management</h1>
          <p className="text-muted-foreground">
            Sistema di gestione documentale con RAG (Retrieval-Augmented Generation)
          </p>
        </div>
        {healthStatus && (
          <Badge variant={healthStatus.enabled && healthStatus.message === 'OK' ? 'default' : 'danger'}>
            {healthStatus.enabled && healthStatus.message === 'OK' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Online
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Offline
              </>
            )}
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">
            <Server className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="containers">
            <Database className="w-4 h-4 mr-2" />
            Containers
          </TabsTrigger>
          <TabsTrigger value="ingest">
            <Upload className="w-4 h-4 mr-2" />
            Ingest
          </TabsTrigger>
          <TabsTrigger value="query">
            <Search className="w-4 h-4 mr-2" />
            Query
          </TabsTrigger>
          <TabsTrigger value="sync-test">
            <Zap className="w-4 h-4 mr-2" />
            Sync Test
          </TabsTrigger>
          <TabsTrigger value="batch">
            <BarChart3 className="w-4 h-4 mr-2" />
            Batch
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Sistema</CardTitle>
              <CardDescription>
                Stato dei servizi SmartDocs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Enabled</p>
                      <p className={healthStatus.enabled ? 'text-green-600' : 'text-red-600'}>
                        {healthStatus.enabled ? 'Sì' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Environment</p>
                      <p>{healthStatus.environment || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Uptime</p>
                      <p>{healthStatus.uptime ? `${Math.floor(healthStatus.uptime)}s` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Message</p>
                      <p>{healthStatus.message || healthStatus.error || 'N/A'}</p>
                    </div>
                  </div>

                  {healthStatus.services && (
                    <div>
                      <p className="text-sm font-medium mb-2">Services</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(healthStatus.services).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            {value === 'healthy' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{key}: {value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Caricamento...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Containers Attivi</CardTitle>
              <CardDescription>
                {containers.length} container(s) disponibili
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedContainer(container.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{container.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {container.description || 'Nessuna descrizione'}
                        </p>
                      </div>
                      <Badge variant="default">{container.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-4">
          {/* Form Creazione/Modifica */}
          {editingContainer ? (
            <ContainerForm
              mode="edit"
              groupedCategories={groupedCategories}
              initialData={{
                type: editingContainer.type,
                name: editingContainer.name,
                description: editingContainer.description || '',
                ai_prompt: (editingContainer as any).ai_prompt || ''
              }}
              loading={loadingStates.updating}
              onSubmit={handleUpdateContainer}
              onCancel={() => setEditingContainer(null)}
            />
          ) : (
            <ContainerForm
              mode="create"
              groupedCategories={groupedCategories}
              loading={loadingStates.creating}
              onSubmit={handleCreateContainer}
            />
          )}

          {/* Lista Containers */}
          <ContainerList
            containers={containers}
            categories={categories}
            searchTerm={searchContainer}
            filterCategory={filterCategory}
            loading={loadingStates.deleting}
            onSearchChange={setSearchContainer}
            onFilterChange={setFilterCategory}
            onView={(container) => setViewingContainer(container)}
            onEdit={(container) => setEditingContainer(container)}
            onDelete={confirmDeleteContainer}
          />
        </TabsContent>

        <TabsContent value="ingest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carica Documento</CardTitle>
              <CardDescription>
                Ingest manuale/documento nel sistema SmartDocs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingest-title">Titolo</Label>
                <Input
                  id="ingest-title"
                  value={ingestData.title}
                  onChange={(e) => setIngestData({ ...ingestData, title: e.target.value })}
                  placeholder="Titolo del documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingest-type">Tipo</Label>
                <Input
                  id="ingest-type"
                  value={ingestData.type}
                  onChange={(e) => setIngestData({ ...ingestData, type: e.target.value })}
                  placeholder="manual, document, report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingest-content">Contenuto</Label>
                <TextArea
                  id="ingest-content"
                  value={ingestData.content}
                  onChange={(e) => setIngestData({ ...ingestData, content: e.target.value })}
                  placeholder="Contenuto del documento..."
                  rows={10}
                />
              </div>

              <Button onClick={handleIngestManual} disabled={loadingStates.ingesting}>
                {loadingStates.ingesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Carica Documento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>💬 Chat con RAG</CardTitle>
                  <CardDescription>
                    Conversa con i tuoi documenti usando intelligenza artificiale
                  </CardDescription>
                </div>
                {conversationHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConversationHistory([]);
                      setQueryResult(null);
                      setQueryDebugData(null);
                      toast.success('Conversazione azzerata');
                    }}
                  >
                    🗑️ Nuova Conversazione
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Storico Conversazione - Chat Style */}
              {conversationHistory.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-3">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">📜 Storico Conversazione</h4>
                  {conversationHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-100 border border-blue-200'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={msg.role === 'user' ? 'default' : 'info'} className="text-xs">
                            {msg.role === 'user' ? '👤 Tu' : '🤖 AI'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {msg.timestamp.toLocaleTimeString('it-IT')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="query-container">Container (opzionale)</Label>
                <select
                  id="query-container"
                  className="w-full p-2 border rounded"
                  value={selectedContainer}
                  onChange={(e) => setSelectedContainer(e.target.value)}
                >
                  <option value="">Tutti i containers</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query-text">La tua domanda</Label>
                <TextArea
                  id="query-text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleQuery();
                    }
                  }}
                  placeholder="Scrivi la tua domanda... (Ctrl+Enter per inviare)"
                  rows={3}
                />
              </div>

              {/* ✅ NEW: Custom System Prompt */}
              <details className="border rounded-lg">
                <summary className="p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm">
                  🤖 System Prompt Personalizzato (opzionale)
                </summary>
                <div className="p-4 space-y-2 border-t">
                  <Label htmlFor="custom-system-prompt">
                    Modifica il prompt di sistema dell'AI
                  </Label>
                  <TextArea
                    id="custom-system-prompt"
                    value={customSystemPrompt}
                    onChange={(e) => setCustomSystemPrompt(e.target.value)}
                    placeholder="Lascia vuoto per usare il prompt di default.\n\nEsempio custom:\nSei un assistente specializzato in manutenzione. Rispondi in modo tecnico e dettagliato. Cita sempre le fonti."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  {customSystemPrompt && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>System prompt personalizzato attivo</span>
                    </div>
                  )}
                </div>
              </details>

              <div className="space-y-2">
                <Label htmlFor="query-threshold">
                  Threshold Similarity ({queryThreshold})
                  <span className="text-xs text-gray-500 ml-2">
                    Più basso = più risultati, più alto = più preciso
                  </span>
                </Label>
                <input
                  id="query-threshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={queryThreshold}
                  onChange={(e) => setQueryThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.0 (Tutto)</span>
                  <span>0.5 (Consigliato)</span>
                  <span>1.0 (Perfetto)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleQuery} disabled={loadingStates.querying} className="flex-1">
                  {loadingStates.querying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ricerca...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Invia Domanda
                    </>
                  )}
                </Button>
                {queryDebugData && (
                  <Button
                    variant="outline"
                    onClick={() => setShowQueryDebug(!showQueryDebug)}
                  >
                    {showQueryDebug ? '🔒 Nascondi Debug' : '🔍 Debug AI'}
                  </Button>
                )}
              </div>

              {queryResult && (
                <div className="mt-6 space-y-4">
                  {/* ✅ NEW: Debug Panel */}
                  {showQueryDebug && queryDebugData && queryDebugData.aiDebug && (
                    <Card className="border-2 border-purple-300 mb-6">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          🤖 Debug AI - Cosa mandiamo all'AI
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Model Info */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-600">Modello</p>
                            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
                              {queryDebugData.aiDebug.model}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600">Temperature</p>
                            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
                              {queryDebugData.aiDebug.temperature}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600">Max Tokens</p>
                            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
                              {queryDebugData.aiDebug.max_tokens}
                            </p>
                          </div>
                        </div>

                        {/* Messages sent to AI */}
                        <div>
                          <p className="text-xs font-semibold text-purple-600 mb-2">
                            💬 MESSAGGI INVIATI ALL'AI ({queryDebugData.aiDebug.messagesCount})
                          </p>
                          <div className="space-y-3">
                            {queryDebugData.aiDebug.messages.map((msg: any, idx: number) => (
                              <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={msg.role === 'system' ? 'default' : 'info'}>
                                    {msg.role === 'system' ? '🔧 SYSTEM' : '👤 USER'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {msg.content.length} caratteri
                                  </span>
                                </div>
                                <pre className="text-xs font-mono bg-white p-3 rounded overflow-x-auto max-h-96 border whitespace-pre-wrap">
                                  {msg.content}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Context Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-600">Fonti Utilizzate</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {queryDebugData.aiDebug.sourcesUsed}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600">Lunghezza Contesto</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {queryDebugData.aiDebug.contextLength.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Raw Context */}
                        <details className="bg-gray-50 rounded p-3">
                          <summary className="text-xs font-semibold text-gray-600 cursor-pointer">
                            📄 Contesto Completo (Click per espandere)
                          </summary>
                          <pre className="text-xs font-mono mt-3 p-3 bg-white rounded border overflow-x-auto max-h-96 whitespace-pre-wrap">
                            {queryDebugData.aiDebug.context}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  )}

                  {/* ✅ Results Section */}
                  <div>
                    <h3 className="font-medium mb-2">Risposta</h3>
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="whitespace-pre-wrap">{queryResult.answer}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">
                      Fonti ({queryResult.sources.length})
                    </h3>
                    <div className="space-y-2">
                      {queryResult.sources.map((source, idx) => (
                        <div key={idx} className="p-3 border rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{source.title}</span>
                            <Badge variant="info">
                              {(source.similarity * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {source.chunk_text.substring(0, 200)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Test Sync da Richiesta Assistenza
              </CardTitle>
              <CardDescription>
                Testa la sincronizzazione automatica di dati strutturati da Richiesta Assistenza a SmartDocs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Cosa fa questo test:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Crea una richiesta di assistenza fittizia con chat e preventivo</li>
                    <li>Serializza i dati in formato testo leggibile</li>
                    <li>Chiama l'API <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">POST /api/sync/ingest</code></li>
                    <li>Crea embeddings OpenAI per semantic search</li>
                    <li>Salva nel database come documento virtuale</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="sync-container">Container di destinazione</Label>
                <select
                  id="sync-container"
                  className="w-full p-2 border rounded"
                  value={syncContainerId}
                  onChange={(e) => setSyncContainerId(e.target.value)}
                >
                  <option value="">Seleziona un container</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ NEW: Custom Content for Testing */}
              <details className="border rounded-lg">
                <summary className="p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm">
                  ⚙️ Opzioni Avanzate (opzionale)
                </summary>
                <div className="p-4 space-y-3 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="custom-sync-content">
                      Contenuto Personalizzato (lascia vuoto per usare dati di test)
                    </Label>
                    <TextArea
                      id="custom-sync-content"
                      value={customSyncPrompt}
                      onChange={(e) => setCustomSyncPrompt(e.target.value)}
                      placeholder="Inserisci contenuto custom da testare...\n\nAd esempio:\nCLIENTE: Mario Rossi\nPROBLEMA: Perdita acqua caldaia\nDESCRIZIONE: Cliente segnala perdita...\n\netc."
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  {customSyncPrompt && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verrà usato questo contenuto invece dei dati di test</span>
                    </div>
                  )}
                </div>
              </details>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleTestSync} 
                  disabled={loadingStates.syncTesting || loadingStates.batchSyncTesting || !syncContainerId}
                  className="w-full"
                >
                  {loadingStates.syncTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizzazione...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Test Singolo
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleBatchTestSync}
                  disabled={loadingStates.syncTesting || loadingStates.batchSyncTesting || !syncContainerId}
                  className="w-full"
                >
                  {loadingStates.batchSyncTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {batchSyncProgress ? `${batchSyncProgress.current}/${batchSyncProgress.total}` : 'Generazione...'}
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Genera 20 Richieste
                    </>
                  )}
                </Button>
              </div>

              {syncDebugData && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSyncDebug(!showSyncDebug)}
                    className="flex-1"
                  >
                    {showSyncDebug ? 'Nascondi Debug' : 'Mostra Debug'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(syncDebugData, null, 2));
                      toast.success('Debug data copiato negli appunti!');
                    }}
                  >
                    Copia JSON
                  </Button>
                </div>
              )}

              {syncTestResult && (
                <div className="mt-6 space-y-4">
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong>Sync completato con successo!</strong>
                    </AlertDescription>
                  </Alert>

                  {/* ✅ Semantic Chunking Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">🧠 Semantic Chunking - Risultati Intelligenti</CardTitle>
                      <CardDescription>
                        Il documento è stato processato con chunking semantico avanzato
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Main Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-2xl font-bold text-blue-600">
                            {syncTestResult.chunksCreated}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Chunk Semantici</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-2xl font-bold text-purple-600">
                            {syncTestResult.entitiesExtracted || 0}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Entità Estratte</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-2xl font-bold text-green-600">
                            {syncTestResult.relationshipsExtracted || 0}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Relazioni</p>
                        </div>
                      </div>

                      {/* Semantic Chunking Details */}
                      {syncTestResult.semanticChunking && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="text-xs font-semibold text-gray-700 mb-3">📊 Dettagli Chunking</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-600">Dimensione Media</p>
                              <p className="text-sm font-mono font-semibold">
                                {syncTestResult.semanticChunking.averageChunkSize} caratteri
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Range Dimensioni</p>
                              <p className="text-sm font-mono font-semibold">
                                {syncTestResult.semanticChunking.minChunkSize} - {syncTestResult.semanticChunking.maxChunkSize}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Token Totali</p>
                              <p className="text-sm font-mono font-semibold">
                                {syncTestResult.semanticChunking.totalTokens}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Importanza Media</p>
                              <p className="text-sm font-mono font-semibold">
                                {syncTestResult.semanticChunking.avgImportance}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Keywords */}
                      {syncTestResult.keywords && syncTestResult.keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">🔑 Keywords Estratte</p>
                          <div className="flex flex-wrap gap-2">
                            {syncTestResult.keywords.map((keyword: string, idx: number) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document ID */}
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600">Document ID</p>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all mt-1">
                          {syncTestResult.documentId}
                        </p>
                      </div>

                      {/* ✅ NEW: Advanced Viewers Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowChunksViewer(!showChunksViewer)}
                          className="flex-1"
                          disabled={generatedChunks.length === 0}
                        >
                          {showChunksViewer ? '🔒 Nascondi' : '📝 Visualizza'} Chunks ({generatedChunks.length})
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowKGGraph(!showKGGraph)}
                          className="flex-1"
                          disabled={extractedEntities.length === 0}
                        >
                          {showKGGraph ? '🔒 Nascondi' : '🕸️ Visualizza'} Knowledge Graph
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ✅ NEW: Chunks Viewer */}
                  {showChunksViewer && generatedChunks.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <ChunksViewer 
                          chunks={generatedChunks} 
                          documentTitle={syncTestResult.title || 'Test Document'}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* ✅ NEW: Knowledge Graph Viewer */}
                  {showKGGraph && extractedEntities.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <KnowledgeGraphViewer
                          entities={extractedEntities}
                          relationships={extractedRelationships}
                          documentTitle={syncTestResult.title || 'Test Document'}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Debug Panel Espandibile */}
                  {showSyncDebug && syncDebugData && (
                    <Card className="border-2 border-blue-300">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Debug Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Timestamp */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Timestamp</p>
                          <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                            {syncDebugData.timestamp}
                          </p>
                        </div>

                        {/* Request */}
                        <div>
                          <p className="text-xs font-semibold text-blue-600 mb-2">REQUEST</p>
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                            <div>
                              <p className="text-xs text-blue-700 font-medium">URL:</p>
                              <p className="text-sm font-mono">{syncDebugData.request.url}</p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700 font-medium">Method:</p>
                              <p className="text-sm font-mono">{syncDebugData.request.method}</p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700 font-medium">Body:</p>
                              <pre className="text-xs font-mono bg-white p-3 rounded overflow-x-auto max-h-96 border">
                                {JSON.stringify(syncDebugData.request.body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Response */}
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-2">RESPONSE</p>
                          <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-green-700 font-medium">Status:</p>
                                <p className="text-sm font-mono">{syncDebugData.response.status}</p>
                              </div>
                              <div>
                                <p className="text-xs text-green-700 font-medium">Status Text:</p>
                                <p className="text-sm font-mono">{syncDebugData.response.statusText}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-green-700 font-medium">Body:</p>
                              <pre className="text-xs font-mono bg-white p-3 rounded overflow-x-auto max-h-96 border">
                                {JSON.stringify(syncDebugData.response.body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Error (se presente) */}
                        {syncDebugData.error && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-2">ERROR</p>
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-sm font-mono text-red-800">
                                {syncDebugData.error.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Alert>
                    <AlertDescription>
                      <strong>Prossimo step:</strong> Vai al tab "Query" per testare una ricerca semantica sul documento appena sincronizzato.
                      <br />
                      <br />
                      Esempio query: "cliente ha bisogno assistenza impianto"
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Batch Results */}
              {batchSyncResults.length > 0 && (
                <div className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Risultati Batch Sync</span>
                        <Badge variant="info">
                          {batchSyncResults.filter(r => r.success).length}/{batchSyncResults.length} successi
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {batchSyncResults.map((result, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border rounded-lg ${
                              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {result.success ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium">#{result.index}</span>
                                  <span className="text-sm text-gray-600">{result.title}</span>
                                </div>
                                {result.success ? (
                                  <div className="text-xs text-gray-600 ml-6">
                                    {result.chunks} chunks creati
                                  </div>
                                ) : (
                                  <div className="text-xs text-red-600 ml-6">
                                    {result.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <AlertDescription>
                      <strong>Dataset generato:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>5 Clienti diversi con email e telefono</li>
                        <li>4 Professionisti con specializzazioni diverse</li>
                        <li>20 Problemi realistici (elettrico, idraulico, climatizzazione, manutenzione)</li>
                        <li>Chat con 5 messaggi per ogni richiesta</li>
                        <li>Preventivi con prezzi variabili (€100-€600)</li>
                        <li>Rapporti di intervento per il 50% delle richieste</li>
                      </ul>
                      <br />
                      <strong>Prova query come:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>"Mario Rossi caldaia"</li>
                        <li>"preventivo elettrico"</li>
                        <li>"rapporto intervento completato"</li>
                        <li>"problemi idraulici"</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Ingest Rapportini</CardTitle>
              <CardDescription>
                Carica rapportini esistenti nel sistema SmartDocs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Questa operazione caricherà fino a 100 rapportini nel sistema SmartDocs.
                  L'operazione può richiedere alcuni minuti.
                </AlertDescription>
              </Alert>

              <Button onClick={handleBatchIngest} disabled={loadingStates.batchIngesting}>
                {loadingStates.batchIngesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Avvia Batch Ingest
                  </>
                )}
              </Button>

              {batchResult && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Processati</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{batchResult.processed}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-600">Successi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          {batchResult.succeeded}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-600">Errori</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-600">
                          {batchResult.failed}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {batchResult.errors && batchResult.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Errori</h3>
                      <div className="space-y-2">
                        {batchResult.errors.map((err: any, idx: number) => (
                          <Alert key={idx} variant="destructive">
                            <AlertDescription>
                              Rapportino #{err.id}: {err.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ContainerCategoryManager />
        </TabsContent>
      </Tabs>

      {/* Modale Visualizzazione Container */}
      {viewingContainer && (
        <ContainerViewModal
          container={viewingContainer}
          categories={categories}
          onClose={() => setViewingContainer(null)}
          onEdit={(container) => {
            setViewingContainer(null);
            setEditingContainer(container);
          }}
        />
      )}

      {/* Modale Conferma Eliminazione */}
      {deletingContainer && (
        <DeleteConfirmModal
          title="Elimina Container"
          message="Vuoi eliminare questo container?"
          containerName={deletingContainer.name}
          loading={loadingStates.deleting}
          onConfirm={handleDeleteContainer}
          onCancel={() => setDeletingContainer(null)}
        />
      )}
    </div>
  );
}
