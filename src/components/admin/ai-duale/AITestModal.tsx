import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface AITestModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  subcategoryId: string;
  mode: 'professional' | 'client';
  subcategoryName?: string;
}

export function AITestModal({ 
  isOpen, 
  onClose, 
  professionalId, 
  subcategoryId, 
  mode,
  subcategoryName 
}: AITestModalProps) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const sendMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await api.post('/ai/chat', {
        professionalId,
        subcategoryId,
        message: userMessage,
        mode,
        conversationHistory: conversation
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Aggiungi la risposta dell'AI alla conversazione
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.data?.message || 'Risposta non disponibile',
          timestamp: new Date()
        }
      ]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella comunicazione con l\'AI');
      console.error('Errore AI:', error);
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;

    // Aggiungi il messaggio dell'utente alla conversazione
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    
    // Invia il messaggio all'AI
    sendMessage.mutate(message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">
              Test AI - Modalità {mode === 'professional' ? 'Professionista' : 'Cliente'}
            </h2>
            {subcategoryName && (
              <span className="text-sm text-gray-500">({subcategoryName})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <CpuChipIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inizia una conversazione con l'assistente AI</p>
              <p className="text-sm mt-2">
                L'AI risponderà in base alle impostazioni configurate per {' '}
                {mode === 'professional' ? 'i professionisti' : 'i clienti'}
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <CpuChipIcon className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {sendMessage.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <CpuChipIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="px-4 py-2 rounded-lg bg-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Scrivi un messaggio..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={sendMessage.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Invia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
