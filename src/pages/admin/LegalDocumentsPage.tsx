import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  CakeIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface LegalDocument {
  id: string;
  type: string;
  internalName: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string;
    email: string;
  };
  versions?: any[];
  _count?: {
    versions: number;
    acceptances: number;
  };
}

const documentTypeConfig = {
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

export default function LegalDocumentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Fetch documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['legal-documents', selectedType, showOnlyActive],
    queryFn: async () => {
      const params: any = { includeVersions: true };
      if (selectedType !== 'all') params.type = selectedType;
      if (showOnlyActive) params.isActive = true;
      
      const response = await api.get('/admin/legal-documents', { params });
      return response.data?.data || [];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/legal-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      toast.success('Documento eliminato con successo');
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione del documento');
    }
  });

  const handleDelete = (doc: LegalDocument) => {
    if (window.confirm(`Sei sicuro di voler eliminare "${doc.displayName}"? Questa azione eliminerà anche tutte le versioni e le accettazioni.`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const getStatusBadge = (doc: LegalDocument) => {
    if (!doc.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Bozza
        </span>
      );
    }

    const hasPublishedVersion = doc.versions?.some((v: any) => v.status === 'PUBLISHED');
    
    if (hasPublishedVersion) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Pubblicato
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="h-3 w-3 mr-1" />
        In Lavorazione
      </span>
    );
  };

  const getLatestVersion = (doc: LegalDocument) => {
    if (!doc.versions || doc.versions.length === 0) return null;
    return doc.versions[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestione Documenti
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Privacy Policy, Termini di Servizio, Cookie Policy e altri documenti GDPR
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/admin/legal-documents/editor')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Editor Documenti
              </button>
              
              <button
                onClick={() => navigate('/admin/legal-documents/new')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuovo Documento
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti i tipi</option>
                <option value="PRIVACY_POLICY">Privacy Policy</option>
                <option value="TERMS_SERVICE">Termini di Servizio</option>
                <option value="COOKIE_POLICY">Cookie Policy</option>
                <option value="DPA">DPA</option>
                <option value="CUSTOM">Personalizzati</option>
              </select>

              {/* Active filter */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Solo documenti attivi
                </span>
              </label>

              {/* Refresh button */}
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Aggiorna
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/admin/legal-documents/acceptances')}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Report Accettazioni
              </button>
              <button
                onClick={() => navigate('/admin/legal-documents/analytics')}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun documento trovato
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Inizia creando il tuo primo documento legale
            </p>
            <button
              onClick={() => navigate('/admin/legal-documents/new')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Crea Primo Documento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc: LegalDocument) => {
              const config = documentTypeConfig[doc.type as keyof typeof documentTypeConfig] || documentTypeConfig.CUSTOM;
              const IconComponent = config.icon;
              const latestVersion = getLatestVersion(doc);
              
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className={`p-4 border-b border-gray-200 bg-${config.color}-50`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <IconComponent className={`h-6 w-6 text-${config.color}-600 mr-3`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {doc.displayName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {config.label}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(doc)}
                    </div>
                    
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-900">
                          {doc._count?.versions || 0}
                        </p>
                        <p className="text-xs text-gray-500">Versioni</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-900">
                          {doc._count?.acceptances || 0}
                        </p>
                        <p className="text-xs text-gray-500">Accettazioni</p>
                      </div>
                    </div>

                    {/* Latest Version Info */}
                    {latestVersion && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Ultima versione:</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            v{latestVersion.version}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(latestVersion.effectiveDate).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-3">
                      {doc.isRequired && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          Obbligatorio
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        <GlobeAltIcon className="h-3 w-3 mr-1" />
                        IT
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/admin/legal-documents/${doc.id}`)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Dettagli
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/admin/legal-documents/${doc.id}/versions`)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Gestisci versioni"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/legal-documents/${doc.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Modifica"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Elimina"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
