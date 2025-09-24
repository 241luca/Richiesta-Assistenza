import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import LegalDocumentEditor from '@/components/admin/legal-documents/LegalDocumentEditor';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  CalendarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CakeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const documentTypes = [
  { value: 'PRIVACY_POLICY', label: 'Privacy Policy', icon: ShieldCheckIcon },
  { value: 'TERMS_SERVICE', label: 'Termini di Servizio', icon: DocumentTextIcon },
  { value: 'COOKIE_POLICY', label: 'Cookie Policy', icon: CakeIcon },
  { value: 'DPA', label: 'Data Processing Agreement', icon: ShieldCheckIcon },
  { value: 'SLA', label: 'Service Level Agreement', icon: DocumentTextIcon },
  { value: 'NDA', label: 'Non-Disclosure Agreement', icon: DocumentTextIcon },
  { value: 'CUSTOM', label: 'Documento Personalizzato', icon: DocumentTextIcon }
];

interface DocumentFormData {
  type: string;
  internalName: string;
  displayName: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
}

interface VersionFormData {
  version: string;
  title: string;
  content: string;
  contentPlain: string;
  summary: string;
  versionNotes: string;
  effectiveDate: string;
  expiryDate: string;
  language: string;
  notifyUsers: boolean;
}

export default function LegalDocumentFormPage() {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEditMode = !!id && action === 'edit';
  const isNewVersion = !!id && action === 'new-version';
  
  // Form state per documento
  const [documentForm, setDocumentForm] = useState<DocumentFormData>({
    type: 'PRIVACY_POLICY',
    internalName: '',
    displayName: '',
    description: '',
    isRequired: true,
    sortOrder: 0
  });

  // Form state per versione
  const [versionForm, setVersionForm] = useState<VersionFormData>({
    version: '1.0.0',
    title: '',
    content: '',
    contentPlain: '',
    summary: '',
    versionNotes: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    language: 'it',
    notifyUsers: true
  });

  // Se stiamo modificando, carica i dati esistenti
  const { data: existingDocument } = useQuery({
    queryKey: ['legal-document', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/admin/legal-documents/${id}`);
      return response.data?.data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (existingDocument && isEditMode) {
      setDocumentForm({
        type: existingDocument.type,
        internalName: existingDocument.internalName,
        displayName: existingDocument.displayName,
        description: existingDocument.description || '',
        isRequired: existingDocument.isRequired,
        sortOrder: existingDocument.sortOrder
      });
    }
    
    if (existingDocument && isNewVersion) {
      // Calcola automaticamente la prossima versione
      const lastVersion = existingDocument.versions?.[0]?.version || '0.0.0';
      const [major, minor, patch] = lastVersion.split('.').map(Number);
      setVersionForm(prev => ({
        ...prev,
        version: `${major}.${minor + 1}.0`,
        title: existingDocument.displayName
      }));
    }
  }, [existingDocument, isEditMode, isNewVersion]);

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      return api.post('/admin/legal-documents', data);
    },
    onSuccess: (response) => {
      const docId = response.data?.data?.id;
      toast.success('Documento creato con successo!');
      
      // Dopo la creazione, vai alla creazione della prima versione
      if (docId) {
        navigate(`/admin/legal-documents/${docId}/new-version`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione del documento');
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      return api.put(`/admin/legal-documents/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Documento aggiornato con successo!');
      navigate('/admin/legal-documents');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento del documento');
    }
  });

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: VersionFormData) => {
      // Log per debug
      console.log('Sending version data:', data);
      return api.post(`/admin/legal-documents/${id}/versions`, data);
    },
    onSuccess: () => {
      toast.success('Versione creata con successo!');
      navigate(`/admin/legal-documents/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione della versione');
    }
  });

  const handleSubmitDocument = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!documentForm.internalName || !documentForm.displayName) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (isEditMode) {
      updateDocumentMutation.mutate(documentForm);
    } else {
      createDocumentMutation.mutate(documentForm);
    }
  };

  const handleSubmitVersion = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log per debug
    console.log('Version form data before submit:', versionForm);
    
    // Validazione
    if (!versionForm.version || !versionForm.title || !versionForm.content || !versionForm.effectiveDate) {
      toast.error('Compila tutti i campi obbligatori');
      console.log('Missing fields:', {
        version: !versionForm.version,
        title: !versionForm.title,
        content: !versionForm.content,
        effectiveDate: !versionForm.effectiveDate
      });
      return;
    }

    // Validazione formato versione
    if (!/^\d+\.\d+\.\d+$/.test(versionForm.version)) {
      toast.error('La versione deve essere nel formato X.Y.Z (es: 1.0.0)');
      return;
    }

    createVersionMutation.mutate(versionForm);
  };

  const handleEditorChange = (content: string, plainText: string) => {
    setVersionForm(prev => ({
      ...prev,
      content,
      contentPlain: plainText
    }));
  };

  // Auto-generate internal name from display name
  const handleDisplayNameChange = (value: string) => {
    setDocumentForm(prev => ({
      ...prev,
      displayName: value,
      internalName: prev.internalName || value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/legal-documents')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewVersion ? 'Nuova Versione Documento' : isEditMode ? 'Modifica Documento' : 'Nuovo Documento Legale'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isNewVersion 
                  ? `Crea una nuova versione per: ${existingDocument?.displayName}`
                  : isEditMode 
                    ? 'Modifica le informazioni del documento'
                    : 'Crea un nuovo documento legale per il sistema'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isNewVersion ? (
          // Form per nuova versione
          <form onSubmit={handleSubmitVersion} className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="p-6 space-y-6">
                {/* Version Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero Versione *
                    </label>
                    <input
                      type="text"
                      value={versionForm.version}
                      onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
                      placeholder="1.0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Formato: MAJOR.MINOR.PATCH
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Effettiva *
                    </label>
                    <input
                      type="date"
                      value={versionForm.effectiveDate}
                      onChange={(e) => setVersionForm({ ...versionForm, effectiveDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Scadenza (opzionale)
                    </label>
                    <input
                      type="date"
                      value={versionForm.expiryDate}
                      onChange={(e) => setVersionForm({ ...versionForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo Documento *
                    </label>
                  <input
                    type="text"
                    value={versionForm.title}
                    onChange={(e) => setVersionForm({ ...versionForm, title: e.target.value })}
                    placeholder="Es: Informativa sulla Privacy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Riepilogo Modifiche
                  </label>
                  <textarea
                    value={versionForm.summary}
                    onChange={(e) => setVersionForm({ ...versionForm, summary: e.target.value })}
                    placeholder="Descrivi brevemente cosa è cambiato in questa versione..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Version Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Versione (per admin)
                  </label>
                  <textarea
                    value={versionForm.versionNotes}
                    onChange={(e) => setVersionForm({ ...versionForm, versionNotes: e.target.value })}
                    placeholder="Note interne per amministratori..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Language and Notify */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                      Lingua
                    </label>
                    <select
                      value={versionForm.language}
                      onChange={(e) => setVersionForm({ ...versionForm, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="it">Italiano</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 mt-8">
                      <input
                        type="checkbox"
                        checked={versionForm.notifyUsers}
                        onChange={(e) => setVersionForm({ ...versionForm, notifyUsers: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Notifica gli utenti della nuova versione
                      </span>
                    </label>
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenuto Documento *
                  </label>
                  <LegalDocumentEditor
                    initialContent={versionForm.content}
                    onChange={handleEditorChange}
                    mode="create"
                    showPreview={true}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/legal-documents/${id}`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                
                <button
                  type="submit"
                  disabled={createVersionMutation.isPending}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createVersionMutation.isPending ? (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      Crea Versione
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Form per documento
          <form onSubmit={handleSubmitDocument} className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="p-6 space-y-6">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Documento *
                  </label>
                  <select
                    value={documentForm.type}
                    onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isEditMode}
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <p className="mt-1 text-xs text-gray-500">
                      <InformationCircleIcon className="h-3 w-3 inline mr-1" />
                      Il tipo non può essere modificato dopo la creazione
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Visualizzato *
                  </label>
                  <input
                    type="text"
                    value={documentForm.displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder="Es: Privacy Policy 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Internal Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Interno *
                  </label>
                  <input
                    type="text"
                    value={documentForm.internalName}
                    onChange={(e) => setDocumentForm({ ...documentForm, internalName: e.target.value })}
                    placeholder="Es: privacy-policy-2025"
                    pattern="[a-z0-9\-]+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Solo lettere minuscole, numeri e trattini
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                    placeholder="Descrizione del documento..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={documentForm.isRequired}
                        onChange={(e) => setDocumentForm({ ...documentForm, isRequired: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Documento obbligatorio
                      </span>
                    </label>
                    <p className="mt-1 ml-7 text-xs text-gray-500">
                      Gli utenti dovranno accettarlo per usare il servizio
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordine Visualizzazione
                    </label>
                    <input
                      type="number"
                      value={documentForm.sortOrder}
                      onChange={(e) => setDocumentForm({ ...documentForm, sortOrder: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Info Box */}
                {!isEditMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Prossimo Step</p>
                        <p>
                          Dopo aver creato il documento, potrai aggiungere la prima versione con il contenuto effettivo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/admin/legal-documents')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                
                <button
                  type="submit"
                  disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {(createDocumentMutation.isPending || updateDocumentMutation.isPending) ? (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Salva Modifiche' : 'Crea Documento'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
