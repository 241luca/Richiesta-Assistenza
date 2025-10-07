import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  FunnelIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
  PaperClipIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AvailableRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  requestedDate?: string;
  createdAt: string;
  distance?: string;
  distanceText?: string;
  durationText?: string;
  client: {
    id: string;
    fullName: string;
    city: string;
    province: string;
  };
  category: {
    id: string;
    name: string;
    color?: string;
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

const priorityConfig = {
  LOW: { label: 'Bassa', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const statusConfig = {
  PENDING: { 
    label: 'In attesa', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon
  },
};

function formatAddress(request: AvailableRequest): string {
  const parts = [];
  if (request.address) parts.push(request.address);
  if (request.city) parts.push(request.city);
  if (request.province) parts.push(`(${request.province})`);
  if (request.postalCode) parts.push(request.postalCode);
  return parts.join(', ') || 'Indirizzo non specificato';
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/D';
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: it });
  } catch {
    return 'N/D';
  }
}

export function AvailableRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterDistance, setFilterDistance] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Fetch available requests
  const { data, isLoading, error } = useQuery({
    queryKey: ['available-requests'],
    queryFn: async () => {
      const response = await api.get('/professionals/available-requests');
      console.log('Available requests response:', response.data);
      console.log('First request details:', response.data?.data?.requests?.[0]);
      return response.data?.data || { requests: [], total: 0 };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Self-assign mutation
  const selfAssignMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const response = await api.post(`/professionals/self-assign/${requestId}`, { notes });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Richiesta presa in carico con successo!');
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'assegnazione';
      toast.error(message);
    }
  });

  // Filter requests
  const filteredRequests = data?.requests?.filter((req: AvailableRequest) => {
    if (filterDistance !== 'all') {
      const distance = req.distanceText || req.distance || 'Altra provincia';
      if (filterDistance === 'same-city' && !distance.includes('Stessa città')) return false;
      if (filterDistance === 'same-province' && !distance.includes('Stessa provincia')) return false;
      if (filterDistance === 'other' && !distance.includes('Altra provincia')) return false;
    }
    if (filterPriority !== 'all' && req.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && req.category?.id !== filterCategory) return false;
    return true;
  }) || [];

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Map();
    data?.requests?.forEach((req: AvailableRequest) => {
      if (req.category) {
        cats.set(req.category.id, req.category);
      }
    });
    return Array.from(cats.values());
  }, [data?.requests]);

  // Check if user can self-assign
  const canSelfAssign = user?.canSelfAssign !== false; // Default to true if undefined

  if (!canSelfAssign) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Auto-assegnazione non disponibile
        </h2>
        <p className="text-gray-600">
          L'amministratore non ti ha abilitato per l'auto-assegnazione delle richieste.
          Contatta il supporto per maggiori informazioni.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
        <p className="text-gray-600">Impossibile caricare le richieste disponibili</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Richieste Disponibili</h1>
            <p className="text-gray-600 mt-1">
              Richieste che puoi prendere in carico per le tue sottocategorie abilitate
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <BriefcaseIcon className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{filteredRequests.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Distanza
            </label>
            <select
              value={filterDistance}
              onChange={(e) => setFilterDistance(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutte</option>
              <option value="same-city">Stessa città</option>
              <option value="same-province">Stessa provincia</option>
              <option value="other">Altra provincia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
              Priorità
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutte</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Bassa</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Categoria
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutte</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nessuna richiesta disponibile
          </h2>
          <p className="text-gray-600">
            {filterDistance !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono richieste disponibili per le tue sottocategorie al momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request: AvailableRequest) => {
            const statusInfo = statusConfig[request.status] || statusConfig['PENDING'];
            const priorityInfo = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig['MEDIUM'];
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
                            {request.category?.name || 'Non categorizzato'}
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
                      
                      {/* Grid info principale */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{request.client.fullName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        
                        {request.requestedDate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>Richiesta per: {formatDate(request.requestedDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Riga separata per indirizzo e distanza */}
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-gray-600">{formatAddress(request)}</span>
                          {(request.distanceText || request.distance) && (
                            <span className="ml-3 text-blue-600 font-medium">
                              📍 {request.distanceText || request.distance}
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
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler prendere in carico la richiesta "${request.title}"?`)) {
                          selfAssignMutation.mutate({ requestId: request.id });
                        }
                      }}
                      disabled={selfAssignMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                      Prendi in carico
                    </button>
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