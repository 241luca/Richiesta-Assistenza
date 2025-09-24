import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';
import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppManager() {
  const [activeTab, setActiveTab] = useState('status');
  const [qrCode, setQrCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [messageForm, setMessageForm] = useState({
    phoneNumber: '',
    message: '',
    mediaUrl: ''
  });
  const [broadcastForm, setBroadcastForm] = useState({
    phoneNumbers: '',
    message: '',
    mediaUrl: ''
  });
  
  const queryClient = useQueryClient();

  // Query per lo stato WhatsApp
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.get('/whatsapp/status'),
    refetchInterval: 10000 // Aggiorna ogni 10 secondi
  });

  // Query per le statistiche
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: () => api.get('/whatsapp/stats'),
    enabled: activeTab === 'stats'
  });

  // Mutation per inizializzare WhatsApp
  const initializeMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/initialize'),
    onSuccess: () => {
      toast.success('WhatsApp inizializzato con successo!');
      refetchStatus();
    },
    onError: (error) => {
      toast.error('Errore inizializzazione WhatsApp');
      console.error(error);
    }
  });

  // Mutation per ottenere QR Code
  const getQRMutation = useMutation({
    mutationFn: () => api.get('/whatsapp/qrcode'),
    onSuccess: (data) => {
      setQrCode(data.qrcode);
      setShowQR(true);
      toast.success('QR Code generato!');
    },
    onError: (error) => {
      toast.error('Errore generazione QR Code');
      console.error(error);
    }
  });

  // Mutation per inviare messaggio
  const sendMessageMutation = useMutation({
    mutationFn: (data) => api.post('/whatsapp/send', data),
    onSuccess: () => {
      toast.success('Messaggio inviato con successo!');
      setMessageForm({ phoneNumber: '', message: '', mediaUrl: '' });
    },
    onError: (error) => {
      toast.error('Errore invio messaggio');
      console.error(error);
    }
  });

  // Mutation per broadcast
  const broadcastMutation = useMutation({
    mutationFn: (data) => api.post('/whatsapp/broadcast', data),
    onSuccess: (data) => {
      toast.success(`Broadcast completato: ${data.sent.length} inviati, ${data.failed.length} falliti`);
      setBroadcastForm({ phoneNumbers: '', message: '', mediaUrl: '' });
    },
    onError: (error) => {
      toast.error('Errore broadcast');
      console.error(error);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessageMutation.mutate(messageForm);
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    const phoneNumbers = broadcastForm.phoneNumbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n);
    
    broadcastMutation.mutate({
      phoneNumbers,
      message: broadcastForm.message,
      mediaUrl: broadcastForm.mediaUrl
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <PhoneIcon className="h-8 w-8 text-green-500 mr-3" />
          WhatsApp Manager
        </h2>
        
        <div className="flex items-center space-x-4">
          {status?.connected ? (
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Connesso
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <XCircleIcon className="h-5 w-5 mr-2" />
              Disconnesso
            </span>
          )}
          
          <button
            onClick={() => refetchStatus()}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Aggiorna stato"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stato Connessione
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Invia Messaggio
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'broadcast'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Broadcast
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Statistiche
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'status' && (
          <div className="space-y-6">
            {!status?.connected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  WhatsApp non connesso
                </h3>
                <p className="text-yellow-700 mb-4">
                  Per utilizzare WhatsApp, devi prima connettere il tuo account.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => initializeMutation.mutate()}
                    disabled={initializeMutation.isPending}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {initializeMutation.isPending ? 'Inizializzazione...' : 'Inizializza WhatsApp'}
                  </button>
                  <button
                    onClick={() => getQRMutation.mutate()}
                    disabled={getQRMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <QrCodeIcon className="h-5 w-5 mr-2" />
                    {getQRMutation.isPending ? 'Generazione...' : 'Mostra QR Code'}
                  </button>
                </div>
              </div>
            )}

            {showQR && qrCode && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Scansiona il QR Code con WhatsApp
                </h3>
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="max-w-sm" />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Apri WhatsApp sul tuo telefono → Impostazioni → Dispositivi collegati → Collega un dispositivo
                </p>
              </div>
            )}

            {status?.connected && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  WhatsApp Connesso
                </h3>
                <div className="space-y-2 text-green-700">
                  <p>Instance ID: {status.instanceId}</p>
                  <p>Stato: Attivo e funzionante</p>
                  <p>Webhook: {status.webhookEnabled ? 'Configurato' : 'Non configurato'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'send' && (
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero di telefono (con prefisso internazionale)
              </label>
              <input
                type="text"
                value={messageForm.phoneNumber}
                onChange={(e) => setMessageForm({...messageForm, phoneNumber: e.target.value})}
                placeholder="Es: 393331234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messaggio
              </label>
              <textarea
                value={messageForm.message}
                onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Media (opzionale)
              </label>
              <input
                type="url"
                value={messageForm.mediaUrl}
                onChange={(e) => setMessageForm({...messageForm, mediaUrl: e.target.value})}
                placeholder="https://esempio.com/immagine.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !status?.connected}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {sendMessageMutation.isPending ? 'Invio...' : 'Invia Messaggio'}
            </button>
          </form>
        )}

        {activeTab === 'broadcast' && (
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numeri di telefono (uno per riga)
              </label>
              <textarea
                value={broadcastForm.phoneNumbers}
                onChange={(e) => setBroadcastForm({...broadcastForm, phoneNumbers: e.target.value})}
                rows={6}
                placeholder="393331234567&#10;393339876543&#10;393335555555"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messaggio
              </label>
              <textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcastMutation.isPending || !status?.connected}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              {broadcastMutation.isPending ? 'Invio broadcast...' : 'Invia Broadcast'}
            </button>
          </form>
        )}

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Messaggi Oggi</h3>
              <p className="text-3xl font-bold text-green-600">{stats.messagestoday || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Utenti WhatsApp</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.whatsappUsers || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Richieste via WhatsApp</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.whatsappRequests || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
