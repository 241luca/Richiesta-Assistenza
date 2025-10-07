import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaperAirplaneIcon, PaperClipIcon, PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { io, Socket } from 'socket.io-client';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';
import FileUploadModal from './FileUploadModal';

interface ChatMessage {
  id: string;
  requestId: string;
  userId: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'SYSTEM';
  attachments?: any[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar?: string;
    role: string;
  };
}

interface RequestChatProps {
  requestId: string;
  requestTitle: string;
  requestStatus: string;
  participants: Array<{
    id: string;
    fullName: string;
    role: string;
    avatar?: string;
  }>;
  suggestedMessage?: string; // NUOVO: Messaggio suggerito iniziale
}

const RequestChat: React.FC<RequestChatProps> = ({ 
  requestId, 
  requestTitle,
  requestStatus,
  participants,
  suggestedMessage 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Imposta il messaggio suggerito quando viene passato
  useEffect(() => {
    if (suggestedMessage && message === '') {
      setMessage(suggestedMessage);
    }
  }, [suggestedMessage]);

  // Query per recuperare i messaggi
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: async () => {
      const response = await api.get(`/chat/${requestId}/messages`);
      return response.data.data;
    },
    refetchInterval: false // Usiamo WebSocket per aggiornamenti real-time
  });

  // Query per verificare l'accesso alla chat
  const { data: chatAccess } = useQuery({
    queryKey: ['chat-access', requestId],
    queryFn: async () => {
      const response = await api.get(`/chat/${requestId}/access`);
      return response.data.data;
    }
  });

  // Mutation per inviare messaggi
  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post(`/chat/${requestId}/messages`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    },
    onSuccess: (newMessage) => {
      setMessage('');
      setSelectedFiles([]);
      
      // Aggiungi il messaggio alla lista locale se non viene dal WebSocket
      queryClient.setQueryData(['chat-messages', requestId], (old: ChatMessage[] = []) => {
        // Controlla se il messaggio esiste già (potrebbe arrivare via WebSocket)
        const exists = old.some(msg => msg.id === newMessage.id);
        if (!exists) {
          return [...old, newMessage];
        }
        return old;
      });
      
      scrollToBottom();
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      alert('Errore nell\'invio del messaggio');
    }
  });

  // Mutation per modificare messaggi
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, message }: { messageId: string; message: string }) => {
      const response = await api.put(`/chat/messages/${messageId}`, { message });
      return response.data.data;
    },
    onSuccess: () => {
      setEditingMessage(null);
    }
  });

  // Mutation per eliminare messaggi
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data.data;
    }
  });

  // Mutation per segnare i messaggi come letti
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/chat/${requestId}/mark-read`);
      return response.data;
    }
  });

  // Inizializza WebSocket
  useEffect(() => {
    if (!user?.token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3200', {
      auth: {
        token: user.token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat WebSocket');
      newSocket.emit('chat:join-request', requestId);
    });

    newSocket.on('chat:initial-messages', (initialMessages: ChatMessage[]) => {
      queryClient.setQueryData(['chat-messages', requestId], initialMessages);
    });

    newSocket.on('chat:new-message', (newMessage: ChatMessage) => {
      queryClient.setQueryData(['chat-messages', requestId], (old: ChatMessage[] = []) => {
        return [...old, newMessage];
      });
      
      // Segna come letto se la chat è aperta
      if (document.hasFocus()) {
        markAsReadMutation.mutate();
      }
      
      scrollToBottom();
    });

    newSocket.on('chat:message-edited', (editedMessage: ChatMessage) => {
      queryClient.setQueryData(['chat-messages', requestId], (old: ChatMessage[] = []) => {
        return old.map(msg => msg.id === editedMessage.id ? editedMessage : msg);
      });
    });

    newSocket.on('chat:message-deleted', ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['chat-messages', requestId], (old: ChatMessage[] = []) => {
        return old.filter(msg => msg.id !== messageId);
      });
    });

    newSocket.on('chat:user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(userId, true);
        } else {
          newMap.delete(userId);
        }
        return newMap;
      });
    });

    newSocket.on('chat:user-joined', ({ userId }: { userId: string }) => {
      console.log(`User ${userId} joined the chat`);
    });

    newSocket.on('chat:user-left', ({ userId }: { userId: string }) => {
      console.log(`User ${userId} left the chat`);
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });

    newSocket.on('chat:error', ({ message }: { message: string }) => {
      console.error('Chat error:', message);
      alert(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('chat:leave-request', requestId);
      newSocket.disconnect();
    };
  }, [user, requestId, queryClient]);

  // Gestione indicatore di digitazione
  const handleTyping = useCallback(() => {
    if (!socket || !isTyping) {
      setIsTyping(true);
      socket?.emit('chat:typing', { requestId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('chat:typing', { requestId, isTyping: false });
    }, 2000);
  }, [socket, isTyping, requestId]);

  // Scroll automatico in fondo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Segna messaggi come letti quando la finestra torna in focus
  useEffect(() => {
    const handleFocus = () => {
      if (chatAccess?.canAccess) {
        markAsReadMutation.mutate();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [chatAccess]);

  // Gestione invio messaggio
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && selectedFiles.length === 0) return;
    if (!chatAccess?.isActive) {
      alert('La chat è chiusa per questa richiesta');
      return;
    }

    const formData = new FormData();
    formData.append('message', message);
    formData.append('messageType', selectedFiles.length > 0 ? 'DOCUMENT' : 'TEXT');
    
    selectedFiles.forEach(file => {
      formData.append('attachments', file);
    });

    // Se usiamo WebSocket, inviamo direttamente
    if (socket && socket.connected) {
      socket.emit('chat:send-message', {
        requestId,
        message,
        messageType: selectedFiles.length > 0 ? 'DOCUMENT' : 'TEXT',
        attachments: selectedFiles.map(f => ({
          fileName: f.name,
          fileType: f.type,
          fileSize: f.size
        }))
      });
      setMessage('');
      setSelectedFiles([]);
    } else {
      // Fallback su API HTTP
      sendMessageMutation.mutate(formData);
    }
  };



  // Gestione selezione file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Rimuovi file selezionato
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Se non può accedere alla chat
  if (chatAccess && !chatAccess.canAccess) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Non hai accesso a questa chat</p>
      </div>
    );
  }

  // Se la chat è chiusa
  if (chatAccess && !chatAccess.isActive) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow">
        <ChatHeader 
          title={requestTitle}
          status={requestStatus}
          participants={participants}
          isActive={false}
        />
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwn={msg.userId === user?.id}
              onEdit={() => {}}
              onDelete={() => {}}
              canEdit={false}
              canDelete={false}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-gray-100 border-t">
          <p className="text-center text-gray-500">
            La chat è chiusa perché la richiesta è stata {requestStatus === 'COMPLETED' ? 'completata' : 'cancellata'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <ChatHeader 
        title={requestTitle}
        status={requestStatus}
        participants={participants}
        isActive={true}
      />

      {/* Messaggi */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Errore nel caricamento dei messaggi</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Nessun messaggio. Inizia la conversazione!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={msg.userId === user?.id}
                onEdit={(newMessage) => {
                  if (socket && socket.connected) {
                    socket.emit('chat:edit-message', {
                      messageId: msg.id,
                      requestId,
                      message: newMessage
                    });
                  } else {
                    editMessageMutation.mutate({ messageId: msg.id, message: newMessage });
                  }
                }}
                onDelete={() => {
                  if (socket && socket.connected) {
                    socket.emit('chat:delete-message', {
                      messageId: msg.id,
                      requestId
                    });
                  } else {
                    deleteMessageMutation.mutate(msg.id);
                  }
                }}
                canEdit={msg.userId === user?.id && !msg.isDeleted}
                canDelete={msg.userId === user?.id && !msg.isDeleted}
              />
            ))}
            {typingUsers.size > 0 && (
              <TypingIndicator users={Array.from(typingUsers.keys())} />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* File selezionati */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 border-t">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border">
                {file.type.startsWith('image/') ? (
                  <PhotoIcon className="h-4 w-4 text-blue-500" />
                ) : (
                  <DocumentIcon className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input messaggio */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Scrivi un messaggio..."
              className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={!chatAccess?.isActive}
            />
          </div>
          
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <PaperClipIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
          </label>

          <button
            type="submit"
            disabled={(!message.trim() && selectedFiles.length === 0) || !chatAccess?.isActive}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Modal upload file */}
      {showFileUpload && (
        <FileUploadModal
          onClose={() => setShowFileUpload(false)}
          onUpload={(files) => {
            setSelectedFiles(files);
            setShowFileUpload(false);
          }}
        />
      )}
    </div>
  );
};

export default RequestChat;
