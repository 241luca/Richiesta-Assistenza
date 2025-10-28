import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUnifiedDocuments,
  useDocumentStatistics,
  useCreateDocumentFromTemplate
} from '@/hooks/useDocumentIntegration';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Filter,
  Plus,
  Search,
  Eye,
  Calendar,
  User,
  Tag,
  TrendingUp,
  X
} from 'lucide-react';

export default function UnifiedDocumentsDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    limit: 50,
    offset: 0
  });

  // Debounce search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Build query filters with debounced search
  const queryFilters = {
    ...filters,
    search: debouncedSearch || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined
  };

  // Queries with debounced search
  const { data: documentsData, isLoading, error } = useUnifiedDocuments(queryFilters);
  const { data: stats } = useDocumentStatistics();
  const createMutation = useCreateDocumentFromTemplate();

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Error loading unified documents:', error);
      toast.error('Errore nel caricamento dei documenti');
    }
  }, [error]);

  const documents = documentsData?.documents || [];
  const total = documentsData?.total || 0;

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      search: '',
      limit: 50,
      offset: 0
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      PUBLISHED: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Create new document - redirect to legal documents editor
  const handleCreateDocument = () => {
    navigate('/admin/legal-documents/editor');
  };

  // View document - redirect to correct page based on type
  const handleViewDocument = (doc: any) => {
    if (doc.type === 'LEGAL') {
      navigate(`/admin/legal-documents/${doc.id}`);
    } else {
      // Form-based: navigate to custom forms editor
      navigate(`/admin/custom-forms/${doc.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Documenti Unificati
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestisci documenti legali e form-based da un'unica interfaccia
              </p>
            </div>
            <button
              onClick={handleCreateDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuovo Documento
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totale</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Legali</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.legalDocuments}</p>
                </div>
                <Tag className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Form-Based</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.formBasedDocuments}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bozze</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draftDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pubblicati</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publishedDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca documenti..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutti i tipi</option>
              <option value="LEGAL">Legali</option>
              <option value="FORM_BASED">Form-Based</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutti gli stati</option>
              <option value="DRAFT">Bozza</option>
              <option value="PUBLISHED">Pubblicato</option>
              <option value="PENDING_APPROVAL">In Approvazione</option>
              <option value="APPROVED">Approvato</option>
              <option value="ARCHIVED">Archiviato</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Pulisci
            </button>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nessun documento trovato
            </h3>
            <p className="text-gray-600">
              Crea il tuo primo documento o modifica i filtri di ricerca
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Versione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creato
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={`${doc.type}-${doc.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          {doc.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.type === 'LEGAL'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {doc.type === 'LEGAL' ? 'Legale' : 'Form-Based'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        v{doc.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                        </div>
                        {doc.createdByUser && (
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <User className="w-3 h-3 mr-1" />
                            {doc.createdByUser.firstName} {doc.createdByUser.lastName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Visualizza
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando {documents.length} di {total} documenti
            </div>
          </>
        )}
      </div>
    </div>
  );
}
