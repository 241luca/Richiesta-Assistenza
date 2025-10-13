/**
 * WhatsApp WPPConnect Manager - Gestione completa
 * Interfaccia completa per gestione istanza WPPConnect
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
  DevicePhoneMobileIcon,
  ServerIcon,
  ClockIcon,
  WifiIcon,
  KeyIcon,
  CogIcon,
  DocumentTextIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

interface WhatsAppStatus {
  connected: boolean;
  provider: string;
  message: string;
  qrCode?: string;
  instanceName?: string;
  instance?: {
    name: string;
    status: string;
    phoneNumber?: string;
    profileName?: string;
    profilePicture?: string;
  };
  systemInfo?: any;
}

interface WhatsAppStats {
  totalMessages: number;
  todayMessages: number;
  connectedSince?: string;
  provider: string;
}

const WhatsAppWPPManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'qrcode' | 'send' | 'info'>('status');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const queryClient = useQueryClient();

  // Query status con più dettagli
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      const data = response.data.data;
      
      // Se c'è un QR code, mostralo automaticamente
      if (data.qrCode && !data.connected) {
        setShowQRCode(true);
      }
      
      return {
        ...data,
        instance: {
          name: data.instanceName,
          status: data.connected ? 'CONNECTED' : 'DISCONNECTED',
          phoneNumber: data.phoneNumber,
          profileName: data.profileName,
          profilePicture: data.profilePicture
        }
      };
    },
    refetchInterval: 5000 // Ogni 5 secondi
  });
  
  // Query per info sistema REALI
  const { data: systemInfo } = useQuery({
    queryKey: ['whatsapp', 'system-info'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/system-info');
      return response.data.data;
    },
    refetchInterval: 60000 // Ogni minuto
  });
  
  // Query stats dettagliate
  const { data: detailedStats } = useQuery({
    queryKey: ['whatsapp', 'detailed-stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/detailed-stats');
      return response.data.data;
    },
    refetchInterval: 30000 // Ogni 30 secondi
  });

  // Query stats
  const { data: stats } = useQuery<WhatsAppStats>({
    queryKey: ['whatsapp', 'stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data.data;
    },
    refetchInterval: 30000 // Ogni 30 secondi
  });

  // Query QR Code
  const { data: qrData, refetch: refetchQR, isFetching: qrLoading } = useQuery({
    queryKey: ['whatsapp', 'qr'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/qrcode');
      return response.data.data;
    },
    enabled: showQRCode && !status?.connected,
    refetchInterval: 3000, // Aggiorna QR ogni 3 secondi
    retry: 2
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
      setShowQRCode(false);
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
      toast.success('Riconnessione in corso...');
      refetchStatus();
      setShowQRCode(true);
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

  // Mutation per inizializzare WhatsApp e generare QR
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/initialize');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data?.qrCode) {
        setShowQRCode(true);
        toast.success('QR Code generato!');
      } else {
  toast('Inizializzazione in corso...');
      }
      refetchStatus();
      refetchQR();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore generazione QR');
    }
  });

  const handleGenerateQR = () => {
    if (status?.connected) {
      toast.error('WhatsApp già connesso');
      return;
    }
    // Usa initialize invece di solo mostrare QR
    initializeMutation.mutate();
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

  // Render tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('status')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'status'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <WifiIcon className="h-5 w-5 inline mr-2" />
          Stato Connessione
        </button>
        
        <button
          onClick={() => setActiveTab('qrcode')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'qrcode'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <QrCodeIcon className="h-5 w-5 inline mr-2" />
          QR Code
        </button>
        
        <button
          onClick={() => setActiveTab('send')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'send'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
          Invia Messaggio
        </button>
        
        <button
          onClick={() => setActiveTab('info')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'info'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <InformationCircleIcon className="h-5 w-5 inline mr-2" />
          Informazioni
        </button>
      </nav>
    </div>
  );

  // Render status tab
  const renderStatusTab = () => (
    <div className="space-y-6">
      {/* Instance Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-gray-600" />
          Stato Istanza
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Nome Istanza:</span>
            <span className="font-medium">{status?.instance?.name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Stato:</span>
            <div className="flex items-center">
              {status?.connected ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-1 text-green-500" />
                  <span className="text-green-600 font-medium">Connesso</span>
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 mr-1 text-red-500" />
                  <span className="text-red-600 font-medium">Disconnesso</span>
                </>
              )}
            </div>
          </div>
          
          {status?.instance?.phoneNumber && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Numero Telefono:</span>
              <span className="font-medium">{status.instance.phoneNumber}</span>
            </div>
          )}
          
          {status?.instance?.profileName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nome Profilo:</span>
              <span className="font-medium">{status.instance.profileName}</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex gap-3">
          {!status?.connected ? (
            <button
              onClick={handleGenerateQR}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              Genera QR Code
            </button>
          ) : (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="flex-1 btn-danger flex items-center justify-center"
            >
              <PowerIcon className="h-5 w-5 mr-2" />
              {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
            </button>
          )}
          
          <button
            onClick={() => reconnectMutation.mutate()}
            disabled={reconnectMutation.isPending}
            className="flex-1 btn-secondary flex items-center justify-center"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${reconnectMutation.isPending ? 'animate-spin' : ''}`} />
            {reconnectMutation.isPending ? 'Riconnessione...' : 'Riconnetti'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-600" />
            Statistiche
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Messaggi Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Messaggi Oggi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
            </div>
            
            {stats.connectedSince && (
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <p className="text-sm text-gray-600">Connesso da</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(stats.connectedSince).toLocaleString('it-IT')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render QR Code tab
  const renderQRCodeTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <QrCodeIcon className="h-5 w-5 mr-2 text-gray-600" />
          Gestione QR Code
        </h3>
        
        {status?.connected ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">WhatsApp già connesso</p>
            <p className="text-gray-600 mt-2">
              La sessione è attiva con il numero {status.instance?.phoneNumber}
            </p>
          </div>
        ) : (
          <div className="text-center">
            {(showQRCode && qrData?.qrCode) || status?.qrCode ? (
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
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500">
                    Il QR Code si aggiorna automaticamente ogni 3 secondi
                  </p>
                  {qrLoading && (
                    <p className="text-xs text-blue-600 animate-pulse">
                      Aggiornamento QR Code...
                    </p>
                  )}
                </div>
                <button
                  onClick={() => refetchQR()}
                  className="mt-4 btn-secondary"
                >
                  <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                  Aggiorna Manualmente
                </button>
              </>
            ) : (
              <div className="py-12">
                <ExclamationCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">QR Code non disponibile</p>
                <p className="text-gray-600 mt-2">
                  Clicca il pulsante per generare un nuovo QR Code
                </p>
                <button
                  onClick={handleGenerateQR}
                  className="mt-4 btn-primary"
                >
                  <QrCodeIcon className="h-5 w-5 inline mr-2" />
                  Genera QR Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render send message tab
  const renderSendTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <PaperAirplaneIcon className="h-5 w-5 mr-2 text-gray-600" />
          Invia Messaggio
        </h3>
        
        {!status?.connected ? (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-700">WhatsApp non connesso</p>
            <p className="text-sm text-gray-500 mt-2">
              Connetti WhatsApp prima di inviare messaggi
            </p>
            <button
              onClick={() => setActiveTab('qrcode')}
              className="mt-4 btn-primary"
            >
              Vai a QR Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Numero Telefono
              </label>
              <div className="mt-1 relative">
                <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+393331234567"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>
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
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi il tuo messaggio..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                {message.length}/{systemInfo?.limits?.messageLength || 0} caratteri
              </p>
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
    </div>
  );

  // Render info tab
  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* Version Info REALI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
          Informazioni Sistema
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Provider:</span>
            <span className={`font-medium ${systemInfo?.provider ? 'text-green-600' : 'font-bold'}`}>
              {systemInfo?.provider || 'NON DISPONIBILE'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Nome Sessione:</span>
            <span className={`font-medium ${systemInfo?.sessionName ? 'text-green-600' : 'font-bold'}`}>
              {systemInfo?.sessionName || 'NON DISPONIBILE'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Versione WPPConnect:</span>
            <span className={`font-medium ${systemInfo?.versions?.wppconnect && systemInfo.versions.wppconnect !== 'unknown' ? 'text-green-600' : 'font-bold'}`}>
              {systemInfo?.versions?.wppconnect || 'NON DISPONIBILE'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">WhatsApp Web:</span>
            <span className={`font-medium ${systemInfo?.versions?.whatsappWeb && systemInfo.versions.whatsappWeb !== 'unknown' ? 'text-green-600' : 'font-bold'}`}>
              {systemInfo?.versions?.whatsappWeb || 'NON DISPONIBILE'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Node.js:</span>
            <span className={`font-medium ${systemInfo?.versions?.node ? 'text-green-600' : 'font-bold'}`}>
              {systemInfo?.versions?.node || 'NON DISPONIBILE'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Multi-Device:</span>
            <span className={`font-medium ${status?.connected ? 'font-bold' : 'font-bold'}`}>
              {systemInfo?.versions?.multiDevice ? '✓ Attivo (HARDCODED)' : '✗ Non attivo'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Auto-Reconnect:</span>
            <span className={`font-medium ${status?.connected ? 'font-bold' : 'font-bold'}`}>
              {systemInfo?.features?.autoReconnect ? '✓ Attivo (HARDCODED)' : '✗ Non attivo (DEFAULT)'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Session Persistence:</span>
            <span className={`font-medium ${status?.connected ? 'font-bold' : 'font-bold'}`}>
              {systemInfo?.features?.sessionPersistence ? '✓ Attiva (HARDCODED)' : '✗ Non attiva (DEFAULT)'}
            </span>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-4 text-xs">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded-full mr-1"></span>
              Dato Reale
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-gray-800 rounded-full mr-1"></span>
              <span className="font-bold">Hardcoded/Default</span>
            </span>
          </div>
        </div>
      </div>

      {/* Device Info REALI */}
      {systemInfo?.device && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-gray-600" />
            Dispositivo Connesso {systemInfo.device.phoneNumber ? '(DATI REALI)' : '(POTREBBE ESSERE VUOTO/FALSO)'}
          </h3>
          
          <div className="space-y-3">
            {systemInfo.device.phoneNumber && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Numero:</span>
                <span className="font-medium text-green-600">{systemInfo.device.phoneNumber}</span>
              </div>
            )}
            {systemInfo.device.platform && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Piattaforma:</span>
                <span className={`font-medium ${systemInfo.device.platform === 'unknown' ? 'font-bold' : 'text-green-600'}`}>
                  {systemInfo.device.platform} {systemInfo.device.platform === 'unknown' && '(DEFAULT)'}
                </span>
              </div>
            )}
            {systemInfo.device.pushname && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium text-green-600">{systemInfo.device.pushname}</span>
              </div>
            )}
            {systemInfo.device.battery !== null && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Batteria:</span>
                <span className="font-medium text-green-600">{systemInfo.device.battery}%</span>
              </div>
            )}
            
            {!systemInfo.device.phoneNumber && (
              <div className="text-red-600 text-sm font-bold">
                ⚠️ getHostDevice() potrebbe non funzionare in WPPConnect
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features REALI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2 text-gray-600" />
          Funzionalità {status?.connected ? '(QUANDO CONNESSO)' : '(DEFAULT QUANDO NON CONNESSO)'}
        </h3>
        
        <div className="space-y-2">
          {systemInfo?.features && Object.entries(systemInfo.features).map(([key, value]) => (
            <div key={key} className="flex items-center text-sm">
              {value ? (
                <CheckCircleIcon className={`h-4 w-4 mr-2 ${status?.connected ? 'text-green-500' : 'text-gray-400'}`} />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4 mr-2 text-red-500" />
              )}
              <span className={status?.connected && value ? 'text-green-700' : 'font-bold'}>
                {key} {!status?.connected && ' (DEFAULT)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Limiti REALI */}
      {systemInfo?.limits && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
            Limiti Sistema
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lunghezza Messaggio:</span>
              <span className={`font-medium ${systemInfo.limits.messageLength === 4096 ? 'font-bold' : 'text-green-600'}`}>
                {systemInfo.limits.messageLength} caratteri {systemInfo.limits.messageLength === 4096 ? '(HARDCODED)' : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dimensione Media:</span>
              <span className={`font-medium ${systemInfo.limits.mediaSize === 16777216 ? 'font-bold' : 'text-green-600'}`}>
                {(systemInfo.limits.mediaSize / (1024*1024)).toFixed(0)} MB {systemInfo.limits.mediaSize === 16777216 ? '(HARDCODED)' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche Dettagliate */}
      {detailedStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-600" />
            Statistiche Dettagliate
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Totali</p>
              <p className="text-lg font-bold">{detailedStats.messages?.total}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Inviati</p>
              <p className="text-lg font-bold">{detailedStats.messages?.sent}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Ricevuti</p>
              <p className="text-lg font-bold">{detailedStats.messages?.received}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Falliti</p>
              <p className="text-lg font-bold text-red-600">{detailedStats.messages?.failed}</p>
            </div>
          </div>
        </div>
      )}
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
                WhatsApp Manager - WPPConnect
              </h1>
              <p className="text-sm text-gray-600 font-bold">
                Sistema principale di messaggistica (TESTO HARDCODED)
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
              onClick={() => refetchStatus()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aggiorna stato"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Message */}
        {status?.message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{status.message}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        {renderTabs()}
        
        <div className="p-6">
          {activeTab === 'status' && renderStatusTab()}
          {activeTab === 'qrcode' && renderQRCodeTab()}
          {activeTab === 'send' && renderSendTab()}
          {activeTab === 'info' && renderInfoTab()}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppWPPManager;