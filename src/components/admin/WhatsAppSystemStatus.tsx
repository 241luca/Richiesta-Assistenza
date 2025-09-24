import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function WhatsAppSystemStatus() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/system-status');
      return response.data?.data;
    },
    refetchInterval: 10000 // Aggiorna ogni 10 secondi
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sistema WhatsApp
        </h3>
        <button 
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Provider Attivo */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Provider Attivo:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status?.activeProvider === 'wppconnect' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {status?.activeProvider === 'wppconnect' ? 'WPPConnect (Principale)' : 'Evolution API (Backup)'}
          </span>
        </div>

        {/* WPPConnect Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">WPPConnect</span>
            {status?.wppconnect?.connected ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            Stato: {status?.wppconnect?.connected ? 'Connesso' : 'Disconnesso'}
            {status?.wppconnect?.qrCode && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 inline mr-1" />
                QR Code disponibile - Scansiona per connettere
              </div>
            )}
          </div>
        </div>

        {/* Evolution API Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Evolution API</span>
            {status?.evolution?.available ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : status?.evolution?.configured ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            {status?.evolution?.configured 
              ? `Backup ${status?.evolution?.available ? 'Disponibile' : 'Non disponibile'}`
              : 'Non configurato'
            }
          </div>
        </div>

        {/* Suggerimento */}
        <div className="border-t pt-4">
          <div className="text-xs text-gray-500">
            💡 Il sistema usa automaticamente il miglior provider disponibile.
            WPPConnect è più stabile e veloce di Evolution API.
          </div>
        </div>
      </div>
    </div>
  );
}
