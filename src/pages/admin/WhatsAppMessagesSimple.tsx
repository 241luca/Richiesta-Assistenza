/**
 * WhatsApp Messages Page Semplificata
 * Post-migrazione a solo WPPConnect
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppMessagesPage() {
  // Ottieni stato connessione
  const { data: connectionStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data?.data;
    },
    refetchInterval: 30000
  });

  // Ottieni statistiche
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data?.data;
    },
    refetchInterval: 60000
  });

  // Ottieni messaggi
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/messages');
      return response.data?.data;
    },
    retry: 1
  });

  const messages = messagesData?.messages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Messaggi WhatsApp
              </h1>
              <p className="text-sm text-gray-600">
                Provider: <span className="font-semibold text-green-600">WPPConnect</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Badge */}
            {connectionStatus?.connected ? (
              <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Connesso</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Non connesso</span>
              </div>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aggiorna messaggi"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Messaggi Totali</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Messaggi Oggi</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Messaggi Recenti
          </h2>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Caricamento messaggi...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg: any) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-lg ${
                    msg.direction === 'outgoing' 
                      ? 'bg-blue-50 ml-auto max-w-md' 
                      : 'bg-gray-50 mr-auto max-w-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {msg.phoneNumber || 'Numero sconosciuto'}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {msg.message}
                      </p>
                    </div>
                    {msg.direction === 'outgoing' && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-600 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(msg.timestamp || msg.createdAt).toLocaleString('it-IT')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700">Nessun messaggio disponibile</p>
              <p className="text-sm text-gray-500 mt-2">
                I messaggi appariranno qui quando saranno disponibili
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      {!connectionStatus?.connected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>WhatsApp non connesso</strong>
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Vai nella sezione principale di WhatsApp per connetterti tramite QR Code
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
