// src/components/admin/audit/AuditDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheckIcon, 
  ChartBarIcon, 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  ServerIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import AuditLogTable from './AuditLogTable';
import AuditStatistics from './AuditStatistics';
import AuditFilters from './AuditFilters';
import AuditAlerts from './AuditAlerts';
import AuditInfo from './AuditInfo';
import ActiveUsersModal from './ActiveUsersModal';

interface AuditFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  category?: string;
  severity?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export default function AuditDashboard() {
  const [activeTab, setActiveTab] = useState<'logs' | 'statistics' | 'alerts' | 'info'>('logs');
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0
  });
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);

  // Fetch audit logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs, error: logsError } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const response = await api.get('/audit/logs', { params: filters });
      console.log('🔍 AUDIT API Response:', response); // DEBUG
      console.log('📊 Response data structure:', response.data); // DEBUG
      console.log('📝 Logs array:', response.data?.data?.logs); // DEBUG
      console.log('🔢 Total:', response.data?.data?.total); // DEBUG
      
      // Il backend ritorna { success, data: { logs, total }, message }
      // api.get ritorna response.data che è già { success, data, message }
      // Quindi dobbiamo accedere a response.data.data
      return response.data?.data || { logs: [], total: 0 };
    },
    staleTime: 30000, // 30 secondi
  });

  // Log error if any
  if (logsError) {
    console.error('❌ Error fetching audit logs:', logsError);
  }

  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['auditStats', filters.fromDate, filters.toDate],
    queryFn: async () => {
      const response = await api.get('/audit/statistics', { 
        params: { 
          fromDate: filters.fromDate, 
          toDate: filters.toDate 
        } 
      });
      // Stesso pattern: response.data.data contiene i dati effettivi
      return response.data?.data || {};
    },
    staleTime: 60000, // 1 minuto
  });

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['auditAlerts'],
    queryFn: async () => {
      const response = await api.get('/audit/alerts');
      // Gli alerts potrebbero essere direttamente in data o in data.data
      return response.data?.data || response.data || [];
    },
    staleTime: 60000,
  });

  const handleExport = async () => {
    try {
      const response = await api.get('/audit/export', {
        params: filters,
        responseType: 'blob'
      });
      
      // Crea un link per scaricare il file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  // Handler per cliccare sui box statistiche
  const handleStatBoxClick = (filterType: 'all' | 'failed' | 'users' | 'success') => {
    if (filterType === 'all') {
      // Ripristina vista completa
      setFilters({
        limit: 50,
        offset: 0
        // Rimuove tutti i filtri
      });
      setActiveTab('logs');
    } else if (filterType === 'failed') {
      // Filtra per operazioni fallite
      setFilters({
        ...filters,
        success: false,
        offset: 0
      });
      setActiveTab('logs');
    } else if (filterType === 'users') {
      // Apri modal utenti attivi
      setShowActiveUsersModal(true);
    } else if (filterType === 'success') {
      // Mostra il tasso di successo
      setFilters({
        ...filters,
        success: true,
        offset: 0
      });
      setActiveTab('logs');
    }
  };

  // Handler per selezionare un utente dal modal
  const handleSelectUser = (userId: string) => {
    setFilters({
      ...filters,
      userId,
      offset: 0
    });
    setActiveTab('logs');
  };

  const tabs = [
    { id: 'logs', name: 'Audit Logs', icon: ShieldCheckIcon },
    { id: 'statistics', name: 'Statistiche', icon: ChartBarIcon },
    { id: 'alerts', name: 'Alert', icon: ExclamationTriangleIcon },
    { id: 'info', name: 'Informazioni', icon: InformationCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Sistema Audit Log
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitoraggio completo delle attività del sistema
                  </p>
                </div>
              </div>
              
              {activeTab === 'logs' && (
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Esporta CSV
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStatBoxClick('all')}
              title="Clicca per vedere tutte le operazioni"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Operazioni Totali
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData?.totalLogs || 0}
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStatBoxClick('failed')}
              title="Clicca per vedere le operazioni fallite"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Operazioni Fallite
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData?.failedOperations || 0}
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStatBoxClick('users')}
              title="Clicca per vedere gli utenti attivi"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Utenti Attivi
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData?.uniqueUsers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStatBoxClick('success')}
              title="Clicca per vedere le operazioni riuscite"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Tasso Successo
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData?.successRate || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <AuditFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            <AuditLogTable
              logs={logsData?.logs || []}
              total={logsData?.total || 0}
              loading={logsLoading}
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={refetchLogs}
            />
          </div>
        )}

        {activeTab === 'statistics' && (
          <AuditStatistics
            data={statsData}
            loading={statsLoading}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {activeTab === 'alerts' && (
          <AuditAlerts
            alerts={alertsData || []}
            loading={alertsLoading}
          />
        )}
        
        {activeTab === 'info' && (
          <AuditInfo />
        )}
      </div>

      {/* Modal Utenti Attivi */}
      <ActiveUsersModal
        isOpen={showActiveUsersModal}
        onClose={() => setShowActiveUsersModal(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
