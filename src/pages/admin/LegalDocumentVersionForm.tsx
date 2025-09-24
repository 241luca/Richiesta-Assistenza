import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  HashtagIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface VersionFormData {
  version: string;
  title: string;
  content: string;
  contentPlain?: string;
  summary?: string;
  versionNotes?: string;
  effectiveDate: string;
  expiryDate?: string;
  language: string;
  notifyUsers: boolean;
}

interface Version {
  id: string;
  version: string;
  title: string;
  content: string;
  contentPlain?: string;
  effectiveDate: string;
  expiryDate?: string;
  language: string;
  status: string;
}

export default function LegalDocumentVersionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    title: '',
    content: '',
    contentPlain: '',
    summary: '',
    versionNotes: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    language: 'it',
    notifyUsers: false
  });

  const [tinymceApiKey, setTinymceApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  // CARICA LA API KEY DI TINYMCE DAL DATABASE
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        setIsLoadingKey(true);
        console.log('LegalDocumentVersionForm: Caricamento API key TinyMCE...');
        
        // Prima prova l'endpoint diretto
        const response = await api.get('/admin/api-keys/TINYMCE/raw');
        if (response.data?.data?.key) {
          console.log('LegalDocumentVersionForm: API key caricata con successo');
          setTinymceApiKey(response.data.data.key);
        }
      } catch (error) {
        console.error('LegalDocumentVersionForm: Errore nel caricamento della API key:', error);
        
        // Fallback: prova la lista
        try {
          const response = await api.get('/admin/api-keys');
          const keys = response.data?.data || [];
          const tinymceKey = keys.find((key: any) => key.service === 'TINYMCE');
          
          if (tinymceKey?.key) {
            console.log('LegalDocumentVersionForm: API key trovata nella lista');
            setTinymceApiKey(tinymceKey.key);
          }
        } catch (err) {
          console.error('LegalDocumentVersionForm: Impossibile caricare API key:', err);
        }
      } finally {
        setIsLoadingKey(false);
      }
    };

    loadApiKey();
  }, []);

  // Fetch document details with versions
  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ['legal-document-with-versions', id],
    queryFn: async () => {
      console.log('Fetching document with versions...');
      const response = await api.get(`/admin/legal-documents/${id}?includeVersions=true`);
      return response.data?.data;
    }
  });

  // Fetch the latest version content separately if needed
  const { data: latestVersion, isLoading: versionLoading } = useQuery({
    queryKey: ['legal-document-latest-version', id],
    queryFn: async () => {
      if (!document?.versions?.[0]?.id) return null;
      
      console.log('Fetching latest version content...');
      try {
        const response = await api.get(`/admin/legal-documents/${id}/versions/${document.versions[0].id}`);
        return response.data?.data;
      } catch (error) {
        console.error('Error fetching version:', error);
        return document.versions[0];
      }
    },
    enabled: !!document?.versions?.[0]?.id,
    staleTime: 5 * 60 * 1000
  });

  // Load latest version content and suggest next version number
  useEffect(() => {
    if (document) {
      console.log('Document loaded:', document);
      
      if (document.versions && document.versions.length > 0) {
        const latest = latestVersion || document.versions[0];
        console.log('Latest version:', latest);
        
        // Parse version number and increment
        const versionParts = latest.version.split('.').map(Number);
        const [major, minor, patch] = versionParts.length === 3 
          ? versionParts 
          : [1, 0, 0];
        
        const newVersion = `${major}.${minor}.${patch + 1}`;
        const newTitle = latest.title || `${document.displayName} - Versione ${newVersion}`;
        
        // Pre-populate form with latest version content
        setFormData(prev => ({
          ...prev,
          version: newVersion,
          title: newTitle,
          content: latest.content || '', // Pre-populate with existing content
          language: latest.language || 'it',
          effectiveDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          summary: '',
          versionNotes: '',
          notifyUsers: true
        }));
        
        console.log('Form pre-populated with latest version content');
      } else {
        // No existing versions, start fresh
        console.log('No existing versions, creating first version');
        setFormData(prev => ({
          ...prev,
          version: '1.0.0',
          title: `${document.displayName} - Versione 1.0.0`,
          content: '', // Empty for first version
          language: 'it'
        }));
      }
    }
  }, [document, latestVersion]);

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: VersionFormData) => {
      // Pulisci i dati prima dell'invio
      const cleanData: any = {
        version: data.version,
        title: data.title,
        content: data.content,
        effectiveDate: data.effectiveDate,
        language: data.language,
        notifyUsers: data.notifyUsers
      };
      
      // Aggiungi solo i campi opzionali se hanno valore
      if (data.summary && data.summary.trim()) {
        cleanData.summary = data.summary.trim();
      }
      
      if (data.versionNotes && data.versionNotes.trim()) {
        cleanData.versionNotes = data.versionNotes.trim();
      }
      
      if (data.expiryDate) {
        cleanData.expiryDate = data.expiryDate;
      }
      
      // Genera contentPlain
      if (!cleanData.contentPlain) {
        const stripHtmlTags = (html: string): string => {
          return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        };
        cleanData.contentPlain = stripHtmlTags(cleanData.content);
      }
      
      console.log('Creating new version with cleaned data:', cleanData);
      return api.post(`/admin/legal-documents/${id}/versions`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['legal-document-with-versions', id] });
      toast.success('Versione creata con successo!');
      
      // Naviga alla pagina di dettaglio del documento
      setTimeout(() => {
        navigate(`/admin/legal-documents/${id}`);
      }, 1000); // Piccolo delay per permettere al toast di essere visibile
    },
    onError: (error: any) => {
      console.error('Error creating version:', error);
      console.error('Error response:', error.response?.data);
      
      // Se ci sono errori di validazione, mostrali
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((err: any) => 
          `${err.field || err.path}: ${err.message}`
        ).join(', ');
        toast.error(`Errori di validazione: ${errorMessages}`);
      } else {
        const message = error.response?.data?.message || error.response?.data?.error || 'Errore nella creazione della versione';
        toast.error(message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione base
    if (!formData.version.match(/^\d+\.\d+\.\d+$/)) {
      toast.error('La versione deve essere nel formato X.Y.Z (es: 1.0.0)');
      return;
    }
    
    if (!formData.title || !formData.content) {
      toast.error('Titolo e contenuto sono obbligatori');
      return;
    }
    
    createVersionMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Template per i documenti
  const getTemplate = (type: string) => {
    const templates: Record<string, string> = {
      PRIVACY_POLICY: `
<h1>Informativa sulla Privacy</h1>
<p><em>Ai sensi del Regolamento UE 2016/679 (GDPR)</em></p>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>[Nome Azienda]</strong>, con sede legale in [Indirizzo].</p>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Raccogliamo le seguenti categorie di dati personali:</p>
<ul>
  <li>Dati anagrafici (nome, cognome, data di nascita)</li>
  <li>Dati di contatto (email, telefono)</li>
  <li>Dati di navigazione (IP, browser)</li>
</ul>

<h2>3. Diritti dell'Interessato</h2>
<p>Lei ha diritto di:</p>
<ul>
  <li>Accedere ai suoi dati personali</li>
  <li>Rettificare dati inesatti</li>
  <li>Cancellare i dati</li>
  <li>Opporsi al trattamento</li>
</ul>`,
      TERMS_SERVICE: `
<h1>Termini e Condizioni di Servizio</h1>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando questo servizio, l'utente accetta di essere vincolato dai presenti Termini e Condizioni.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Il nostro servizio consiste in una piattaforma di collegamento tra clienti e professionisti.</p>

<h2>3. Obblighi dell'Utente</h2>
<p>L'utente si impegna a fornire informazioni veritiere e accurate.</p>`,
      COOKIE_POLICY: `
<h1>Cookie Policy</h1>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo.</p>

<h2>2. Tipologie di Cookie</h2>
<ul>
  <li>Cookie Necessari</li>
  <li>Cookie Analitici</li>
  <li>Cookie di Marketing</li>
</ul>`
    };
    
    return templates[type] || '';
  };

  const applyTemplate = () => {
    if (document?.type) {
      const template = getTemplate(document.type);
      if (template) {
        setFormData(prev => ({ ...prev, content: template }));
        toast.success('Template applicato!');
      }
    }
  };

  // Se sta caricando, mostra loading
  if (documentLoading || versionLoading || isLoadingKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">
            {isLoadingKey ? 'Caricamento editor...' : 'Caricamento documento e versioni...'}
          </p>
        </div>
      </div>
    );
  }

  // Se non c'è la API key, mostra errore
  if (!tinymceApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Editor Non Disponibile</h2>
          </div>
          <p className="text-gray-700 mb-4">
            La chiave API di TinyMCE non è configurata. L'editor non può essere caricato.
          </p>
          <div className="space-y-3">
            <a
              href="/admin/api-keys"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Configura API Key
            </a>
            <button
              onClick={() => navigate('/admin/legal-documents')}
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Torna ai Documenti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/admin/legal-documents/${id}`)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <DocumentDuplicateIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Nuova Versione
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {document?.displayName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner if editing existing version */}
      {document?.versions?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Stai creando una nuova versione basata su:</p>
                <p className="mt-1">
                  Versione {document.versions[0].version} - {document.versions[0].title}
                </p>
                <p className="mt-1 text-blue-700">
                  Il contenuto è stato pre-caricato. Modifica ciò che serve e salva come nuova versione.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Version Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informazioni Versione
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Versione *
                </label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="1.0.0"
                  pattern="^\d+\.\d+\.\d+$"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: X.Y.Z (es: 1.0.0, 2.1.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lingua
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Effettiva *
                </label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Scadenza (opzionale)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notifyUsers"
                  checked={formData.notifyUsers}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Notifica gli utenti della nuova versione
                </span>
              </label>
            </div>
          </div>

          {/* Content - SOLO TINYMCE, NIENTE ALTRO! */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Contenuto Documento
              </h2>
              <div className="flex space-x-2">
                {document?.type && (
                  <button
                    type="button"
                    onClick={applyTemplate}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Applica Template {document.type.replace('_', ' ')}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenuto Documento *
                </label>
                
                {/* TINYMCE EDITOR DIRETTO - NIENTE COMPONENTI WRAPPER! */}
                <Editor
                  apiKey={tinymceApiKey}
                  value={formData.content}
                  onEditorChange={(content) => {
                    console.log('Content changed, length:', content.length);
                    setFormData(prev => ({ ...prev, content }));
                  }}
                  init={{
                    height: 600,
                    menubar: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                      'pagebreak', 'nonbreaking', 'visualchars', 'quickbars', 'codesample'
                    ],
                    toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
                      'forecolor backcolor | removeformat | alignleft aligncenter alignright alignjustify | ' +
                      'bullist numlist outdent indent | link image media table | ' +
                      'code fullscreen preview | help',
                    toolbar_mode: 'sliding',
                    content_style: `
                      body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 16px; 
                        line-height: 1.6; 
                        color: #1a202c;
                        padding: 1rem;
                      }
                      h1 { font-size: 2.5em; font-weight: 800; margin: 1em 0 0.5em; }
                      h2 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; }
                      h3 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.5em; }
                      p { margin: 1em 0; }
                      ul, ol { margin: 1em 0; padding-left: 2em; }
                      table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
                      th { background: #f7fafc; border: 1px solid #e2e8f0; padding: 0.75em; }
                      td { border: 1px solid #e2e8f0; padding: 0.75em; }
                    `,
                    placeholder: 'Inizia a scrivere il contenuto del documento...'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Riepilogo Modifiche
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrivi brevemente cosa è cambiato in questa versione..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Versione (per admin)
                </label>
                <textarea
                  name="versionNotes"
                  value={formData.versionNotes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Note interne per amministratori..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/admin/legal-documents/${id}`)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            
            <button
              type="submit"
              disabled={createVersionMutation.isPending}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createVersionMutation.isPending ? (
                <>
                  <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Crea Versione
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
