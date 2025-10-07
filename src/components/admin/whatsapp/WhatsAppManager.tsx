/**
 * WhatsApp Manager - Solo WPPConnect
 * Componente semplificato per gestione WhatsApp con un solo provider
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

interface WhatsAppStatus {
  connected: boolean;
  provider: string;
  message: string;
  qrCode?: string;
}

interface WhatsAppStats {
  totalMessages: number;
  todayMessages: number;
  connectedSince?: string;
  provider: string;
}

const WhatsAppManager: React.FC = () => {
  const [showQR, setShowQR] = useState(false);
  const queryClient = useQueryClient();

  // Query status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data;
    },
    refetchInterval: 10000 // Ogni 10 secondi
  });

  // Query stats
  const { data: stats } = useQuery<WhatsAppStats>({
    queryKey: ['whatsapp', 'stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data.data;
    },
    refetchInterval: 60000 // Ogni minuto
  });

  // Query QR Code
  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ['whatsapp', 'qr'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/qr');
      return response.data.data;
    },
    enabled: showQR && !status?.connected,
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

  const handleShowQR = () => {
    if (status?.connected) {
      toast.error('WhatsApp già connesso');
      return;
    }
    setShowQR(true);
    refetchQR();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestione WhatsApp
              </h1>
              <p className="text-sm text-gray-600">
                Provider: <span className="font-semibold text-green-600">WPPConnect</span>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Messaggi Totali</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Oggi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <PhoneIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Provider</p>
                <p className="text-lg font-bold text-gray-900">WPPConnect</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Azioni</h2>
        
        <div className="flex flex-wrap gap-4">
          {!status?.connected ? (
            <button
              onClick={handleShowQR}
              className="btn-primary flex items-center space-x-2"
            >
              <QrCodeIcon className="h-5 w-5" />
              <span>Mostra QR Code</span>
            </button>
          ) : (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="btn-danger flex items-center space-x-2"
            >
              <PhoneIcon className="h-5 w-5" />
              <span>
                {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
              </span>
            </button>
          )}
          
          <button
            onClick={() => reconnectMutation.mutate()}
            disabled={reconnectMutation.isPending}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-5 w-5 ${reconnectMutation.isPending ? 'animate-spin' : ''}`} />
            <span>
              {reconnectMutation.isPending ? 'Riconnessione...' : 'Riconnetti'}
            </span>
          </button>
        </div>
      </div>

      {/* QR Code Display */}
      {showQR && !status?.connected && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">QR Code per Connessione</h2>
          
          {qrData?.qrCode ? (
            <div className="text-center">
              <div className="inline-block p-4 bg-white border rounded-lg">
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Scansiona questo QR Code con WhatsApp per connettere il tuo account
              </p>
              <button
                onClick={() => refetchQR()}
                className="mt-2 btn-secondary text-sm"
              >
                Aggiorna QR Code
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Generazione QR Code...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppManager;
