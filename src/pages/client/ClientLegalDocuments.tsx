import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,  // Corretto: era DownloadIcon
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface LegalDocument {
  id: string;
  type: string;
  displayName: string;
  description?: string;
  isRequired: boolean;
  currentVersion?: {
    id: string;
    version: string;
    title: string;
    effectiveDate: string;
    content: string;
  };
  userAcceptance?: {
    id: string;
    acceptedAt: string;
    versionId: string;
    version: {
      version: string;
    };
  };
}

export default function ClientLegalDocuments() {
  const { user } = useAuth();
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  
  // Fetch documenti da accettare
  const { data: pendingDocuments, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['legal-pending'],
    queryFn: async () => {
      const response = await api.get('/legal/pending');
      return response.data?.data || [];
    }
  });

  // Fetch documenti già accettati
  const { data: acceptedDocuments, isLoading: loadingAccepted, refetch: refetchAccepted } = useQuery({
    queryKey: ['legal-acceptances'],
    queryFn: async () => {
      const response = await api.get('/legal/acceptances');
      return response.data?.data || [];
    }
  });

  // Mutation per accettare documento
  const acceptMutation = useMutation({
    mutationFn: async (data: { documentId: string; versionId: string }) => {
      console.log('Mutation data received:', data);
      console.log('Document ID type:', typeof data.documentId, 'Value:', data.documentId);
      console.log('Version ID type:', typeof data.versionId, 'Value:', data.versionId);
      
      // Verifica che gli ID siano presenti
      if (!data.documentId || !data.versionId) {
        console.error('Missing IDs:', { documentId: data.documentId, versionId: data.versionId });
        throw new Error('Document ID o Version ID mancanti');
      }
      
      const payload = {
        documentId: String(data.documentId),
        versionId: String(data.versionId),
        method: hasScrolledToBottom ? 'IMPLICIT_SCROLL' : 'EXPLICIT_CLICK'
      };
      
      console.log('Sending to API:', payload);
      
      const response = await api.post('/legal/accept', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Documento accettato con successo!');
      setShowDocumentModal(false);
      setSelectedDocument(null);
      refetchPending();
      refetchAccepted();
    },
    onError: (error: any) => {
      console.error('Accept mutation error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Se ci sono errori di validazione, mostrali
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        console.error('Validation errors details:', validationErrors);
        validationErrors.forEach((err: any) => {
          console.error(`Field: ${err.field}, Message: ${err.message}`);
        });
        const errorMessages = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`Errori di validazione: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Errore durante l\'accettazione');
      }
    }
  });

  // Monitora lo scroll del documento
  const handleDocumentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom = 
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    setHasScrolledToBottom(scrolledToBottom);
  };

  const openDocument = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
    setHasScrolledToBottom(false);
  };

  const documentTypeIcons: Record<string, any> = {
    PRIVACY_POLICY: ShieldCheckIcon,
    TERMS_SERVICE: DocumentTextIcon,
    COOKIE_POLICY: DocumentTextIcon,
    DEFAULT: DocumentTextIcon
  };

  const getDocumentIcon = (type: string) => {
    return documentTypeIcons[type] || documentTypeIcons.DEFAULT;
  };

  const hasDocumentsToAccept = pendingDocuments && pendingDocuments.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documenti Legali e Consensi</h1>
        <p className="mt-2 text-gray-600">
          Gestisci i tuoi consensi e visualizza i documenti legali
        </p>
      </div>

      {/* Alert per documenti da accettare */}
      {hasDocumentsToAccept && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Azione richiesta
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Ci sono {pendingDocuments.length} documenti che richiedono la tua accettazione per continuare ad utilizzare i nostri servizi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documenti da Accettare */}
      {hasDocumentsToAccept && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Documenti da Accettare
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingDocuments.map((doc: any) => {
              const Icon = getDocumentIcon(doc.document.type);
              return (
                <div
                  key={doc.document.id}
                  className="bg-white border-2 border-yellow-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-yellow-600" />
                    {doc.document.isRequired && (
                      <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                        Obbligatorio
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {doc.document.displayName}
                  </h3>
                  
                  {doc.document.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {doc.document.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    <p>Versione: {doc.version.version}</p>
                    <p>Efficace dal: {format(new Date(doc.version.effectiveDate), 'dd MMMM yyyy', { locale: it })}</p>
                  </div>

                  <button
                    onClick={() => {
                      console.log('Opening document:', doc);
                      openDocument({ 
                        id: doc.document.id,  // Assicuriamoci di avere l'id del documento
                        ...doc.document, 
                        currentVersion: {
                          id: doc.version.id,  // Assicuriamoci di avere l'id della versione
                          ...doc.version
                        }
                      });
                    }}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
                  >
                    <EyeIcon className="h-5 w-5 mr-2" />
                    Visualizza e Accetta
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documenti Accettati */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Documenti Accettati
        </h2>
        
        {loadingAccepted ? (
          <div className="text-center py-8">
            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : acceptedDocuments?.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nessun documento accettato</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accettato il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {acceptedDocuments?.map((acceptance: any) => (
                  <tr key={acceptance.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {acceptance.document.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {acceptance.document.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      v{acceptance.version.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(acceptance.acceptedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {acceptance.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Attivo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Sostituito
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // Implementare download PDF del consenso
                          toast.info('Download consenso in arrivo...');
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visualizzazione Documento */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedDocument.displayName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Versione {selectedDocument.currentVersion?.version} - 
                    Efficace dal {format(new Date(selectedDocument.currentVersion?.effectiveDate || ''), 'dd MMMM yyyy', { locale: it })}
                  </p>
                </div>

                {/* Contenuto Documento con Scroll Tracking */}
                <div 
                  className="prose prose-sm max-w-none overflow-y-auto max-h-96 border rounded-lg p-4"
                  onScroll={handleDocumentScroll}
                >
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: selectedDocument.currentVersion?.content || '' 
                    }}
                  />
                </div>

                {/* Progress Indicator */}
                {!hasScrolledToBottom && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    <p>⬇️ Scorri fino in fondo per poter accettare</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={!hasScrolledToBottom || acceptMutation.isPending}
                  onClick={() => {
                    console.log('Selected document:', selectedDocument);
                    console.log('Current version:', selectedDocument.currentVersion);
                    if (selectedDocument.currentVersion) {
                      const data = {
                        documentId: selectedDocument.id,
                        versionId: selectedDocument.currentVersion.id
                      };
                      console.log('Sending to backend:', data);
                      acceptMutation.mutate(data);
                    } else {
                      console.error('No current version found!');
                    }
                  }}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    hasScrolledToBottom && !acceptMutation.isPending
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {acceptMutation.isPending ? (
                    <>
                      <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                      Accettazione in corso...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Accetto
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                    setHasScrolledToBottom(false);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
