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
  ArrowDownTrayIcon,
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

export default function ProfessionalLegalDocuments() {
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
      const payload = {
        documentId: String(data.documentId),
        versionId: String(data.versionId),
        method: hasScrolledToBottom ? 'IMPLICIT_SCROLL' : 'EXPLICIT_CLICK'
      };
      
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
      toast.error(error.response?.data?.message || 'Errore durante l\'accettazione');
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
          Gestisci i tuoi consensi professionali e visualizza i documenti legali
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
                Ci sono {pendingDocuments.length} documenti che richiedono la tua accettazione per continuare ad operare come professionista.
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
                      openDocument({ 
                        id: doc.document.id,
                        ...doc.document, 
                        currentVersion: {
                          id: doc.version.id,
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
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Attivo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Documento */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDocumentModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">{selectedDocument.currentVersion?.title}</h2>
                <p className="text-sm text-gray-600">Versione {selectedDocument.currentVersion?.version}</p>
              </div>
              
              <div 
                className="px-6 py-4 overflow-y-auto max-h-[60vh]"
                onScroll={handleDocumentScroll}
                dangerouslySetInnerHTML={{ __html: selectedDocument.currentVersion?.content || '' }}
              />
              
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    {!hasScrolledToBottom && (
                      <p className="text-sm text-gray-500">
                        Scorri fino in fondo per accettare
                      </p>
                    )}
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => setShowDocumentModal(false)}
                      className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => {
                        if (selectedDocument.currentVersion) {
                          acceptMutation.mutate({
                            documentId: selectedDocument.id,
                            versionId: selectedDocument.currentVersion.id
                          });
                        }
                      }}
                      disabled={!hasScrolledToBottom || acceptMutation.isPending}
                      className={`px-4 py-2 rounded-lg ${
                        hasScrolledToBottom && !acceptMutation.isPending
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {acceptMutation.isPending ? 'Accettazione...' : 'Accetta'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
