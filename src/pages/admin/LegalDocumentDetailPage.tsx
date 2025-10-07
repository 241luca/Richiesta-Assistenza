import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import LegalDocumentVersionWorkflow from '@/components/admin/legal/LegalDocumentVersionWorkflow';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  GlobeAltIcon,
  UserIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ShieldCheckIcon,
  CakeIcon,
  DocumentArrowUpIcon,
  RocketLaunchIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const documentTypeConfig: Record<string, any> = {
  PRIVACY_POLICY: {
    label: 'Privacy Policy',
    icon: ShieldCheckIcon,
    color: 'blue',
    description: 'Informativa sulla privacy e trattamento dati'
  },
  TERMS_SERVICE: {
    label: 'Termini di Servizio',
    icon: DocumentTextIcon,
    color: 'green',
    description: 'Termini e condizioni di utilizzo del servizio'
  },
  COOKIE_POLICY: {
    label: 'Cookie Policy',
    icon: CakeIcon,
    color: 'yellow',
    description: 'Informativa sui cookie e tecnologie simili'
  },
  DPA: {
    label: 'Data Processing Agreement',
    icon: ShieldCheckIcon,
    color: 'purple',
    description: 'Accordo sul trattamento dei dati'
  },
  CUSTOM: {
    label: 'Documento Personalizzato',
    icon: DocumentTextIcon,
    color: 'gray',
    description: 'Documento legale personalizzato'
  }
};

const versionStatusConfig = {
  DRAFT: { label: 'Bozza', color: 'gray', icon: ClockIcon },
  REVIEW: { label: 'In Revisione', color: 'yellow', icon: ClockIcon },
  APPROVED: { label: 'Approvata', color: 'blue', icon: CheckCircleIcon },
  PUBLISHED: { label: 'Pubblicata', color: 'green', icon: RocketLaunchIcon },
  ARCHIVED: { label: 'Archiviata', color: 'gray', icon: XCircleIcon },
  SUPERSEDED: { label: 'Sostituita', color: 'orange', icon: DocumentDuplicateIcon }
};

export default function LegalDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'versions' | 'workflow'>('versions');

  // Fetch document details with versions
  const { data: document, isLoading, refetch } = useQuery({
    queryKey: ['legal-document-detail', id],
    queryFn: async () => {
      const response = await api.get(`/admin/legal-documents/${id}?includeVersions=true`);
      return response.data?.data;
    },
    enabled: !!id
  });

  const handleWorkflowUpdate = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['legal-document-detail', id] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Caricamento documento...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Documento non trovato</p>
          <button
            onClick={() => navigate('/admin/legal-documents')}
            className="text-blue-600 hover:text-blue-800"
          >
            Torna alla lista documenti
          </button>
        </div>
      </div>
    );
  }

  const config = documentTypeConfig[document.type] || documentTypeConfig.CUSTOM;
  const IconComponent = config.icon;

  // Trova la versione pubblicata attuale
  const publishedVersion = document.versions && Array.isArray(document.versions) 
    ? document.versions.find((v: any) => v.status === 'PUBLISHED')
    : null;
  
  // Ordina versioni per data creazione (più recenti prima)
  const sortedVersions = document.versions && Array.isArray(document.versions)
    ? document.versions.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/legal-documents')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <IconComponent className={`h-8 w-8 text-${config.color}-600 mr-3`} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {document.displayName}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {config.label} • ID: {document.internalName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/admin/legal-documents/${id}/new-version`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Nuova Versione
              </button>
              <button
                onClick={() => navigate(`/admin/legal-documents/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Modifica Info
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informazioni Documento
              </h2>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="text-sm text-gray-900 mt-1">{config.label}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stato</dt>
                  <dd className="mt-1">
                    {document.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Attivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Inattivo
                      </span>
                    )}
                  </dd>
                </div>

                {publishedVersion && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Versione Pubblicata</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        v{publishedVersion.version}
                      </span>
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Obbligatorio</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {document.isRequired ? 'Sì' : 'No'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ordine</dt>
                  <dd className="text-sm text-gray-900 mt-1">{document.sortOrder}</dd>
                </div>
                
                {document.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Descrizione</dt>
                    <dd className="text-sm text-gray-900 mt-1">{document.description}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creato da</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {document.creator?.fullName || 'Sconosciuto'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creato il</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {new Date(document.createdAt).toLocaleDateString('it-IT')}
                  </dd>
                </div>
              </dl>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistiche</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">
                      {document._count?.versions || 0}
                    </p>
                    <p className="text-xs text-gray-500">Versioni</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">
                      {document._count?.acceptances || 0}
                    </p>
                    <p className="text-xs text-gray-500">Accettazioni</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Versions and Workflow */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setSelectedTab('versions')}
                    className={`
                      py-3 px-6 border-b-2 font-medium text-sm
                      ${selectedTab === 'versions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    Versioni ({sortedVersions?.length || 0})
                  </button>
                  <button
                    onClick={() => setSelectedTab('workflow')}
                    className={`
                      py-3 px-6 border-b-2 font-medium text-sm
                      ${selectedTab === 'workflow'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    Workflow Pubblicazione
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {selectedTab === 'versions' ? (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Gestione Versioni
                      </h2>
                      <button
                        onClick={() => navigate(`/admin/legal-documents/${id}/new-version`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        Aggiungi Versione
                      </button>
                    </div>
                  </div>

                  {sortedVersions && sortedVersions.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {sortedVersions.map((version: any) => {
                        const statusConfig = versionStatusConfig[version.status];
                        const StatusIcon = statusConfig?.icon || ClockIcon;
                        const isExpanded = expandedVersion === version.id;

                        return (
                          <div key={version.id} className="hover:bg-gray-50">
                            <div className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <h3 className="text-base font-semibold text-gray-900">
                                      v{version.version}
                                    </h3>
                                    <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusConfig?.color}-100 text-${statusConfig?.color}-700`}>
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {statusConfig?.label}
                                    </span>
                                    {version.status === 'PUBLISHED' && (
                                      <span className="ml-2 text-xs text-green-600 font-medium">
                                        (Versione Corrente)
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-gray-900 mt-2">
                                    {version.title}
                                  </p>
                                  
                                  {version.summary && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {version.summary}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      Effettiva: {new Date(version.effectiveDate).toLocaleDateString('it-IT')}
                                    </span>
                                    {version.expiryDate && (
                                      <span className="flex items-center">
                                        <ClockIcon className="h-3 w-3 mr-1" />
                                        Scade: {new Date(version.expiryDate).toLocaleDateString('it-IT')}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <GlobeAltIcon className="h-3 w-3 mr-1" />
                                      {version.language.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {/* Version Actions */}
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                    title={isExpanded ? "Chiudi" : "Espandi"}
                                  >
                                    {isExpanded ? (
                                      <ChevronUpIcon className="h-5 w-5" />
                                    ) : (
                                      <ChevronDownIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => window.open(`/legal/${document.type.toLowerCase().replace('_', '-')}?version=${version.version}`, '_blank')}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                    title="Anteprima"
                                  >
                                    <EyeIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Content with Workflow */}
                              {isExpanded && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <LegalDocumentVersionWorkflow
                                    version={version}
                                    documentId={document.id}
                                    onStatusChange={handleWorkflowUpdate}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Nessuna versione disponibile</p>
                      <button
                        onClick={() => navigate(`/admin/legal-documents/${id}/new-version`)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Crea Prima Versione
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Workflow Tab */
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Workflow di Pubblicazione
                    </h2>
                    <p className="text-sm text-gray-600">
                      Gestisci il processo di approvazione e pubblicazione delle versioni del documento.
                      Solo una versione alla volta può essere pubblicata.
                    </p>
                  </div>

                  {sortedVersions && sortedVersions.length > 0 ? (
                    <div className="space-y-6">
                      {sortedVersions.map((version: any) => (
                        <LegalDocumentVersionWorkflow
                          key={version.id}
                          version={version}
                          documentId={document.id}
                          onStatusChange={handleWorkflowUpdate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Nessuna versione disponibile per il workflow
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
