import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PaperClipIcon,
  DocumentArrowDownIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { api, apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import AssignRequestModal from '../components/admin/AssignRequestModal';

interface AssistanceRequest {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  clientId: string;
  professionalId?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  requestedDate?: string;
  assignedDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt?: string;
  // Campi distanza che arrivano dal backend
  distance?: number;
  distanceText?: string;
  duration?: number;
  durationText?: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
  };
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    profession?: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  _count?: {
    quotes: number;
    attachments: number;
  };
}

const statusConfig: any = {
  PENDING: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  pending: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  ASSIGNED: {
    label: 'Assegnata',
    color: 'bg-blue-100 text-blue-800',
    icon: UserIcon,
  },
  assigned: {
    label: 'Assegnata',
    color: 'bg-blue-100 text-blue-800',
    icon: UserIcon,
  },
  IN_PROGRESS: {
    label: 'In Corso',
    color: 'bg-indigo-100 text-indigo-800',
    icon: ArrowPathIcon,
  },
  in_progress: {
    label: 'In Corso',
    color: 'bg-indigo-100 text-indigo-800',
    icon: ArrowPathIcon,
  },
  COMPLETED: {
    label: 'Completata',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  completed: {
    label: 'Completata',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: 'Annullata',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
  cancelled: {
    label: 'Annullata',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
};

const priorityConfig = {
  LOW: {
    label: 'Bassa',
    color: 'bg-gray-100 text-gray-800',
  },
  MEDIUM: {
    label: 'Media',
    color: 'bg-blue-100 text-blue-800',
  },
  HIGH: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
  },
  URGENT: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800',
  },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequestForAssign, setSelectedRequestForAssign] = useState<AssistanceRequest | null>(null);

  // Fetch requests - ora include già le distanze dal backend
  const { data: requestsData, isLoading, refetch } = useQuery({
    queryKey: ['requests', { searchTerm, filterStatus, filterPriority, filterCategory }],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterCategory !== 'all') params.category = filterCategory;
      
      const response = await api.requests.getAll(params);
      return response.data?.data || response.data;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const response = await api.categories.getAll();
      const data = response.data?.data || response.data;
      return data?.categories || data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.requests.delete(id);
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || 'Richiesta eliminata con successo';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante l\'eliminazione';
      toast.error(errorMessage);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.requests.update(id, { status });
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || 'Stato aggiornato con successo';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante l\'aggiornamento';
      toast.error(errorMessage);
    },
  });

  const requests = requestsData?.requests || requestsData || [];

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa richiesta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDownloadPDF = async (requestId: string) => {
    try {
      const response = await api.get(`/requests/${requestId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `richiesta-${requestId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF scaricato con successo');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Errore durante il download del PDF');
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/D';
    return format(new Date(date), 'dd MMM yyyy', { locale: it });
  };

  const formatAddress = (request: AssistanceRequest) => {
    return `${request.address}, ${request.city} (${request.province})`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'CLIENT' ? 'Le Mie Richieste' : 'Richieste di Assistenza'}
          </h1>
          <p className="mt-2 text-gray-600">
            {requests.length > 0 
              ? `${requests.length} richiest${requests.length === 1 ? 'a' : 'e'} trovate`
              : 'Nessuna richiesta trovata'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {user?.role === 'CLIENT' && (
            <button
              onClick={() => navigate('/requests/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nuova Richiesta
            </button>
          )}
          
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Aggiorna
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filtri
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per titolo o descrizione..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutti gli stati</option>
                <option value="PENDING">In Attesa</option>
                <option value="ASSIGNED">Assegnata</option>
                <option value="IN_PROGRESS">In Corso</option>
                <option value="COMPLETED">Completata</option>
                <option value="CANCELLED">Annullata</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutte le priorità</option>
                <option value="LOW">Bassa</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            
            {categoriesData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutte le categorie</option>
                  {categoriesData.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna richiesta trovata
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non hai ancora creato richieste di assistenza'}
          </p>
          {user?.role === 'CLIENT' && !searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/requests/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Crea la tua prima richiesta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request: AssistanceRequest) => {
            const statusInfo = statusConfig[request.status] || statusConfig['pending'] || {
              label: 'Sconosciuto',
              color: 'bg-gray-100 text-gray-800',
              icon: ClockIcon,
            };
            const priorityInfo = priorityConfig[request.priority] || priorityConfig['MEDIUM'];
            const StatusIcon = statusInfo.icon;
            
            return (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        {/* Categoria e Sottocategoria */}
                        {(request.category || request.subcategory) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <TagIcon className="h-3.5 w-3.5" />
                            {typeof request.category === 'string' ? request.category : request.category?.name || 'Non categorizzato'}
                            {request.subcategory && (
                              <>
                                <span className="text-purple-600"> / </span>
                                {request.subcategory.name}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      
                      {/* Grid info principale - 2 colonne su mobile, 3 su desktop */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        
                        {request.professional && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{request.professional.fullName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Riga separata per indirizzo e distanza */}
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-gray-600">{formatAddress(request)}</span>
                          {request.distanceText && user?.role === 'PROFESSIONAL' && (
                            <span className="ml-3 text-blue-600 font-medium">
                              📍 {request.distanceText}
                              {request.durationText && (
                                <span className="ml-2 text-gray-500">({request.durationText})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex gap-2 mt-3">
                        {request._count?.quotes && request._count.quotes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                            <DocumentTextIcon className="h-3.5 w-3.5" />
                            {request._count.quotes} preventiv{request._count.quotes === 1 ? 'o' : 'i'}
                          </span>
                        )}
                        
                        {request._count?.attachments && request._count.attachments > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded">
                            <PaperClipIcon className="h-3.5 w-3.5" />
                            {request._count.attachments} allegat{request._count.attachments === 1 ? 'o' : 'i'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/requests/${request.id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Dettagli
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(request.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      PDF
                    </button>
                    
                    {user?.role === 'CLIENT' && request.status === 'PENDING' && (
                      <button
                        onClick={() => navigate(`/requests/${request.id}/edit`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Modifica
                      </button>
                    )}
                    
                    {/* Bottone Assegna per ADMIN e SUPER_ADMIN */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && 
                     request.status === 'PENDING' && (
                      <button
                        onClick={() => setSelectedRequestForAssign(request)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        Assegna
                      </button>
                    )}
                    
                    {user?.role === 'PROFESSIONAL' && request.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusChange(request.id, 'IN_PROGRESS')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Inizia Lavoro
                      </button>
                    )}
                    
                    {user?.role === 'PROFESSIONAL' && request.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(request.id, 'COMPLETED')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Completa
                      </button>
                    )}
                    
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Elimina
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}