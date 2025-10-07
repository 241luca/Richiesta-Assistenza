// src/components/admin/audit/AuditLogTable.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AuditLogDetail from './AuditLogDetail';

interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  success: boolean;
  ipAddress: string;
  endpoint?: string;
  method?: string;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  severity: string;
  category: string;
  metadata?: any;
  oldValues?: any;
  newValues?: any;
  changes?: any;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface Props {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onRefresh: () => void;
}

export default function AuditLogTable({ 
  logs, 
  total, 
  loading, 
  filters, 
  onFiltersChange,
  onRefresh 
}: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 50));

  const handlePageChange = (page: number) => {
    onFiltersChange({
      ...filters,
      offset: (page - 1) * (filters.limit || 50)
    });
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-100';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50';
      case 'INFO':
        return 'text-blue-600 bg-blue-50';
      case 'DEBUG':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return 'text-purple-700 bg-purple-100';
      case 'BUSINESS':
        return 'text-green-700 bg-green-100';
      case 'SYSTEM':
        return 'text-orange-700 bg-orange-100';
      case 'COMPLIANCE':
        return 'text-indigo-700 bg-indigo-100';
      case 'API':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Amministratore',
      'PROFESSIONAL': 'Professionista',
      'CLIENT': 'Cliente'
    };
    return labels[role] || role;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN_SUCCESS': 'Login',
      'LOGIN_FAILED': 'Login Fallito',
      'LOGOUT': 'Logout',
      'CREATE': 'Creazione',
      'UPDATE': 'Modifica',
      'DELETE': 'Eliminazione',
      'READ': 'Lettura',
      'REQUEST_CREATED': 'Richiesta Creata',
      'REQUEST_ASSIGNED': 'Richiesta Assegnata',
      'QUOTE_SENT': 'Preventivo Inviato',
      'PAYMENT_PROCESSED': 'Pagamento Processato',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'User': 'Utente',
      'AssistanceRequest': 'Richiesta',
      'Quote': 'Preventivo',
      'Payment': 'Pagamento',
      'InterventionReport': 'Rapporto',
      'Authentication': 'Autenticazione',
      'Notification': 'Notifica',
      'Category': 'Categoria',
      'Backup': 'Backup',
      'System': 'Sistema',
      'Code': 'Codice/Script'
    };
    return labels[entityType] || entityType;
  };

  const getEndpointLabel = (endpoint?: string, method?: string) => {
    if (!endpoint) return '-';
    
    // Rimuovi /api/ dall'inizio
    const cleanPath = endpoint.replace(/^\/api\//, '');
    
    // Abbrevia path troppo lunghi
    if (cleanPath.length > 30) {
      const parts = cleanPath.split('/');
      if (parts.length > 2) {
        return `${parts[0]}/.../${parts[parts.length - 1]}`;
      }
    }
    
    // Aggiungi il metodo se presente
    const methodLabel = method ? `${method} ` : '';
    return methodLabel + cleanPath;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Log di Audit ({total} totali)
          </h2>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entità/Dettaglio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risultato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severità
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr 
                key={log.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(log)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: it })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {log.user?.fullName || log.userEmail || 'Sistema'}
                    </div>
                    <div className="text-gray-500">
                      {log.user?.role ? getRoleLabel(log.user.role) : log.userRole ? getRoleLabel(log.userRole) : ''}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {getEntityLabel(log.entityType)}
                    </div>
                    {log.entityId && (
                      <div className="text-gray-500 text-xs">
                        ID: {log.entityId.substring(0, 8)}...
                      </div>
                    )}
                    {log.errorMessage && (
                      <div className="text-red-500 text-xs truncate max-w-xs" title={log.errorMessage}>
                        ⚠️ {log.errorMessage.substring(0, 30)}...
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {getEndpointLabel(log.endpoint, log.method)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {log.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <span className="ml-2 text-sm text-gray-900">
                      {log.statusCode || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(log.category)}`}>
                    {log.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Precedente
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Successivo
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando da{' '}
              <span className="font-medium">{filters.offset + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(filters.offset + filters.limit, total)}
              </span>{' '}
              di <span className="font-medium">{total}</span> risultati
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = currentPage - 2 + i;
                if (page > 0 && page <= totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Modal Dettaglio */}
      <AuditLogDetail 
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}
