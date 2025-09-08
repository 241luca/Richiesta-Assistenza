import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AiChatProps {
  requestId?: string;
  subcategoryId?: string;
  conversationType?: 'client_help' | 'professional_help' | 'system_help';
  initialMessage?: string;
  className?: string;
  forceOpen?: boolean; // Nuova prop per controllare dall'esterno
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function AiChatComplete({ 
  requestId, 
  subcategoryId, 
  conversationType = 'client_help',
  initialMessage,
  className = '',
  forceOpen = false // Nuovo parametro
}: AiChatProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sincronizza con forceOpen quando cambia
  useEffect(() => {
    setIsOpen(forceOpen);
  }, [forceOpen]);

  // Check AI health status
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => api.get('/ai/health'),
    refetchInterval: 60000 // Check every minute
  });

  // Add initial message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = initialMessage || getWelcomeMessage();
      if (welcomeMessage) {
        setMessages([{
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, initialMessage]);

  function getWelcomeMessage() {
    switch (conversationType) {
      case 'system_help':
        return 'Ciao! Sono qui per aiutarti ad usare il Sistema Richiesta Assistenza. Come posso esserti utile?';
      case 'professional_help':
        return 'Benvenuto! Sono il tuo assistente tecnico. Posso aiutarti con consigli professionali e soluzioni tecniche.';
      case 'client_help':
      default:
        return 'Ciao! Sono qui per aiutarti con il tuo problema. Posso darti consigli immediati mentre aspetti il professionista.';
    }
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return api.post('/ai/chat', {
        message,
        requestId,
        subcategoryId,
        conversationType,
        conversationId
      });
    },
    onSuccess: (response) => {
      const { message: aiMessage, conversationId: convId } = response.data;
      
      if (convId && !conversationId) {
        setConversationId(convId);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date()
      }]);
    },
    onError: (error: any) => {
      console.error('Error sending message to AI:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: error.response?.data?.message || 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to AI
    sendMessageMutation.mutate(inputMessage);

    // Clear input
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't show button if AI is not configured
  if (aiStatus?.data?.status === 'not_configured') {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${className}`}
          title="Assistente AI"
        >
          <SparklesIcon style={{ width: '24px', height: '24px' }} />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-[480px] h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SparklesIcon style={{ width: '20px', height: '20px' }} />
              <div>
                <h3 className="font-semibold">Assistente AI</h3>
                <p className="text-xs text-blue-100">
                  {conversationType === 'system_help' ? 'Aiuto Sistema' :
                   conversationType === 'professional_help' ? 'Assistenza Tecnica' : 
                   'Supporto Cliente'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
            >
              <XMarkIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* AI Status indicator */}
          {aiStatus && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Stato AI:</span>
                <span className={`flex items-center space-x-1 ${
                  aiStatus.data.status === 'operational' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    aiStatus.data.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                  } animate-pulse`}></span>
                  <span>{aiStatus.data.status === 'operational' ? 'Operativo' : 'Configurazione'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className={`text-xs mt-1 block ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi un messaggio..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={sendMessageMutation.isPending || aiStatus?.data?.status !== 'operational'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending || aiStatus?.data?.status !== 'operational'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200"
              >
                <PaperAirplaneIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {conversationType === 'client_help' && (
                <>
                  <button
                    onClick={() => setInputMessage('È urgente questo problema?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                  >
                    È urgente?
                  </button>
                  <button
                    onClick={() => setInputMessage('Cosa posso fare mentre aspetto?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                  >
                    Cosa fare ora?
                  </button>
                </>
              )}
              {conversationType === 'professional_help' && (
                <>
                  <button
                    onClick={() => setInputMessage('Quali strumenti mi servono?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                  >
                    Strumenti necessari
                  </button>
                  <button
                    onClick={() => setInputMessage('Quanto tempo ci vuole?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                  >
                    Tempi stimati
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
