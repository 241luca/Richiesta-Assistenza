/**
 * WhatsApp Connection Component - Backend Integration
 * Usa gli endpoint del backend che a sua volta chiama Evolution API
 * NON chiama direttamente Evolution API dal frontend
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';  // Usa il client API del backend
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  PhoneIcon,
  LinkIcon,
  RocketLaunchIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppConnectionEvolutionVPS() {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  
  // ⚠️ USA IL BACKEND, NON CHIAMARE EVOLUTION DIRETTAMENTE!
  
  // Recupera stato connessione dal BACKEND
  const { data: status, isLoading: loadingStatus, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      try {
        // Chiama il backend endpoint /api/whatsapp/status
        const response = await api.get('/whatsapp/status');
        return response.data.data;
      } catch (error: any) {
        console.error('Errore recupero stato:', error);
        return {
          connected: false,
          state: 'error',
          message: error.response?.data?.message || 'Errore connessione al backend'
        };
      }
    },
    refetchInterval: showQR ? 5000 : 30000  // Poll più frequente quando mostra QR
  });
  
  // Mutation per creare istanza tramite BACKEND
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      // Chiama il backend per creare l'istanza
      const response = await api.post('/whatsapp/instance/create');
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success('Istanza creata con successo!');
      
      // Se c'è già un QR nella risposta, mostralo
      if (data.qrcode) {
        setQrCode(data.qrcode);
        setShowQR(true);
      } else {
        // Altrimenti ottieni il QR separatamente
        getQRCode();
      }
      
      refetch();  // Ricarica lo stato
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore creazione istanza';
      toast.error(message);
      setIsCreatingInstance(false);
    }
  });
  
  // Mutation per ottenere QR code tramite BACKEND
  const getQRCodeMutation = useMutation({
    mutationFn: async () => {
      // Chiama il backend per ottenere il QR
      const response = await api.get('/whatsapp/qrcode');
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data.qrcode) {
        setQrCode(data.qrcode);
        setShowQR(true);
        toast.success('QR Code generato! Scansiona con WhatsApp.');
      } else if (data.connected) {
        toast.info('WhatsApp già connesso!');
        setShowQR(false);
      } else {
        toast.error('QR code non disponibile');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore generazione QR';
      toast.error(message);
    }
  });
  
  // Mutation per eliminare istanza tramite BACKEND
  const deleteInstanceMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/whatsapp/instance');
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Istanza eliminata');
      setShowQR(false);
      setQrCode('');
      refetch();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore eliminazione istanza';
      toast.error(message);
    }
  });
  
  // Funzioni helper
  const handleCreateInstance = async () => {
    setIsCreatingInstance(true);
    createInstanceMutation.mutate();
  };
  
  const getQRCode = () => {
    getQRCodeMutation.mutate();
  };
  
  const handleDeleteInstance = () => {
    if (confirm('Sei sicuro di voler eliminare l\'istanza WhatsApp?')) {
      deleteInstanceMutation.mutate();
    }
  };
  
  // Determina lo stato dell'interfaccia
  const isConnected = status?.connected === true;
  const instanceExists = status?.exists !== false;
  const needsCreation = status?.state === 'not_exists' || !instanceExists;
  const isConnecting = status?.state === 'connecting';
  
  // Effetto per polling QR quando in connessione
  useEffect(() => {
    if (showQR && !isConnected) {
      const interval = setInterval(() => {
        refetch();  // Ricontrolla lo stato
      }, 5000);
      
      return () => clearInterval(interval);
    } else if (isConnected) {
      setShowQR(false);  // Nascondi QR se connesso
    }
  }, [showQR, isConnected, refetch]);
  
  // Rendering
  if (loadingStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
          <span className="text-gray-600">Caricamento stato WhatsApp...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Connessione WhatsApp Evolution API
          </h3>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Ricarica stato"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Status Card */}
        <div className={`rounded-lg p-4 mb-6 ${
          isConnected ? 'bg-green-50 border border-green-200' :
          needsCreation ? 'bg-yellow-50 border border-yellow-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center">
            {isConnected ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            ) : needsCreation ? (
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-3" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
            )}
            
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {isConnected ? 'WhatsApp Connesso' :
                 needsCreation ? 'Istanza Non Configurata' :
                 isConnecting ? 'Connessione in corso...' :
                 'WhatsApp Non Connesso'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {status?.message || 'Stato sconosciuto'}
              </p>
              {status?.instanceName && (
                <p className="text-xs text-gray-500 mt-1">
                  Istanza: {status.instanceName}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {needsCreation && (
            <button
              onClick={handleCreateInstance}
              disabled={isCreatingInstance || createInstanceMutation.isPending}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingInstance ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Creazione in corso...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-4 w-4 mr-2" />
                  Crea Istanza WhatsApp
                </>
              )}
            </button>
          )}
          
          {!needsCreation && !isConnected && (
            <button
              onClick={getQRCode}
              disabled={getQRCodeMutation.isPending}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {getQRCodeMutation.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Generazione QR...
                </>
              ) : (
                <>
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  Genera QR Code
                </>
              )}
            </button>
          )}
          
          {instanceExists && !needsCreation && (
            <button
              onClick={handleDeleteInstance}
              disabled={deleteInstanceMutation.isPending}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              Elimina Istanza
            </button>
          )}
        </div>
        
        {/* QR Code Display */}
        {showQR && qrCode && !isConnected && (
          <div className="mt-6 p-6 bg-white border-2 border-gray-200 rounded-lg">
            <p className="text-center text-sm text-gray-600 mb-4">
              Scansiona questo QR code con WhatsApp
            </p>
            <div className="flex justify-center">
              {qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Code" className="max-w-xs" />
              ) : (
                <QRCode value={qrCode} size={256} />
              )}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Il QR code si aggiorna automaticamente
            </p>
          </div>
        )}
        
        {/* Connected Info */}
        {isConnected && status?.instanceData && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">
              Dettagli Connessione
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              {status.instanceData.profileName && (
                <p>Nome: {status.instanceData.profileName}</p>
              )}
              {status.instanceData.ownerJid && (
                <p>Numero: {status.instanceData.ownerJid.replace('@s.whatsapp.net', '')}</p>
              )}
              <p>Stato: {status.state}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}