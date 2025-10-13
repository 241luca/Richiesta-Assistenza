import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import { BellIcon, LinkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function WhatsAppWebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Recupera stato webhook
  const { data: webhookStatus, refetch } = useQuery({
    queryKey: ['whatsapp-webhook-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/webhook-status');
      return response.data?.data ?? response.data;
    }
  });
  
  // Configura webhook
  const configureMutation = useMutation({
    mutationFn: (url: string) => api.post('/whatsapp/configure-webhook', { webhookUrl: url }),
    onSuccess: () => {
      toast.success('Webhook configurato con successo!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore configurazione webhook');
    }
  });
  
  // Recupera messaggi ricevuti
  const { data: receivedMessages } = useQuery({
    queryKey: ['whatsapp-messages-received'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/messages/received?limit=10');
      return response.data?.data ?? response.data;
    },
    refetchInterval: 5000 // Aggiorna ogni 5 secondi
  });
  
  const handleConfigure = () => {
    if (!webhookUrl) {
      toast.error('Inserisci un URL webhook valido');
      return;
    }
    
    if (!webhookUrl.startsWith('https://')) {
      toast.error('Il webhook deve essere HTTPS');
      return;
    }
    
    configureMutation.mutate(webhookUrl);
  };
  
  // Genera URL webhook suggerito
  const suggestedUrl = `${window.location.origin}/api/whatsapp/webhook`;
  
  return (
    <div className="space-y-6">
      {/* Stato Webhook */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Configurazione Webhook
          </h3>
          {webhookStatus?.configured ? (
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              Configurato
            </span>
          ) : (
            <span className="flex items-center text-gray-400">
              <XCircleIcon className="h-5 w-5 mr-1" />
              Non configurato
            </span>
          )}
        </div>
        
        {webhookStatus?.configured && webhookStatus?.webhookUrl && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>URL Webhook attivo:</strong>
            </p>
            <p className="text-xs font-mono mt-1 break-all">
              {webhookStatus.webhookUrl}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Webhook per ricevere messaggi
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://tuodominio.com/api/whatsapp/webhook"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleConfigure}
                disabled={configureMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {configureMutation.isPending ? 'Configurando...' : 'Configura'}
              </button>
            </div>
            
            {/* Suggerimento URL */}
            <button
              onClick={() => setWebhookUrl(suggestedUrl)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Usa URL suggerito: {suggestedUrl}
            </button>
          </div>
          
          {/* Istruzioni */}
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showInstructions ? '▼' : '▶'} Come configurare il webhook?
            </button>
            
            {showInstructions && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Il webhook deve essere un URL HTTPS pubblicamente accessibile</li>
                  <li>Se stai testando in locale, usa un servizio come ngrok:
                    <pre className="mt-1 p-2 bg-gray-800 text-gray-100 rounded text-xs">
                      ngrok http 3200
                    </pre>
                  </li>
                  <li>Copia l'URL ngrok e aggiungi <code>/api/whatsapp/webhook</code></li>
                  <li>Esempio: <code>https://abc123.ngrok.io/api/whatsapp/webhook</code></li>
                  <li>Configura questo URL qui sopra</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Messaggi Ricevuti */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Ultimi Messaggi Ricevuti
        </h3>
        
        {receivedMessages?.messages?.length > 0 ? (
          <div className="space-y-3">
            {receivedMessages.messages.map((msg: any) => (
              <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Da: {msg.phoneNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                    {msg.mediaUrl && (
                      <a 
                        href={msg.mediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        📎 Media allegato
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">
                      📨 Ricevuto: {msg.receivedAt 
                        ? new Date(msg.receivedAt).toLocaleString('it-IT') 
                        : new Date(msg.createdAt).toLocaleString('it-IT')
                      }
                    </span>
                    {msg.sentAt && msg.sentAt !== msg.receivedAt && (
                      <span className="text-xs text-gray-400 block mt-1">
                        ✍️ Inviato: {new Date(msg.sentAt).toLocaleString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Nessun messaggio ricevuto. Configura il webhook per ricevere messaggi.
          </p>
        )}
      </div>
    </div>
  );
}