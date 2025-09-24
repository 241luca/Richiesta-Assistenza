import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  PhoneIcon,
  LinkIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export function WhatsAppConnection() {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  
  // Recupera stato connessione
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data || response.data;
    },
    refetchInterval: showQR ? 5000 : 30000 // Controlla più spesso se mostra QR
  });
  
  // Mutation per creare istanza e generare QR Code
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      try {
        // Prima crea l'istanza
        await api.post('/whatsapp/instance/create', {
          instanceName: 'main'
        });
        
        // Poi ottieni il QR code
        const qrResponse = await api.get('/whatsapp/qrcode');
        return qrResponse;
      } catch (error: any) {
        // Se l'istanza esiste già, prova solo a ottenere il QR
        if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
          const qrResponse = await api.get('/whatsapp/qrcode');
          return qrResponse;
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data.success !== false && data.data) {
        // Evolution API restituisce il QR in modo diverso
        const qrData = data.data;
        
        if (qrData.base64 || qrData.qr || qrData.qrcode) {
          const base64String = qrData.base64 || qrData.qr || qrData.qrcode;
          // Assicurati che abbia il prefisso data:image
          const qrImage = base64String.includes('data:image') 
            ? base64String 
            : `data:image/png;base64,${base64String}`;
          
          setQrCode(qrImage);
          setShowQR(true);
          toast.success('QR Code generato! Scansiona con WhatsApp');
        } else if (qrData.code) {
          // Se è un codice stringa, genera QR con libreria
          // Per ora mostriamo il codice
          setQrCode(qrData.code);
          setShowQR(true);
          toast.success('Codice generato! ' + qrData.code);
        } else {
          toast.error('Formato QR Code non riconosciuto');
        }
      } else {
        toast.error(data.message || 'QR Code non disponibile');
      }
    },
    onError: (error: any) => {
      console.error('QR Generation error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Errore generazione QR Code');
    }
  });
  
  // Mutation per disconnettere
  const disconnectMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/logout', { instanceName: 'main' }),
    onSuccess: () => {
      toast.success('WhatsApp disconnesso');
      setShowQR(false);
      setQrCode('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore disconnessione');
    }
  });
  
  const isConnected = status?.connected || status?.isConnected;
  const phoneNumber = status?.phoneNumber || status?.instance?.profileName;
  const provider = status?.provider || 'evolution';
  const providerUrl = status?.url;
  
  return (
    <div className="space-y-6">
      {/* Stato Connessione */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stato Connessione WhatsApp</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Stato</p>
              <p className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connesso' : 'Non Connesso'}
              </p>
            </div>
          </div>
          
          {phoneNumber && (
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Numero</p>
                <p className="font-semibold">{phoneNumber}</p>
              </div>
            </div>
          )}
          
          {provider && (
            <div className="flex items-center space-x-3">
              <RocketLaunchIcon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-semibold capitalize">
                  {provider === 'evolution' ? 'Evolution API' : provider}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Azioni */}
        <div className="mt-6 flex gap-3">
          {!isConnected ? (
            <button
              onClick={() => generateQRMutation.mutate()}
              disabled={generateQRMutation.isPending}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              {generateQRMutation.isPending ? 'Generazione...' : 'Genera QR Code'}
            </button>
          ) : (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
            </button>
          )}
          
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna Stato
          </button>
        </div>
      </div>
      
      {/* QR Code */}
      {showQR && qrCode && !isConnected && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Scansiona QR Code</h3>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-lg">
              {qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <p className="text-xs font-mono break-all">{qrCode}</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                1. Apri WhatsApp sul telefono<br/>
                2. Vai su Impostazioni → Dispositivi collegati<br/>
                3. Clicca su "Collega un dispositivo"<br/>
                4. Scansiona questo codice QR
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              Attendo connessione...
            </div>
          </div>
        </div>
      )}
      
      {/* Info Configurazione */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">Configurazione Attiva</h4>
        <dl className="text-sm space-y-1">
          <div className="flex">
            <dt className="text-gray-500 w-32">Provider:</dt>
            <dd className="font-medium">
              {provider === 'evolution' ? '🚀 Evolution API (Self-Hosted)' : 
               provider === 'sendapp' ? '☁️ SendApp Cloud' : 
               provider}
            </dd>
          </div>
          {providerUrl && (
            <div className="flex">
              <dt className="text-gray-500 w-32">Server URL:</dt>
              <dd className="font-mono text-xs">{providerUrl}</dd>
            </div>
          )}
          {provider === 'evolution' && (
            <>
              <div className="flex">
                <dt className="text-gray-500 w-32">Costo:</dt>
                <dd className="font-medium text-green-600">Gratuito (Self-Hosted)</dd>
              </div>
              <div className="flex">
                <dt className="text-gray-500 w-32">Messaggi:</dt>
                <dd className="font-medium text-green-600">Illimitati</dd>
              </div>
            </>
          )}
        </dl>
      </div>
      
      {provider === 'evolution' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Evolution API Attiva</p>
              <p>Stai usando Evolution API self-hosted con messaggi illimitati gratuiti.</p>
              <p className="mt-1">Server: {providerUrl || 'http://37.27.89.35:8080'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
