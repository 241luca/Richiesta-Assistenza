import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  message?: string;
  latency?: number;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  timestamp: string;
}

const ServiceStatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Polling ogni 30 secondi per lo stato dei servizi
  const { data: health, isLoading } = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/status');
      return response.data.data;
    },
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    retry: 1,
  });

  // Determina il colore del pallino principale
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-500';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Icona per ogni servizio
  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database':
      case 'postgresql':
        return '🗄️';
      case 'redis':
        return '📡';
      case 'websocket':
      case 'socket.io':
        return '🔌';
      case 'email':
        return '📧';
      case 'whatsapp':
        return '💬';
      case 'openai':
      case 'ai':
        return '🤖';
      case 'stripe':
      case 'payment':
        return '💳';
      case 'google maps':
      case 'google calendar':
        return '🗺️';
      default:
        return '⚙️';
    }
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
    );
  }

  const overallStatus = health?.overall || 'critical';
  const services = health?.services || [];

  return (
    <div className="relative">
      {/* Pallino indicatore principale */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center"
        title="Stato Sistema"
      >
        <div className={`w-3 h-3 rounded-full ${getStatusColor(overallStatus)}`}>
          {overallStatus !== 'healthy' && (
            <div className={`absolute inset-0 rounded-full ${getStatusColor(overallStatus)} animate-ping`}></div>
          )}
        </div>
        
        {/* Badge con numero di servizi offline */}
        {services.filter(s => s.status === 'offline').length > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {services.filter(s => s.status === 'offline').length}
          </span>
        )}
      </button>

      {/* Pannello dettagli servizi */}
      {isOpen && (
        <>
          {/* Overlay per chiudere cliccando fuori */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Pannello */}
          <div className="absolute right-0 top-8 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Stato Servizi Sistema
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  overallStatus === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : overallStatus === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {overallStatus === 'healthy' ? 'Tutto OK' : 
                   overallStatus === 'degraded' ? 'Degradato' : 'Critico'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ultimo controllo: {new Date(health?.timestamp || Date.now()).toLocaleTimeString()}
              </p>
            </div>

            {/* Lista servizi */}
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                {services.length > 0 ? (
                  services.map((service, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getServiceIcon(service.name)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </span>
                            {service.latency && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {service.latency}ms
                              </span>
                            )}
                          </div>
                          {service.message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {service.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                        <span className={`ml-2 text-xs font-medium ${
                          service.status === 'online' 
                            ? 'text-green-600 dark:text-green-400' 
                            : service.status === 'warning'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {service.status === 'online' ? 'Online' : 
                           service.status === 'warning' ? 'Warning' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Caricamento stato servizi...
                  </div>
                )}
              </div>
            </div>

            {/* Footer con azioni */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => window.location.href = '/admin/system-status'}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Dettagli completi →
                </button>
                <button
                  onClick={() => {
                    // Forza refresh
                    window.location.reload();
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceStatusIndicator;
