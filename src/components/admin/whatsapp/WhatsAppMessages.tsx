import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  ChatBubbleLeftIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  DocumentIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  type: string;
  status: string;
  direction: 'inbound' | 'outbound';
  mediaUrl?: string;
  sentAt?: string;
  receivedAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  metadata?: any;
}

export function WhatsAppMessages() {
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [searchPhone, setSearchPhone] = useState('');
  
  // Recupera messaggi con refresh automatico
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-messages', filter, searchPhone],
    queryFn: async () => {
      const params: any = {};
      if (filter !== 'all') params.direction = filter;
      if (searchPhone) params.phoneNumber = searchPhone;
      
      const response = await api.get('/whatsapp/messages', { params });
      // Aggiustato per corrispondere al formato ResponseFormatter
      return response.data?.data?.messages || response.data?.messages || [];
    },
    refetchInterval: 3000 // Aggiorna ogni 3 secondi
  });
  
  // Icona per tipo di messaggio
  const getMessageIcon = (type: string) => {
    switch(type) {
      case 'image': return <PhotoIcon className="h-4 w-4" />;
      case 'document': return <DocumentIcon className="h-4 w-4" />;
      case 'audio': return <MusicalNoteIcon className="h-4 w-4" />;
      case 'video': return <VideoCameraIcon className="h-4 w-4" />;
      default: return <ChatBubbleLeftIcon className="h-4 w-4" />;
    }
  };
  
  // Icona per stato messaggio
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'sent': return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'delivered': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'read': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed': return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  
  // Formatta numero telefonico
  const formatPhone = (phone: string) => {
    // Rimuovi il prefisso 39 se presente
    if (phone.startsWith('39')) {
      phone = phone.substring(2);
    }
    // Formatta come xxx xxx xxxx
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };
  
  // Ottieni la data più rilevante
  const getRelevantDate = (msg: WhatsAppMessage) => {
    if (msg.direction === 'inbound' && msg.receivedAt) {
      return new Date(msg.receivedAt);
    }
    if (msg.direction === 'outbound' && msg.sentAt) {
      return new Date(msg.sentAt);
    }
    return new Date(msg.createdAt);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messaggi WhatsApp</h1>
        <p className="text-gray-600">Visualizza tutti i messaggi inviati e ricevuti</p>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilter('inbound')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'inbound' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ricevuti
            </button>
            <button
              onClick={() => setFilter('outbound')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'outbound' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inviati
            </button>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cerca per numero di telefono..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>
      
      {/* Lista messaggi */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento messaggi...</p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessun messaggio trovato</p>
          </div>
        ) : (
          messages?.map((msg: WhatsAppMessage) => {
            const isInbound = msg.direction === 'inbound';
            const relevantDate = getRelevantDate(msg);
            
            return (
              <div
                key={msg.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  isInbound ? 'border-l-4 border-green-500' : 'border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold">
                        {isInbound ? 'Da:' : 'A:'} +39 {formatPhone(msg.phoneNumber)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isInbound 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isInbound ? 'Ricevuto' : 'Inviato'}
                      </span>
                      {getMessageIcon(msg.type)}
                      <span className="text-xs text-gray-500">
                        {msg.type}
                      </span>
                    </div>
                    
                    {/* Messaggio */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p className="text-gray-800">{msg.message}</p>
                      {msg.mediaUrl && (
                        <a 
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline text-sm"
                        >
                          📎 Visualizza media
                        </a>
                      )}
                    </div>
                    
                    {/* Footer con date */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {msg.sentAt && (
                        <span>✍️ Inviato: {new Date(msg.sentAt).toLocaleString('it-IT')}</span>
                      )}
                      {msg.deliveredAt && (
                        <span>✅ Consegnato: {new Date(msg.deliveredAt).toLocaleString('it-IT')}</span>
                      )}
                      {msg.readAt && (
                        <span>👁️ Letto: {new Date(msg.readAt).toLocaleString('it-IT')}</span>
                      )}
                      {!msg.sentAt && !msg.deliveredAt && !msg.readAt && (
                        <span>🕐 {relevantDate.toLocaleString('it-IT')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Stato */}
                  <div className="ml-4">
                    {getStatusIcon(msg.status)}
                  </div>
                </div>
                
                {/* Metadata (debug) */}
                {process.env.NODE_ENV === 'development' && msg.metadata && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">Debug info</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(msg.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer con statistiche */}
      {messages && messages.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-sm text-gray-600">Totale messaggi</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {messages.filter((m: WhatsAppMessage) => m.direction === 'inbound').length}
              </p>
              <p className="text-sm text-gray-600">Ricevuti</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {messages.filter((m: WhatsAppMessage) => m.direction === 'outbound').length}
              </p>
              <p className="text-sm text-gray-600">Inviati</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {messages.filter((m: WhatsAppMessage) => m.status === 'read').length}
              </p>
              <p className="text-sm text-gray-600">Letti</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
