import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';
import {
  DocumentTextIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  DocumentPlusIcon,
  XCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  DocumentArrowDownIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  type: string;
  typeConfigId?: string;
  internalName: string;
  displayName: string;
  description?: string;
  versions?: Version[];
  isActive?: boolean;
  isRequired?: boolean;
}

interface Version {
  id: string;
  version: string;
  title: string;
  content: string;
  contentPlain?: string;
  effectiveDate: string;
  status: string;
  createdAt: string;
}

interface DocumentType {
  id: string;
  code: string;
  displayName: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  isRequired?: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  content: string;
  metadata?: {
    tags?: string[];
    category?: string;
    isPublic?: boolean;
    sourceDocumentId?: string;
    sourceDocumentName?: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function LegalDocumentEditor() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [tinymceApiKey, setTinymceApiKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Stati per creazione nuovo documento
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: '',
    typeConfigId: '',
    internalName: '',
    displayName: '',
    description: '',
    isActive: true,
    isRequired: false
  });

  // Stato per "Salva come"
  const [saveAsName, setSaveAsName] = useState('');
  
  // Stati per Template
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isTemplatePublic, setIsTemplatePublic] = useState(false);

  // Carica i tipi di documento disponibili dal database
  const { data: documentTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/document-types');
        console.log('Document types loaded:', response.data?.data);
        return response.data?.data || [];
      } catch (error) {
        console.error('Error loading document types:', error);
        return [];
      }
    }
  });

  // Carica la API key di TinyMCE
  const { data: apiKeyData } = useQuery({
    queryKey: ['api-key-tinymce'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/api-keys/TINYMCE/raw');
        if (response.data?.data?.key) {
          return response.data.data.key;
        }
      } catch (error) {
        console.error('TinyMCE key not found:', error);
      }
      return null;
    }
  });

  // Carica i template personalizzati
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/document-templates');
        return response.data?.data || [];
      } catch (error) {
        console.error('Error loading templates:', error);
        return [];
      }
    }
  });

  // Carica tutti i documenti con le versioni
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['legal-documents-editor'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/legal-documents?includeVersions=true');
        console.log('Documents loaded:', response.data?.data);
        return response.data?.data || [];
      } catch (error) {
        console.error('Error loading documents:', error);
        return [];
      }
    }
  });

  // Imposta la API key quando viene caricata
  useEffect(() => {
    if (apiKeyData) {
      setTinymceApiKey(apiKeyData);
    }
  }, [apiKeyData]);

  // Quando si seleziona un documento, carica la sua ultima versione
  const handleSelectDocument = async (doc: Document) => {
    console.log('Selecting document:', doc);
    setSelectedDocument(doc);
    setIsCreatingNew(false);
    
    // Carica i dettagli completi del documento con le versioni
    try {
      const response = await api.get(`/admin/legal-documents/${doc.id}`);
      const fullDocument = response.data?.data;
      
      if (fullDocument) {
        setSelectedDocument(fullDocument);
        
        // Se il documento ha versioni, carica l'ultima
        if (fullDocument.versions && fullDocument.versions.length > 0) {
          const latestVersion = fullDocument.versions.sort((a: Version, b: Version) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          console.log('Loading version:', latestVersion);
          setSelectedVersion(latestVersion);
          setEditorContent(latestVersion.content || '');
          toast.success(`Documento "${doc.displayName}" caricato`);
        } else {
          // Se non ha versioni, pulisci e prepara per nuova versione
          setSelectedVersion(null);
          setEditorContent('');
          toast.info('Documento senza versioni - Crea la prima versione');
          // Inizia automaticamente una nuova versione
          startNewVersion(fullDocument);
        }
      }
    } catch (error) {
      console.error('Error loading document details:', error);
      toast.error('Errore nel caricamento del documento');
      // Prova a usare i dati esistenti se il caricamento fallisce
      if (doc.versions && doc.versions.length > 0) {
        const latestVersion = doc.versions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedVersion(latestVersion);
        setEditorContent(latestVersion.content || '');
      }
    }
  };

  // Seleziona una versione specifica
  const handleSelectVersion = (version: Version) => {
    console.log('Selecting version:', version);
    setSelectedVersion(version);
    setEditorContent(version.content || '');
    setIsCreatingNew(false);
  };

  // Mutation per creare un nuovo documento
  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof newDocument) => {
      return api.post('/admin/legal-documents', data);
    },
    onSuccess: async (response) => {
      const createdDoc = response.data?.data;
      toast.success('Documento creato con successo!');
      
      // Ricarica la lista documenti
      await refetchDocuments();
      
      setShowNewDocumentModal(false);
      setNewDocument({
        type: '',
        typeConfigId: '',
        internalName: '',
        displayName: '',
        description: '',
        isActive: true,
        isRequired: false
      });
      
      // Seleziona il documento appena creato
      if (createdDoc) {
        handleSelectDocument(createdDoc);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione del documento');
    }
  });

  // Mutation per "Salva come" - crea una copia del documento
  const saveAsDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) throw new Error('Nessun documento selezionato');
      
      // Crea un nuovo documento con lo stesso tipo ma nome diverso
      const newDocData: any = {
        type: selectedDocument.type,
        internalName: `${selectedDocument.type.toLowerCase().replace(/_/g, '-')}-copy-${Date.now()}`,
        displayName: saveAsName,
        description: selectedDocument.description || '',
        isActive: true,
        isRequired: false
      };
      
      // Aggiungi typeConfigId solo se esiste
      if (selectedDocument.typeConfigId) {
        newDocData.typeConfigId = selectedDocument.typeConfigId;
      }
      
      console.log('Saving new document with data:', newDocData);
      
      // Prima crea il documento
      const docResponse = await api.post('/admin/legal-documents', newDocData);
      const newDoc = docResponse.data?.data;
      
      // Poi crea una versione con il contenuto attuale
      if (newDoc) {
        const div = document.createElement('div');
        div.innerHTML = editorContent;
        const contentPlain = div.textContent || div.innerText || '';
        
        await api.post(`/admin/legal-documents/${newDoc.id}/versions`, {
          version: '1.0.0',
          title: `${saveAsName} - v1.0.0`,
          content: editorContent,
          contentPlain,
          effectiveDate: new Date().toISOString(),
          language: 'it',
          notifyUsers: false
        });
      }
      
      return newDoc;
    },
    onSuccess: async (newDoc) => {
      toast.success('Documento salvato con nuovo nome!');
      await refetchDocuments();
      setShowSaveAsModal(false);
      setSaveAsName('');
      
      // Seleziona il nuovo documento
      if (newDoc) {
        handleSelectDocument(newDoc);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Mutation per salvare una nuova versione
  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) throw new Error('Nessun documento selezionato');
      
      // Genera contentPlain dal content HTML
      const div = document.createElement('div');
      div.innerHTML = editorContent;
      const contentPlain = div.textContent || div.innerText || '';
      
      return api.post(`/admin/legal-documents/${selectedDocument.id}/versions`, {
        version: newVersionNumber,
        title: newVersionTitle,
        content: editorContent,
        contentPlain,
        effectiveDate: new Date().toISOString(),
        language: 'it',
        notifyUsers: false
      });
    },
    onSuccess: async () => {
      toast.success('Versione salvata con successo!');
      await refetchDocuments();
      setIsCreatingNew(false);
      setNewVersionNumber('');
      setNewVersionTitle('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Mutation per salvare come template
  const saveAsTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) throw new Error('Nessun documento selezionato');
      
      const data = {
        documentId: selectedDocument.id,
        versionId: selectedVersion?.id,
        name: templateName,
        description: templateDescription
      };
      
      return api.post('/admin/document-templates/from-document', data);
    },
    onSuccess: async () => {
      toast.success('Template salvato con successo!');
      await refetchTemplates();
      setShowSaveAsTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
      setIsTemplatePublic(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio del template');
    }
  });

  // Mutation per eliminare un template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return api.delete(`/admin/document-templates/${templateId}`);
    },
    onSuccess: async () => {
      toast.success('Template eliminato!');
      await refetchTemplates();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione del template');
    }
  });

  // Mutation per aggiornare una versione esistente
  const updateVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !selectedVersion) throw new Error('Nessuna versione selezionata');
      
      const div = document.createElement('div');
      div.innerHTML = editorContent;
      const contentPlain = div.textContent || div.innerText || '';
      
      return api.put(`/admin/legal-documents/${selectedDocument.id}/versions/${selectedVersion.id}`, {
        content: editorContent,
        contentPlain
      });
    },
    onSuccess: async () => {
      toast.success('Versione aggiornata con successo!');
      await refetchDocuments();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Inizia una nuova versione
  const startNewVersion = (doc?: Document) => {
    const docToUse = doc || selectedDocument;
    if (!docToUse) return;
    
    // Calcola il numero di versione
    if (docToUse.versions && docToUse.versions.length > 0) {
      const latestVersion = docToUse.versions[0].version;
      const parts = latestVersion.split('.');
      const major = parseInt(parts[0] || '1');
      const minor = parseInt(parts[1] || '0');
      const patch = parseInt(parts[2] || '0');
      setNewVersionNumber(`${major}.${minor}.${patch + 1}`);
    } else {
      setNewVersionNumber('1.0.0');
    }
    
    setNewVersionTitle(`${docToUse.displayName} - Versione ${newVersionNumber || '1.0.0'}`);
    setIsCreatingNew(true);
    
    // Se non ci sono versioni, applica il template
    if (!docToUse.versions || docToUse.versions.length === 0) {
      applyTemplate(docToUse.type);
    }
  };

  // Template predefiniti COMPLETI
  const applyTemplate = (type: string) => {
    const templates: Record<string, string> = {
      PRIVACY_POLICY: `<h1>Informativa sulla Privacy</h1>
<p><em>Ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003</em></p>
<p><strong>Ultimo aggiornamento:</strong> ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>Richiesta Assistenza S.r.l.</strong>, con sede legale in Via Example 123, 00100 Roma, Italia.</p>
<ul>
<li>P.IVA: 12345678901</li>
<li>Email: privacy@richiesta-assistenza.it</li>
<li>PEC: privacy@pec.richiesta-assistenza.it</li>
<li>Telefono: +39 06 12345678</li>
</ul>

<h2>2. Responsabile della Protezione dei Dati (DPO)</h2>
<p>Il Responsabile della Protezione dei Dati può essere contattato all'indirizzo:</p>
<ul>
<li>Email: dpo@richiesta-assistenza.it</li>
</ul>

<h2>3. Tipologie di Dati Raccolti</h2>
<p>Nell'ambito dell'erogazione dei nostri servizi, trattiamo le seguenti categorie di dati personali:</p>

<h3>3.1 Dati Anagrafici e di Contatto</h3>
<ul>
<li>Nome e cognome</li>
<li>Data e luogo di nascita</li>
<li>Codice fiscale e/o Partita IVA</li>
<li>Indirizzo di residenza/domicilio</li>
<li>Indirizzo email</li>
<li>Numero di telefono fisso e/o mobile</li>
</ul>

<h3>3.2 Dati di Accesso e Utilizzo</h3>
<ul>
<li>Username e password (criptata)</li>
<li>Indirizzo IP di connessione</li>
<li>Log di accesso e attività sulla piattaforma</li>
<li>Preferenze di utilizzo del servizio</li>
<li>Storico delle richieste di assistenza</li>
</ul>

<h3>3.3 Dati di Pagamento</h3>
<ul>
<li>Coordinate bancarie (IBAN)</li>
<li>Dati della carta di credito/debito (tramite provider sicuro)</li>
<li>Storico transazioni e fatturazioni</li>
</ul>

<h2>4. Finalità del Trattamento e Base Giuridica</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>

<table>
<thead>
<tr>
<th>Finalità</th>
<th>Base Giuridica</th>
<th>Periodo di Conservazione</th>
</tr>
</thead>
<tbody>
<tr>
<td>Erogazione del servizio</td>
<td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
<td>Durata del contratto + 10 anni</td>
</tr>
<tr>
<td>Gestione amministrativa</td>
<td>Obbligo legale (art. 6.1.c GDPR)</td>
<td>10 anni dalla cessazione</td>
</tr>
<tr>
<td>Marketing diretto</td>
<td>Consenso (art. 6.1.a GDPR)</td>
<td>Fino a revoca del consenso</td>
</tr>
</tbody>
</table>

<h2>5. Diritti dell'Interessato</h2>
<p>In qualità di interessato, Lei ha diritto di:</p>
<ul>
<li><strong>Accesso (art. 15 GDPR):</strong> ottenere conferma e accesso ai dati</li>
<li><strong>Rettifica (art. 16 GDPR):</strong> correggere dati inesatti</li>
<li><strong>Cancellazione (art. 17 GDPR):</strong> richiedere la cancellazione</li>
<li><strong>Limitazione (art. 18 GDPR):</strong> limitare il trattamento</li>
<li><strong>Portabilità (art. 20 GDPR):</strong> ricevere i dati in formato strutturato</li>
<li><strong>Opposizione (art. 21 GDPR):</strong> opporsi al trattamento</li>
</ul>

<h2>6. Contatti</h2>
<p>Per esercitare i suoi diritti o per qualsiasi domanda sulla privacy:</p>
<ul>
<li>Email: privacy@richiesta-assistenza.it</li>
<li>PEC: privacy@pec.richiesta-assistenza.it</li>
<li>Telefono: +39 06 12345678</li>
</ul>`,

      TERMS_SERVICE: `<h1>Termini e Condizioni di Servizio</h1>
<p><strong>Ultimo aggiornamento:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
<p><strong>Versione:</strong> 1.0</p>

<h2>1. Definizioni</h2>
<p>Ai fini dei presenti Termini e Condizioni:</p>
<ul>
<li><strong>"Piattaforma"</strong>: il servizio online Richiesta Assistenza</li>
<li><strong>"Società"</strong>: Richiesta Assistenza S.r.l.</li>
<li><strong>"Cliente"</strong>: persona che richiede servizi di assistenza</li>
<li><strong>"Professionista"</strong>: prestatore di servizi registrato</li>
</ul>

<h2>2. Oggetto del Servizio</h2>
<p>La Piattaforma fornisce un servizio di intermediazione per servizi di assistenza tecnica professionale.</p>

<h2>3. Registrazione e Account</h2>
<p>Per utilizzare la Piattaforma è necessario:</p>
<ul>
<li>Avere almeno 18 anni di età</li>
<li>Fornire informazioni veritiere</li>
<li>Mantenere aggiornati i propri dati</li>
</ul>

<h2>4. Utilizzo del Servizio</h2>
<p>L'utente si impegna a utilizzare il servizio in conformità con le leggi vigenti.</p>

<h2>5. Pagamenti e Commissioni</h2>
<p>La Società applica commissioni secondo il listino pubblicato.</p>

<h2>6. Limitazione di Responsabilità</h2>
<p>La Società agisce esclusivamente come intermediario.</p>

<h2>7. Legge Applicabile</h2>
<p>I presenti Termini sono regolati dalla legge italiana.</p>`,

      COOKIE_POLICY: `<h1>Cookie Policy</h1>
<p><strong>Ultimo aggiornamento:</strong> ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che i siti web salvano sul dispositivo dell'utente.</p>

<h2>2. Tipologie di Cookie Utilizzati</h2>
<h3>Cookie Tecnici</h3>
<ul>
<li>Cookie di sessione</li>
<li>Cookie di autenticazione</li>
</ul>

<h3>Cookie Analitici</h3>
<ul>
<li>Google Analytics</li>
<li>Cookie di performance</li>
</ul>

<h3>Cookie di Marketing</h3>
<ul>
<li>Google Ads</li>
<li>Facebook Pixel</li>
</ul>

<h2>3. Gestione dei Cookie</h2>
<p>È possibile gestire le preferenze sui cookie attraverso il browser.</p>

<h2>4. Contatti</h2>
<p>Per informazioni: privacy@richiesta-assistenza.it</p>`
    };

    const template = templates[type] || `<h1>Nuovo Documento</h1>
<p>Contenuto del documento...</p>`;
    
    setEditorContent(template);
    toast.success('Template applicato!');
  };

  // Gestione salvataggio
  const handleSave = () => {
    if (!editorContent.trim()) {
      toast.error('Il contenuto non può essere vuoto');
      return;
    }

    if (isCreatingNew) {
      if (!newVersionNumber || !newVersionTitle) {
        toast.error('Inserisci numero versione e titolo');
        return;
      }
      saveVersionMutation.mutate();
    } else if (selectedVersion) {
      updateVersionMutation.mutate();
    } else {
      toast.error('Nessuna versione selezionata');
    }
  };

  // Applica un template selezionato
  const applySelectedTemplate = (template: DocumentTemplate) => {
    setEditorContent(template.content);
    setShowTemplatesModal(false);
    toast.success(`Template "${template.name}" applicato!`);
  };

  // Prepara il modal "Salva come template"
  const handleSaveAsTemplateClick = () => {
    if (!selectedDocument) {
      toast.error('Seleziona prima un documento');
      return;
    }
    setTemplateName(`Template - ${selectedDocument.displayName}`);
    setTemplateDescription(`Template creato da: ${selectedDocument.displayName}`);
    setShowSaveAsTemplateModal(true);
  };

  // Prepara il modal "Salva come"
  const handleSaveAsClick = () => {
    if (!selectedDocument) return;
    setSaveAsName(`${selectedDocument.displayName} (Copia)`);
    setShowSaveAsModal(true);
  };

  // Gestione tipo documento nel modal
  const handleTypeChange = (typeId: string) => {
    const selectedType = documentTypes?.find((t: DocumentType) => t.id === typeId);
    if (selectedType) {
      setNewDocument({
        ...newDocument,
        typeConfigId: typeId,
        type: selectedType.code,
        displayName: selectedType.displayName || '',
        description: selectedType.description || '',
        internalName: `${selectedType.code.toLowerCase().replace(/_/g, '-')}-${Date.now()}`,
        isRequired: selectedType.isRequired || false
      });
    }
  };

  // Creazione nuovo documento
  const handleCreateDocument = () => {
    if (!newDocument.typeConfigId) {
      toast.error('Seleziona un tipo di documento');
      return;
    }
    if (!newDocument.displayName.trim()) {
      toast.error('Inserisci il nome del documento');
      return;
    }
    createDocumentMutation.mutate(newDocument);
  };

  // CSS PROFESSIONALE per l'editor
  const getProfessionalCSS = () => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700;900&display=swap');
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        line-height: 1.8;
        color: #1a1a1a;
        padding: 3rem;
        max-width: 1000px;
        margin: 0 auto;
      }
      
      h1 { 
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 3em;
        font-weight: 900;
        margin: 1.5em 0 0.5em;
        color: #0f172a;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 0.3em;
      }
      
      h2 { 
        font-size: 2em;
        font-weight: 700;
        margin: 1.5em 0 0.5em;
        color: #1e293b;
        padding-left: 0.5em;
        border-left: 4px solid #3b82f6;
      }
      
      h3 { 
        font-size: 1.5em;
        font-weight: 600;
        margin: 1.2em 0 0.4em;
        color: #334155;
      }
      
      p { 
        margin: 1.2em 0;
        text-align: justify;
      }
      
      ul, ol { 
        margin: 1.2em 0;
        padding-left: 2em;
      }
      
      li { 
        margin: 0.5em 0;
        line-height: 1.6;
      }
      
      table { 
        border-collapse: collapse;
        width: 100%;
        margin: 2em 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      th { 
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
      }
      
      td { 
        border: 1px solid #e5e7eb;
        padding: 12px 16px;
        background: white;
      }
      
      tr:nth-child(even) td {
        background: #f9fafb;
      }
      
      tr:hover td {
        background: #eff6ff;
      }
      
      blockquote { 
        border-left: 4px solid #3b82f6;
        margin: 2em 0;
        padding: 1em 1.5em;
        background: #f0f9ff;
        border-radius: 0 8px 8px 0;
        font-style: italic;
        color: #475569;
      }
      
      a {
        color: #3b82f6;
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: all 0.2s;
      }
      
      a:hover {
        color: #2563eb;
        border-bottom-color: #2563eb;
      }
      
      strong {
        font-weight: 600;
        color: #0f172a;
      }
      
      em {
        font-style: italic;
        color: #64748b;
      }
      
      code {
        background: #1e293b;
        color: #94f000;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', monospace;
        font-size: 0.9em;
      }
      
      hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
        margin: 2em 0;
      }
    `;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Editor Documenti
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FolderOpenIcon className="h-5 w-5 mr-2" />
                I Miei Template
                {templates && templates.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-700 rounded-full text-xs">
                    {templates.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowNewDocumentModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DocumentPlusIcon className="h-5 w-5 mr-2" />
                Nuovo Documento
              </button>
              {selectedDocument && (
                <>
                  <button
                    onClick={handleSaveAsTemplateClick}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                    Salva come Template
                  </button>
                  <button
                    onClick={handleSaveAsClick}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Salva Come...
                  </button>
                  {!isCreatingNew && selectedVersion && (
                    <button
                      onClick={() => startNewVersion()}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Nuova Versione
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!editorContent.trim() || (!isCreatingNew && !selectedVersion)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    {isCreatingNew ? 'Salva Nuova Versione' : 'Aggiorna Versione'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista Documenti */}
      <div className="bg-white border-b">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Documenti Disponibili
          </h2>
          
          {documentsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {documents.map((doc: Document) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`flex-shrink-0 min-w-[200px] p-3 rounded-lg transition-all border-2 ${
                    selectedDocument?.id === doc.id
                      ? 'bg-blue-50 border-blue-400 shadow-md transform scale-105'
                      : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {doc.displayName}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Tipo: {doc.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {doc.versions?.length || 0} version{doc.versions?.length !== 1 ? 'i' : 'e'}
                      {doc.isActive ? '' : ' • Inattivo'}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Card per creare nuovo documento */}
              <button
                onClick={() => setShowNewDocumentModal(true)}
                className="flex-shrink-0 min-w-[200px] p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center"
              >
                <DocumentPlusIcon className="h-8 w-8 text-gray-400 mb-2" />
                <div className="font-medium text-gray-600">
                  Crea Nuovo
                </div>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">Nessun documento trovato</p>
              <button
                onClick={() => setShowNewDocumentModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <DocumentPlusIcon className="h-5 w-5 mr-2" />
                Crea il Primo Documento
              </button>
            </div>
          )}
          
          {/* Versioni del documento selezionato */}
          {selectedDocument && selectedDocument.versions && selectedDocument.versions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Versioni di: {selectedDocument.displayName}
              </h3>
              <div className="flex space-x-2 overflow-x-auto">
                {selectedDocument.versions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((version) => (
                    <button
                      key={version.id}
                      onClick={() => handleSelectVersion(version)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded text-sm transition-all ${
                        selectedVersion?.id === version.id
                          ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      v{version.version}
                      {version.status === 'PUBLISHED' && ' ✅'}
                      {version.status === 'DRAFT' && ' 📝'}
                      <span className="text-xs ml-1 opacity-75">
                        ({new Date(version.createdAt).toLocaleDateString('it-IT')})
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area Editor */}
      <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
        {selectedDocument ? (
          <>
            {/* Toolbar Editor */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isCreatingNew 
                      ? 'Nuova Versione' 
                      : selectedVersion?.title || 'Seleziona una versione o creane una nuova'}
                  </h3>
                  {isCreatingNew && (
                    <div className="flex items-center space-x-4 mt-2">
                      <input
                        type="text"
                        value={newVersionNumber}
                        onChange={(e) => setNewVersionNumber(e.target.value)}
                        placeholder="Numero versione (es: 1.0.1)"
                        className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newVersionTitle}
                        onChange={(e) => setNewVersionTitle(e.target.value)}
                        placeholder="Titolo versione"
                        className="px-3 py-1 border rounded-lg text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedDocument && (
                    <button
                      onClick={() => applyTemplate(selectedDocument.type)}
                      className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                      Applica Template
                    </button>
                  )}
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isPreview 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isPreview ? (
                      <>
                        <CodeBracketIcon className="h-4 w-4 inline mr-1" />
                        Editor
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4 inline mr-1" />
                        Anteprima
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Editor o Preview */}
            <div className="flex-1 p-4 bg-gray-50 overflow-auto">
              {isPreview ? (
                <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-12">
                  <style dangerouslySetInnerHTML={{ __html: getProfessionalCSS() }} />
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: editorContent || '<p class="text-gray-500">Nessun contenuto da visualizzare</p>' }}
                  />
                </div>
              ) : (
                <div className="h-full">
                  {!tinymceApiKey ? (
                    <div className="flex flex-col items-center justify-center h-full bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8">
                      <XMarkIcon className="h-16 w-16 text-yellow-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Editor Non Disponibile
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        Per utilizzare l'editor, configura la API key di TinyMCE.
                      </p>
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full h-full min-h-[400px] p-4 border rounded-lg font-mono text-sm"
                        placeholder="Inserisci il contenuto HTML del documento..."
                      />
                    </div>
                  ) : (
                    <Editor
                      apiKey={tinymceApiKey}
                      value={editorContent}
                      onEditorChange={(content) => setEditorContent(content)}
                      init={{
                        height: '100%',
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
                        ],
                        toolbar: 'undo redo | styles | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | removeformat | preview fullscreen code | help',
                        style_formats: [
                          {
                            title: 'Titoli',
                            items: [
                              { title: 'Titolo Principale', format: 'h1' },
                              { title: 'Sottotitolo', format: 'h2' },
                              { title: 'Sezione', format: 'h3' }
                            ]
                          },
                          {
                            title: 'Blocchi',
                            items: [
                              { title: 'Paragrafo', format: 'p' },
                              { title: 'Citazione', format: 'blockquote' },
                              { title: 'Codice', format: 'pre' }
                            ]
                          }
                        ],
                        content_style: getProfessionalCSS()
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FolderOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Seleziona o crea un documento
              </h3>
              <p className="text-gray-500 mb-4">
                Scegli un documento dalla lista sopra o creane uno nuovo
              </p>
              <button
                onClick={() => setShowNewDocumentModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DocumentPlusIcon className="h-5 w-5 mr-2" />
                Crea Nuovo Documento
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuovo Documento */}
      {showNewDocumentModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Crea Nuovo Documento
                </h3>
                <button
                  onClick={() => {
                    setShowNewDocumentModal(false);
                    setNewDocument({
                      type: '',
                      typeConfigId: '',
                      internalName: '',
                      displayName: '',
                      description: '',
                      isActive: true,
                      isRequired: false
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo Documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Documento *
                  </label>
                  <select
                    value={newDocument.typeConfigId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleziona un tipo...</option>
                    {documentTypes?.map((type: DocumentType) => (
                      <option key={type.id} value={type.id}>
                        {type.displayName} ({type.category || 'Generale'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nome Documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Documento *
                  </label>
                  <input
                    type="text"
                    value={newDocument.displayName}
                    onChange={(e) => setNewDocument({ ...newDocument, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: Privacy Policy 2025"
                  />
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descrizione opzionale del documento..."
                  />
                </div>

                {/* Checkbox */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDocument.isActive}
                      onChange={(e) => setNewDocument({ ...newDocument, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Documento attivo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDocument.isRequired}
                      onChange={(e) => setNewDocument({ ...newDocument, isRequired: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Obbligatorio per gli utenti</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewDocumentModal(false);
                    setNewDocument({
                      type: '',
                      typeConfigId: '',
                      internalName: '',
                      displayName: '',
                      description: '',
                      isActive: true,
                      isRequired: false
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateDocument}
                  disabled={!newDocument.typeConfigId || !newDocument.displayName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crea Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal I Miei Template */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    I Miei Template Salvati
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Seleziona un template da applicare al documento corrente
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template: DocumentTemplate) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {template.description || 'Nessuna descrizione'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Eliminare il template "${template.name}"?`)) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Tipo: {template.type.replace(/_/g, ' ')}</span>
                          <span>Creato: {new Date(template.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                        <button
                          onClick={() => applySelectedTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Applica
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Nessun template salvato</p>
                  <p className="text-sm text-gray-400">
                    Salva un documento come template per riutilizzarlo in futuro
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Salva come Template */}
      {showSaveAsTemplateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Salva come Template
                </h3>
                <button
                  onClick={() => {
                    setShowSaveAsTemplateModal(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Template *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: Template Privacy Aziendale"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descrizione opzionale del template..."
                  />
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Il contenuto attuale dell'editor verrà salvato come template riutilizzabile.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSaveAsTemplateModal(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => saveAsTemplateMutation.mutate()}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Salva Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Salva Come" */}
      {showSaveAsModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Salva Documento Come...
                </h3>
                <button
                  onClick={() => {
                    setShowSaveAsModal(false);
                    setSaveAsName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome del Nuovo Documento *
                  </label>
                  <input
                    type="text"
                    value={saveAsName}
                    onChange={(e) => setSaveAsName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: Privacy Policy v2"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Verrà creato un nuovo documento con il contenuto attuale
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSaveAsModal(false);
                    setSaveAsName('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => saveAsDocumentMutation.mutate()}
                  disabled={!saveAsName.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Salva Come
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
