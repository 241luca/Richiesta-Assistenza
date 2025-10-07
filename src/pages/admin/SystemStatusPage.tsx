import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

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
  systemStats?: {
    cpu: {
      model: string;
      cores: number;
      usage: number;
      loadAvg: number[];
    };
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    os: {
      platform: string;
      type: string;
      release: string;
      hostname: string;
      uptime: number;
    };
  };
  timestamp: string;
}

const SystemStatusPage: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query stato sistema con auto-refresh
  const { data: health, isLoading, refetch } = useQuery<SystemHealth>({
    queryKey: ['system-health-detailed'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/status');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 1,
  });

  // Ottieni icona per servizio
  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database':
      case 'postgresql':
        return <CircleStackIcon className="h-8 w-8" />;
      case 'redis':
        return <ServerIcon className="h-8 w-8" />;
      case 'websocket':
      case 'socket.io':
        return <CpuChipIcon className="h-8 w-8" />;
      default:
        return <ServerIcon className="h-8 w-8" />;
    }
  };

  // Ottieni colore stato
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'offline':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Ottieni icona stato
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'offline':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Formatta bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatta uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}g ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Ottieni dettagli specifici per servizio
  const getServiceDetails = (service: ServiceStatus) => {
    const name = service.name.toLowerCase();
    
    if (name.includes('postgresql') || name.includes('database')) {
      return [
        { label: 'Tipo', value: 'PostgreSQL' },
        { label: 'Pool', value: '2-20 connessioni' },
        { label: 'Performance', value: service.latency && service.latency < 50 ? 'Eccellente' : service.latency && service.latency < 200 ? 'Buona' : 'Lenta' },
        { label: 'Stato', value: service.status === 'online' ? 'Attivo' : 'Offline' },
      ];
    }
    
    if (name.includes('redis')) {
      return [
        { label: 'Tipo', value: 'Cache Redis' },
        { label: 'Versione', value: 'ioredis' },
        { label: 'Uso', value: 'Session + Cache' },
        { label: 'TTL Default', value: '5 minuti' },
      ];
    }
    
    if (name.includes('websocket') || name.includes('socket')) {
      return [
        { label: 'Tipo', value: 'Socket.io' },
        { label: 'Versione', value: 'v4.8+' },
        { label: 'Client', value: service.message?.match(/\d+/)?.[0] || '0' },
        { label: 'Clustering', value: 'Attivo' },
      ];
    }
    
    if (name.includes('email')) {
      return [
        { label: 'Provider', value: 'Brevo' },
        { label: 'Tipo', value: 'SMTP + API' },
        { label: 'Rate Limit', value: '300/giorno' },
        { label: 'Templates', value: '20+' },
      ];
    }
    
    if (name.includes('whatsapp')) {
      return [
        { label: 'Tipo', value: 'WppConnect' },
        { label: 'Versione', value: 'v1.37+' },
        { label: 'Multidevice', value: 'Supportato' },
        { label: 'QR Refresh', value: '30s' },
      ];
    }
    
    if (name.includes('openai') || name.includes('ai')) {
      return [
        { label: 'Modello', value: 'GPT-4/3.5' },
        { label: 'Dual Config', value: 'Pro + Client' },
        { label: 'Embeddings', value: 'text-embed-3' },
        { label: 'Rate Limit', value: '100 req/day' },
      ];
    }
    
    if (name.includes('stripe')) {
      return [
        { label: 'Tipo', value: 'Payment Gateway' },
        { label: 'Webhook', value: 'Configurato' },
        { label: 'API Version', value: 'Latest' },
        { label: 'SCA', value: '3D Secure' },
      ];
    }
    
    if (name.includes('google maps')) {
      return [
        { label: 'API', value: 'Maps Platform' },
        { label: 'Servizi', value: 'Places + Geocoding' },
        { label: 'Cache', value: '24h Redis' },
        { label: 'Quota', value: '$200/mese' },
      ];
    }
    
    if (name.includes('google calendar')) {
      return [
        { label: 'API', value: 'Calendar v3' },
        { label: 'OAuth', value: 'Configurato' },
        { label: 'Sync', value: 'Bidirezionale' },
        { label: 'Events', value: 'Illimitati' },
      ];
    }
    
    return null;
  };
  
  // Ottieni descrizione servizio
  const getServiceDescription = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    
    if (name.includes('postgresql') || name.includes('database')) {
      return 'Database relazionale principale che memorizza tutti i dati dell\'applicazione. Monitora latenza query e connessioni attive.';
    }
    
    if (name.includes('redis')) {
      return 'Sistema di cache in-memory per sessioni utente e dati frequenti. Migliora le performance riducendo query al database.';
    }
    
    if (name.includes('websocket') || name.includes('socket')) {
      return 'Server WebSocket per comunicazioni real-time tra client e server. Gestisce notifiche push, chat e aggiornamenti live.';
    }
    
    if (name.includes('email')) {
      return 'Servizio email transazionale Brevo per invio automatico di notifiche, conferme e comunicazioni agli utenti.';
    }
    
    if (name.includes('whatsapp')) {
      return 'Integrazione WhatsApp con WppConnect per messaggistica business. Supporta invio messaggi, media e gestione gruppi.';
    }
    
    if (name.includes('openai') || name.includes('ai')) {
      return 'Intelligenza artificiale OpenAI per suggerimenti smart, categorizzazione automatica e assistenza conversazionale.';
    }
    
    if (name.includes('stripe')) {
      return 'Gateway di pagamento Stripe per processare transazioni sicure. Gestisce carte di credito, SEPA e metodi alternativi.';
    }
    
    if (name.includes('google maps')) {
      return 'API Google Maps per geocoding, calcolo distanze e visualizzazione mappe. Include Places API per autocompletamento indirizzi.';
    }
    
    if (name.includes('google calendar')) {
      return 'Integrazione Google Calendar per sincronizzazione appuntamenti e gestione disponibilitÃ  professionisti.';
    }
    
    return 'Servizio di sistema monitorato per garantire il corretto funzionamento dell\'applicazione.';
  };

  const overallStatus = health?.overall || 'critical';
  const services = health?.services || [];
  const stats = health?.systemStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stato Sistema
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitoraggio in tempo reale di tutti i servizi
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Auto-refresh (30s)</span>
            </label>
            
            {/* Refresh manuale */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          overallStatus === 'healthy' 
            ? 'bg-green-50 border-green-200' 
            : overallStatus === 'degraded'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {overallStatus === 'healthy' ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            ) : overallStatus === 'degraded' ? (
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                overallStatus === 'healthy' 
                  ? 'text-green-900' 
                  : overallStatus === 'degraded'
                  ? 'text-yellow-900'
                  : 'text-red-900'
              }`}>
                {overallStatus === 'healthy' ? 'Sistema Operativo' : 
                 overallStatus === 'degraded' ? 'Sistema Degradato' : 'Sistema Critico'}
              </h3>
              <p className={`text-sm ${
                overallStatus === 'healthy' 
                  ? 'text-green-700' 
                  : overallStatus === 'degraded'
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {services.filter(s => s.status === 'online').length} di {services.length} servizi online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche Sistema */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">CPU</h3>
              <CpuChipIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Modello:</span>
                <span className="font-medium text-gray-900 truncate ml-2" title={stats.cpu.model}>
                  {stats.cpu.model.substring(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Core:</span>
                <span className="font-medium text-gray-900">{stats.cpu.cores}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Utilizzo:</span>
                <span className="font-medium text-gray-900">{stats.cpu.usage}%</span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.cpu.usage > 80 ? 'bg-red-500' : 
                      stats.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.cpu.usage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Memoria */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Memoria</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Totale:</span>
                <span className="font-medium text-gray-900">{formatBytes(stats.memory.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usata:</span>
                <span className="font-medium text-gray-900">{formatBytes(stats.memory.used)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Libera:</span>
                <span className="font-medium text-gray-900">{formatBytes(stats.memory.free)}</span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.memory.percentage > 80 ? 'bg-red-500' : 
                      stats.memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${stats.memory.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Sistema</h3>
              <ServerIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">OS:</span>
                <span className="font-medium text-gray-900">{stats.os.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Versione:</span>
                <span className="font-medium text-gray-900">{stats.os.release}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hostname:</span>
                <span className="font-medium text-gray-900">{stats.os.hostname}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium text-gray-900">{formatUptime(stats.os.uptime)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista Servizi */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Servizi Monitorati ({services.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {services.map((service, index) => {
            // Dettagli aggiuntivi per ogni servizio
            const serviceDetails = getServiceDetails(service);
            
            return (
            <div 
              key={index}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    service.status === 'online' ? 'bg-green-100' :
                    service.status === 'warning' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    {getServiceIcon(service.name)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.name}
                          </h3>
                          {service.latency !== undefined && (
                            <span className={`text-sm px-2 py-1 rounded ${
                              service.latency < 50 ? 'bg-green-100 text-green-800' :
                              service.latency < 200 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {service.latency}ms
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.message || 'Nessun messaggio'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <span className="text-sm font-medium capitalize">
                          {service.status === 'online' ? 'Online' :
                           service.status === 'warning' ? 'Warning' :
                           'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Dettagli aggiuntivi del servizio */}
                    {serviceDetails && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {serviceDetails.map((detail, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {detail.label}
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">
                              {detail.value}
                            </dd>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Descrizione servizio */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">
                        {getServiceDescription(service.name)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );})}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Ultimo aggiornamento: {new Date(health?.timestamp || Date.now()).toLocaleString('it-IT')}
        </p>
      </div>
    </div>
  );
};

export default SystemStatusPage;
