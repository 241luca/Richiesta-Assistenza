import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface WhatsAppMessage {
  id: string;
  messageId: string;
  phoneNumber: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'RECEIVED';
  senderName?: string;
  timestamp: Date;
  createdAt: Date;
}

interface ChatGroup {
  phoneNumber: string;
  senderName?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: WhatsAppMessage[];
}

export default function WhatsAppMessages() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Mutation per segnare messaggi come letti
  const markAsReadMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      // Controllo di sicurezza per messages
      if (!Array.isArray(messages)) {
        return phoneNumber;
      }
      
      // Trova tutti i messaggi non letti di questo numero
      const unreadMessages = messages.filter(
        msg => msg.phoneNumber === phoneNumber && 
        msg.direction === 'incoming' && 
        msg.status === 'RECEIVED'
      );
      
      // Segna tutti come letti
      const promises = unreadMessages.map(msg => 
        api.post(`/whatsapp/messages/${msg.id}/read`)
      );
      
      await Promise.all(promises);
      return phoneNumber;
    },
    onSuccess: (phoneNumber) => {
      refetch(); // Ricarica messaggi per aggiornare stati
      
      // Controllo di sicurezza per messages
      if (!Array.isArray(messages)) {
        return;
      }
      
      // Trova il conteggio di messaggi che erano non letti
      const unreadCount = messages.filter(
        msg => msg.phoneNumber === phoneNumber && 
        msg.direction === 'incoming' && 
        msg.status === 'RECEIVED'
      ).length;
      
      if (unreadCount > 0) {
        toast.success(`${unreadCount} ${unreadCount === 1 ? 'messaggio segnato' : 'messaggi segnati'} come ${unreadCount === 1 ? 'letto' : 'letti'}`, {
          duration: 2000,
          position: 'bottom-center',
          style: {
            fontSize: '14px'
          }
        });
      }
    }
  });

  // Quando selezioni una chat, segna i messaggi come letti
  const handleSelectChat = (phoneNumber: string) => {
    setSelectedChat(phoneNumber);
    
    // Segna come letti dopo un breve delay (simula lettura umana)
    setTimeout(() => {
      markAsReadMutation.mutate(phoneNumber);
    }, 500);
  };

  // Query per ottenere tutti i messaggi dal database
  const { data: messages = [], isLoading, refetch } = useQuery<WhatsAppMessage[]>({
    queryKey: ['whatsapp', 'messages'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/messages');
      // L'endpoint ritorna { success, message, data: { data: [], pagination: {} } }
      // Dobbiamo estrarre l'array di messaggi dalla struttura nidificata
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    },
    refetchInterval: 5000 // Aggiorna ogni 5 secondi
  });

  // Raggruppa messaggi per numero di telefono per creare le chat
  const chats = React.useMemo(() => {
    const grouped: Record<string, ChatGroup> = {};
    
    // Controllo di sicurezza: assicuriamoci che messages sia un array
    if (!Array.isArray(messages)) {
      return [];
    }
    
    messages.forEach(msg => {
      if (!grouped[msg.phoneNumber]) {
        grouped[msg.phoneNumber] = {
          phoneNumber: msg.phoneNumber,
          senderName: msg.senderName,
          lastMessage: '',
          lastMessageTime: new Date(msg.timestamp),
          unreadCount: 0,
          messages: []
        };
      }
      
      grouped[msg.phoneNumber].messages.push(msg);
      
      // Aggiorna ultimo messaggio
      const msgTime = new Date(msg.timestamp);
      if (msgTime > grouped[msg.phoneNumber].lastMessageTime) {
        grouped[msg.phoneNumber].lastMessage = msg.message;
        grouped[msg.phoneNumber].lastMessageTime = msgTime;
        if (msg.senderName) {
          grouped[msg.phoneNumber].senderName = msg.senderName;
        }
      }
      
      // Conta non letti (messaggi incoming con status RECEIVED)
      if (msg.direction === 'incoming' && msg.status === 'RECEIVED') {
        grouped[msg.phoneNumber].unreadCount++;
      }
      // Se lo stato è READ, azzera il contatore per questo numero
      if (msg.direction === 'incoming' && msg.status === 'READ') {
        // Non contarlo come non letto
      }
    });
    
    // Ordina per ultimo messaggio
    return Object.values(grouped).sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }, [messages]);

  // Filtra chat in base alla ricerca
  const filteredChats = chats.filter(chat => 
    chat.phoneNumber.includes(searchTerm) || 
    chat.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Messaggi della chat selezionata
  const currentChatMessages = selectedChat 
    ? chats.find(c => c.phoneNumber === selectedChat)?.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ) || []
    : [];

  // Mutation per inviare messaggio
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await api.post('/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Messaggio inviato!');
      setMessage('');
      refetch(); // Ricarica messaggi
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
    }
  });

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  const handleSendMessage = () => {
    if (!selectedChat || !message.trim()) return;
    
    sendMessageMutation.mutate({
      phoneNumber: selectedChat,
      message: message.trim()
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // Formatta numero italiano
    if (phone.startsWith('39')) {
      const number = phone.substring(2);
      return `+39 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckIcon className="h-4 w-4 text-gray-400" />;
      case 'DELIVERED':
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />;
      case 'READ':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'FAILED':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-300" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Caricamento messaggi...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex">
      {/* Lista Chat */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header con ricerca */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Chat WhatsApp ({chats.length})
          </h3>
          
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca chat..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Lista chat scrollabile */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <InboxIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">Nessuna chat trovata</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.phoneNumber}
                onClick={() => handleSelectChat(chat.phoneNumber)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                  selectedChat === chat.phoneNumber ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <UserCircleIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.senderName || formatPhoneNumber(chat.phoneNumber)}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(chat.lastMessageTime), 'HH:mm', { locale: it })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPhoneNumber(chat.phoneNumber)}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-1">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con refresh */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => refetch()}
            className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Aggiorna chat
          </button>
        </div>
      </div>

      {/* Area Messaggi */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header chat */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">
                    {chats.find(c => c.phoneNumber === selectedChat)?.senderName || 
                     formatPhoneNumber(selectedChat)}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1" />
                    {formatPhoneNumber(selectedChat)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messaggi */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {currentChatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Nessun messaggio in questa chat</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.direction === 'outgoing'
                            ? 'bg-green-500 text-white'
                            : msg.status === 'READ' 
                              ? 'bg-white text-gray-900 shadow opacity-80'
                              : 'bg-white text-gray-900 shadow'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {format(new Date(msg.timestamp), 'HH:mm', { locale: it })}
                          </span>
                          {msg.direction === 'outgoing' && getStatusIcon(msg.status)}
                          {msg.direction === 'incoming' && msg.status === 'READ' && (
                            <span className="text-xs text-blue-500">• Letto</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input messaggio */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !message.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">Seleziona una chat per iniziare</p>
              <p className="text-sm mt-2">
                {chats.length} {chats.length === 1 ? 'chat disponibile' : 'chat disponibili'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
