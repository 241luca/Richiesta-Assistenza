import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  PhoneIcon, 
  QrCodeIcon, 
  ArrowPathIcon,
  PaperAirplaneIcon,
  WifiIcon,
  PowerIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function WhatsAppDashboard() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'send' | 'messages' | 'contacts'>('status');

  // Query per stato WhatsApp
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data?.data;
    },
    refetchInterval: 10000 // Aggiorna ogni 10 secondi
  });

  // Query per messaggi
  const { data: messages } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/messages');
      return response.data?.data || [];
    },
    enabled: activeTab === 'messages'
  });

  // Mutation per inizializzare
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/initialize');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Inizializzazione WhatsApp avviata');
      setTimeout(() => refetchStatus(), 3000);
    },
    onError: () => {
      toast.error('Errore nell\'inizializzazione');
    }
  });

  // Mutation per generare QR
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/whatsapp/qrcode');
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.connected) {
  toast('WhatsApp già connesso');
      } else if (data?.data?.qrCode) {
        toast.success('QR Code generato!');
      }
      refetchStatus();
    },
    onError: () => {
      toast.error('Errore generazione QR Code');
    }
  });

  // Mutation per inviare messaggio
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipient: string; message: string }) => {
      const response = await api.post('/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Messaggio inviato con successo!');
      setMessage('');
      setRecipient('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Errore invio messaggio';
      toast.error(errorMsg);
    }
  });

  // Mutation per disconnettere
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/disconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('WhatsApp disconnesso');
      refetchStatus();
    },
    onError: () => {
      toast.error('Errore disconnessione');
    }
  });

  // Mutation per riconnettere
  const reconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/reconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Riconnessione avviata');
      setTimeout(() => refetchStatus(), 5000);
    },
    onError: () => {
      toast.error('Errore riconnessione');
    }
  });

  const handleSendMessage = () => {
    if (!recipient || !message) {
      toast.error('Inserisci destinatario e messaggio');
      return;
    }
    sendMessageMutation.mutate({ recipient, message });
  };

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    if (status.connected) return 'text-green-600';
    if (status.status === 'connecting') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (!status) return 'Sconosciuto';
    if (status.connected) return 'Connesso';
    if (status.status === 'connecting') return 'Connessione in corso...';
    return 'Disconnesso';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <PhoneIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
                <p className="text-gray-600">Sistema di messaggistica integrato</p>
              </div>
            </div>
            
            <button
              onClick={() => refetchStatus()}
              disabled={statusLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <ArrowPathIcon className={`h-5 w-5 ${statusLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <WifiIcon className="h-5 w-5 inline mr-2" />
                Stato Connessione
              </button>
              
              <button
                onClick={() => setActiveTab('send')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'send'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
                Invia Messaggio
              </button>
              
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'messages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
                Messaggi ({status?.stats?.unreadMessages || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stato Connessione */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Stato Connessione
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Stato:</span>
                  <span className={`font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
                
                {status?.phoneNumber && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Numero:</span>
                    <span className="font-medium">{status.phoneNumber}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Messaggi Totali:</span>
                  <span className="font-medium">{status?.stats?.totalMessages || 0}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Messaggi Oggi:</span>
                  <span className="font-medium">{status?.stats?.todayMessages || 0}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Non Letti:</span>
                  <span className="font-medium text-blue-600">
                    {status?.stats?.unreadMessages || 0}
                  </span>
                </div>
              </div>

              {/* Azioni */}
              <div className="mt-6 space-y-2">
                {!status?.connected && (
                  <>
                    {!status?.qrCode ? (
                      <button
                        onClick={() => initializeMutation.mutate()}
                        disabled={initializeMutation.isPending}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {initializeMutation.isPending ? 'Inizializzazione...' : 'Inizializza WhatsApp'}
                      </button>
                    ) : (
                      <button
                        onClick={() => generateQRMutation.mutate()}
                        disabled={generateQRMutation.isPending}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        <QrCodeIcon className="h-5 w-5 inline mr-2" />
                        {generateQRMutation.isPending ? 'Generazione...' : 'Rigenera QR Code'}
                      </button>
                    )}
                  </>
                )}
                
                {status?.connected && (
                  <>
                    <button
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                    >
                      <PowerIcon className="h-5 w-5 inline mr-2" />
                      {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
                    </button>
                    
                    <button
                      onClick={() => reconnectMutation.mutate()}
                      disabled={reconnectMutation.isPending}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                    >
                      <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                      {reconnectMutation.isPending ? 'Riconnessione...' : 'Riconnetti'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* QR Code o Stato */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {status?.qrCode ? (
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Scansiona il QR Code
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <img 
                      src={status.qrCode} 
                      alt="QR Code" 
                      className="mx-auto max-w-full"
                      style={{ maxWidth: '256px' }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Apri WhatsApp sul tuo telefono e scansiona questo codice
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Impostazioni → Dispositivi collegati → Collega un dispositivo
                  </div>
                </div>
              ) : status?.connected ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    WhatsApp Connesso
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Il sistema è connesso e pronto per inviare messaggi
                  </p>
                  {status.phoneNumber && (
                    <p className="mt-2 text-sm text-gray-500">
                      Numero: {status.phoneNumber}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    WhatsApp Non Connesso
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Clicca su "Inizializza WhatsApp" per iniziare
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invia Messaggio
            </h2>
            
            {status?.connected ? (
              <div className="max-w-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero Destinatario
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="es: 393331234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Inserisci il numero con prefisso internazionale senza +
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      placeholder="Scrivi il tuo messaggio..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {message.length}/4096 caratteri
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !recipient || !message}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                        Invia Messaggio
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  WhatsApp deve essere connesso per inviare messaggi
                </p>
                <button
                  onClick={() => setActiveTab('status')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Vai a Stato Connessione
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Messaggi Recenti
            </h2>
            
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.direction === 'incoming' 
                        ? 'bg-gray-50 border-l-4 border-blue-500' 
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {msg.phoneNumber}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            msg.direction === 'incoming'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {msg.direction === 'incoming' ? 'Ricevuto' : 'Inviato'}
                          </span>
                          {msg.status === 'UNREAD' && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Non letto
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 inline mr-1" />
                        {new Date(msg.timestamp).toLocaleString('it-IT')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nessun messaggio disponibile
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
