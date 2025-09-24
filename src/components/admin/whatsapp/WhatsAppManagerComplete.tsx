/**
 * WhatsApp Manager Completo - WPPConnect
 * Gestione completa dell'istanza WhatsApp con tutte le funzionalità
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  PowerIcon,
  InformationCircleIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  ServerIcon,
  WifiIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  BoltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

interface WhatsAppStatus {
  connected: boolean;
  provider: string;
  message: string;
  qrCode?: string;
  instance?: {
    name: string;
    status: string;
    phoneNumber?: string;
    profileName?: string;
    profilePicture?: string;
  };
  device?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    waVersion?: string;
    battery?: number;
    plugged?: boolean;
  };
}

interface WhatsAppStats {
  totalMessages: number;
  todayMessages: number;
  connectedSince?: string;
  provider: string;
  sessionInfo?: {
    startTime?: string;
    uptime?: number;
    messagesHandled?: number;
  };
}

interface SystemInfo {
  wppconnect: {
    version: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  features: {
    multiDevice: boolean;
    businessMode: boolean;
    encryption: boolean;
    mediaSupport: boolean;
    groupSupport: boolean;
    statusSupport: boolean;
  };
}

const WhatsAppManagerComplete: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connection' | 'info' | 'qr' | 'send' | 'settings'>('connection');
  const [showQR, setShowQR] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [instanceName, setInstanceName] = useState('assistenza-wpp');
  const queryClient = useQueryClient();

  // Query status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data;
    },
    refetchInterval: 5000 // Ogni 5 secondi
  });

  // Query stats
  const { data: stats, refetch: refetchStats } = useQuery<WhatsAppStats>({
    queryKey: ['whatsapp', 'stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data.data;
    },
    refetchInterval: 30000 // Ogni 30 secondi
  });

  // Query system info (mock per ora)
  const { data: systemInfo } = useQuery<SystemInfo>({
    queryKey: ['whatsapp', 'system-info'],
    queryFn: async () => {
      // Mock data per ora, puoi implementare l'endpoint reale
      return {
        wppconnect: {
          version: '1.28.4',
          nodeVersion: process.version || 'v18.17.0',
          platform: 'linux',
          arch: 'x64',
          uptime: 125430,
          memoryUsage: {
            rss: 134217728,
            heapTotal: 83886080,
            heapUsed: 67108864
          }
        },
        features: {
          multiDevice: true,
          businessMode: true,
          encryption: true,
          mediaSupport: true,
          groupSupport: true,
          statusSupport: true
        }
      };
    },
    staleTime: 60000
  });

  // Query QR Code
  const { data: qrData, refetch: refetchQR, isFetching: qrLoading } = useQuery({
    queryKey: ['whatsapp', 'qr'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/qr');
      return response.data.data;
    },
    enabled: showQR && !status?.connected,
    refetchInterval: showQR && !status?.connected ? 2000 : false,
    retry: false
  });

  // Mutation disconnect
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/disconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('WhatsApp disconnesso');
      refetchStatus();
      setShowQR(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore disconnessione');
    }
  });

  // Mutation reconnect
  const reconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/reconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('WhatsApp riconnesso');
      refetchStatus();
      setShowQR(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore riconnessione');
    }
  });

  // Mutation send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await api.post('/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Messaggio inviato!');
      setPhoneNumber('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
    }
  });

  const handleShowQR = () => {
    if (status?.connected) {
      toast.error('WhatsApp già connesso');
      return;
    }
    setShowQR(true);
    refetchQR();
  };

  const handleSendMessage = () => {
    if (!phoneNumber || !message) {
      toast.error('Inserisci numero e messaggio');
      return;
    }
    if (!status?.connected) {
      toast.error('WhatsApp non connesso');
      return;
    }
    sendMessageMutation.mutate({ phoneNumber, message });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}g ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Tab Connection
  const renderConnectionTab = () => (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <WifiIcon className="h-5 w-5 mr-2 text-blue-600" />
          Stato Connessione
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Istanza:</span>
            <span className="font-medium">{instanceName}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Stato:</span>
            <div className="flex items-center">
              {statusLoading ? (
                <span className="text-gray-500">Verifica...</span>
              ) : status?.connected ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">Connesso</span>
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-600 font-medium">Disconnesso</span>
                </>
              )}
            </div>
          </div>

          {status?.instance?.phoneNumber && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Numero:</span>
              <span className="font-medium">{status.instance.phoneNumber}</span>
            </div>
          )}

          {status?.instance?.profileName && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium">{status.instance.profileName}</span>
            </div>
          )}

          {stats?.connectedSince && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connesso da:</span>
              <span className="font-medium">
                {new Date(stats.connectedSince).toLocaleString('it-IT')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!status?.connected ? (
            <>
              <button
                onClick={handleShowQR}
                className="btn-primary flex items-center"
              >
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Genera QR Code
              </button>
              <button
                onClick={() => reconnectMutation.mutate()}
                disabled={reconnectMutation.isPending}
                className="btn-secondary flex items-center"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${reconnectMutation.isPending ? 'animate-spin' : ''}`} />
                Connetti
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="btn-danger flex items-center"
              >
                <PowerIcon className="h-5 w-5 mr-2" />
                Disconnetti
              </button>
              <button
                onClick={() => {
                  refetchStatus();
                  refetchStats();
                }}
                className="btn-secondary flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Aggiorna
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Messaggi Totali</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Oggi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-xl font-bold text-gray-900">
                  {systemInfo?.wppconnect.uptime ? formatUptime(systemInfo.wppconnect.uptime) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Tab Info
  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* System Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-blue-600" />
          Informazioni Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">WPPConnect</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versione:</span>
                <span className="text-sm font-medium">{systemInfo?.wppconnect.version || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Node.js:</span>
                <span className="text-sm font-medium">{systemInfo?.wppconnect.nodeVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Piattaforma:</span>
                <span className="text-sm font-medium">
                  {systemInfo?.wppconnect.platform || 'N/A'} ({systemInfo?.wppconnect.arch || 'N/A'})
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Memoria</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RSS:</span>
                <span className="text-sm font-medium">
                  {systemInfo?.wppconnect.memoryUsage ? formatBytes(systemInfo.wppconnect.memoryUsage.rss) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heap Totale:</span>
                <span className="text-sm font-medium">
                  {systemInfo?.wppconnect.memoryUsage ? formatBytes(systemInfo.wppconnect.memoryUsage.heapTotal) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heap Usato:</span>
                <span className="text-sm font-medium">
                  {systemInfo?.wppconnect.memoryUsage ? formatBytes(systemInfo.wppconnect.memoryUsage.heapUsed) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BoltIcon className="h-5 w-5 mr-2 text-yellow-600" />
          Funzionalità Supportate
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {systemInfo?.features && Object.entries(systemInfo.features).map(([key, value]) => (
            <div key={key} className="flex items-center">
              {value ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Device Info */}
      {status?.device && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-green-600" />
            Informazioni Dispositivo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Produttore:</span>
                <span className="text-sm font-medium">{status.device.manufacturer || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Modello:</span>
                <span className="text-sm font-medium">{status.device.model || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">OS:</span>
                <span className="text-sm font-medium">{status.device.osVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">WhatsApp:</span>
                <span className="text-sm font-medium">{status.device.waVersion || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Tab QR Code
  const renderQRTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <QrCodeIcon className="h-5 w-5 mr-2 text-purple-600" />
        QR Code per Connessione
      </h3>
      
      {status?.connected ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <p className="text-lg font-medium text-gray-900">WhatsApp Già Connesso</p>
          <p className="text-gray-600 mt-2">
            La sessione è attiva con il numero {status.instance?.phoneNumber || 'N/A'}
          </p>
        </div>
      ) : (
        <div className="text-center">
          {qrData?.qrCode || status?.qrCode ? (
            <>
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                <img 
                  src={qrData?.qrCode || status?.qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Scansiona questo QR Code con WhatsApp per connettere il tuo account
              </p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => refetchQR()}
                  disabled={qrLoading}
                  className="btn-secondary"
                >
                  <ArrowPathIcon className={`h-5 w-5 inline mr-2 ${qrLoading ? 'animate-spin' : ''}`} />
                  Aggiorna QR
                </button>
              </div>
            </>
          ) : showQR ? (
            <div className="py-8">
              <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Generazione QR Code...</p>
            </div>
          ) : (
            <div className="py-8">
              <QrCodeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 mb-4">QR Code non disponibile</p>
              <button
                onClick={handleShowQR}
                className="btn-primary"
              >
                <QrCodeIcon className="h-5 w-5 inline mr-2" />
                Genera QR Code
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Tab Send Message
  const renderSendTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <PaperAirplaneIcon className="h-5 w-5 mr-2 text-blue-600" />
        Invia Messaggio
      </h3>
      
      {!status?.connected ? (
        <div className="text-center py-8">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <p className="text-gray-700">WhatsApp non connesso</p>
          <p className="text-sm text-gray-500 mt-2">
            Connetti WhatsApp prima di inviare messaggi
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Numero Telefono
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+393331234567"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Formato internazionale con prefisso (es: +39 per Italia)
            </p>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Messaggio
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi il tuo messaggio..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !phoneNumber || !message}
            className="w-full btn-primary flex items-center justify-center"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            {sendMessageMutation.isPending ? 'Invio...' : 'Invia Messaggio'}
          </button>
        </div>
      )}
    </div>
  );

  // Tab Settings
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2 text-gray-600" />
          Impostazioni Istanza
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700">
              Nome Istanza
            </label>
            <input
              type="text"
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">Opzioni</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Auto-reconnect su disconnessione</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Salva sessione (mantieni login)</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Multi-device attivo</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Modalità debug</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Le modifiche alle impostazioni richiederanno il riavvio della sessione WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                WhatsApp Manager
              </h1>
              <p className="text-sm text-gray-600">
                Gestione completa istanza WPPConnect
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Badge */}
            {statusLoading ? (
              <div className="flex items-center text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                <span>Verificando...</span>
              </div>
            ) : status?.connected ? (
              <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Connesso</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Non connesso</span>
              </div>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={() => {
                refetchStatus();
                refetchStats();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aggiorna stato"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('connection')}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === 'connection'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <WifiIcon className="h-5 w-5 inline mr-2" />
              Connessione
            </button>
            
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === 'info'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <InformationCircleIcon className="h-5 w-5 inline mr-2" />
              Informazioni
            </button>
            
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === 'qr'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCodeIcon className="h-5 w-5 inline mr-2" />
              QR Code
            </button>
            
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === 'send'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
              Invia
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Impostazioni
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'connection' && renderConnectionTab()}
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'qr' && renderQRTab()}
          {activeTab === 'send' && renderSendTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppManagerComplete;