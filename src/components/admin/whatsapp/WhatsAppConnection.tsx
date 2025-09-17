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
  LinkIcon
} from '@heroicons/react/24/outline';

export function WhatsAppConnection() {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  
  // Recupera stato connessione
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data;
    },
    refetchInterval: showQR ? 5000 : 30000 // Controlla più spesso se mostra QR
  });
  
  // Mutation per generare QR Code
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      // Prima crea l'istanza se necessaria
      await api.post('/whatsapp/create-instance');
      // Poi ottieni il QR code
      return api.get('/whatsapp/qr-code');
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data.success && data.data?.base64) {
        // Aggiungi prefisso data:image se manca
        const base64 = data.data.base64.includes('data:image') 
          ? data.data.base64 
          : `data:image/png;base64,${data.data.base64}`;
        setQrCode(base64);
        setShowQR(true);
        toast.success('QR Code generato! Scansiona con WhatsApp');
      } else {
        toast.error('QR Code non valido ricevuto');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore generazione QR Code');
    }
  });
  
  // Mutation per disconnettere
  const disconnectMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/disconnect'),
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
  
  const isConnected = status?.isConnected;
  const phoneNumber = status?.phoneNumber;
  const instanceId = status?.instanceId;
  
  return (
    <div className="space-y-6">
      {/* Stato Connessione */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stato Connessione</h3>
        
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
                {isConnected ? 'Connesso' : 'Disconnesso'}
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
          
          {instanceId && (
            <div className="flex items-center space-x-3">
              <LinkIcon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Instance ID</p>
                <p className="font-mono text-xs">{instanceId}</p>
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
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
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
              <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
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
        <h4 className="font-medium text-gray-700 mb-2">Informazioni Configurazione</h4>
        <dl className="text-sm space-y-1">
          <div className="flex">
            <dt className="text-gray-500 w-32">Provider:</dt>
            <dd className="font-medium">SendApp Cloud</dd>
          </div>
          <div className="flex">
            <dt className="text-gray-500 w-32">API URL:</dt>
            <dd className="font-mono text-xs">https://app.sendapp.cloud/api</dd>
          </div>
          <div className="flex">
            <dt className="text-gray-500 w-32">Token:</dt>
            <dd className="font-mono text-xs">••••••••••••</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}