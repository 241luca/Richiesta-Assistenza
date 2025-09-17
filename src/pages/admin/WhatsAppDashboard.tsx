/**
 * Dashboard WhatsApp per Admin - Versione Migliorata
 * Visualizza e gestisce tutti i messaggi WhatsApp ricevuti
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  ChatBubbleLeftRightIcon, 
  PhoneIcon, 
  UserIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  MapPinIcon,
  PaperClipIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid 
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  type: string;
  status: string;
  direction: 'inbound' | 'outbound';
  mediaUrl?: string;
  metadata?: any;
  sentAt?: string;
  receivedAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

interface MessageStats {
  todayMessages: number;
  totalMessages: number;
  stats: Array<{
    type: string;
    status: string;
    _count: number;
  }>;
}

// Template di risposta predefiniti
const responseTemplates = [
  { id: 1, name: 'Saluto', text: 'Ciao! Come posso aiutarti?' },
  { id: 2, name: 'Attesa', text: 'Un momento, verifico e ti rispondo subito.' },
  { id: 3, name: 'Grazie', text: 'Grazie per averci contattato! A presto!' },
  { id: 4, name: 'Orari', text: 'I nostri orari sono:\n• Lun-Ven: 9:00-18:00\n• Sab: 9:00-13:00' },
  { id: 5, name: 'Contatti', text: 'Per assistenza urgente chiama il numero principale.' }
];

export default function WhatsAppDashboard() {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Auto-scroll ai nuovi messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedNumber]);

  // Fetch messaggi con filtri
  const { data: messagesData, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ['whatsapp-messages', searchTerm, filterType],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.phoneNumber = searchTerm;
      if (filterType !== 'all') params.type = filterType;
      
      const response = await api.get('/whatsapp/messages', { params });
      return response.data.data;
    },
    refetchInterval: 3000 // Refresh ogni 3 secondi (più veloce)
  });

  // Fetch statistiche
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data.data as MessageStats;
    },
    refetchInterval: 30000
  });

  // Mutation per inviare messaggi
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string; mediaUrl?: string }) => {
      const response = await api.post('/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Messaggio inviato!');
      setMessageText('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
    }
  });

  // Mutation per esportare chat
  const exportChatMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await api.get(`/whatsapp/export/${phoneNumber}`, {
        responseType: 'blob'
      });
      return response.data;
    },
    onSuccess: (data, phoneNumber) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chat_${phoneNumber}_${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Chat esportata!');
    },
    onError: () => {
      toast.error('Errore esportazione chat');
    }
  });

  // Raggruppa messaggi per numero di telefono
  const messagesByNumber = React.useMemo(() => {
    if (!messagesData?.messages) return {};
    
    const grouped: Record<string, WhatsAppMessage[]> = {};
    messagesData.messages.forEach((msg: WhatsAppMessage) => {
      if (!grouped[msg.phoneNumber]) {
        grouped[msg.phoneNumber] = [];
      }
      grouped[msg.phoneNumber].push(msg);
    });
    
    // Ordina per data più recente
    Object.keys(grouped).forEach(number => {
      grouped[number].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
    
    return grouped;
  }, [messagesData]);

  // Lista conversazioni (numeri unici)
  const conversations = Object.keys(messagesByNumber).sort((a, b) => {
    const lastA = messagesByNumber[a][messagesByNumber[a].length - 1];
    const lastB = messagesByNumber[b][messagesByNumber[b].length - 1];
    return new Date(lastB.createdAt).getTime() - new Date(lastA.createdAt).getTime();
  });

  // Messaggi della conversazione selezionata
  const selectedMessages = selectedNumber ? messagesByNumber[selectedNumber] || [] : [];

  const handleSendMessage = () => {
    if (!selectedNumber || !messageText.trim()) return;
    
    sendMessageMutation.mutate({
      phoneNumber: selectedNumber,
      message: messageText
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedNumber) return;

    // TODO: Implementare upload file a un servizio di storage
    toast.info('Upload file in sviluppo...');
  };

  const handleTemplateSelect = (template: typeof responseTemplates[0]) => {
    setMessageText(template.text);
    setShowTemplates(false);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="h-4 w-4" />;
      case 'document':
        return <DocumentIcon className="h-4 w-4" />;
      case 'audio':
        return <MusicalNoteIcon className="h-4 w-4" />;
      case 'video':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'location':
        return <MapPinIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />;
      case 'delivered':
        return <CheckCircleSolid className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <CheckCircleSolid className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircleSolid className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    const msgDate = new Date(messageDate);
    msgDate.setHours(0, 0, 0, 0);
    
    if (msgDate.getTime() === today.getTime()) {
      return 'Oggi';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.getTime() === yesterday.getTime()) {
      return 'Ieri';
    }
    
    return messageDate.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const renderMessageContent = (msg: WhatsAppMessage) => {
    switch (msg.type) {
      case 'image':
        return (
          <div>
            {msg.mediaUrl && (
              <img 
                src={msg.mediaUrl} 
                alt="Immagine" 
                className="rounded-lg max-w-xs cursor-pointer hover:opacity-90"
                onClick={() => window.open(msg.mediaUrl, '_blank')}
              />
            )}
            {msg.message && <p className="mt-2">{msg.message}</p>}
          </div>
        );
      
      case 'document':
        return (
          <a 
            href={msg.mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg hover:bg-white/20"
          >
            <DocumentIcon className="h-8 w-8" />
            <span>{msg.message}</span>
          </a>
        );
      
      case 'audio':
        return (
          <div className="flex items-center space-x-2">
            <MusicalNoteIcon className="h-6 w-6" />
            {msg.mediaUrl ? (
              <audio controls className="max-w-xs">
                <source src={msg.mediaUrl} />
              </audio>
            ) : (
              <span>{msg.message}</span>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div>
            {msg.mediaUrl && (
              <video controls className="rounded-lg max-w-xs">
                <source src={msg.mediaUrl} />
              </video>
            )}
            {msg.message && <p className="mt-2">{msg.message}</p>}
          </div>
        );
      
      case 'location':
        return (
          <a 
            href={msg.mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-blue-500 hover:underline"
          >
            <MapPinIcon className="h-5 w-5" />
            <span>{msg.message}</span>
          </a>
        );
      
      default:
        return <p className="whitespace-pre-wrap break-words">{msg.message}</p>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con statistiche e filtri */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Dashboard</h1>
              <p className="text-sm text-gray-500">Gestione messaggi WhatsApp</p>
            </div>
          </div>
          
          {stats && (
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
                <p className="text-xs text-gray-500">Oggi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                <p className="text-xs text-gray-500">Totali</p>
              </div>
              
              {/* Filtro tipo messaggio */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tutti i tipi</option>
                <option value="text">Testo</option>
                <option value="image">Immagini</option>
                <option value="document">Documenti</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="location">Posizioni</option>
              </select>
              
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Aggiorna"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar conversazioni */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca numero o nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Lista conversazioni */}
          <div className="flex-1 overflow-y-auto">
            {messagesLoading ? (
              <div className="p-4 text-center text-gray-500">
                <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                Caricamento...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                Nessuna conversazione
              </div>
            ) : (
              conversations.map(number => {
                const messages = messagesByNumber[number];
                const lastMessage = messages[messages.length - 1];
                const unreadCount = messages.filter(
                  m => m.direction === 'inbound' && m.status === 'received'
                ).length;
                
                return (
                  <button
                    key={number}
                    onClick={() => setSelectedNumber(number)}
                    className={`w-full p-4 border-b hover:bg-gray-50 text-left transition-colors ${
                      selectedNumber === number ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {lastMessage.metadata?.isGroup ? (
                            <UserGroupIcon className="h-6 w-6 text-gray-600" />
                          ) : (
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {lastMessage.metadata?.pushName || number}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {number}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            {lastMessage.direction === 'outbound' && (
                              <span className="text-gray-400">✓</span>
                            )}
                            {getMessageIcon(lastMessage.type)}
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage.message}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-xs text-gray-500">
                          {formatMessageTime(lastMessage.createdAt)}
                        </p>
                        {unreadCount > 0 && (
                          <span className="mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Area chat */}
        <div className="flex-1 flex flex-col">
          {selectedNumber ? (
            <>
              {/* Header chat con azioni */}
              <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <PhoneIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMessages[0]?.metadata?.pushName || selectedNumber}
                      </p>
                      <p className="text-sm text-gray-500">{selectedNumber}</p>
                    </div>
                  </div>
                  
                  {/* Azioni chat */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportChatMutation.mutate(selectedNumber)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Esporta chat"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Impostazioni"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messaggi */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('/whatsapp-bg.png')] bg-repeat">
                {selectedMessages.map((msg, index) => {
                  const showDate = index === 0 || 
                    formatMessageDate(msg.createdAt) !== formatMessageDate(selectedMessages[index - 1].createdAt);
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="text-center sticky top-0 z-10">
                          <span className="px-3 py-1 bg-gray-200/90 backdrop-blur text-xs text-gray-600 rounded-full">
                            {formatMessageDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          msg.direction === 'outbound' 
                            ? 'bg-green-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-900 rounded-bl-none'
                        }`}>
                          {renderMessageContent(msg)}
                          <div className={`flex items-center justify-end space-x-1 mt-1 ${
                            msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-400'
                          } text-xs`}>
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Template risposte */}
              {showTemplates && (
                <div className="bg-white border-t p-4">
                  <div className="flex flex-wrap gap-2">
                    {responseTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input messaggio con azioni */}
              <div className="bg-white border-t px-6 py-4">
                <div className="flex items-end space-x-3">
                  {/* Pulsanti azione */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Allega file"
                    >
                      <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Template"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Input nascosto per file */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  />
                  
                  {/* Campo messaggio */}
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                  
                  {/* Pulsante invio */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">Seleziona una conversazione</p>
                <p className="text-sm text-gray-400 mt-2">
                  Scegli una chat dalla lista per iniziare
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
