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

// ✅ Email Parser Function
function parseEmail(emailContent: string): string {
  try {
    const lines = emailContent.split('\n');
    const parsed: string[] = [];
    
    let subject = '';
    let from = '';
    let to = '';
    let date = '';
    let bodyStartIndex = 0;
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('Subject:')) {
        subject = line.replace('Subject:', '').trim();
      } else if (line.startsWith('From:')) {
        from = line.replace('From:', '').trim();
      } else if (line.startsWith('To:')) {
        to = line.replace('To:', '').trim();
      } else if (line.startsWith('Date:')) {
        date = line.replace('Date:', '').trim();
      } else if (line.trim() === '') {
        bodyStartIndex = i + 1;
        break;
      }
    }
    
    // Build formatted output
    parsed.push('EMAIL RICEVUTA');
    parsed.push('='.repeat(50));
    if (subject) parsed.push(`Oggetto: ${subject}`);
    if (from) parsed.push(`Da: ${from}`);
    if (to) parsed.push(`A: ${to}`);
    if (date) parsed.push(`Data: ${date}`);
    parsed.push('='.repeat(50));
    parsed.push('');
    
    // Add body
    const body = lines.slice(bodyStartIndex).join('\n').trim();
    parsed.push(body);
    
    return parsed.join('\n');
  } catch (error) {
    console.error('Email parsing error:', error);
    return emailContent; // Fallback to raw content
  }
}

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
  chunk_count?: string;
  entities_count?: string;
  relationships_count?: string;
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

// 🆕 NUOVO: Modal di conferma per Azzera Container
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

// 🔧 FUNZIONE FIX: Converte sempre a array
const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // Se è un oggetto, prova a cercare una proprietà che sia un array
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.chunks)) return data.chunks;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
};

export default function SmartDocsTestLab() {
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [syncContainerId, setSyncContainerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'query' | 'sync' | 'batch' | 'advanced' | 'patterns' | 'markdown'>('query');
  
  // Form states
  const [queryText, setQueryText] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customSyncContent, setCustomSyncContent] = useState<string>(`RICHIESTA DI ASSISTENZA TECNICA
================================
Data Richiesta: 2025-10-28
ID Richiesta: RA-2025-001847
Cliente: Ditta Rossi Mario S.r.l.
Indirizzo: Via Roma 45, 20100 Milano
Telefono: +39 02 1234 5678
Email: mario.rossi@dittarossi.it
Referente: Sig. Mario Rossi

## DATI PROFESSIONISTA ASSEGNATO
Nome Completo: Andrea Bianchi
ID Professionista: PROF-2024-001847
Email Professionale: andrea.bianchi@techsupport.it
Telefono Diretto: +39 011 555 6789
Cellulare: +39 347 123 4567
Azienda: TechSupport Solutions S.r.l.
Partita IVA: IT12345678901
Codice Fiscale: BNC DRA 85M01L219Z
Sede: Via Garibaldi 78, 10123 Torino
Sito Web: https://www.techsupport-solutions.it
Professione: Ingegnere Informatico Senior
Professione ID: PROFESSION-IT-001

Dati di Competenza:
  - Specializzazioni: Network Engineering, Systems Administration, Cloud Infrastructure
  - Anni di Esperienza: 12 anni
  - Livello Certificazione: Senior (Certified Cisco Instructor)
  - Certificazioni:
    * Cisco Certified Network Professional (CCNP) - Valida fino 2026-05-15
    * AWS Solutions Architect Associate - Valida fino 2025-12-10
    * CompTIA Security+ - Valida fino 2025-08-20
  - Lingue: Italiano (nativo), Inglese (fluente), Francese (base)
  - Categorie di Competenza: ["Manutenzione Informatica", "Network e Infrastruttura", "Cloud Services"]

Valutazioni e Recensioni:
  - Rating Medio: 4.8/5.0 (basato su 47 recensioni)
  - Numero Interventi Completati: 312
  - Tasso di Soddisfazione Clienti: 96.2%
  - Tempi Medi di Risposta: 45 minuti
  - Tasso di Completamento al Primo Tentativo: 89%

Profilo Professionale:
  - Professionista Verificato: SI
  - Background Check: COMPLETATO (2024-03-15)
  - Certificati Verificati: SI
  - Documenti Verificati: SI
  - Approvazione Piattaforma: APPROVATO (2023-11-20)
  - Status Attuale: ATTIVO E DISPONIBILE

Dati Finanziari:
  - Tariffa Oraria: €150,00/ora
  - Tariffa Minima: €180,00 (3 ore)
  - Costo Viaggio: €1,20/km (raggio coperto: 30 km)
  - Km Gratuiti: 15 km
  - Modalità Pagamento Accettate: Bonifico, Carta Credito, Assegno
  - IBAN: IT60X0542811101000000123456
  - BIC: BCCAITMM
  - Beneficiario: Andrea Bianchi

Disponibilità:
  - Giorni Lavorativi: Lunedi-Venerdì
  - Orari: 08:00-19:00 (con pausa 12:30-13:30)
  - Weekend: Su richiesta (+25% supplemento)
  - Urgenze 24/7: SI (disponibile entro 2 ore)
  - Giorni Festivi: Disponibile (+50% supplemento)

Aree di Servizio:
  - Area Principale: Torino e Provincia TO
  - Aree Secondarie: Province AL, CN, NO, VB
  - Telelavoro: SI (supporto remoto disponibile)
  - Missioni: Disponibile (richiedere preventivo speciale)

Strumenti e Tecnologie Utilizzate:
  - Software: Cisco IOS XE, Junos, MikroTik, pfSense
  - Hardware: Cisco ASR, Catalyst, Arista, Juniper EX
  - Monitoring: Zabbix, Nagios, PRTG Network Monitor
  - Documentation: Confluence, Jira, Asana
  - Remote Access: TeamViewer, AnyDesk, RDP

## DESCRIZIONE DEL PROBLEMA
Il sistema di gestione magazzino non funziona correttamente. Gli ordini non vengono registrati nel database e l'interfaccia è lenta. Inoltre, i report di vendita non caricano i dati storici degli ultimi 3 mesi.

Priorità: ALTA
Tipo Problema: Software / Hardware - Misto
Sistemi Interessati: ERP, Database, Server

## STORICO DELLA CHAT DI SUPPORTO

[2025-10-28 09:15] Cliente: Buongiorno, il nostro sistema ERP è down da questa mattina
[2025-10-28 09:16] Supporto: Buongiorno, accesso al ticket RA-2025-001847. Stiamo analizzando il problema
[2025-10-28 09:45] Supporto: Abbiamo verificato il server - il disco è pieno al 95%. Procediamo con la pulizia
[2025-10-28 10:30] Cliente: Quanto tempo occorrerà? Abbiamo ordini in sospeso
[2025-10-28 10:32] Supporto: Stimiamo 2-3 ore. Procederemo con l'ottimizzazione del database e la pulizia dei log
[2025-10-28 14:00] Supporto: Sistema ripristinato. Spazio disco liberato: 450GB. Backup completato
[2025-10-28 14:05] Cliente: Perfetto! Ora funziona. Potete mandare un preventivo per la manutenzione?

## PREVENTIVI

### Preventivo 1: Manutenzione Ordinaria
Data: 2025-10-28
Validità: 30 giorni

1. Pulizia e ottimizzazione database: €450,00
   - Rimozione dati obsoleti
   - Riorganizzazione indici
   - Analisi performance
   
2. Backup automatizzato (configurazione): €300,00
   - Configurazione backup giornaliero
   - Verifiche di ripristino
   - Documentazione procedure
   
3. Monitoraggio 24/7 (1 anno): €2.400,00
   - Monitoraggio continuo risorse
   - Alert automatici
   - Supporto prioritario

Sottotale: €3.150,00
IVA (22%): €693,00
**TOTALE: €3.843,00**

### Preventivo 2: Upgrade Infrastruttura
Data: 2025-10-28
Validità: 30 giorni

1. Upgrade SSD Server (+1TB): €850,00
   - Fornitura disco SSD NVMe
   - Installazione e configurazione
   - Test performance
   
2. RAM aggiuntiva (64GB): €1.200,00
   - Fornitura RAM DDR4 ECC
   - Installazione
   - Verifica compatibilità
   
3. Migrazione database (zero downtime): €1.500,00
   - Pianificazione della migrazione
   - Esecuzione con replica live
   - Verifiche integrità dati

Sottotale: €3.550,00
IVA (22%): €781,00
**TOTALE: €4.331,00**

## RAPPORTO DI INTERVENTO

Data Intervento: 2025-10-28
Ora Inizio: 09:30
Ora Fine: 15:30
Durata: 6 ore
Tecnico: Ing. Andrea Bianchi
Livello Intervento: Senior

### Fase 1: Diagnosi (1,5 ore)
- Accesso remoto al server
- Verifica log di sistema: Errore - Disco pieno (95% utilizzo)
- Analisi processi attivi
- Backup preventivo completato (450GB)
Stato: ✅ COMPLETATO

### Fase 2: Risoluzione (3 ore)
- Pulizia log dei server: liberati 120GB
- Compressione archivi vecchi: liberati 200GB
- Ottimizzazione database: liberati 130GB
- Riavvio servizi in sequenza controllata
Stato: ✅ COMPLETATO

### Fase 3: Verifica e Test (1,5 ore)
- Test completo dei servizi
- Verifica caricamento report storici: ✅ OK
- Inserimento ordini di prova: ✅ OK
- Verifiche performance: velocità rispristinata al 100%
- Salvataggio dati diagnostici per analisi futura
Stato: ✅ COMPLETATO

### Note Tecniche
- Problema Primario: Partizione root piena causata da log-rotation non configurato
- Soluzione Permanente: Configurazione log-rotation automatico
- Documenti Forniti: Procedure di backup, checklist manutenzione mensile
- Raccomandazioni: Upgrade storage hardware entro 60 giorni

### Costi Intervento
- Ore Intervento (6 @ €150/ora): €900,00
- Spare parts: €0,00
Totale Intervento: €900,00
Stato: COMPLETATO - In attesa fatturazione

### Follow-up
- Prossima manutenzione preventiva: 2025-11-28
- Verifica backup: ogni lunedì
- Riunione progetto upgrade: da concordare

================================
Fine Documento: 2025-10-28 15:45
Generato da: SmartDocs Test Lab`);
  const [useLLMExtraction, setUseLLMExtraction] = useState(false); // ✅ DEFAULT: FALSE per usare Pattern Learning automatico
  
  // ✅ NEW: LLM Configuration Parameters
  const [llmModel, setLlmModel] = useState<'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview'>('gpt-3.5-turbo');
  const [llmMaxTokens, setLlmMaxTokens] = useState(4000);
  const [llmTemperature, setLlmTemperature] = useState(0.2);
  const [llmEnableSummary, setLlmEnableSummary] = useState(true);
  
  // ✅ NEW: RAG Query Configuration
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [showRagDebug, setShowRagDebug] = useState(false);
  const [ragDebugData, setRagDebugData] = useState<any>(null);
  
  // ✅ NEW: RAG AI Configuration
  const [ragAiModel, setRagAiModel] = useState<'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview'>('gpt-4-turbo-preview');
  const [ragMaxTokens, setRagMaxTokens] = useState(2000);
  const [ragTemperature, setRagTemperature] = useState(0.7);
  const [ragTopK, setRagTopK] = useState(5);
  const [ragSystemPrompt, setRagSystemPrompt] = useState(`Sei un assistente AI esperto che risponde a domande basandoti su documenti forniti.

ISTRUZIONI:
- Rispondi SOLO usando le informazioni nei documenti forniti
- Se la risposta non è nei documenti, dillo chiaramente
- Cita sempre le fonti quando possibile
- Sii preciso, conciso e professionale
- Se ci sono entità o relazioni rilevanti nel knowledge graph, usale per arricchire la risposta`);
  
  // ✅ NEW: Chat History
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([]);
  
  // UI states
  const [showQueryDebug, setShowQueryDebug] = useState(false);
  const [showSyncDebug, setShowSyncDebug] = useState(false);
  const [syncDebugData, setSyncDebugData] = useState<any>(null);
  const [queryDebugData, setQueryDebugData] = useState<any>(null);
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
  
  // 🆕 NUOVO: State per Azzera Container
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResettingContainer, setIsResettingContainer] = useState(false);
  
  // 🆕 NUOVO: State per Debug Details dal Worker
  const [isLoadingDebugDetails, setIsLoadingDebugDetails] = useState(false);
  const [debugDetails, setDebugDetails] = useState<{
    chunks: any[];
    embeddings: any;
    graph: any;
  }>({
    chunks: [],
    embeddings: null,
    graph: null
  });
  const [debugDetailsError, setDebugDetailsError] = useState<string | null>(null);
  const [lastSyncedDocumentId, setLastSyncedDocumentId] = useState<string | null>(null);
  
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

  // ✅ NEW: Pattern Learning States
  const [patterns, setPatterns] = useState<any[]>([]);
  const [hybridStats, setHybridStats] = useState<any>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternUsageLog, setPatternUsageLog] = useState<any[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [patternUsageByDocument, setPatternUsageByDocument] = useState<any[]>([]);
  const [showUsageByDocModal, setShowUsageByDocModal] = useState(false);

  // ✅ NEW: Markdown Pipeline States
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [mdOcrEngine, setMdOcrEngine] = useState<'auto' | 'docling' | 'paddleocr-vl'>('auto');
  const [mdChunkingMethod, setMdChunkingMethod] = useState<'docling' | 'semantic' | 'both'>('both');
  const [mdResult, setMdResult] = useState<any>(null);
  const [isProcessingMd, setIsProcessingMd] = useState(false);
  const [mdDoclingChunks, setMdDoclingChunks] = useState<any[]>([]);
  const [mdSemanticChunks, setMdSemanticChunks] = useState<any[]>([]);
  const [showMdComparison, setShowMdComparison] = useState(false);

  // ✅ NEW: Sync Test - Markdown Settings (optional)
  const [syncUseMarkdown, setSyncUseMarkdown] = useState(false); // Disabled by default until Docling is installed
  const [syncOcrEngine, setSyncOcrEngine] = useState<'auto' | 'docling' | 'paddleocr-vl' | 'marker'>('auto');  // ✅ Added Marker
  const [syncChunkingMethod, setSyncChunkingMethod] = useState<'semantic' | 'docling'>('semantic');
  
  // 🔥 NEW: File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

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

  // 🆕 NUOVO: Funzione per Azzera Container
  const handleResetContainer = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container prima');
      return;
    }

    setShowResetModal(true);
  };

  // 🆕 NUOVO: Conferma Azzera Container
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
        return data.success ? ensureArray(data.data) : [];
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
        return data.success ? ensureArray(data.data) : [];
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
        return data.success ? ensureArray(data.data) : [];
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
        // 🔧 FIX: Usa ensureArray per gestire sia array che oggetti
        const chunksArray = ensureArray(data.data);
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
        // 🔧 FIX: Usa ensureArray per gestire sia array che oggetti
        const chunksArray = ensureArray(data.data);
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

  // 🆕 NUOVO: Load debug details dal documento sincrizzato (chunks, embeddings, graph)
  const loadDebugDetails = async (documentId: string) => {
    console.log('📊 DocumentID ricevuto:', documentId);
    
    if (!documentId || documentId === 'undefined') {
      console.error('❌ DocumentID non valido:', documentId);
      toast.error('Errore: documento non trovato. Riprova con un nuovo sync.');
      return;
    }

    setIsLoadingDebugDetails(true);
    setDebugDetailsError(null);
    
    try {
      console.log('📊 Caricando dettagli debug per documento:', documentId);
      
      // 1. Carica chunks
      console.log('1️⃣ Caricando chunks...');
      let chunks = [];
      try {
        const chunksResponse = await fetch(`http://localhost:3500/api/chunks/document/${documentId}`);
        if (chunksResponse.ok) {
          const chunksData = await chunksResponse.json();
          chunks = chunksData.success ? ensureArray(chunksData.data) : [];
          console.log(`✅ Chunks caricati: ${chunks.length}`);
        }
      } catch (err) {
        console.warn('⚠️ Errore caricamento chunks:', err);
      }

      // 2. Carica embeddings
      console.log('2️⃣ Caricando embeddings...');
      let embeddings = null;
      try {
        const embeddingsResponse = await fetch(`http://localhost:3500/api/embeddings/document/${documentId}`);
        if (embeddingsResponse.ok) {
          const embeddingsData = await embeddingsResponse.json();
          embeddings = embeddingsData.success && embeddingsData.data ? embeddingsData.data : null;
          console.log(`✅ Embeddings caricati`);
        }
      } catch (err) {
        console.warn('⚠️ Errore caricamento embeddings:', err);
      }

      // 3. Carica knowledge graph
      console.log('3️⃣ Caricando knowledge graph...');
      let graph = null;
      try {
        const graphResponse = await fetch(`http://localhost:3500/api/knowledge-graph/document/${documentId}`);
        if (graphResponse.ok) {
          const graphData = await graphResponse.json();
          graph = graphData.success && graphData.data ? graphData.data : null;
          console.log(`✅ Knowledge Graph caricato`);
        }
      } catch (err) {
        console.warn('⚠️ Errore caricamento knowledge graph:', err);
      }

      // Salva i dati nel state
      setDebugDetails({
        chunks,
        embeddings,
        graph
      });

      toast.success(`✅ Dettagli debug caricati! Chunks: ${chunks.length}`);
      console.log('✅ Tutti i dettagli caricati con successo');

    } catch (error) {
      console.error('❌ Errore nel caricamento dettagli debug:', error);
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      setDebugDetailsError(errorMsg);
      toast.error(`❌ Errore: ${errorMsg}`);
    } finally {
      setIsLoadingDebugDetails(false);
    }
  };

  // Load container stats - VERSIONE MIGLIORATA
  const loadContainerStats = async (containerId: string) => {
    if (!containerId) return;
    
    setIsLoadingStats(true);
    setStatsError(null);
    
    try {
      console.log('📊 Caricando statistiche per container:', containerId);
      
      // 🆕 Chiama /api/system/stats?containerId=xxx per ottenere le statistiche del container
      const statsResponse = await fetch(`http://localhost:3500/api/system/stats?containerId=${containerId}`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Stats caricati:', statsData);
        
        if (statsData.success && statsData.data?.statistics) {
          const stats = statsData.data.statistics;
          
          // Trasforma i dati dal nuovo formato in quello atteso dal frontend
          const containerStats: ContainerStats = {
            document_count: String(stats.total_documents || 0),
            embedding_count: String(stats.total_embeddings || 0),
            total_content_size: String(stats.total_storage_bytes || 0),
            chunk_count: String(stats.total_chunks || 0),
            entities_count: String(stats.total_entities || 0),
            relationships_count: String(stats.total_relationships || 0)
          };
          
          setContainerStats(containerStats);
          console.log('✅ Container stats trasformati:', containerStats);
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
      
    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche:', error);
      setStatsError(`Errore nel caricamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // ✅ NEW: Load Pattern Learning Data
  const loadPatterns = async () => {
    setIsLoadingPatterns(true);
    try {
      const response = await fetch('http://localhost:3500/api/patterns?showInactive=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatterns(data.data.patterns || []);
          console.log('✅ Patterns caricati:', data.data.patterns.length);
        }
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
      toast.error('Errore caricamento pattern');
    } finally {
      setIsLoadingPatterns(false);
    }
  };

  const loadHybridStats = async () => {
    try {
      const response = await fetch('http://localhost:3500/api/patterns/stats/hybrid-extraction');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHybridStats(data.data.statistics);
        }
      }
    } catch (error) {
      console.error('Failed to load hybrid stats:', error);
    }
  };

  const loadPatternDetails = async (patternId: string) => {
    try {
      const [detailsRes, usageRes] = await Promise.all([
        fetch(`http://localhost:3500/api/patterns/${patternId}`),
        fetch(`http://localhost:3500/api/patterns/${patternId}/usage-log?limit=20`)
      ]);

      if (detailsRes.ok && usageRes.ok) {
        const detailsData = await detailsRes.json();
        const usageData = await usageRes.json();

        if (detailsData.success) {
          setSelectedPattern(detailsData.data.pattern);
        }
        if (usageData.success) {
          const logs = usageData.data.usage_log || [];
          setPatternUsageLog(logs);
          
          // ✅ NEW: Raggruppa utilizzi per documento
          const byDocument = logs.reduce((acc: any, log: any) => {
            const docId = log.document_id;
            if (!acc[docId]) {
              acc[docId] = {
                document_id: docId,
                total_uses: 0,
                successes: 0,
                failures: 0,
                avg_time_ms: 0,
                total_entities: 0,
                total_relationships: 0,
                uses: []
              };
            }
            acc[docId].total_uses++;
            if (log.success) acc[docId].successes++;
            else acc[docId].failures++;
            acc[docId].total_entities += log.entities_extracted || 0;
            acc[docId].total_relationships += log.relationships_extracted || 0;
            acc[docId].uses.push(log);
            return acc;
          }, {});
          
          // Calcola avg time
          Object.values(byDocument).forEach((doc: any) => {
            const totalTime = doc.uses.reduce((sum: number, use: any) => sum + (use.extraction_time_ms || 0), 0);
            doc.avg_time_ms = Math.round(totalTime / doc.total_uses);
          });
          
          setPatternUsageByDocument(Object.values(byDocument));
        }
        setShowPatternModal(true);
      }
    } catch (error) {
      console.error('Failed to load pattern details:', error);
      toast.error('Errore caricamento dettagli pattern');
    }
  };

  const togglePattern = async (patternId: string, isActive: boolean) => {
    try {
      const response = await fetch(`http://localhost:3500/api/patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(isActive ? 'Pattern disattivato' : 'Pattern attivato');
        await loadPatterns();
        await loadHybridStats();
      }
    } catch (error) {
      console.error('Failed to toggle pattern:', error);
      toast.error('Errore aggiornamento pattern');
    }
  };

  const deletePattern = async (patternId: string, hard: boolean = false) => {
    if (!confirm(hard ? 'Eliminare DEFINITIVAMENTE questo pattern? (Non recuperabile!)' : 'Disattivare questo pattern?')) {
      return;
    }

    try {
      const url = hard 
        ? `http://localhost:3500/api/patterns/${patternId}?hard=true`
        : `http://localhost:3500/api/patterns/${patternId}`;
      
      const response = await fetch(url, { method: 'DELETE' });

      if (response.ok) {
        toast.success(hard ? '✅ Pattern eliminato definitivamente' : '✅ Pattern disattivato');
        await loadPatterns();
        await loadHybridStats();
      } else {
        toast.error('❌ Errore eliminazione pattern');
      }
    } catch (error) {
      console.error('Failed to delete pattern:', error);
      toast.error('❌ Errore eliminazione pattern');
    }
  };

  // Load patterns when tab changes to 'patterns'
  useEffect(() => {
    if (activeTab === 'patterns') {
      loadPatterns();
      loadHybridStats();
    }
  }, [activeTab]);

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
    onSuccess: (data) => {
      toast.success('Query eseguita con successo!');
      // 🆕 NUOVO: Salva i dati debug per visualizzazione successiva
      if (data.debug) {
        setQueryDebugData(data.debug);
      }
    },
    onError: (error: any) => {
      toast.error(`Errore query: ${error.message}`);
    }
  });

  // Sync mutation  
  const syncMutation = useMutation({
    mutationFn: async (payload: any) => {
      // ✅ RESET debug data BEFORE new sync
      setDebugDetails({ chunks: [], embeddings: null, graph: null });
      setDebugDetailsError(null);
      
      const response = await fetch('http://localhost:3500/api/sync/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Sync failed');
      return data;
    },
    onSuccess: (data) => {
      console.log('🔍 FULL RESPONSE:', data);
      console.log('data.data:', data.data);
      console.log('data.data.documentId:', data.data?.documentId);
      
      toast.success('Sync completato con successo!');
      if (data.debug) {
        setSyncDebugData(data.debug);
      }
      // 🆕 La risposta API è wrappata in { success, data }, quindi documentId è in data.data!
      const docId = data.data?.documentId;
      if (docId) {
        setLastSyncedDocumentId(docId);
        console.log('✅ Document ID SALVATO:', docId);
      } else {
        console.warn('⚠️ Nessun document_id trovato! data.data:', data.data);
      }
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
      debug: true,
      use_knowledge_base: useKnowledgeBase, // ✅ Include KB search flag
      // ✅ NEW: AI Configuration
      ai_model: ragAiModel,
      ai_max_tokens: ragMaxTokens,
      ai_temperature: ragTemperature,
      top_k: ragTopK,
      system_prompt: ragSystemPrompt.trim() || undefined
    };

    if (selectedContainer) {
      payload.container_id = selectedContainer;
    }

    // ✅ Add user message to chat history
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    }]);

    // ✅ Save debug data for display
    setRagDebugData({
      request: payload,
      timestamp: new Date().toISOString()
    });

    queryMutation.mutate(payload, {
      onSuccess: (response: any) => {
        // ✅ Add assistant response to chat history
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date().toISOString()
        }]);
        // Clear query text for next message
        setQueryText('');
      }
    });
  };

  // Execute sync
  const executeSync = async () => {
    if (!syncContainerId) {
      toast.error('Seleziona un container');
      return;
    }

    // 🔥 Check if we have an uploaded binary file
    if (uploadedFile) {
      // ✅ Binary file path: create FormData and upload to temp endpoint
      setIsUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('container_id', syncContainerId);
        formData.append('source_app', 'test-lab');
        formData.append('entity_type', 'test_document');
        formData.append('entity_id', `test-${Date.now()}`);
        formData.append('title', `Test Lab - ${uploadedFileName}`);
        formData.append('use_markdown', 'true'); // Always use Markdown for binary files
        formData.append('ocr_engine', syncOcrEngine);
        formData.append('chunking_method', syncChunkingMethod);
        formData.append('metadata', JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'smartdocs-test-lab',
          use_llm_extraction: useLLMExtraction,
          llm_model: llmModel,
          llm_max_tokens: llmMaxTokens,
          llm_temperature: llmTemperature,
          llm_enable_summary: llmEnableSummary,
          uploaded_file_name: uploadedFileName
        }));

        // Call the same /ingest endpoint (now supports FormData)
        const response = await fetch('http://localhost:3500/api/sync/ingest', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        // ✅ SEMPRE salva debug data, anche in caso di errore
        if (result.debug) {
          setSyncDebugData(result.debug);
          console.log('📊 Debug data salvato:', result.debug);
        }

        if (result.success) {
          toast.success('✅ File binario processato con successo!');
          // Handle success like normal sync
          if (result.data) {
            setLastSyncedDocumentId(result.data.documentId);
          }
          // Reload stats
          if (syncContainerId) {
            loadContainerStats(syncContainerId);
          }
        } else {
          toast.error(`❌ Errore: ${result.error}`);
        }
      } catch (error: any) {
        toast.error(`❌ Errore upload file: ${error.message}`);
      } finally {
        setIsUploadingFile(false);
      }
      return;
    }

    // 📝 Text content path (original logic)
    const testContent = customSyncContent.trim() || `RICHIESTA DI ASSISTENZA TECNICA
Codice: RA-2024-000123

=== INFORMAZIONI CLIENTE ===
Nome: Acme Corporation S.p.A.
Indirizzo: Via Roma 123, 20100 Milano MI
Telefono: +39 02 1234567
Email: info@acmecorp.it

=== TECNICO ASSEGNATO ===
Nome: Mario Rossi
Reparto: Assistenza Tecnica
Telefono: +39 333 1234567

=== DESCRIZIONE PROBLEMA ===
Data Segnalazione: 28 Ottobre 2024
Problema: Il sistema di climatizzazione dell'ufficio principale non funziona correttamente.
Sintomi: La temperatura impostata non viene raggiunta, il compressore si spegne dopo pochi minuti.
Urgenza: ALTA

=== INTERVENTO EFFETTUATO ===
Data Intervento: 30 Ottobre 2024
Ora Inizio: 09:00
Ora Fine: 11:30

Attività svolte:
1. Verifica impianto elettrico e collegamenti
2. Test del termostato e sensori temperatura
3. Identificazione termostato difettoso
4. Sostituzione componente con modello compatibile
5. Taratura e test funzionale del sistema
6. Verifica raggiungimento temperatura target

=== MATERIALI UTILIZZATI ===
- Termostato digitale Honeywell T6 Pro (1 pz)
- Cavi elettrici 2x1.5mm (5 mt)
- Morsetti di collegamento (4 pz)

=== PREVENTIVO E COSTI ===
Manodopera (2.5 ore): €150.00
Materiali: €85.00
Trasferta: €25.00
-------------------
Subtotale: €260.00
IVA 22%: €57.20
TOTALE: €317.20

=== STATO INTERVENTO ===
Stato: COMPLETATO
Esito: POSITIVO - Sistema ripristinato
Firma Tecnico: M. Rossi
Firma Cliente: G. Bianchi
Data Completamento: 30/10/2024

=== NOTE AGGIUNTIVE ===
Consigliata manutenzione programmata ogni 6 mesi.
Prossima verifica prevista: Aprile 2025.`;

    const payload = {
      container_id: syncContainerId,
      source_app: 'test-lab',
      entity_type: 'test_document',
      entity_id: `test-${Date.now()}`,
      title: `Test Lab - ${new Date().toLocaleString()}`,
      content: testContent,
      // ✅ NEW: Markdown-first pipeline (optional - disabled by default)
      use_markdown: syncUseMarkdown,
      ocr_engine: syncOcrEngine,
      chunking_method: syncChunkingMethod,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'smartdocs-test-lab',
        use_llm_extraction: useLLMExtraction, // ✅ LLM flag
        // ✅ NEW: LLM Configuration Parameters
        llm_model: llmModel,
        llm_max_tokens: llmMaxTokens,
        llm_temperature: llmTemperature,
        llm_enable_summary: llmEnableSummary
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

              {/* 🆕 NUOVO: Pulsante Azzera Container */}
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
                    {/* 📊 STATISTICHE CONTAINER */}
                    {containerStats && (
                      <>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          📊 Statistiche: <span className="font-bold text-blue-600">{selectedContainer ? containers.find((c: SmartDocsContainer) => c.id === syncContainerId)?.name || 'Container' : 'Container'}</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
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
                            <span className="text-sm text-gray-600">Chunks:</span>
                            <button
                              onClick={async () => {
                                setShowChunksModal(true);
                                if (syncContainerId) {
                                  const containerChunks = await loadContainerChunks(syncContainerId);
                                  setChunks(ensureArray(containerChunks));
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                            >
                              <CubeIcon className="w-3 h-3 mr-1" />
                              {/* 🆕 Usa auto_sync chunks che sono specifici di questo container */}
                              {syncStats?.auto_sync?.total_chunks || containerStats?.chunk_count || '0'}
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
                            <span className="text-sm text-gray-600">KB Graph Entities:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              {containerStats.entities_count || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">KB Graph Relationships:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {containerStats.relationships_count || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Dimensione:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {/* 🆕 Usa storage_size_bytes da auto_sync (in bytes), poi converti a KB/MB */}
                              {syncStats?.auto_sync?.storage_size_bytes 
                                ? formatBytes(parseInt(syncStats.auto_sync.storage_size_bytes))
                                : formatBytes(parseInt(containerStats.total_content_size || '0'))}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {!containerStats && syncStats && (
                      <>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">📊 Sync Stats</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Documenti:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {syncStats.total.total_documents}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Chunks:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <CubeIcon className="w-3 h-3 mr-1" />
                              {syncStats.total.total_chunks}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tokens:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {parseInt(syncStats.total.total_tokens).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Dimensione:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {formatBytes(syncStats.total.storage_size_bytes)}
                            </span>
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
                    { key: 'advanced', label: '🆕 Analisi Avanzata', icon: BeakerIcon },
                    { key: 'patterns', label: '🧠 Pattern Learning', icon: SparklesIcon },
                    { key: 'markdown', label: '📝 Markdown Pipeline', icon: DocumentTextIcon }
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
                      <p className="text-gray-600">Chat AI con retrieval semantico sui documenti</p>
                    </div>

                    {/* ✅ NEW: AI Configuration Panel */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900">⚙️ Configurazione AI</h4>
                        <button
                          onClick={() => {
                            setRagSystemPrompt(`Sei un assistente AI esperto che risponde a domande basandoti su documenti forniti.
ISTRUZIONI:
- Rispondi SOLO usando le informazioni nei documenti forniti
- Se la risposta non è nei documenti, dillo chiaramente
- Cita sempre le fonti quando possibile
- Sii preciso, conciso e professionale
- Se ci sono entità o relazioni rilevanti nel knowledge graph, usale per arricchire la risposta`);
                            toast.success('✅ Prompt resettato al default');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          🔄 Reset Default
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Model */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Modello AI</label>
                          <select
                            value={ragAiModel}
                            onChange={(e) => setRagAiModel(e.target.value as any)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="gpt-3.5-turbo">💨 GPT-3.5 Turbo (~$0.002/query)</option>
                            <option value="gpt-4">🧠 GPT-4 (~$0.04/query)</option>
                            <option value="gpt-4-turbo-preview">⚡ GPT-4 Turbo (~$0.02/query)</option>
                          </select>
                        </div>

                        {/* Top K Results */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Top K Risultati: {ragTopK}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={ragTopK}
                            onChange={(e) => setRagTopK(parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Max Tokens */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Tokens: {ragMaxTokens}
                          </label>
                          <input
                            type="range"
                            min="500"
                            max="4000"
                            step="100"
                            value={ragMaxTokens}
                            onChange={(e) => setRagMaxTokens(parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Temperature: {ragTemperature.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={ragTemperature}
                            onChange={(e) => setRagTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* System Prompt */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          System Prompt
                        </label>
                        <textarea
                          value={ragSystemPrompt}
                          onChange={(e) => setRagSystemPrompt(e.target.value)}
                          rows={5}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                          placeholder="System prompt per l'AI..."
                        />
                      </div>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Tutti i container</option>
                          {containers.map((c: SmartDocsContainer) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Knowledge Base Option */}
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useKnowledgeBase}
                            onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                🔗 Usa Knowledge Base (Entities + Relations)
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                ⚡ Enhanced
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Arricchisce RAG con knowledge graph
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* ✅ NEW: Chat History Display */}
                      {chatHistory.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">💬 Chat History</h4>
                            <button
                              onClick={() => setChatHistory([])}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              🗑️ Clear
                            </button>
                          </div>
                          {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white border border-gray-300 text-gray-800'
                              }`}>
                                <div className="text-xs opacity-75 mb-1">
                                  {msg.role === 'user' ? '👤 Tu' : '🤖 AI'} · {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Query Input */}
                      <div>
                        <label htmlFor="query-text" className="block text-sm font-medium text-gray-700 mb-2">
                          💬 Messaggio
                        </label>
                        <div className="flex space-x-2">
                          <textarea
                            id="query-text"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                executeQuery();
                              }
                            }}
                            rows={3}
                            placeholder="Scrivi il tuo messaggio... (Shift+Enter per nuova riga, Enter per inviare)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            onClick={executeQuery}
                            disabled={queryMutation.isPending || !queryText.trim()}
                            className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {queryMutation.isPending ? (
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                              <span>➡️</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Latest Response */}
                      {queryMutation.data && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                            <h4 className="text-lg font-semibold text-blue-900">📝 Ultima Risposta</h4>
                          </div>

                          {queryMutation.data.data.sources && queryMutation.data.data.sources.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-blue-900 mb-2">
                                📚 Fonti ({queryMutation.data.data.sources.length})
                              </h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {queryMutation.data.data.sources.map((source: any, idx: number) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <h6 className="font-medium text-blue-700">{source.title}</h6>
                                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                        {(source.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2">{source.chunk_text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Debug Panel */}
                          <div className="mt-3">
                            <button
                              onClick={() => setShowRagDebug(!showRagDebug)}
                              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm"
                            >
                              {showRagDebug ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                              <span>{showRagDebug ? '🔒 Nascondi' : '🔍 Mostra'} Debug (Request + Response)</span>
                            </button>

                            {showRagDebug && (
                              <div className="mt-3 bg-gray-900 rounded-lg p-4 space-y-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-yellow-400">➡️ REQUEST</span>
                                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(ragDebugData?.request, null, 2)); toast.success('📋 Copiato!'); }} className="text-xs text-blue-400">
                                      📋 Copia
                                    </button>
                                  </div>
                                  <pre className="text-xs text-yellow-300 font-mono bg-gray-800 rounded p-3 overflow-auto max-h-64">{JSON.stringify(ragDebugData?.request, null, 2)}</pre>
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-green-400">⬅️ RESPONSE</span>
                                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(queryMutation.data?.data, null, 2)); toast.success('📋 Copiato!'); }} className="text-xs text-blue-400">
                                      📋 Copia
                                    </button>
                                  </div>
                                  <pre className="text-xs text-green-300 font-mono bg-gray-800 rounded p-3 overflow-auto max-h-64">{JSON.stringify(queryMutation.data?.data, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
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
                          Contenuto Test
                        </label>
                        
                        {/* ✅ NEW: File Upload */}
                        <div className="mb-3 flex items-center space-x-3">
                          <label className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                              <div className="text-center">
                                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mt-1 text-sm text-gray-600">
                                  <span className="font-semibold text-blue-600">Carica file</span> o trascina qui
                                </p>
                                <p className="text-xs text-gray-500">TXT, PDF, DOCX, EML (max 10MB)</p>
                              </div>
                            </div>
                            <input
                              type="file"
                              accept=".txt,.pdf,.doc,.docx,.eml,.msg"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const fileName = file.name.toLowerCase();
                                    
                                    // 🔥 Determina se è un file binario che richiede OCR
                                    const isBinaryFile = fileName.endsWith('.pdf') || 
                                                        fileName.endsWith('.doc') || 
                                                        fileName.endsWith('.docx');
                                    
                                    if (isBinaryFile) {
                                      // ✅ File binario: salva per OCR, mostra placeholder
                                      setUploadedFile(file);
                                      setUploadedFileName(file.name);
                                      setSyncUseMarkdown(true); // Auto-abilita Markdown pipeline
                                      setCustomSyncContent(`[File Binario Caricato: ${file.name}]

⚠️ Questo file verrà processato tramite OCR.
Dimensione: ${(file.size / 1024).toFixed(2)} KB
Tipo: ${file.type || 'application/octet-stream'}

💡 Il contenuto verrà estratto automaticamente durante il sync.`);
                                      toast.success(`📄 File binario caricato: ${file.name} - OCR abilitato automaticamente`);
                                    } else if (fileName.endsWith('.eml') || fileName.endsWith('.msg')) {
                                      // 📧 Email file: parse content
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const content = event.target?.result as string;
                                        const emailData = parseEmail(content);
                                        setCustomSyncContent(emailData);
                                        setUploadedFile(null);
                                        setUploadedFileName('');
                                        toast.success(`📧 Email caricata: ${file.name}`);
                                      };
                                      reader.readAsText(file);
                                    } else {
                                      // 📄 Text file: read and display
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const content = event.target?.result as string;
                                        setCustomSyncContent(content);
                                        setUploadedFile(null);
                                        setUploadedFileName('');
                                        toast.success(`✅ File caricato: ${file.name}`);
                                      };
                                      reader.readAsText(file);
                                    }
                                  } catch (error: any) {
                                    toast.error(`❌ Errore lettura file: ${error.message}`);
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          
                          {(customSyncContent || uploadedFile) && (
                            <button
                              onClick={() => {
                                setCustomSyncContent('');
                                setUploadedFile(null);
                                setUploadedFileName('');
                              }}
                              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              🗑️ Cancella
                            </button>
                          )}
                        </div>
                        
                        <textarea
                          id="sync-content"
                          value={customSyncContent}
                          onChange={(e) => setCustomSyncContent(e.target.value)}
                          rows={6}
                          placeholder="Carica un file o inserisci contenuto manualmente (lascia vuoto per usare il default)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* ✅ NEW: LLM Extraction Checkbox */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useLLMExtraction}
                            onChange={(e) => setUseLLMExtraction(e.target.checked)}
                            className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                🤖 Forza AI Extraction (disabilita Pattern Learning)
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Sconsigliato
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              ⚠️ Forza l'uso dell'AI anche se esiste un pattern. Costo: ~$0.05-0.15 per documento. Lascia DISABILITATO per usare il Pattern Learning automatico.
                            </p>
                            {useLLMExtraction && (
                              <div className="mt-2 flex items-center space-x-2 text-xs">
                                <SparklesIcon className="w-4 h-4 text-red-600" />
                                <span className="text-red-700 font-medium">
                                  ⚠️ Pattern Learning DISABILITATO - Verrà sempre usata l'AI (costo elevato)
                                </span>
                              </div>
                            )}
                            {!useLLMExtraction && (
                              <div className="mt-2 flex items-center space-x-2 text-xs">
                                <span className="text-green-700 font-medium">
                                  ✅ Pattern Learning ATTIVO - Il sistema userà automaticamente pattern esistenti (GRATIS) o creerà nuovi pattern dall'AI
                                </span>
                              </div>
                            )}
                          </div>
                        </label>

                        {/* ✅ NEW: LLM Configuration Panel (shown when LLM extraction is enabled) */}
                        {useLLMExtraction && (
                          <div className="mt-4 pt-4 border-t border-purple-200 space-y-4">
                            <div className="text-xs font-semibold text-purple-900 mb-3">
                              ⚙️ Configurazione LLM
                            </div>

                            {/* AI Model Selection */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Modello AI
                              </label>
                              <select
                                value={llmModel}
                                onChange={(e) => setLlmModel(e.target.value as any)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              >
                                <option value="gpt-3.5-turbo">💨 GPT-3.5 Turbo (veloce, economico: ~$0.003/doc)</option>
                                <option value="gpt-4">🧠 GPT-4 (più accurato: ~$0.03/doc)</option>
                                <option value="gpt-4-turbo-preview">⚡ GPT-4 Turbo (bilanciato: ~$0.015/doc)</option>
                              </select>
                            </div>

                            {/* Max Tokens */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Max Tokens Output (più è alto, più entità vengono estratte)
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="range"
                                  min="1000"
                                  max="8000"
                                  step="500"
                                  value={llmMaxTokens}
                                  onChange={(e) => setLlmMaxTokens(parseInt(e.target.value))}
                                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-purple-700 min-w-[80px] text-right">
                                  {llmMaxTokens.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Meno entità</span>
                                <span>Più entità</span>
                              </div>
                            </div>

                            {/* Temperature */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Temperature (più bassa = più deterministico)
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={llmTemperature}
                                  onChange={(e) => setLlmTemperature(parseFloat(e.target.value))}
                                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-purple-700 min-w-[80px] text-right">
                                  {llmTemperature.toFixed(1)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Preciso (0.0)</span>
                                <span>Creativo (1.0)</span>
                              </div>
                            </div>

                            {/* Enable Summary */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="llm-summary"
                                checked={llmEnableSummary}
                                onChange={(e) => setLlmEnableSummary(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <label htmlFor="llm-summary" className="text-xs font-medium text-gray-700 cursor-pointer">
                                📝 Genera riassunto del documento (richiede +200 token)
                              </label>
                            </div>

                            {/* Cost Estimate */}
                            <div className="bg-purple-100 border border-purple-300 rounded-md p-2">
                              <div className="text-xs text-purple-800">
                                <span className="font-semibold">💰 Stima costo:</span>
                                {' '}
                                {llmModel === 'gpt-3.5-turbo' && '~$0.003-0.005'}
                                {llmModel === 'gpt-4' && '~$0.030-0.050'}
                                {llmModel === 'gpt-4-turbo-preview' && '~$0.015-0.025'}
                                {' '}per documento ({llmMaxTokens.toLocaleString()} max tokens)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ✅ NEW: Markdown Pipeline Settings (Optional) */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="sync-use-markdown"
                            checked={syncUseMarkdown}
                            onChange={(e) => setSyncUseMarkdown(e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <label htmlFor="sync-use-markdown" className="flex items-center space-x-2 cursor-pointer">
                              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                              <h4 className="text-sm font-bold text-gray-900">📝 Abilita Markdown Pipeline</h4>
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Converti documento in Markdown prima del processing (richiede Docling/PaddleOCR installato)
                            </p>
                            {syncUseMarkdown && (
                              <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded-md p-2 text-xs text-yellow-800">
                                ⚠️ <strong>Nota:</strong> Se ricevi errori di "OCR non disponibile", esegui:
                                <code className="block mt-1 bg-yellow-100 px-2 py-1 rounded font-mono text-xs">
                                  cd smartdocs && ./scripts/install_ocr_dependencies.sh docling
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!syncUseMarkdown && (
                          <div className="bg-yellow-100 border border-yellow-300 rounded-md p-2 text-xs text-yellow-800">
                            ⚠️ Markdown pipeline disabilitato - userà chunking semantic standard sul testo raw
                          </div>
                        )}
                        
                        {syncUseMarkdown && (
                          <div className="bg-blue-100 border border-blue-300 rounded-md p-2 text-xs text-blue-800">
                            ✅ Il documento verrà convertito in Markdown prima del processing
                          </div>
                        )}

                        {/* OCR Engine Selection */}
                        {syncUseMarkdown && (
                          <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Motore OCR
                          </label>
                          <select
                            value={syncOcrEngine}
                            onChange={(e) => setSyncOcrEngine(e.target.value as any)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="auto">🤖 Auto (scelta automatica)</option>
                            <option value="docling">📘 Docling (IBM Research - strutturati)</option>
                            <option value="marker">⭐ Marker (VikParuchuri - BEST QUALITY)</option>
                            <option value="paddleocr-vl">🔥 PaddleOCR-VL (Baidu - Multilingua)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {syncOcrEngine === 'auto' && '⚠️ Auto-select userà Docling per default'}
                            {syncOcrEngine === 'docling' && 'Ottimo per DOCX, PDF strutturati, tabelle'}
                            {syncOcrEngine === 'marker' && '⭐ BEST: Tabelle avanzate, math inline, LLM mode, 25 pages/sec (Docker)'}
                            {syncOcrEngine === 'paddleocr-vl' && '🔥 OCR multilingua, formule, documenti scientifici (Docker)'}
                          </p>
                          {syncOcrEngine === 'paddleocr-vl' && (
                            <div className="mt-2 bg-red-50 border border-red-300 rounded-md p-2 text-xs text-red-800">
                              ⚠️ <strong>Avviso:</strong> PaddleOCR è temporaneamente disabilitato per problemi di compatibilità. Userà Docling automaticamente.
                            </div>
                          )}
                        </div>
                        )}

                        {/* Chunking Method Selection */}
                        {syncUseMarkdown && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Metodo Chunking
                          </label>
                          <div className="space-y-2">
                            <label className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg border-2 hover:bg-blue-50 transition-colors ${
                              syncChunkingMethod === 'semantic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}>
                              <input
                                type="radio"
                                name="sync-chunking"
                                value="semantic"
                                checked={syncChunkingMethod === 'semantic'}
                                onChange={(e) => setSyncChunkingMethod(e.target.value as any)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">🧠 Semantic (Custom)</div>
                                <p className="text-xs text-gray-600">Chunking semantico personalizzato con context windows</p>
                              </div>
                            </label>
                            
                            <label className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg border-2 hover:bg-orange-50 transition-colors ${
                              syncChunkingMethod === 'docling' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                            }`}>
                              <input
                                type="radio"
                                name="sync-chunking"
                                value="docling"
                                checked={syncChunkingMethod === 'docling'}
                                onChange={(e) => setSyncChunkingMethod(e.target.value as any)}
                                className="w-4 h-4 text-orange-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">📘 Docling Hybrid</div>
                                <p className="text-xs text-gray-600">Chunking strutturale basato su layout documento (IBM)</p>
                              </div>
                            </label>
                          </div>
                        </div>
                        )}
                      </div>

                      <button
                        onClick={executeSync}
                        disabled={syncMutation.isPending || isUploadingFile || !syncContainerId}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {(syncMutation.isPending || isUploadingFile) ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <BoltIcon className="w-5 h-5" />
                        )}
                        <span>
                          {syncMutation.isPending || isUploadingFile 
                            ? (uploadedFile ? 'Processing PDF...' : 'Sincronizzazione in corso...') 
                            : 'Avvia Test Sync'
                          }
                        </span>
                      </button>

                      {syncMutation.data && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <h4 className="text-lg font-semibold text-green-900">✅ Test Sync Completato</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="sm:col-span-2 bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Documento ID</div>
                              <div className="font-medium text-gray-900 break-all text-sm">
                                {syncMutation.data.data?.documentId || syncMutation.data.data?.document_id || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Chunks</div>
                              <div className="font-medium text-gray-900">
                                {syncMutation.data.data?.chunksCreated || syncMutation.data.data?.chunks_count || 0}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-sm text-gray-600">Embeddings</div>
                              <div className="font-medium text-gray-900">
                                {syncMutation.data.data?.chunksCreated || syncMutation.data.data?.embeddings_count || 0}
                              </div>
                            </div>
                          </div>

                          {/* ✅ NEW: Hybrid Extraction Debug Info */}
                          {syncMutation.data.data?.hybridExtraction && (
                            <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                              <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                🧠 Hybrid Extraction Debug
                              </h5>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div className={`rounded-lg p-3 ${
                                  syncMutation.data.data.hybridExtraction.method === 'pattern' 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-blue-100 border border-blue-300'
                                }`}>
                                  <div className="text-xs font-medium mb-1">
                                    {syncMutation.data.data.hybridExtraction.method === 'pattern' ? '✅ Pattern Match' : '🤖 AI Extraction'}
                                  </div>
                                  <div className="text-lg font-bold">
                                    {syncMutation.data.data.hybridExtraction.method === 'pattern' ? 'PATTERN' : 'AI'}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {syncMutation.data.data.hybridExtraction.processingTimeMs || 0}ms
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="text-xs text-gray-600 mb-1">Costo Extraction</div>
                                  <div className="text-lg font-bold text-gray-900">
                                    ${(syncMutation.data.data.hybridExtraction.cost || 0).toFixed(4)}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {syncMutation.data.data.hybridExtraction.method === 'pattern' ? 'Gratis! 🎉' : 'Pagato'}
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="text-xs text-gray-600 mb-1">Entities Estratte</div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {syncMutation.data.data.hybridExtraction.entitiesSaved || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {syncMutation.data.data.hybridExtraction.relationshipsSaved || 0} relazioni
                                  </div>
                                </div>
                              </div>

                              {/* Pattern Info */}
                              {syncMutation.data.data.hybridExtraction.patternUsed && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="text-xs font-semibold text-green-900 mb-2">✅ Pattern Utilizzato:</div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">Nome:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {syncMutation.data.data.hybridExtraction.patternUsed.name}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Tipo:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {syncMutation.data.data.hybridExtraction.patternUsed.type}
                                      </span>
                                    </div>
                                    {syncMutation.data.data.hybridExtraction.classificationConfidence && (
                                      <div className="col-span-2">
                                        <span className="text-gray-600">Similarity Score:</span>
                                        <span className="ml-2 font-bold text-green-700">
                                          {(syncMutation.data.data.hybridExtraction.classificationConfidence * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* AI Info */}
                              {syncMutation.data.data.hybridExtraction.method === 'ai' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-xs font-semibold text-blue-900 mb-2">
                                    🤖 Motivo AI Extraction:
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {syncMutation.data.data.hybridExtraction.patternCreated 
                                      ? '✅ Nuovo pattern creato da questo documento!' 
                                      : '❌ Nessun pattern corrispondente trovato (similarity troppo bassa o primo documento di questo tipo)'}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 🆕 NUOVO: Debug Details dal Worker */}
                          {syncMutation.data?.data?.documentId && (
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  const docId = syncMutation.data.data.documentId;
                                  console.log('📋 Passando document_id:', docId);
                                  loadDebugDetails(docId);
                                }}
                                disabled={isLoadingDebugDetails}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium"
                              >
                                {isLoadingDebugDetails ? (
                                  <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    <span>Caricamento dettagli debug...</span>
                                  </>
                                ) : (
                                  <>
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Carica Dettagli Debug (Chunks, Embeddings, Graph)</span>
                                  </>
                                )}
                              </button>

                              {debugDetailsError && (
                                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                                  <div className="text-red-600 text-sm">❌ Errore: {debugDetailsError}</div>
                                </div>
                              )}

                              {(debugDetails.chunks.length > 0 || debugDetails.embeddings || debugDetails.graph) && (
                                <div className="mt-3 bg-gray-900 rounded-lg p-3 border border-gray-700 space-y-4">
                                  {/* CHUNKS SECTION */}
                                  {debugDetails.chunks.length > 0 && (
                                    <div className="pb-4 border-b border-gray-600">
                                      <div className="text-purple-300 font-bold text-sm mb-2 flex items-center gap-2">
                                        <span>📦 CHUNKS ({debugDetails.chunks.length})</span>
                                      </div>
                                      <div className="max-h-96 overflow-y-auto space-y-2">
                                        {debugDetails.chunks.map((chunk, idx) => (
                                          <details key={idx} className="bg-gray-800 rounded border border-gray-600">
                                            <summary className="cursor-pointer p-2 hover:bg-gray-700 transition-colors">
                                              <span className="text-gray-400 font-mono text-xs">Chunk #{chunk.chunk_index || idx}</span>
                                              {chunk.tokens_count && <span className="text-gray-500 text-xs ml-2">🔢 {chunk.tokens_count} tokens</span>}
                                            </summary>
                                            <div className="p-3 bg-gray-900 border-t border-gray-700">
                                              <div className="text-gray-300 text-xs whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                                                {chunk.chunk_text || 'N/A'}
                                              </div>
                                            </div>
                                          </details>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* EMBEDDINGS SECTION */}
                                  {debugDetails.embeddings && (
                                    <div className="pb-4 border-b border-gray-600">
                                      <div className="text-green-300 font-bold text-sm mb-2 flex items-center gap-2">
                                        <span>🧠 EMBEDDINGS ({debugDetails.embeddings.total_embeddings || (Array.isArray(debugDetails.embeddings.embeddings) ? debugDetails.embeddings.embeddings.length : 0)})</span>
                                      </div>
                                      <div className="max-h-96 overflow-y-auto space-y-2">
                                        {Array.isArray(debugDetails.embeddings.embeddings) ? (
                                          debugDetails.embeddings.embeddings.map((emb: any, idx: number) => (
                                            <div key={idx} className="bg-gray-800 rounded p-2 border border-gray-600 text-xs">
                                              <div className="text-gray-400 font-mono mb-1">Embedding #{emb.chunk_index || idx}</div>
                                              <div className="text-green-300 line-clamp-3">{emb.chunk_text || 'N/A'}</div>
                                              <div className="text-gray-500 mt-1 text-xs">ID: {emb.embedding_id?.substring(0, 20)}...</div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="bg-gray-800 rounded p-2 border border-gray-600 text-xs">
                                            <pre className="text-green-400 font-mono whitespace-pre-wrap break-words">
                                              {JSON.stringify(debugDetails.embeddings, null, 2).substring(0, 300)}...
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* KNOWLEDGE GRAPH SECTION */}
                                  {debugDetails.graph && (
                                    <div>
                                      <div className="text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                                        <span>🔗 KNOWLEDGE GRAPH</span>
                                        {debugDetails.graph.entities && <span className="text-xs">Entities: {debugDetails.graph.entities.length}</span>}
                                        {debugDetails.graph.relationships && <span className="text-xs ml-2">Relations: {debugDetails.graph.relationships.length}</span>}
                                      </div>
                                      <div className="space-y-3">
                                        {/* ENTITIES */}
                                        {debugDetails.graph.entities && debugDetails.graph.entities.length > 0 && (
                                          <div className="bg-gray-800 rounded p-3 border border-gray-600">
                                            <div className="text-blue-300 font-bold text-xs mb-2">📋 Entities ({debugDetails.graph.entities.length})</div>
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                              {debugDetails.graph.entities.map((entity: any, idx: number) => {
                                                // ✅ Handle different entity structures
                                                const entityName = typeof entity === 'string' 
                                                  ? entity 
                                                  : (entity.name || entity.text || entity.entity_name || entity.label || JSON.stringify(entity));
                                                const entityType = typeof entity === 'object' 
                                                  ? (entity.type || entity.entity_type || entity.category || 'unknown')
                                                  : 'unknown';
                                                
                                                return (
                                                  <div key={idx} className="text-gray-300 text-xs flex justify-between">
                                                    <span className="truncate">{String(entityName)}</span>
                                                    <span className="text-gray-500 ml-2">[{String(entityType)}]</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* RELATIONSHIPS */}
                                        {debugDetails.graph.relationships && debugDetails.graph.relationships.length > 0 && (
                                          <div className="bg-gray-800 rounded p-3 border border-gray-600">
                                            <div className="text-blue-300 font-bold text-xs mb-2">⟳ Relationships ({debugDetails.graph.relationships.length})</div>
                                            <div className="max-h-48 overflow-y-auto space-y-2">
                                              {debugDetails.graph.relationships.slice(0, 20).map((rel: any, idx: number) => {
                                                // ✅ Handle flexible property names for source/target/type
                                                const getRawValue = (obj: any, keys: string[]) => {
                                                  for (const key of keys) {
                                                    if (obj[key] !== undefined && obj[key] !== null) {
                                                      return obj[key];
                                                    }
                                                  }
                                                  return null;
                                                };
                                                
                                                const sourceRaw = getRawValue(rel, ['entity1_name', 'source', 'from', 'entity_1', 'subject']);
                                                const targetRaw = getRawValue(rel, ['entity2_name', 'target', 'to', 'entity_2', 'object']);
                                                const relTypeRaw = getRawValue(rel, ['relationship_type', 'type', 'relation', 'predicate']);
                                                
                                                const source = typeof sourceRaw === 'object' ? JSON.stringify(sourceRaw) : (sourceRaw || 'Unknown');
                                                const target = typeof targetRaw === 'object' ? JSON.stringify(targetRaw) : (targetRaw || 'Unknown');
                                                const relType = typeof relTypeRaw === 'object' ? JSON.stringify(relTypeRaw) : (relTypeRaw || 'related_to');
                                                const confidence = rel.confidence || rel.strength || null;

                                                return (
                                                  <div key={idx} className="bg-gray-700 rounded p-2 border border-gray-500">
                                                    <div className="flex items-center text-xs space-x-2">
                                                      <span className="text-yellow-300 font-semibold truncate">{String(source)}</span>
                                                      <span className="text-gray-400">→</span>
                                                      <span className="text-purple-300 font-mono text-[10px] px-1.5 py-0.5 bg-purple-900 rounded truncate">
                                                        {String(relType)}
                                                      </span>
                                                      <span className="text-gray-400">→</span>
                                                      <span className="text-cyan-300 font-semibold truncate">{String(target)}</span>
                                                    </div>
                                                    {confidence && (
                                                      <div className="text-gray-500 text-[10px] mt-1">
                                                        Confidence: {(Number(confidence) * 100).toFixed(0)}%
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                              {debugDetails.graph.relationships.length > 20 && (
                                                <div className="text-gray-500 text-xs ml-2">... e {debugDetails.graph.relationships.length - 20} altre</div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ SEMPRE VISIBILE: Statistiche Processing (anche in caso di errore) */}
                {(syncMutation.data?.data || syncDebugData?.response) && (
                  <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">⚡ Statistiche Processing</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600">Chunks</div>
                        <div className="font-bold text-lg text-gray-900">
                          {syncMutation.data?.data?.chunksCreated || syncDebugData?.response?.chunksCreated || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600">Embeddings</div>
                        <div className="font-bold text-lg text-gray-900">
                          {syncMutation.data?.data?.chunksCreated || syncDebugData?.response?.chunksCreated || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600">Entità</div>
                        <div className="font-bold text-lg text-gray-900">
                          {syncMutation.data?.data?.entitiesExtracted || syncDebugData?.response?.entitiesExtracted || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600">Relazioni</div>
                        <div className="font-bold text-lg text-gray-900">
                          {syncMutation.data?.data?.relationshipsExtracted || syncDebugData?.response?.relationshipsExtracted || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ SEMPRE VISIBILE: Markdown e Debug (anche in caso di errore) */}
                {(syncDebugData?.response?.markdown || syncMutation.data?.data?.markdown) && (
                  <details open className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg">
                    <summary className="cursor-pointer p-3 font-semibold text-indigo-900 hover:bg-indigo-100 transition-colors rounded-t-lg flex items-center gap-2">
                      📝 Markdown Prodotto (OCR Output)
                    </summary>
                    <div className="p-4 bg-white border-t border-indigo-200 rounded-b-lg">
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">{syncDebugData?.response?.markdown || syncMutation.data?.data?.markdown}</pre>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>Lunghezza: {(syncDebugData?.response?.markdown || syncMutation.data?.data?.markdown || '').length} caratteri</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(syncDebugData?.response?.markdown || syncMutation.data?.data?.markdown || '');
                            alert('Markdown copiato negli appunti!');
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          📋 Copia
                        </button>
                      </div>
                    </div>
                  </details>
                )}

                {syncDebugData && (
                  <details open className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg">
                    <summary className="cursor-pointer p-3 font-semibold text-yellow-900 hover:bg-yellow-100 transition-colors rounded-t-lg flex items-center gap-2">
                      🐛 Debug Info Completo
                    </summary>
                    <div className="p-4 bg-white border-t border-yellow-200 rounded-b-lg">
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(syncDebugData, null, 2)}</pre>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>Timestamp: {syncDebugData.timestamp || new Date().toISOString()}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(syncDebugData, null, 2));
                            alert('Debug info copiato negli appunti!');
                          }}
                          className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          📋 Copia JSON
                        </button>
                      </div>
                    </div>
                  </details>
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
                          Template Contenuto (usa {`{{INDEX}}`} per il numero documento)
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

                {/* ✅ NEW: Pattern Learning Tab */}
                {activeTab === 'patterns' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🧠 Pattern Learning - Sistema Ibrido AI+Regex</h3>
                      <p className="text-gray-600">Visualizza pattern appresi dal sistema per ridurre i costi AI</p>
                    </div>

                    {/* Statistics Cards */}
                    {hybridStats && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-700 font-medium">Pattern Successi</p>
                              <p className="text-2xl font-bold text-green-900">{hybridStats.pattern_successes || 0}</p>
                            </div>
                            <CheckCircleIcon className="w-10 h-10 text-green-600" />
                          </div>
                          <p className="text-xs text-green-600 mt-2">{hybridStats.pattern_success_rate}% success rate</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-700 font-medium">AI Fallbacks</p>
                              <p className="text-2xl font-bold text-blue-900">{hybridStats.ai_fallbacks || 0}</p>
                            </div>
                            <SparklesIcon className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="text-xs text-blue-600 mt-2">{hybridStats.ai_fallback_rate}% fallback rate</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-purple-700 font-medium">Avg Time</p>
                              <p className="text-2xl font-bold text-purple-900">{hybridStats.avg_pattern_time_ms || 0}ms</p>
                            </div>
                            <BoltIcon className="w-10 h-10 text-purple-600" />
                          </div>
                          <p className="text-xs text-purple-600 mt-2">Pattern extraction time</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-yellow-700 font-medium">Cost Savings</p>
                              <p className="text-2xl font-bold text-yellow-900">${(hybridStats.estimated_cost_savings || 0).toFixed(2)}</p>
                            </div>
                            <SparklesIcon className="w-10 h-10 text-yellow-600" />
                          </div>
                          <p className="text-xs text-yellow-600 mt-2">Estimated savings</p>
                        </div>
                      </div>
                    )}

                    {/* Patterns Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">📋 Pattern Appresi ({patterns.length})</h4>
                        <button
                          onClick={() => { loadPatterns(); loadHybridStats(); }}
                          disabled={isLoadingPatterns}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {isLoadingPatterns ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowPathIcon className="w-4 h-4" />}
                          Ricarica
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        {isLoadingPatterns ? (
                          <div className="text-center py-12">
                            <ArrowPathIcon className="w-12 h-12 mx-auto text-gray-400 animate-spin" />
                            <p className="text-gray-500 mt-2">Caricamento pattern...</p>
                          </div>
                        ) : patterns.length === 0 ? (
                          <div className="text-center py-12">
                            <SparklesIcon className="w-12 h-12 mx-auto text-gray-300" />
                            <p className="text-gray-500 mt-2">Nessun pattern trovato</p>
                            <p className="text-sm text-gray-400 mt-1">I pattern verranno creati automaticamente processando documenti</p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Pattern</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ultimo Uso</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {patterns.map((pattern) => (
                                <tr key={pattern.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {pattern.document_type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pattern.pattern_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${
                                              pattern.accuracy_score >= 0.8 ? 'bg-green-600' :
                                              pattern.accuracy_score >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                                            }`}
                                            style={{ width: `${(pattern.accuracy_score || 0) * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className="ml-2 text-sm text-gray-600">{((pattern.accuracy_score || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pattern.success_count}/{pattern.usage_count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {pattern.last_used_at ? new Date(pattern.last_used_at).toLocaleDateString() : 'Mai'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {pattern.is_verified ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Verificato
                                      </span>
                                    ) : pattern.is_active ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Attivo
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Disattivo
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => loadPatternDetails(pattern.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Dettagli"
                                      >
                                        <EyeIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => togglePattern(pattern.id, pattern.is_active)}
                                        className={`${pattern.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                        title={pattern.is_active ? 'Disattiva' : 'Attiva'}
                                      >
                                        {pattern.is_active ? '⏸️' : '▶️'}
                                      </button>
                                      <button
                                        onClick={() => deletePattern(pattern.id, false)}
                                        className="text-orange-600 hover:text-orange-800"
                                        title="Disattiva (soft delete)"
                                      >
                                        🚮
                                      </button>
                                      <button
                                        onClick={() => deletePattern(pattern.id, true)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Elimina definitivamente"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Markdown Pipeline Tab */}
                {activeTab === 'markdown' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">📝 Pipeline Markdown</h3>
                      <p className="text-gray-600">Test della pipeline di conversione Markdown e confronto chunking</p>
                    </div>

                    {/* Upload Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">📁 Upload Documento</h4>
                      
                      {/* File Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleziona file (PDF, DOCX, TXT)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setMdFile(e.target.files[0]);
                              toast.success(`File selezionato: ${e.target.files[0].name}`);
                            }
                          }}
                          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-2"
                        />
                        {mdFile && (
                          <p className="mt-2 text-sm text-gray-600">
                            ✅ {mdFile.name} ({(mdFile.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>

                      {/* Container Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Container di destinazione
                        </label>
                        <select
                          value={syncContainerId}
                          onChange={(e) => setSyncContainerId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Seleziona container...</option>
                          {containers.map((c: SmartDocsContainer) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* OCR Engine Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motore OCR
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setMdOcrEngine('auto')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdOcrEngine === 'auto'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🤖 Auto
                          </button>
                          <button
                            onClick={() => setMdOcrEngine('docling')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdOcrEngine === 'docling'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            📝 Docling
                          </button>
                          <button
                            onClick={() => setMdOcrEngine('paddleocr-vl')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdOcrEngine === 'paddleocr-vl'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🕵️ PaddleOCR
                          </button>
                        </div>
                      </div>

                      {/* Chunking Method */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Metodo Chunking
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setMdChunkingMethod('docling')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdChunkingMethod === 'docling'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🧠 Docling
                          </button>
                          <button
                            onClick={() => setMdChunkingMethod('semantic')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdChunkingMethod === 'semantic'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ✨ Semantic
                          </button>
                          <button
                            onClick={() => setMdChunkingMethod('both')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              mdChunkingMethod === 'both'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🔬 Confronta
                          </button>
                        </div>
                      </div>

                      {/* Process Button */}
                      <button
                        onClick={async () => {
                          if (!mdFile) {
                            toast.error('Seleziona un file');
                            return;
                          }
                          if (!syncContainerId) {
                            toast.error('Seleziona un container');
                            return;
                          }

                          setIsProcessingMd(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', mdFile);
                            formData.append('container_id', syncContainerId);
                            formData.append('title', mdFile.name);
                            formData.append('ocr_engine', mdOcrEngine);
                            formData.append('chunking_method', mdChunkingMethod);

                            const response = await fetch('http://localhost:3500/api/documents/upload-markdown', {
                              method: 'POST',
                              body: formData
                            });

                            const result = await response.json();

                            if (result.success) {
                              setMdResult(result.data);
                              toast.success('✅ Documento processato con successo!');

                              // Load chunks per confronto
                              if (mdChunkingMethod === 'both') {
                                // Carica Docling chunks
                                const doclingResp = await fetch(
                                  `http://localhost:3500/api/markdown/chunks/${result.data.documentId}`
                                );
                                const doclingData = await doclingResp.json();
                                if (doclingData.success) {
                                  setMdDoclingChunks(doclingData.data.chunks || []);
                                }

                                // Semantic chunks sono già in result.data.semanticChunking
                                setShowMdComparison(true);
                              }
                            } else {
                              throw new Error(result.error || 'Errore durante il processing');
                            }
                          } catch (error: any) {
                            toast.error(`Errore: ${error.message}`);
                          } finally {
                            setIsProcessingMd(false);
                          }
                        }}
                        disabled={!mdFile || !syncContainerId || isProcessingMd}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessingMd ? (
                          <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <RocketLaunchIcon className="w-5 h-5" />
                            Processa Documento
                          </>
                        )}
                      </button>
                    </div>

                    {/* Results */}
                    {mdResult && (
                      <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Chunks Creati</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {mdResult.chunksCreated || 0}
                                </p>
                              </div>
                              <CubeIcon className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Entità Estratte</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {mdResult.entitiesExtracted || 0}
                                </p>
                              </div>
                              <SparklesIcon className="w-8 h-8 text-green-600" />
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Relazioni</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {mdResult.relationshipsExtracted || 0}
                                </p>
                              </div>
                              <LinkIcon className="w-8 h-8 text-purple-600" />
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Metodo</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {mdResult.hybridExtraction?.method || 'N/A'}
                                </p>
                              </div>
                              <BeakerIcon className="w-8 h-8 text-gray-600" />
                            </div>
                          </div>
                        </div>

                        {/* Chunking Stats */}
                        {mdResult.semanticChunking && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">📊 Statistiche Semantic Chunking</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div>
                                <p className="text-xs text-gray-600">Total Chunks</p>
                                <p className="text-lg font-bold">{mdResult.semanticChunking.totalChunks}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Avg Size</p>
                                <p className="text-lg font-bold">{mdResult.semanticChunking.averageChunkSize}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Min Size</p>
                                <p className="text-lg font-bold">{mdResult.semanticChunking.minChunkSize}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Max Size</p>
                                <p className="text-lg font-bold">{mdResult.semanticChunking.maxChunkSize}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Total Tokens</p>
                                <p className="text-lg font-bold">{mdResult.semanticChunking.totalTokens}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Chunking Comparison */}
                        {showMdComparison && mdDoclingChunks.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">🔬 Confronto Chunking</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-purple-50 rounded-lg p-4">
                                <h5 className="font-medium text-purple-900 mb-2">🧠 Docling Hybrid</h5>
                                <p className="text-3xl font-bold text-purple-600 mb-2">
                                  {mdDoclingChunks.length}
                                </p>
                                <p className="text-sm text-gray-600">chunks totali</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h5 className="font-medium text-blue-900 mb-2">✨ Semantic Custom</h5>
                                <p className="text-3xl font-bold text-blue-600 mb-2">
                                  {mdResult.chunksCreated}
                                </p>
                                <p className="text-sm text-gray-600">chunks totali</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
            {!Array.isArray(advancedChunksData) || advancedChunksData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun chunk trovato</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-blue-600">{Array.isArray(advancedChunksData) ? advancedChunksData.length : 0}</div>
                  <div className="text-sm text-gray-600">Totale chunk estratti</div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {Array.isArray(advancedChunksData) && advancedChunksData.length > 0 && (
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

      {/* 🆕 NUOVO: Modal di conferma Azzera Container */}
      <ConfirmResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetContainer}
        containerName={containers.find((c: SmartDocsContainer) => c.id === syncContainerId)?.name || 'Sconosciuto'}
        isLoading={isResettingContainer}
      />

      {/* ✅ NEW: Pattern Details Modal */}
      <DetailModal
        isOpen={showPatternModal}
        onClose={() => { setShowPatternModal(false); setSelectedPattern(null); setPatternUsageLog([]); }}
        title="🧠 Dettagli Pattern"
      >
        {selectedPattern && (
          <div className="space-y-4">
            {/* Pattern Info */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">{selectedPattern.pattern_name}</h4>
              <p className="text-sm text-gray-700">{selectedPattern.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-600">Tipo Documento:</span>
                  <p className="text-sm font-medium">{selectedPattern.document_type}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Accuracy:</span>
                  <p className="text-sm font-medium">{((selectedPattern.accuracy_score || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Utilizzi:</span>
                  <p className="text-sm font-medium">{selectedPattern.usage_count} ({selectedPattern.success_count} successi)</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Creato:</span>
                  <p className="text-sm font-medium">{new Date(selectedPattern.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* ✅ NEW: Utilizzo per Documento */}
            {patternUsageByDocument.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-blue-900">📝 Utilizzo per Documento ({patternUsageByDocument.length})</h5>
                  <button
                    onClick={() => setShowUsageByDocModal(true)}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Espandi
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {patternUsageByDocument.map((docUsage: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-3 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-600">
                          Doc: {docUsage.document_id.substring(0, 12)}...
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                          {docUsage.total_uses} utilizzi
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center bg-green-50 rounded p-1">
                          <div className="text-green-700 font-medium">{docUsage.successes}</div>
                          <div className="text-gray-500 text-[10px]">✅ Successi</div>
                        </div>
                        <div className="text-center bg-red-50 rounded p-1">
                          <div className="text-red-700 font-medium">{docUsage.failures}</div>
                          <div className="text-gray-500 text-[10px]">❌ Errori</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded p-1">
                          <div className="text-purple-700 font-medium">{docUsage.total_entities}</div>
                          <div className="text-gray-500 text-[10px]">🏷️ Entities</div>
                        </div>
                        <div className="text-center bg-yellow-50 rounded p-1">
                          <div className="text-yellow-700 font-medium">{docUsage.avg_time_ms}ms</div>
                          <div className="text-gray-500 text-[10px]">⏱️ Avg Time</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entity Patterns */}
            {selectedPattern.entity_patterns && Object.keys(selectedPattern.entity_patterns).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">🏷️ Entity Patterns ({Object.keys(selectedPattern.entity_patterns).length})</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(selectedPattern.entity_patterns).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{key}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{String(value?.type || 'unknown')}</span>
                      </div>
                      <code className="text-xs text-gray-600 font-mono block bg-gray-50 p-1 rounded">
                        {String(value?.regex || value || 'N/A')}
                      </code>
                      {value?.example && (
                        <div className="text-xs text-gray-500 mt-1">Es: {String(value.example)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationship Rules */}
            {selectedPattern.relationship_rules && selectedPattern.relationship_rules.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-900 mb-2">🔗 Relationship Rules ({selectedPattern.relationship_rules.length})</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedPattern.relationship_rules.map((rule: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-2 flex items-center justify-between text-sm">
                      <span className="text-gray-900 font-medium">{String(rule?.source || rule?.entity1_name || 'unknown')}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-purple-600 font-mono text-xs px-2 py-0.5 bg-purple-100 rounded">
                        {String(rule?.type || rule?.relationship_type || 'related_to')}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-900 font-medium">{String(rule?.target || rule?.entity2_name || 'unknown')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Log */}
            {patternUsageLog.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">📊 Usage Log (ultimi {patternUsageLog.length})</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patternUsageLog.map((log: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-2 border">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? '✅ Success' : '❌ Failed'}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(log.used_at).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Entities:</span>
                          <span className="ml-1 font-medium">{log.entities_extracted || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Relations:</span>
                          <span className="ml-1 font-medium">{log.relationships_extracted || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <span className="ml-1 font-medium">{log.extraction_time_ms || 0}ms</span>
                        </div>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-1 truncate">⚠️ {log.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* ✅ NEW: Modal Utilizzo per Documento (Espanso) */}
      <DetailModal
        isOpen={showUsageByDocModal}
        onClose={() => setShowUsageByDocModal(false)}
        title="📝 Utilizzo Pattern per Documento"
      >
        <div className="space-y-4">
          {patternUsageByDocument.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nessun dato disponibile</p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">📊 Riepilogo Utilizzo</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-2xl font-bold text-blue-600">{patternUsageByDocument.length}</div>
                    <div className="text-xs text-gray-600">Documenti Processati</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {patternUsageByDocument.reduce((sum, doc) => sum + doc.successes, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Totale Successi</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {patternUsageByDocument.reduce((sum, doc) => sum + doc.total_entities, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Totale Entities</div>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {patternUsageByDocument.map((docUsage: any, idx: number) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h6 className="font-mono text-sm text-gray-900">Doc ID: {docUsage.document_id}</h6>
                        <p className="text-xs text-gray-500 mt-1">
                          Utilizzato {docUsage.total_uses} {docUsage.total_uses === 1 ? 'volta' : 'volte'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        docUsage.failures === 0 ? 'bg-green-100 text-green-800' :
                        docUsage.successes > docUsage.failures ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {docUsage.successes}/{docUsage.total_uses} successi
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-green-50 rounded p-2 text-center">
                        <div className="text-lg font-bold text-green-700">{docUsage.successes}</div>
                        <div className="text-xs text-gray-600">✅ Successi</div>
                      </div>
                      <div className="bg-red-50 rounded p-2 text-center">
                        <div className="text-lg font-bold text-red-700">{docUsage.failures}</div>
                        <div className="text-xs text-gray-600">❌ Errori</div>
                      </div>
                      <div className="bg-purple-50 rounded p-2 text-center">
                        <div className="text-lg font-bold text-purple-700">{docUsage.total_entities}</div>
                        <div className="text-xs text-gray-600">🏷️ Entities</div>
                      </div>
                      <div className="bg-yellow-50 rounded p-2 text-center">
                        <div className="text-lg font-bold text-yellow-700">{docUsage.avg_time_ms}ms</div>
                        <div className="text-xs text-gray-600">⏱️ Avg Time</div>
                      </div>
                    </div>

                    {/* Individual Uses */}
                    <div className="border-t border-gray-200 pt-3">
                      <h6 className="text-xs font-semibold text-gray-700 mb-2">Dettagli Utilizzi:</h6>
                      <div className="space-y-1">
                        {docUsage.uses.slice(0, 5).map((use: any, useIdx: number) => (
                          <div key={useIdx} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                            <span className={`px-2 py-0.5 rounded ${
                              use.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {use.success ? '✅' : '❌'}
                            </span>
                            <span className="text-gray-600">{new Date(use.used_at).toLocaleString()}</span>
                            <span className="text-gray-600">{use.entities_extracted || 0} ent</span>
                            <span className="text-gray-600">{use.extraction_time_ms || 0}ms</span>
                          </div>
                        ))}
                        {docUsage.uses.length > 5 && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            ... e altri {docUsage.uses.length - 5} utilizzi
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DetailModal>
    </div>
  );
}
