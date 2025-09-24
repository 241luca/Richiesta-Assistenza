import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  DocumentCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface LegalDocument {
  id: string;
  type: string;
  displayName: string;
  description: string;
  icon: string;
  isRequired: boolean;
  currentVersion: {
    id: string;
    version: string;
    title: string;
    effectiveDate: string;
    summary?: string;
  } | null;
  hasAccepted: boolean;
  needsNewAcceptance: boolean;
  userAcceptance?: {
    id: string;
    acceptedAt: string;
    version: {
      version: string;
    };
  };
}

interface Acceptance {
  id: string;
  acceptedAt: string;
  method: string;
  document: {
    id: string;
    type: string;
    displayName: string;
  };
  version: {
    id: string;
    version: string;
    title: string;
    effectiveDate: string;
  };
}

export default function LegalConsentDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history'>('overview');

  // Fetch all legal documents with user acceptance status
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['user-legal-documents'],
    queryFn: async () => {
      const response = await api.get('/legal/documents');
      return response.data?.data || [];
    },
    enabled: !!user
  });

  // Fetch user's acceptance history
  const { data: acceptances, isLoading: acceptancesLoading } = useQuery({
    queryKey: ['user-legal-acceptances'],
    queryFn: async () => {
      const response = await api.get('/legal/acceptances');
      return response.data?.data || [];
    },
    enabled: !!user && selectedTab === 'history'
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'PRIVACY_POLICY':
        return ShieldCheckIcon;
      case 'TERMS_SERVICE':
        return DocumentTextIcon;
      case 'COOKIE_POLICY':
        return DocumentCheckIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getDocumentUrl = (type: string) => {
    return `/legal/${type.toLowerCase().replace('_', '-')}`;
  };

  const requiredDocuments = documents?.filter((d: LegalDocument) => d.isRequired) || [];
  const optionalDocuments = documents?.filter((d: LegalDocument) => !d.isRequired) || [];
  const pendingCount = documents?.filter((d: LegalDocument) => 
    (d.isRequired && !d.hasAccepted) || d.needsNewAcceptance
  ).length || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Accedi per visualizzare i tuoi consensi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestione Consensi e Documenti Legali
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Visualizza e gestisci i tuoi consensi per i documenti legali del servizio
              </p>
            </div>
            <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents?.filter((d: LegalDocument) => d.hasAccepted && !d.needsNewAcceptance).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Documenti Accettati</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-sm text-gray-600">Da Accettare</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Documenti Totali</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`
                  py-3 px-6 border-b-2 font-medium text-sm
                  ${selectedTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Panoramica Documenti
              </button>
              <button
                onClick={() => setSelectedTab('history')}
                className={`
                  py-3 px-6 border-b-2 font-medium text-sm
                  ${selectedTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Storico Accettazioni
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedTab === 'overview' ? (
              <div className="space-y-6">
                {/* Pending Documents Alert */}
                {pendingCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-900">
                          Attenzione: Hai {pendingCount} document{pendingCount === 1 ? 'o' : 'i'} da accettare
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Alcuni documenti richiedono la tua accettazione per continuare ad utilizzare il servizio.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Required Documents */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Documenti Obbligatori
                  </h2>
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <ClockIcon className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
                      <p className="mt-2 text-gray-500">Caricamento...</p>
                    </div>
                  ) : requiredDocuments.length > 0 ? (
                    <div className="grid gap-4">
                      {requiredDocuments.map((doc: LegalDocument) => {
                        const Icon = getDocumentIcon(doc.type);
                        const needsAction = !doc.hasAccepted || doc.needsNewAcceptance;
                        
                        return (
                          <div
                            key={doc.id}
                            className={`
                              border rounded-lg p-4 transition-colors
                              ${needsAction 
                                ? 'border-yellow-300 bg-yellow-50' 
                                : 'border-gray-200 bg-white'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <Icon className={`h-6 w-6 mr-3 mt-1 ${
                                  needsAction ? 'text-yellow-600' : 'text-green-600'
                                }`} />
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">
                                    {doc.displayName}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {doc.description}
                                  </p>
                                  
                                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                    {doc.currentVersion && (
                                      <>
                                        <span>Versione: {doc.currentVersion.version}</span>
                                        <span>•</span>
                                        <span>
                                          Effettiva dal: {new Date(doc.currentVersion.effectiveDate).toLocaleDateString('it-IT')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {doc.hasAccepted && !doc.needsNewAcceptance && doc.userAcceptance && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                                      Accettato il {new Date(doc.userAcceptance.acceptedAt).toLocaleDateString('it-IT')}
                                    </div>
                                  )}
                                  
                                  {doc.needsNewAcceptance && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                      Nuova versione disponibile
                                    </div>
                                  )}
                                  
                                  {!doc.hasAccepted && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                      Non ancora accettato
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <a
                                href={getDocumentUrl(doc.type)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                  inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                  ${needsAction
                                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }
                                `}
                              >
                                {needsAction ? 'Accetta' : 'Visualizza'}
                                <ArrowRightIcon className="h-4 w-4 ml-1" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nessun documento obbligatorio disponibile.</p>
                  )}
                </div>

                {/* Optional Documents */}
                {optionalDocuments.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Documenti Opzionali
                    </h2>
                    <div className="grid gap-4">
                      {optionalDocuments.map((doc: LegalDocument) => {
                        const Icon = getDocumentIcon(doc.type);
                        
                        return (
                          <div
                            key={doc.id}
                            className="border border-gray-200 bg-white rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <Icon className="h-6 w-6 text-gray-400 mr-3 mt-1" />
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">
                                    {doc.displayName}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {doc.description}
                                  </p>
                                  
                                  {doc.hasAccepted && doc.userAcceptance && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                                      Accettato il {new Date(doc.userAcceptance.acceptedAt).toLocaleDateString('it-IT')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <a
                                href={getDocumentUrl(doc.type)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Visualizza
                                <ArrowRightIcon className="h-4 w-4 ml-1" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* History Tab */
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Storico delle Accettazioni
                </h2>
                
                {acceptancesLoading ? (
                  <div className="text-center py-8">
                    <ClockIcon className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
                    <p className="mt-2 text-gray-500">Caricamento...</p>
                  </div>
                ) : acceptances && acceptances.length > 0 ? (
                  <div className="overflow-x-auto">
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
                            Data Accettazione
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metodo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {acceptances.map((acceptance: Acceptance) => (
                          <tr key={acceptance.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {acceptance.document.displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {acceptance.version.title}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                v{acceptance.version.version}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(acceptance.acceptedAt).toLocaleString('it-IT')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {acceptance.method === 'EXPLICIT_CLICK' ? 'Click esplicito' : 
                               acceptance.method === 'IMPLICIT_SCROLL' ? 'Lettura completa' :
                               acceptance.method}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessuna accettazione registrata</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Informazioni sui Consensi</p>
              <p>
                I documenti legali obbligatori devono essere accettati per utilizzare il servizio. 
                Quando pubblichiamo nuove versioni, ti chiederemo di rivederle e accettarle nuovamente. 
                Puoi sempre consultare lo storico delle tue accettazioni e scaricare copie dei documenti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
