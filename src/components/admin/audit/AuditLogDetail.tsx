// src/components/admin/audit/AuditLogDetail.tsx
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  userAgent: string;
  endpoint?: string;
  method?: string;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  severity: string;
  category: string;
  sessionId?: string;
  requestId?: string;
  oldValues?: any;
  newValues?: any;
  changes?: any;
  metadata?: any;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface Props {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogDetail({ log, isOpen, onClose }: Props) {
  if (!isOpen || !log) return null;

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600';
    if (action.includes('UPDATE')) return 'text-blue-600';
    if (action.includes('DELETE')) return 'text-red-600';
    if (action.includes('LOGIN')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'ERROR': 'bg-red-50 text-red-600',
      'WARNING': 'bg-yellow-50 text-yellow-600',
      'INFO': 'bg-blue-50 text-blue-600',
      'DEBUG': 'bg-gray-50 text-gray-600'
    };
    return colors[severity] || 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-50 w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Dettaglio Log di Audit
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {log.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Informazioni Principali */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Informazioni Principali</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: it })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Azione</p>
                  <p className={`font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entità</p>
                  <p className="font-medium">
                    {log.entityType}
                    {log.entityId && (
                      <span className="text-sm text-gray-500 ml-2">
                        (ID: {log.entityId})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Risultato</p>
                  <p className="font-medium">
                    {log.success ? (
                      <span className="text-green-600">✅ Successo</span>
                    ) : (
                      <span className="text-red-600">❌ Fallito</span>
                    )}
                    {log.statusCode && (
                      <span className="ml-2 text-sm text-gray-500">
                        (HTTP {log.statusCode})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Severità</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(log.severity)}`}>
                    {log.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-medium">{log.category}</p>
                </div>
              </div>
            </div>

            {/* Informazioni Utente */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Informazioni Utente</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Utente</p>
                    <p className="font-medium">
                      {log.user?.fullName || log.userEmail || 'Sistema'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {log.user?.email || log.userEmail || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ruolo</p>
                    <p className="font-medium">
                      {log.user?.role || log.userRole || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IP Address</p>
                    <p className="font-medium font-mono text-sm">{log.ipAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dettagli Tecnici */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Dettagli Tecnici</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  {log.endpoint && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Endpoint</p>
                      <p className="font-medium font-mono text-sm">
                        {log.method} {log.endpoint}
                      </p>
                    </div>
                  )}
                  {log.responseTime && (
                    <div>
                      <p className="text-sm text-gray-500">Tempo di Risposta</p>
                      <p className="font-medium">{log.responseTime}ms</p>
                    </div>
                  )}
                  {log.requestId && (
                    <div>
                      <p className="text-sm text-gray-500">Request ID</p>
                      <p className="font-medium font-mono text-xs">{log.requestId}</p>
                    </div>
                  )}
                  {log.sessionId && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Session ID</p>
                      <p className="font-medium font-mono text-xs">{log.sessionId}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">User Agent</p>
                    <p className="font-mono text-xs">{log.userAgent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Errore (se presente) */}
            {log.errorMessage && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dettagli Errore</h4>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm text-red-800">{log.errorMessage}</p>
                </div>
              </div>
            )}

            {/* Dati Modificati */}
            {(log.oldValues || log.newValues || log.changes) && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dati Modificati</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {log.changes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Modifiche</p>
                      <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.oldValues && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Valori Precedenti</p>
                      <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                        {JSON.stringify(log.oldValues, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.newValues && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Nuovi Valori</p>
                      <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                        {JSON.stringify(log.newValues, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Metadata Aggiuntivi</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
