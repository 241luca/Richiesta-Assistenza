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
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon
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
  scheduledDate?: string;
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
  // Preventivi collegati alla richiesta
  quotes?: Array<{
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'DRAFT';
    amount?: number;
    totalAmount?: number;
    currency?: string;
  }>;
  // Conteggi vari
  _count?: {
    quotes: number;
    attachments: number;
    unreadMessages?: number;
  };
  // Ultimo messaggio per determinare il colore della chat
  lastMessage?: {
    id: string;
    userId: string;
    createdAt: string;
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
  const [sortBy, setSortBy] = useState<string>('createdAt-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequestForAssign, setSelectedRequestForAssign] = useState<AssistanceRequest | null>(null);
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  // Filtra le categorie in base al ruolo (dopo aver caricato requests)
  const filteredCategories = React.useMemo(() => {
    if (!categoriesData) return [];
    
    // Admin, SuperAdmin e Client vedono tutte le categorie
    if (user?.role !== 'PROFESSIONAL') {
      return categoriesData;
    }
    
    // Per i professionisti, se NON sta filtrando per categoria,
    // mostra solo le categorie delle richieste esistenti
    // Se sta già filtrando, mostra tutte per permettere di cambiare filtro
    if (filterCategory === 'all') {
      // Estrai le categorie uniche dalle loro richieste non filtrate
      const myCategoryIds = new Set(
        requests
          .map((req: AssistanceRequest) => req.categoryId)
          .filter(Boolean)
      );
      
      // Se ha richieste, filtra le categorie, altrimenti mostra tutte
      if (myCategoryIds.size > 0) {
        return categoriesData.filter((cat: any) => myCategoryIds.has(cat.id));
      }
    }
    
    // Quando sta filtrando, mostra tutte le categorie per poter cambiare
    return categoriesData;
  }, [categoriesData, user?.role, requests, filterCategory]);

  // Applica ordinamento ai risultati
  const sortedRequests = [...requests].sort((a: AssistanceRequest, b: AssistanceRequest) => {
    const [field, order] = sortBy.split('-');
    const isAsc = order === 'asc';

    switch (field) {
      case 'createdAt':
        return isAsc 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      
      case 'requestedDate':
        if (!a.requestedDate && !b.requestedDate) return 0;
        if (!a.requestedDate) return 1;
        if (!b.requestedDate) return -1;
        return isAsc
          ? new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
          : new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime();
      
      case 'distance':
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return isAsc ? a.distance - b.distance : b.distance - a.distance;
      
      case 'priority':
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        return isAsc ? aPriority - bPriority : bPriority - aPriority;
      
      case 'status':
        return isAsc 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      
      default:
        return 0;
    }
  });

  // Calcola paginazione
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);

  // Funzioni paginazione
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Determina il colore dell'icona chat in base ai messaggi
  const getChatIconColor = (request: AssistanceRequest) => {
    if (!request.lastMessage) {
      return 'text-blue-500'; // Nessun messaggio - blu
    }
    
    // Se l'ultimo messaggio è del cliente
    if (request.lastMessage.userId === request.clientId) {
      return 'text-red-500'; // Cliente ha scritto per ultimo - rosso
    }
    
    // Se l'ultimo messaggio è del professionista o admin
    return 'text-green-500'; // Abbiamo risposto - verde
  };

  // Formatta l'importo del preventivo
  const formatQuoteAmount = (quotes?: AssistanceRequest['quotes']) => {
    if (!quotes || quotes.length === 0) return null;
    
    // Trova il preventivo accettato, altrimenti prendi il più recente
    const acceptedQuote = quotes.find(q => q.status === 'ACCEPTED');
    const quoteToShow = acceptedQuote || quotes[0];
    
    // Se non c'è amount o è 0, non mostrare nulla
    if (!quoteToShow.amount || Number(quoteToShow.amount) === 0) return null;
    
    const amount = Number(quoteToShow.amount);
    const currency = quoteToShow.currency || 'EUR';
    
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
          <p className="mt-1 text-sm text-gray-600">
            {sortedRequests.length > 0 
              ? `${sortedRequests.length} richiest${sortedRequests.length === 1 ? 'a' : 'e'} trovate - Pagina ${currentPage} di ${totalPages}`
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Aggiorna
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutte le priorità</option>
                <option value="LOW">Bassa</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            
            {filteredCategories && filteredCategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutte le categorie</option>
                  {filteredCategories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ordina per
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt-desc">Più recenti</option>
                <option value="createdAt-asc">Più vecchie</option>
                <option value="requestedDate-asc">Intervento: prima</option>
                <option value="requestedDate-desc">Intervento: dopo</option>
                <option value="priority-desc">Priorità: alta</option>
                <option value="priority-asc">Priorità: bassa</option>
                {(user?.role === 'PROFESSIONAL' || user?.role === 'SUPER_ADMIN') && (
                  <>
                    <option value="distance-asc">Distanza: vicini</option>
                    <option value="distance-desc">Distanza: lontani</option>
                  </>
                )}
                <option value="status-asc">Stato: A-Z</option>
                <option value="status-desc">Stato: Z-A</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {paginatedRequests.length === 0 ? (
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
        <>
          <div className="space-y-4">
            {paginatedRequests.map((request: AssistanceRequest) => {
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
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {/* Riga 1: Titolo, Badge Status/Priority, Data Creazione, Categoria, Preventivi */}
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
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
                        {/* Data Creazione */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs text-gray-600 bg-gray-50 rounded-full border border-gray-200">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          Creata: {formatDate(request.createdAt)}
                        </span>
                        {/* Categoria e Sottocategoria */}
                        {(request.category || request.subcategory) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
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
                        {/* Preventivi con importo - NELLA PRIMA RIGA - CLICCABILI */}
                        {request.quotes && request.quotes.length > 0 && (
                          <>
                            {request.quotes.some(q => q.status === 'PENDING') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const pendingQuote = request.quotes?.find(q => q.status === 'PENDING');
                                  if (pendingQuote) navigate(`/quotes/${pendingQuote.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 hover:bg-yellow-200 transition-colors cursor-pointer"
                              >
                                🟡 Preventivo{formatQuoteAmount(request.quotes) ? `: ${formatQuoteAmount(request.quotes)}` : ''}
                              </button>
                            )}
                            {request.quotes.some(q => q.status === 'ACCEPTED') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const acceptedQuote = request.quotes?.find(q => q.status === 'ACCEPTED');
                                  if (acceptedQuote) navigate(`/quotes/${acceptedQuote.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-300 hover:bg-green-200 transition-colors cursor-pointer"
                              >
                                🟢 Accettato{formatQuoteAmount(request.quotes.filter(q => q.status === 'ACCEPTED')) ? `: ${formatQuoteAmount(request.quotes.filter(q => q.status === 'ACCEPTED'))}` : ''}
                              </button>
                            )}
                            {request.quotes.some(q => q.status === 'REJECTED') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rejectedQuote = request.quotes?.find(q => q.status === 'REJECTED');
                                  if (rejectedQuote) navigate(`/quotes/${rejectedQuote.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-300 hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                🔴 Rifiutato
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      
                      {/* Riga 3: Cliente, Richiesta, Programmato, Professionista - TUTTO IN UNA RIGA */}
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        {/* Nome Cliente */}
                        {request.client && (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <UserIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">{request.client.fullName}</span>
                          </div>
                        )}
                        
                        {/* Data Intervento Richiesta dal Cliente */}
                        {request.requestedDate && (
                          <div className="flex items-center gap-1.5 text-orange-700">
                            <ClockIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            <span className="font-medium">Richiesta: {formatDate(request.requestedDate)}</span>
                          </div>
                        )}
                        
                        {/* Data Intervento Programmato dal Professionista */}
                        {request.scheduledDate && (
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">Programmato: {formatDate(request.scheduledDate)}</span>
                          </div>
                        )}
                        
                        {/* Professionista Assegnato */}
                        {request.professional && (
                          <div className="flex items-center gap-1.5 text-green-700">
                            <UserIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="font-medium">{request.professional.fullName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Riga separata per indirizzo e distanza */}
                      <div className="mt-3 flex items-start gap-2 text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-gray-600">{formatAddress(request)}</span>
                          {/* Distanza visibile a PROFESSIONAL e SUPER_ADMIN */}
                          {request.distanceText && (user?.role === 'PROFESSIONAL' || user?.role === 'SUPER_ADMIN') && (
                            <span className="ml-3 text-blue-600 font-medium">
                              📍 {request.distanceText}
                              {request.durationText && (
                                <span className="ml-2 text-gray-500">(⏱️ {request.durationText})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                    {/* Icona Moduli */}
                    <button
                      onClick={() => navigate(`/requests/${request.id}/forms`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                      title="Visualizza moduli personalizzati"
                    >
                      <Squares2X2Icon className="h-5 w-5 text-indigo-600" />
                      Moduli
                    </button>

                    {/* Icona Chat con colore dinamico */}
                    <button
                      onClick={() => navigate(`/requests/${request.id}/chat`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                      title={!request.lastMessage ? 'Nessun messaggio' : request.lastMessage.userId === request.clientId ? 'Cliente ha scritto per ultimo' : 'Hai risposto'}
                    >
                      <ChatBubbleLeftRightIcon className={`h-5 w-5 ${getChatIconColor(request)}`} />
                      Chat
                      {request._count?.unreadMessages && request._count.unreadMessages > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {request._count.unreadMessages}
                        </span>
                      )}
                    </button>

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

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              {/* Info e selezione righe */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Mostra da <span className="font-medium">{startIndex + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(endIndex, sortedRequests.length)}</span> di{' '}
                  <span className="font-medium">{sortedRequests.length}</span> risultati
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10 per pagina</option>
                  <option value={20}>20 per pagina</option>
                  <option value={50}>50 per pagina</option>
                  <option value={100}>100 per pagina</option>
                </select>
              </div>

              {/* Controlli paginazione */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Precedente
                </button>
                
                {/* Numeri pagina */}
                <div className="flex gap-1">
                  {currentPage > 2 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="px-2 py-2 text-gray-500">...</span>}
                    </>
                  )}
                  
                  {currentPage > 1 && (
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {currentPage - 1}
                    </button>
                  )}
                  
                  <button
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg"
                  >
                    {currentPage}
                  </button>
                  
                  {currentPage < totalPages && (
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {currentPage + 1}
                    </button>
                  )}
                  
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="px-2 py-2 text-gray-500">...</span>}
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Successiva
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}