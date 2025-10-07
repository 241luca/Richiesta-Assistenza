import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  BriefcaseIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
// CORRETTO: Usa l'API service strutturato e il nuovo hook useAuth
import { api, apiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { GuaranteeBanner } from '../components/guarantees';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  discount?: number;
}

interface Quote {
  id: string;
  requestId: string;
  professionalId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  currency: string;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
  items: QuoteItem[];
  request: {
    id: string;
    title: string;
    description: string;
    status: string;
    client: {
      id: string;
      fullName: string;
      email: string;
    };
    category?: {
      name: string;
      color: string;
    };
    subcategory?: {
      name: string;
    };
  };
  professional: {
    id: string;
    fullName: string;
    profession?: string;
  };
}

const statusConfig = {
  DRAFT: {
    label: 'Bozza',
    color: 'bg-gray-100 text-gray-800',
    icon: DocumentTextIcon,
  },
  PENDING: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  ACCEPTED: {
    label: 'Accettato',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  REJECTED: {
    label: 'Rifiutato',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
  EXPIRED: {
    label: 'Scaduto',
    color: 'bg-gray-100 text-gray-600',
    icon: ClockIcon,
  },
};

export function QuotesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRequest, setFilterRequest] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestSelectionModal, setShowRequestSelectionModal] = useState(false);
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState<string>('');

  // Helper per tradurre stato in italiano
  const getStatusLabel = (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Da assegnare',
      'assigned': 'Assegnato',
      'in_progress': 'In corso',
      'completed': 'Completato',
      'cancelled': 'Annullato'
    };
    return statusLabels[status.toLowerCase()] || status;
  };

  // Helper per tradurre priorità in italiano
  const getPriorityLabel = (priority: string): string => {
    const priorityLabels: { [key: string]: string } = {
      'low': 'Bassa',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorityLabels[priority.toLowerCase()] || priority;
  };

  // Helper per ottenere il colore dello stato
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Helper per ottenere il colore della priorità
  const getPriorityColor = (priority: string): string => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // CORRETTO: Fetch quotes con ResponseFormatter
  const { data: quotesData, isLoading, refetch } = useQuery({
    queryKey: ['quotes', { status: filterStatus, requestId: filterRequest }],
    queryFn: async () => {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterRequest !== 'all') params.requestId = filterRequest;
      
      const response = await api.quotes.getAll(params);
      // CORRETTO: Gestisce ResponseFormatter (data.data || data)
      return response.data?.data || response.data;
    },
  });

  // CORRETTO: Fetch user's requests con ResponseFormatter
  const { data: requestsData } = useQuery({
    queryKey: ['user-requests'],
    queryFn: async () => {
      const response = await api.requests.getAll();
      // CORRETTO: Gestisce ResponseFormatter
      return response.data?.data || response.data;
    },
    enabled: user?.role === 'CLIENT',
  });

  // CORRETTO: Fetch available requests con ResponseFormatter
  const { data: availableRequestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['available-requests-for-quotes', user?.id],
    queryFn: async () => {
      try {
        // Per i professionisti, prendiamo tutte le richieste e filtriamo lato client
        const response = await api.requests.getAll();
        
        // CORRETTO: Gestisce ResponseFormatter
        const data = response.data?.data || response.data;
        const requests = data?.requests || data || [];
        
        console.log('All requests fetched:', requests.length);
        console.log('User role:', user?.role, 'User ID:', user?.id);
        
        // Se è un professionista, filtra per mostrare:
        // 1. Richieste assegnate a lui
        // 2. Richieste non ancora assegnate (PENDING)
        if (user?.role === 'PROFESSIONAL' && requests.length > 0) {
          const userId = String(user.id); // Converti a stringa per confronto
          const filtered = requests.filter((req: any) => {
            const reqProfId = String(req.professionalId || '');
            const reqProfId2 = String(req.professional?.id || '');
            const isPending = req.status === 'PENDING' || req.status === 'pending';
            const isAssignedToMe = reqProfId === userId || reqProfId2 === userId;
            const isAssignedOrInProgress = req.status === 'ASSIGNED' || req.status === 'assigned' || 
                                          req.status === 'IN_PROGRESS' || req.status === 'in_progress';
            
            // Mostra se: è pending OPPURE è assegnata a questo professionista
            return isPending || (isAssignedOrInProgress && isAssignedToMe);
          });
          console.log('Filtered requests for professional:', filtered.length);
          return filtered;
        }
        
        // Per admin, mostra tutte
        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
          return requests;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching available requests:', error);
        return [];
      }
    },
    enabled: showRequestSelectionModal && !!user,
  });

  console.log('Quotes response:', quotesData);
  
  // CORRETTO: Gestisci il formato ResponseFormatter
  // Il server restituisce {data: Array, pagination: {...}}
  const allQuotes = Array.isArray(quotesData?.data) ? quotesData.data : 
                     Array.isArray(quotesData?.quotes) ? quotesData.quotes : 
                     Array.isArray(quotesData) ? quotesData : [];
  const pagination = quotesData?.pagination;
  
  // Filtra i preventivi in base alla query di ricerca
  const quotes = allQuotes.filter((quote: Quote) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      quote.title?.toLowerCase().includes(searchLower) ||
      quote.description?.toLowerCase().includes(searchLower) ||
      quote.request?.title?.toLowerCase().includes(searchLower) ||
      quote.request?.client?.fullName?.toLowerCase().includes(searchLower) ||
      quote.professional?.fullName?.toLowerCase().includes(searchLower) ||
      quote.notes?.toLowerCase().includes(searchLower)
    );
  });
  
  console.log('Quotes array:', quotes);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  // CORRETTO: Accept mutation con ResponseFormatter
  const acceptMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await api.quotes.accept(quoteId);
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || 'Preventivo accettato con successo';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore nell\'accettare il preventivo';
      toast.error(errorMessage);
    }
  });

  // CORRETTO: Reject mutation con ResponseFormatter
  const rejectMutation = useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason?: string }) => {
      const response = await api.quotes.reject(quoteId, reason || '');
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || 'Preventivo rifiutato';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore nel rifiutare il preventivo';
      toast.error(errorMessage);
    }
  });

  const handleAcceptQuote = (quoteId: string) => {
    acceptMutation.mutate(quoteId);
  };

  const handleRejectQuote = (quoteId: string, reason?: string) => {
    rejectMutation.mutate({ quoteId, reason });
  };

  // CORRETTO: Download PDF usando l'API service
  const handleDownloadPDF = async (quoteId: string) => {
    try {
      // Usiamo l'apiClient direttamente per il download blob
      const { apiClient } = await import('../services/api');
      const response = await api.get(`/quotes/${quoteId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `preventivo-${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF scaricato con successo');
    } catch (error: any) {
      toast.error('Errore nel download del PDF');
    }
  };

  const handleViewDetails = (quoteId: string) => {
    navigate(`/quotes/${quoteId}`);
  };

  const handleCreateQuote = () => {
    setShowRequestSelectionModal(true);
  };

  const handleSelectRequestForQuote = () => {
    if (selectedRequestForQuote) {
      navigate(`/quotes/new/${selectedRequestForQuote}`);
      setShowRequestSelectionModal(false);
      setSelectedRequestForQuote('');
    } else {
      toast.error('Seleziona una richiesta per continuare');
    }
  };

  // Mutation per eliminare preventivo
  const deleteMutation = useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason?: string }) => {
      const response = await api.delete(`/quotes/${quoteId}`, {
        data: reason ? { reason } : undefined
      });
      return response.data;
    },
    onSuccess: (responseData) => {
      const message = responseData?.message || 'Preventivo eliminato con successo';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore nell\'eliminazione del preventivo';
      toast.error(errorMessage);
    }
  });

  // Funzione per modificare un preventivo
  const handleEditQuote = (quoteId: string) => {
    navigate(`/quotes/edit/${quoteId}`);
  };

  // Funzione per eliminare un preventivo
  const handleDeleteQuote = (quoteId: string) => {
    const confirmed = confirm('Sei sicuro di voler eliminare questo preventivo? Questa azione non può essere annullata.');
    
    if (confirmed) {
      // Opzionale: chiedi il motivo della cancellazione
      const reason = prompt('Motivo della cancellazione (opzionale):');
      
      // Se l'utente ha cliccato Annulla sul prompt del motivo, non procedere
      if (reason === null && false) { // Disabilitato: procedi anche senza motivo
        return;
      }
      
      // Chiama la mutation con il motivo se fornito
      deleteMutation.mutate({ quoteId, reason: reason || undefined });
    }
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
            {user?.role === 'PROFESSIONAL' ? 'I Miei Preventivi' : 
             user?.role === 'CLIENT' ? 'Preventivi Ricevuti' : 'Tutti i Preventivi'}
          </h1>
          <p className="mt-2 text-gray-600">
            {quotes.length > 0 
              ? `${quotes.length} preventiv${quotes.length === 1 ? 'o' : 'i'} trovati`
              : 'Nessun preventivo disponibile'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {(user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={handleCreateQuote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nuovo Preventivo
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filtri
          </button>
        </div>
      </div>

      {/* Banner Garanzie */}
      <div className="mb-6">
        <GuaranteeBanner />
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per titolo, descrizione, cliente, professionista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <option value="DRAFT">Bozza</option>
                <option value="PENDING">In Attesa</option>
                <option value="ACCEPTED">Accettato</option>
                <option value="REJECTED">Rifiutato</option>
                <option value="EXPIRED">Scaduto</option>
              </select>
            </div>
            
            {user?.role === 'CLIENT' && requestsData?.requests && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Richiesta
                </label>
                <select
                  value={filterRequest}
                  onChange={(e) => setFilterRequest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutte le richieste</option>
                  {requestsData.requests.map((request: any) => (
                    <option key={request.id} value={request.id}>
                      {request.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun preventivo trovato
          </h3>
          <p className="text-gray-500 mb-4">
            {user?.role === 'PROFESSIONAL' 
              ? 'Non hai ancora creato preventivi. Clicca su "Nuovo Preventivo" per iniziare.'
              : user?.role === 'CLIENT'
              ? 'Non hai ancora ricevuto preventivi per le tue richieste.'
              : 'Non ci sono preventivi nel sistema.'}
          </p>
          {(user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={handleCreateQuote}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Crea il primo preventivo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote: Quote) => {
            const statusInfo = statusConfig[quote.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <div
                key={quote.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quote.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                      
                      {quote.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {quote.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Richiesta:</span>
                          <span className="truncate">{quote.request?.title || 'N/A'}</span>
                        </div>
                        
                        {user?.role === 'CLIENT' ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Professionista:</span>
                            <span>{quote.professional?.fullName || 'N/A'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Cliente:</span>
                            <span>{quote.request?.client?.fullName || 'N/A'}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Creato:</span>
                          <span>{format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: it })}</span>
                        </div>
                        
                        {quote.validUntil && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Valido fino:</span>
                            <span>{format(new Date(quote.validUntil), 'dd MMM yyyy', { locale: it })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(quote.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.items?.length || 0} voc{quote.items?.length === 1 ? 'e' : 'i'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(quote.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Dettagli
                    </button>
                    
                    <button
                      onClick={() => handleDownloadPDF(quote.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      PDF
                    </button>
                    
                    {/* Pulsanti per PROFESSIONAL - Modifica e Cancella */}
                    {user?.role === 'PROFESSIONAL' && quote.professionalId === user.id && 
                     (quote.status === 'DRAFT' || quote.status === 'PENDING') && (
                      <>
                        <button
                          onClick={() => handleEditQuote(quote.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Modifica
                        </button>
                        
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Elimina
                        </button>
                      </>
                    )}
                    
                    {user?.role === 'CLIENT' && quote.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          disabled={acceptMutation.isPending}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          {acceptMutation.isPending ? 'Accettando...' : 'Accetta'}
                        </button>
                        
                        <button
                          onClick={() => {
                            const reason = prompt('Motivo del rifiuto (opzionale):');
                            handleRejectQuote(quote.id, reason || undefined);
                          }}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          {rejectMutation.isPending ? 'Rifiutando...' : 'Rifiuta'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1 rounded-lg ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {/* Modal selección request */}
      {showRequestSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Seleziona una Richiesta</h3>
              <button
                onClick={() => {
                  setShowRequestSelectionModal(false);
                  setSelectedRequestForQuote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Seleziona la richiesta per cui vuoi creare un preventivo:
            </p>
            
            <div className="max-h-[50vh] overflow-y-auto">
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : availableRequestsData && availableRequestsData.length > 0 ? (
                <div className="space-y-3">
                  {availableRequestsData.map((request: any) => (
                    <div
                      key={request.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRequestForQuote === request.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRequestForQuote(request.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{request.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getStatusLabel(request.status)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                              {getPriorityLabel(request.priority)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 mb-3">{request.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                            <div>
                              <span className="font-medium">Cliente:</span> {request.client?.fullName || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Categoria:</span> {request.category?.name || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Creata:</span> {format(new Date(request.createdAt), 'dd/MM/yyyy')}
                            </div>
                            <div>
                              <span className="font-medium">Indirizzo:</span> {request.city}, {request.province}
                            </div>
                          </div>
                        </div>
                        {selectedRequestForQuote === request.id && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {user?.role === 'PROFESSIONAL' 
                      ? 'Non hai richieste assegnate per cui creare preventivi.'
                      : 'Nessuna richiesta disponibile per creare preventivi.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setShowRequestSelectionModal(false);
                  setSelectedRequestForQuote('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleSelectRequestForQuote}
                disabled={!selectedRequestForQuote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procedi con la Richiesta Selezionata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotesPage;