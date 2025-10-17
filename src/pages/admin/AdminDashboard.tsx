import { RequestTableRow } from '@/components/admin/RequestTableRow';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ModulesStatusWidget } from '../../components/admin/dashboard/ModulesStatusWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserIcon, 
  ClipboardDocumentListIcon, 
  CurrencyEuroIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalRequests: number;
    totalQuotes: number;
    totalRevenue: number;
    usersByRole: {
      clients: number;
      professionals: number;
      staff: number;
    };
    requestsByStatus: {
      pending: number;
      assigned: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    monthlyGrowth: {
      users: number;
      requests: number;
      quotes: number;
      revenue: number;
    };
  };
  recentActivity: {
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    recentRequests: Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
    recentQuotes: Array<{
      id: string;
      requestId?: string; // ID della richiesta associata
      requestTitle: string;
      amount: number;
      status: string;
      createdAt: string;
      professional?: string; // Nome del professionista
      client?: string; // Nome del cliente
    }>;
    allRequests?: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      subcategory: string;
      subcategoryId: string | null;
      client: string;
      professional: string | null;
      createdAt: string;
      requestedDate: string | null;
      scheduledDate: string | null;
    }>;
  };
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'neutral',
  onClick
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  onClick?: () => void;
}) {
  return (
    <div className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow rounded-lg" : ""} onClick={onClick}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <p className={`text-xs flex items-center mt-1 ${
              changeType === 'increase' ? 'text-green-600' : 
              changeType === 'decrease' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {changeType === 'increase' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
              {changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
              {change}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  
  // Stati per i filtri
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    subcategoryId: '',
    hasScheduledDate: '',
    searchText: '',
    excludeCancelled: true,  // Nuovo flag
    excludeCompleted: false   // Nuovo flag
  });
  
  // Stati per paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stati per ordinamento
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard', currentPage, rowsPerPage, sortBy, sortOrder],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard', {
        params: {
          page: currentPage,
          limit: rowsPerPage,
          sortBy,
          sortOrder
        }
      });
      // AGGIORNATO: Gestisce il formato ResponseFormatter
      return response.data.data || response.data; // Compatibilità con vecchio e nuovo formato
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filtra le richieste basandosi sui filtri
  const filteredRequests = useMemo(() => {
    if (!data?.recentActivity?.allRequests) return [];
    
    let filtered = [...data.recentActivity.allRequests];
    
    // Filtro escludi annullate
    if (filters.excludeCancelled) {
      filtered = filtered.filter(r => r.status !== 'CANCELLED');
    }
    
    // Filtro escludi completate
    if (filters.excludeCompleted) {
      filtered = filtered.filter(r => r.status !== 'COMPLETED');
    }
    
    // Filtro stato (solo se non vuoto)
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    // Filtro priorità
    if (filters.priority) {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    
    // Filtro sottocategoria
    if (filters.subcategoryId) {
      filtered = filtered.filter(r => r.subcategoryId === filters.subcategoryId);
    }
    
    // Filtro data programmata
    if (filters.hasScheduledDate === 'yes') {
      filtered = filtered.filter(r => r.scheduledDate);
    } else if (filters.hasScheduledDate === 'no') {
      filtered = filtered.filter(r => !r.scheduledDate);
    }
    
    // Ricerca testuale
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(search) ||
        r.client?.toLowerCase().includes(search) ||
        r.professional?.toLowerCase().includes(search) ||
        r.subcategory?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [data?.recentActivity?.allRequests, filters]);

  // Conta richieste senza professionisti abilitati
  const requestsWithoutProfessionals = useMemo(() => {
    if (!data?.recentActivity?.allRequests) return 0;
    
    // Per ora assumiamo che le richieste senza professionista assegnato e con sottocategoria 
    // che non hanno professionisti abilitati siano quelle problematiche
    // Questo andrebbe verificato con una query al backend
    return data.recentActivity.allRequests.filter(r => 
      !r.professional && r.status === 'PENDING'
    ).length;
  }, [data?.recentActivity?.allRequests]);

  // Query per i professionisti in attesa
  const { data: pendingProfessionals } = useQuery({
    queryKey: ['pending-professionals'],
    queryFn: async () => {
      const response = await api.get('/users/professionals');
      const professionals = response.data.data || [];
      return professionals.filter((p: any) => p.approvalStatus === 'PENDING');
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Query per i professionisti disponibili per sottocategoria
  const { data: availableProfessionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ['professionals-by-subcategory', selectedSubcategoryId],
    queryFn: async () => {
      if (!selectedSubcategoryId) {
        // Se non c'è sottocategoria, carica tutti i professionisti
        const response = await api.get('/admin/users', {
          params: {
            role: 'PROFESSIONAL',
            limit: 20
          }
        });
        return response.data.data?.users || [];
      }
      // Usa il nuovo endpoint per sottocategoria
      const response = await api.get(`/admin/users/professionals-by-subcategory/${selectedSubcategoryId}`);
      return response.data.data || [];
    },
    enabled: showAssignModal  // Carica solo quando il modal è aperto
  });

  // Mutations per aggiornare stato e priorità
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const response = await api.put(`/requests/${requestId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento dello stato');
    }
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ requestId, priority }: { requestId: string; priority: string }) => {
      const response = await api.put(`/requests/${requestId}/priority`, { priority });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Priorità aggiornata con successo!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento della priorità');
    }
  });

  // Mutation per assegnare la richiesta
  const assignMutation = useMutation({
    mutationFn: async ({ requestId, professionalId }: { requestId: string; professionalId: string }) => {
      const response = await api.post(`/requests/${requestId}/assign`, { professionalId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Richiesta assegnata con successo!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedSubcategoryId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'assegnazione');
    }
  });

  const handleAssignClick = (e: React.MouseEvent, requestId: string, subcategoryId: string | null) => {
    e.stopPropagation(); // Previeni la navigazione alla richiesta
    setSelectedRequest(requestId);
    setSelectedSubcategoryId(subcategoryId);
    setShowAssignModal(true);
  };

  const handleAssignProfessional = (professionalId: string) => {
    if (selectedRequest) {
      assignMutation.mutate({ requestId: selectedRequest, professionalId });
    }
  };
  
  // Funzione per gestire l'ordinamento
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Se è lo stesso campo, inverti l'ordine
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se è un nuovo campo, imposta desc di default
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset alla prima pagina
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Errore nel caricamento dei dati. Riprova più tardi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = data?.stats || {
    totalUsers: 0,
    totalRequests: 0,
    totalQuotes: 0,
    totalRevenue: 0,
    usersByRole: { clients: 0, professionals: 0, staff: 0 },
    requestsByStatus: {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    monthlyGrowth: { users: 0, requests: 0, quotes: 0, revenue: 0 }
  };

  const activity = data?.recentActivity || {
    recentUsers: [],
    recentRequests: [],
    recentQuotes: []
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>

      {/* Notifica professionisti in attesa */}
      {pendingProfessionals && pendingProfessionals.length > 0 && (
        <div 
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => navigate('/admin/professionals')}
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800">
                Professionisti in attesa di approvazione
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Ci sono <span className="font-bold">{pendingProfessionals.length}</span> professionisti in attesa di essere approvati.
                <span className="text-yellow-600 ml-2 underline">Clicca per gestire</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche principali */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Utenti Totali" 
          value={stats.totalUsers}
          icon={UserIcon}
          change={`${stats.monthlyGrowth.users > 0 ? '+' : ''}${stats.monthlyGrowth.users}% questo mese`}
          changeType={stats.monthlyGrowth.users > 0 ? 'increase' : stats.monthlyGrowth.users < 0 ? 'decrease' : 'neutral'}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard 
          title="Richieste Totali" 
          value={stats.totalRequests}
          icon={ClipboardDocumentListIcon}
          change={`${stats.monthlyGrowth.requests > 0 ? '+' : ''}${stats.monthlyGrowth.requests}% questo mese`}
          changeType={stats.monthlyGrowth.requests > 0 ? 'increase' : stats.monthlyGrowth.requests < 0 ? 'decrease' : 'neutral'}
          onClick={() => {
            const element = document.getElementById('richieste-grid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
        <StatCard 
          title="Preventivi Totali" 
          value={stats.totalQuotes}
          icon={ChartBarIcon}
          change={`${stats.monthlyGrowth.quotes > 0 ? '+' : ''}${stats.monthlyGrowth.quotes || 0}% questo mese`}
          changeType={stats.monthlyGrowth.quotes > 0 ? 'increase' : stats.monthlyGrowth.quotes < 0 ? 'decrease' : 'neutral'}
          onClick={() => navigate('/quotes')}
        />
        <StatCard 
          title="Fatturato Totale" 
          value={`€${(stats.totalRevenue / 100).toLocaleString('it-IT')}`}
          icon={CurrencyEuroIcon}
          change={`${stats.monthlyGrowth.revenue > 0 ? '+' : ''}${stats.monthlyGrowth.revenue}% questo mese`}
          changeType={stats.monthlyGrowth.revenue > 0 ? 'increase' : stats.monthlyGrowth.revenue < 0 ? 'decrease' : 'neutral'}
        />
      </div>



      {/* Griglia Richieste - Con scroll */}
      {data?.recentActivity?.allRequests && (
        <div id="richieste-grid">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tutte le Richieste di Assistenza</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Clicca su una richiesta per vedere i dettagli</p>
          </CardHeader>
          <CardContent>
            {/* Filtri */}
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Filtro Stato */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tutti gli stati</option>
                  <option value="PENDING">In Attesa</option>
                  <option value="ASSIGNED">Assegnata</option>
                  <option value="IN_PROGRESS">In Corso</option>
                  <option value="COMPLETED">Completata</option>
                  <option value="CANCELLED">Annullata</option>
                </select>

                {/* Filtro Priorità */}
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tutte le priorità</option>
                  <option value="LOW">Bassa</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>

                {/* Filtro Sottocategoria */}
                <select
                  value={filters.subcategoryId}
                  onChange={(e) => setFilters({...filters, subcategoryId: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tutte le sottocategorie</option>
                  {data?.recentActivity?.allRequests
                    ?.map(r => ({id: r.subcategoryId, name: r.subcategory}))
                    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
                    .map(sub => (
                      <option key={sub.id} value={sub.id || ''}>{sub.name}</option>
                    )) || []}
                </select>

                {/* Filtro Data Programmata */}
                <select
                  value={filters.hasScheduledDate}
                  onChange={(e) => setFilters({...filters, hasScheduledDate: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tutte</option>
                  <option value="yes">Con data programmata</option>
                  <option value="no">Senza data programmata</option>
                </select>

                {/* Pulsante Reset */}
                <button
                  onClick={() => {
                    setFilters({
                      status: '',
                      priority: '',
                      subcategoryId: '',
                      hasScheduledDate: '',
                      searchText: '',
                      excludeCancelled: true,
                      excludeCompleted: false
                    });
                    setCurrentPage(1);  // Reset anche la paginazione
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  Reset Filtri
                </button>
              </div>

              {/* Checkbox per escludere stati */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.excludeCancelled}
                    onChange={(e) => setFilters({...filters, excludeCancelled: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Nascondi annullate</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.excludeCompleted}
                    onChange={(e) => setFilters({...filters, excludeCompleted: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Nascondi completate</span>
                </label>
              </div>

              {/* Ricerca testuale */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  placeholder="Cerca per titolo, cliente, professionista, note..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Indicatore richieste senza professionisti */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Totale: {data.recentActivity.allRequests?.length || 0} richieste
                </span>
                <span className="text-gray-600">
                  Filtrate: {filteredRequests.length} richieste
                </span>
                {requestsWithoutProfessionals > 0 && (
                  <span className="text-orange-600 font-medium">
                    ⚠️ {requestsWithoutProfessionals} richieste senza professionisti abilitati
                  </span>
                )}
              </div>
            </div>

              {/* Controlli paginazione sopra la tabella */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Righe per pagina:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Precedente
                  </button>
                  <span className="text-sm">
                    Pagina {currentPage} di {data?.recentActivity?.pagination?.totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(data?.recentActivity?.pagination?.totalPages || 1, p + 1))}
                    disabled={currentPage >= (data?.recentActivity?.pagination?.totalPages || 1)}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Successiva →
                  </button>
                </div>
              </div>

            <div className="overflow-x-auto max-h-[630px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b">
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Data Richiesta {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('title')}
                    >
                      Titolo {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('subcategory')}
                    >
                      Sottocategoria {sortBy === 'subcategory' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      Stato {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('priority')}
                    >
                      Priorità {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('client')}
                    >
                      Cliente {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('professional')}
                    >
                      Professionista {sortBy === 'professional' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('requestedDate')}
                    >
                      Data Richiesta Int. {sortBy === 'requestedDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left pb-2 px-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('scheduledDate')}
                    >
                      Data Programmata {sortBy === 'scheduledDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center pb-2 px-2">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <RequestTableRow 
                      key={request.id} 
                      request={request} 
                      onAssignClick={handleAssignClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Modal Assegnazione Professionista */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Seleziona Professionista</h2>
            {selectedSubcategoryId && (
              <p className="text-sm text-gray-600 mb-4">
                Professionisti per la sottocategoria selezionata
              </p>
            )}
            
            {loadingProfessionals ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : availableProfessionals && availableProfessionals.length > 0 ? (
              <div className="space-y-3">
                {availableProfessionals.map((prof: any) => (
                  <div 
                    key={prof.id} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      prof.isGeneric ? 'border-gray-300' : 'border-green-500'
                    }`}
                    onClick={() => handleAssignProfessional(prof.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {prof.firstName} {prof.lastName}
                          {prof.hasCertifications && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Certificato
                            </span>
                          )}
                          {prof.isGeneric && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Generico
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{prof.email}</p>
                        {prof.phone && (
                          <p className="text-sm text-gray-600">Tel: {prof.phone}</p>
                        )}
                        {prof.city && (
                          <p className="text-sm text-gray-500">{prof.city}, {prof.province}</p>
                        )}
                        {prof.profession && (
                          <p className="text-sm text-blue-600 mt-1">Professione: {prof.profession}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {prof.hourlyRate && (
                          <p className="text-sm font-medium">€{prof.hourlyRate}/ora</p>
                        )}
                        {prof.experienceYears > 0 && (
                          <p className="text-xs text-gray-500">Esperienza: {prof.experienceYears} anni</p>
                        )}
                        {prof.workRadius && (
                          <p className="text-xs text-gray-500">Raggio: {prof.workRadius} km</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nessun professionista disponibile</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRequest(null);
                  setSelectedSubcategoryId(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche dettagliate - 4 box in una riga */}
      <div className="grid gap-6 grid-cols-4 mb-8">
        {/* Widget Stato Moduli */}
        <ModulesStatusWidget />
        {/* Distribuzione Utenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Distribuzione Utenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Clienti</span>
                <span className="font-semibold">{stats.usersByRole.clients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Professionisti</span>
                <span className="font-semibold">{stats.usersByRole.professionals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Staff</span>
                <span className="font-semibold">{stats.usersByRole.staff}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stato Richieste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Stato Richieste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">In attesa</span>
                <span className="font-semibold text-yellow-600">{stats.requestsByStatus.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Assegnate</span>
                <span className="font-semibold text-blue-600">{stats.requestsByStatus.assigned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In corso</span>
                <span className="font-semibold text-orange-600">{stats.requestsByStatus.in_progress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completate</span>
                <span className="font-semibold text-green-600">{stats.requestsByStatus.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Annullate</span>
                <span className="font-semibold text-gray-600">{stats.requestsByStatus.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attività Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Nuovi Utenti</h4>
                  {activity.recentUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="text-xs text-gray-600 mb-1">
                      {user.name} ({user.role})
                    </div>
                  ))}
                </div>
              )}
              
              {activity.recentRequests.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Richieste Recenti</h4>
                  {activity.recentRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="text-xs text-gray-600 mb-1">
                      {request.title} - {request.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabella dettagliata preventivi recenti */}
      {activity.recentQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preventivi Recenti</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Clicca su un preventivo per vedere i dettagli</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Professionista</th>
                    <th className="text-left pb-2">Cliente</th>
                    <th className="text-left pb-2">Richiesta</th>
                    <th className="text-left pb-2">Importo</th>
                    <th className="text-left pb-2">Stato</th>
                    <th className="text-left pb-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.recentQuotes.slice(0, 10).map((quote) => (
                    <tr 
                      key={quote.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <td className="py-2">{quote.professional || 'Non assegnato'}</td>
                      <td className="py-2">{quote.client || 'N/A'}</td>
                      <td className="py-2">{quote.requestTitle}</td>
                      <td className="py-2">€{(quote.amount / 100).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-2">{new Date(quote.createdAt).toLocaleDateString('it-IT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
