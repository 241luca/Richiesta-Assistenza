import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/services/api';
import { ArrowLeftIcon, PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

export default function RequestChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom quando ci sono nuovi messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Query per caricare i dettagli della richiesta
  const { data: request } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}`);
      console.log('Raw API response:', response.data);
      
      // I dati sono in response.data.data.request per via del ResponseFormatter
      const requestData = response.data?.data?.request || response.data?.request || response.data;
      
      console.log('Extracted request data:', requestData);
      return requestData;
    }
  });

  // Query per caricare i messaggi della chat
  const { data: messages, isLoading } = useQuery({
    queryKey: ['request-chat', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}/chat`);
      return response.data.data || response.data || [];
    },
    refetchInterval: 5000 // Refresh ogni 5 secondi
  });

  // Mutation per inviare un messaggio
  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageText, attachments }: { messageText: string; attachments?: any[] }) => {
      const response = await api.post(`/requests/${id}/chat`, {
        message: messageText,
        attachments
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['request-chat', id] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
    }
  });

  useEffect(() => {
    if (request) {
      console.log('Request loaded in component:', {
        fullObject: request,
        id: request.id,
        title: request.title,
        description: request.description,
        hasClient: !!request.client,
        clientObject: request.client,
        clientId: request.clientId,
        clientFirstName: request.client?.firstName,
        clientLastName: request.client?.lastName,
        hasProfessional: !!request.professional,
        professionalObject: request.professional,
        professionalId: request.professionalId
      });
    }
  }, [request]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFiles.length > 0) && !isSubmitting) {
      setIsSubmitting(true);
      
      // Prepara gli allegati se ci sono file selezionati
      let attachments = undefined;
      if (selectedFiles.length > 0) {
        attachments = selectedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }));
        // Nota: per un'implementazione completa, qui dovresti caricare i file su un server
        // e salvare gli URL nel database
      }
      
      sendMessageMutation.mutate({ 
        messageText: message.trim(),
        attachments 
      });
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">
                Chat Richiesta #{id?.slice(0, 8)}
              </h2>
              {request && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Richiesta:</span> {request.title || request.description || 'Senza titolo'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Cliente:</span> {
                      request.client 
                        ? `${request.client.firstName || ''} ${request.client.lastName || ''}`.trim() || request.client.email
                        : 'Non specificato'
                    }
                    {request.client?.phone && ` - Tel: ${request.client.phone}`}
                  </p>
                  {request.professional ? (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Professionista:</span> {
                        `${request.professional.firstName || ''} ${request.professional.lastName || ''}`.trim() || request.professional.email
                      }
                      {request.professional.phone && ` - Tel: ${request.professional.phone}`}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">
                      <span className="font-medium">Professionista:</span> Non ancora assegnato
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-lg ${
                    msg.senderId === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {msg.senderName}
                    </span>
                    <span className={`text-xs ${
                      msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {msg.message && (
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  )}
                  
                  {/* Mostra allegati se presenti */}
                  {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                    <div className={`${msg.message ? 'mt-2' : ''} space-y-1`}>
                      <div className="flex items-center gap-1">
                        <PaperClipIcon className={`h-4 w-4 ${
                          msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs ${
                          msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {msg.attachments.length} {msg.attachments.length === 1 ? 'allegato' : 'allegati'}
                        </span>
                      </div>
                      {msg.attachments.map((attachment: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 ml-5">
                          <span className={`text-xs ${
                            msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {attachment.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nessun messaggio. Inizia la conversazione!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* File selezionati */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                  <PaperClipIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Input e bottoni */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Allega file"
            >
              <PaperClipIcon className="h-6 w-6" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            
            <button
              type="submit"
              disabled={(!message.trim() && selectedFiles.length === 0) || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              Invia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
