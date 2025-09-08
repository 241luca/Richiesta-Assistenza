import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Componenti modali
import UserDetailsModal from '../components/admin/users/UserDetailsModal';
import CreateUserModal from '../components/admin/users/CreateUserModal';
import EditUserModal from '../components/admin/users/EditUserModal';
import ResetPasswordModal from '../components/admin/users/ResetPasswordModal';
import BulkActionsModal from '../components/admin/users/BulkActionsModal';

// Tipi
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  city?: string;
  province?: string;
  profession?: string;
  emailVerified: boolean;
  isActive: boolean;
  blocked: boolean;
  blockedReason?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    clientRequests: number;
    professionalRequests: number;
    Quote: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    byRole: Record<string, number>;
    active: number;
    blocked: number;
    verified: number;
  };
}

// Mappatura ruoli per display
const roleLabels: Record<string, string> = {
  CLIENT: 'Cliente',
  PROFESSIONAL: 'Professionista',
  ADMIN: 'Amministratore',
  SUPER_ADMIN: 'Super Admin'
};

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-100 text-blue-800',
  PROFESSIONAL: 'bg-green-100 text-green-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  SUPER_ADMIN: 'bg-red-100 text-red-800'
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  
  // Stati
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Stati modali
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Query principale
  const { data, isLoading, error, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, limit, search, roleFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });
      
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) {
        if (statusFilter === 'active') params.append('isActive', 'true');
        if (statusFilter === 'inactive') params.append('isActive', 'false');
        if (statusFilter === 'blocked') params.append('blocked', 'true');
        if (statusFilter === 'verified') params.append('emailVerified', 'true');
      }
      
      const response = await api.get(`/admin/users?${params}`);
      return response.data.data;
    }
  });

  // Query statistiche
  const { data: stats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/users/stats/overview');
      return response.data.data;
    }
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('Utente eliminato con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUsers([]);
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione dell\'utente');
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, userIds, reason }: { action: string; userIds: string[]; reason?: string }) => {
      await api.post('/admin/users/bulk', { action, userIds, reason });
    },
    onSuccess: (_, variables) => {
      const actionMessages: Record<string, string> = {
        activate: 'Utenti attivati',
        deactivate: 'Utenti disattivati',
        block: 'Utenti bloccati',
        unblock: 'Utenti sbloccati',
        delete: 'Utenti eliminati',
        verify_email: 'Email verificate',
        send_welcome_email: 'Email di benvenuto inviate'
      };
      toast.success(`${actionMessages[variables.action]} con successo`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUsers([]);
      setShowBulkActionsModal(false);
    },
    onError: () => {
      toast.error('Errore nell\'azione di massa');
    }
  });

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === data?.users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(data?.users.map(u => u.id) || []);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  // Handler per inviare email di benvenuto
  const handleSendWelcomeEmail = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/send-welcome-email`);
      toast.success(`Email di benvenuto inviata a ${user.email}`);
    } catch (error) {
      toast.error('Errore nell\'invio dell\'email di benvenuto');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'utente ${user.fullName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/admin/users/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
      
      toast.success('Export completato con successo');
    } catch (error) {
      toast.error('Errore durante l\'export');
    }
  };

  // Render statistiche
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Utenti</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.total}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utenti Attivi</p>
              <p className="text-2xl font-bold text-green-600">{stats.overview.active}</p>
              <p className="text-xs text-gray-500">{stats.overview.percentageActive}%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nuovi Oggi</p>
              <p className="text-2xl font-bold text-blue-600">{stats.growth.today}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Questa Settimana</p>
              <p className="text-2xl font-bold text-purple-600">{stats.growth.week}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Questo Mese</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.growth.month}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
            <p className="text-gray-600 mt-1">
              Gestisci tutti gli utenti registrati sulla piattaforma
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Nuovo Utente
          </button>
        </div>
      </div>

      {/* Statistiche */}
      {renderStats()}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Ricerca */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca per nome, email, telefono..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filtri */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center ${
                showFilters ? 'bg-gray-100' : ''
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtri
              {(roleFilter || statusFilter) && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {[roleFilter, statusFilter].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Vista */}
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                title="Vista tabella"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                title="Vista griglia"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>

            {/* Export */}
            <div className="relative group">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Azioni di massa */}
            {selectedUsers.length > 0 && (
              <button
                onClick={() => setShowBulkActionsModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
              >
                Azioni ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>

        {/* Filtri espansi */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Tutti i ruoli</option>
              <option value="CLIENT">Cliente</option>
              <option value="PROFESSIONAL">Professionista</option>
              <option value="ADMIN">Amministratore</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="inactive">Inattivi</option>
              <option value="blocked">Bloccati</option>
              <option value="verified">Email verificata</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="createdAt">Data registrazione</option>
              <option value="lastLogin">Ultimo accesso</option>
              <option value="fullName">Nome</option>
              <option value="email">Email</option>
              <option value="role">Ruolo</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="border rounded-lg px-4 py-2"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        )}
      </div>

      {/* Contenuto principale */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Errore nel caricamento degli utenti
          </div>
        ) : viewMode === 'table' ? (
          // Vista tabella con scroll orizzontale se necessario
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === data?.users.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Richieste
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                    {user.profession && (
                      <div className="text-xs text-gray-500 mt-1">{user.profession}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {user.phone && (
                        <div className="flex items-center text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {user.phone}
                        </div>
                      )}
                      {user.city && (
                        <div className="flex items-center text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {user.city} {user.province && `(${user.province})`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {user.isActive ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Inattivo
                        </span>
                      )}
                      {user.emailVerified && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Email verificata
                        </span>
                      )}
                      {user.blocked && (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Bloccato
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {user.requestsCount !== undefined ? (
                        <div>Richieste: {user.requestsCount}</div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {user._count && (
                            <>
                              {user.role === 'CLIENT' && user._count.clientRequests !== undefined && (
                                <div>Richieste: {user._count.clientRequests}</div>
                              )}
                              {user.role === 'PROFESSIONAL' && (
                                <>
                                  {user._count.professionalRequests !== undefined && (
                                    <div>Assegnate: {user._count.professionalRequests}</div>
                                  )}
                                  {user._count.Quote !== undefined && (
                                    <div>Preventivi: {user._count.Quote}</div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {user.quotesCount !== undefined && (
                        <div>Preventivi: {user.quotesCount}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Registrato: {new Date(user.createdAt).toLocaleDateString('it-IT')}
                        {user.lastLogin && (
                          <div>Ultimo accesso: {new Date(user.lastLogin).toLocaleDateString('it-IT')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="Visualizza dettagli"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-gray-600 hover:text-green-600"
                        title="Modifica"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-1 text-gray-600 hover:text-orange-600"
                        title="Reset password"
                      >
                        <KeyIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSendWelcomeEmail(user)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="Invia email benvenuto"
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Elimina"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        ) : (
          // Vista griglia
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="rounded mt-1"
                />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>

              <div className="mb-3">
                <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                {user.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {user.phone}
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {user.city}
                  </div>
                )}
                {user.profession && (
                  <div className="text-xs text-gray-500">{user.profession}</div>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                {user.isActive ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" title="Attivo" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400" title="Inattivo" />
                )}
                {user.emailVerified && (
                  <EnvelopeIcon className="h-5 w-5 text-blue-500" title="Email verificata" />
                )}
                {user.blocked && (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" title="Bloccato" />
                )}
              </div>

              <div className="text-xs text-gray-500 mb-3">
                Registrato: {new Date(user.createdAt).toLocaleDateString('it-IT')}
              </div>

              <div className="flex justify-between pt-3 border-t">
                <button
                  onClick={() => handleViewDetails(user)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Dettagli
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-1 text-gray-600 hover:text-green-600"
                    title="Modifica"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleResetPassword(user)}
                    className="p-1 text-gray-600 hover:text-orange-600"
                    title="Reset password"
                  >
                    <KeyIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSendWelcomeEmail(user)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                    title="Email benvenuto"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Elimina"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
            </div>
          </div>
        )}
      </div>

      {/* Paginazione */}
      {data && data.pagination && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, data.pagination.total)} di {data.pagination.total} utenti
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 border rounded-lg ${
                      page === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modali */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showBulkActionsModal && (
        <BulkActionsModal
          selectedCount={selectedUsers.length}
          onClose={() => setShowBulkActionsModal(false)}
          onAction={(action, reason) => {
            bulkActionMutation.mutate({ action, userIds: selectedUsers, reason });
          }}
        />
      )}
    </div>
  );
}