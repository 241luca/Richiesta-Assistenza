import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  CogIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('status');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [instanceInfo, setInstanceInfo] = useState<any>(null);
  const queryClient = useQueryClient();

  // Verifica configurazione WhatsApp
  const { data: whatsappConfig, isLoading: configLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const response = await api.get('/admin/whatsapp/config');
      return response.data.data;
    }
  });

  // Stato WhatsApp
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data;
    },
    enabled: whatsappConfig?.isConfigured,
    refetchInterval: 5000
  });

  // Crea istanza
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/create-instance');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Istanza creata con successo!');
      if (data?.data?.instance_id) {
        setInstanceInfo(data.data);
      }
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error: any) => {
      toast.error('Errore creazione istanza: ' + (error.response?.data?.message || error.message));
    }
  });

  // Genera QR Code
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/whatsapp/qr-code');
      return response.data;
    },
    onSuccess: (data) => {
      console.log('QR Response completa:', data);
      
      // Proviamo a trovare il QR in diversi posti possibili
      let qrImage = null;
      
      // Caso 1: Il QR è in data.data.base64
      if (data?.data?.base64) {
        qrImage = data.data.base64;
        console.log('QR trovato in data.data.base64');
      }
      // Caso 2: Il QR è direttamente in data.base64
      else if (data?.base64) {
        qrImage = data.base64;
        console.log('QR trovato in data.base64');
      }
      // Caso 3: Il QR è in data.data (come stringa)
      else if (typeof data?.data === 'string' && data.data.includes('data:image')) {
        qrImage = data.data;
        console.log('QR trovato in data.data come stringa');
      }
      // Caso 4: Cerca in altri campi possibili
      else if (data?.data) {
        const possibleFields = ['qrcode', 'qr_code', 'image', 'url'];
        for (const field of possibleFields) {
          if (data.data[field]) {
            qrImage = data.data[field];
            console.log(`QR trovato in data.data.${field}`);
            break;
          }
        }
      }
      
      if (qrImage) {
        // Se il QR non inizia con 'data:image', aggiungi il prefisso
        if (!qrImage.startsWith('data:image')) {
          qrImage = `data:image/png;base64,${qrImage}`;
        }
        
        setQrCodeImage(qrImage);
        setShowQR(true);
        toast.success('QR Code generato! Scansiona con WhatsApp');
        
        // Log dell'URL usato per debugging
        console.log('=== QR CODE GENERATO ===');
        console.log('Instance ID:', status?.instanceId);
        console.log('Access Token:', status?.accessToken || '********');
        console.log('URL API:', `https://app.sendapp.cloud/api/get_qrcode?instance_id=${status?.instanceId}&access_token=${status?.accessToken || '********'}`);
        console.log('========================');
      } else {
        console.error('QR non trovato nella risposta. Struttura ricevuta:', data);
        toast.error('QR Code non trovato nella risposta del server. Controlla i log del backend.');
      }
    },
    onError: (error: any) => {
      console.error('Errore completo:', error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error('Errore generazione QR: ' + errorMessage);
      
      // Se l'errore contiene dettagli JSON, proviamo a mostrarli
      try {
        const errorData = JSON.parse(errorMessage);
        if (errorData.message) {
          toast.error('Dettaglio: ' + errorData.message);
        }
      } catch (e) {
        // Ignora se non è JSON
      }
    }
  });

  // Invia messaggio
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await api.post('/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Messaggio inviato con successo!');
    },
    onError: (error: any) => {
      toast.error('Errore invio: ' + (error.response?.data?.message || error.message));
    }
  });

  if (!configLoading && !whatsappConfig?.isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                WhatsApp Non Configurato
              </h2>
              <p className="text-gray-600 mb-6">
                Il token è già configurato nel database. Ora devi solo creare l'istanza.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <PhoneIcon className="h-8 w-8 mr-3 text-green-600" />
              Gestione WhatsApp
            </h1>
            
            {/* Info Box Configurazione */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Configurazione Attuale:</p>
                  <div className="grid grid-cols-2 gap-2 text-blue-700">
                    <div>
                      <span className="font-medium">Token:</span> ********
                    </div>
                    <div>
                      <span className="font-medium">Instance ID:</span> ********
                    </div>
                    <div>
                      <span className="font-medium">Stato:</span> 
                      <span className={`ml-1 font-semibold ${status?.connected ? 'text-green-600' : 'text-red-600'}`}>
                        {status?.connected ? 'Connesso' : 'Non connesso'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Configurato:</span> 
                      <span className="ml-1 font-semibold text-green-600">Sì</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'status', label: 'Stato', icon: CheckCircleIcon },
                { id: 'send', label: 'Invia Messaggio', icon: PaperAirplaneIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tab Stato */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${status?.connected ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      {status?.connected ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                      ) : (
                        <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {status?.connected ? 'WhatsApp Connesso' : 'WhatsApp Non Connesso'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {status?.message || 'Usa i pulsanti sotto per configurare'}
                        </p>
                        {status?.lastCheck && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ultimo controllo: {new Date(status.lastCheck).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => refetchStatus()}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                        title="Aggiorna stato"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Instance ID</p>
                    <p className="font-mono text-xs">{status?.instanceId || instanceInfo?.instance_id || 'Non configurato'}</p>
                  </div>
                </div>
                
                {/* Avviso importante e pulsanti stato manuale */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="w-full">
                      <p className="text-sm text-blue-800 mb-3">
                        SendApp non fornisce un endpoint per verificare lo stato della connessione. 
                        Usa i pulsanti sotto per aggiornare manualmente lo stato dopo aver scansionato il QR Code.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await api.post('/whatsapp/set-status', { connected: true });
                              toast.success('Stato impostato su CONNESSO');
                              refetchStatus();
                            } catch (error) {
                              toast.error('Errore impostazione stato');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Imposta come CONNESSO
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.post('/whatsapp/set-status', { connected: false });
                              toast.success('Stato impostato su NON CONNESSO');
                              refetchStatus();
                            } catch (error) {
                              toast.error('Errore impostazione stato');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center"
                        >
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          Imposta come NON CONNESSO
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => createInstanceMutation.mutate()}
                    disabled={createInstanceMutation.isPending}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <CogIcon className="h-5 w-5 mr-2" />
                    {createInstanceMutation.isPending ? 'Creazione...' : 'Crea Istanza'}
                  </button>

                  <button
                    onClick={() => generateQRMutation.mutate()}
                    disabled={generateQRMutation.isPending}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <QrCodeIcon className="h-5 w-5 mr-2" />
                    {generateQRMutation.isPending ? 'Generazione...' : 'Genera QR Code'}
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm('Sei sicuro di voler resettare l\'istanza?')) {
                        try {
                          await api.post('/whatsapp/reset');
                          toast.success('Istanza resettata');
                          refetchStatus();
                        } catch (error) {
                          toast.error('Errore reset');
                        }
                      }
                    }}
                    className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Reset Istanza
                  </button>
                </div>

                {/* QR Code Display */}
                {showQR && qrCodeImage && (
                  <div className="mt-6 p-6 bg-white border-2 border-blue-500 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <QrCodeIcon className="h-6 w-6 mr-2 text-blue-600" />
                      Scansiona questo QR Code con WhatsApp
                    </h3>
                    
                    {/* Mostra i riferimenti usati per generare il QR */}
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Riferimenti QR Code:</p>
                      <div className="space-y-1 text-xs font-mono text-yellow-700">
                        <p><span className="font-semibold">Instance ID:</span> {status?.instanceId || 'Non disponibile'}</p>
                        <p><span className="font-semibold">Access Token:</span> {status?.accessToken || '********'}</p>
                        <p><span className="font-semibold">Generato alle:</span> {new Date().toLocaleTimeString()}</p>
                      </div>
                      
                      {/* Link per testare direttamente l'API */}
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">URL API chiamato:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://app.sendapp.cloud/api/get_qrcode?instance_id=${status?.instanceId || '********'}&access_token=${status?.accessToken || '********'}`}
                            className="flex-1 text-xs p-1 bg-white border rounded font-mono"
                          />
                          <button
                            onClick={() => {
                              const url = `https://app.sendapp.cloud/api/get_qrcode?instance_id=${status?.instanceId || '********'}&access_token=${status?.accessToken || '********'}`;
                              window.open(url, '_blank');
                            }}
                            className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Test API
                          </button>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          Clicca "Test API" per verificare direttamente la risposta dell'API SendApp
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
                      {qrCodeImage.startsWith('data:image') ? (
                        <img 
                          src={qrCodeImage} 
                          alt="WhatsApp QR Code" 
                          className="max-w-sm"
                        />
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-600 mb-4">QR Code in formato testo:</p>
                          <pre className="text-xs bg-white p-4 rounded overflow-auto">
                            {qrCodeImage}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowQR(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Chiudi QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Invia Messaggio */}
            {activeTab === 'send' && (
              <div className="max-w-2xl">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  sendMessageMutation.mutate({
                    phoneNumber: formData.get('phoneNumber') as string,
                    message: formData.get('message') as string
                  });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero Telefono (solo cifre, es: 393331234567)
                    </label>
                    <input
                      name="phoneNumber"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="393331234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Scrivi il tuo messaggio..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !status?.connected}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendMessageMutation.isPending ? 'Invio in corso...' : 'Invia Messaggio'}
                  </button>
                  
                  {!status?.connected && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ WhatsApp non connesso. Prima connetti WhatsApp scansionando il QR code.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
