import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ShieldCheckIcon, ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SecurityEvent {
  id: string;
  type: 'login_failed' | 'suspicious_activity' | 'rate_limit' | 'new_device' | 'unusual_location' | 'permission_denied' | 'critical_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: string;
  resolved?: boolean;
}

interface SecurityStats {
  overall: 'secure' | 'warning' | 'critical';
  failedLogins24h: number;
  failedLoginsLastHour: number;
  suspiciousActivities: number;
  criticalEvents: number;
  newDevices: number;
  blockedIps: number;
  rateLimitHits: number;
  lastIncident?: string;
  events: SecurityEvent[];
}

const SecurityStatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Polling ogni 60 secondi per lo stato di sicurezza
  const { data: securityData, isLoading } = useQuery<SecurityStats>({
    queryKey: ['security-status'],
    queryFn: async () => {
      const response = await api.get('/security/status');
      return response.data.data;
    },
    refetchInterval: 60000, // Aggiorna ogni 60 secondi
    retry: 1,
  });

  // Determina il colore e l'icona dello scudo
  const getSecurityStatus = () => {
    const status = securityData?.overall || 'critical';
    
    switch (status) {
      case 'secure':
        return {
          icon: <ShieldCheckIcon className="h-5 w-5 text-green-500" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: 'Sicuro'
        };
      case 'warning':
        return {
          icon: <ShieldExclamationIcon className="h-5 w-5 text-yellow-500" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          label: 'Attenzione'
        };
      case 'critical':
        return {
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: 'Critico'
        };
      default:
        return {
          icon: <ShieldCheckIcon className="h-5 w-5 text-gray-500" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          label: 'Sconosciuto'
        };
    }
  };

  // Icona per tipo di evento
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_failed':
        return '🔒';
      case 'suspicious_activity':
        return '⚠️';
      case 'rate_limit':
        return '🚫';
      case 'new_device':
        return '📱';
      case 'unusual_location':
        return '🌍';
      case 'permission_denied':
        return '🛑';
      case 'critical_action':
        return '🔴';
      default:
        return '📋';
    }
  };

  // Colore per severità
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Formatta timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ore fa`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} giorni fa`;
  };

  if (isLoading) {
    return (
      <div className="relative">
        <ShieldCheckIcon className="h-5 w-5 text-gray-400 animate-pulse" />
      </div>
    );
  }

  const statusInfo = getSecurityStatus();
  const events = securityData?.events || [];
  const criticalCount = securityData?.criticalEvents || 0;

  return (
    <div className="relative">
      {/* Icona scudo principale */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center"
        title="Stato Sicurezza"
      >
        {statusInfo.icon}
        
        {/* Badge con numero eventi critici */}
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {criticalCount}
          </span>
        )}
      </button>

      {/* Pannello dettagli sicurezza */}
      {isOpen && (
        <>
          {/* Overlay per chiudere cliccando fuori */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Pannello */}
          <div className="absolute right-0 top-8 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Centro Sicurezza
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              {/* Statistiche rapide */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {securityData?.failedLoginsLastHour || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Login falliti (1h)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {securityData?.suspiciousActivities || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Attività sospette
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {securityData?.blockedIps || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    IP bloccati
                  </div>
                </div>
              </div>
            </div>

            {/* Eventi recenti */}
            <div className="max-h-96 overflow-y-auto">
              <div className="px-4 py-2">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Eventi Recenti
                </h4>
                
                {events.length > 0 ? (
                  <div className="space-y-2">
                    {events.slice(0, 10).map((event) => (
                      <div 
                        key={event.id}
                        className="p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <span className="text-base">{getEventIcon(event.type)}</span>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                {event.message}
                              </p>
                              {event.userEmail && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {event.userEmail}
                                </p>
                              )}
                              {event.ipAddress && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  IP: {event.ipAddress}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTime(event.timestamp)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                    ✅ Nessun evento di sicurezza recente
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-500 dark:text-gray-400">
                  {securityData?.failedLogins24h || 0} login falliti (24h)
                </div>
                <button
                  onClick={() => window.location.href = '/admin/audit'}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Vedi tutti →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SecurityStatusIndicator;
