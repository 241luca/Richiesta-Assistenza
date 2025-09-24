import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function WhatsAppMessages() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!recipient || !message) {
      toast.error('Inserisci numero e messaggio');
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/whatsapp/send', {
        recipient,
        message
      });
      
      if (response.data.success) {
        toast.success('Messaggio inviato!');
        setMessage('');
      } else {
        toast.error(response.data.message || 'Errore invio');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
    }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Invia Messaggio WhatsApp
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numero destinatario
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="es: 3401234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Inserisci il numero senza +39
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Messaggio
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Scrivi il tuo messaggio..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        
        <button
          onClick={sendMessage}
          disabled={sending || !recipient || !message}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            'Invio in corso...'
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Invia Messaggio
            </>
          )}
        </button>
      </div>
    </div>
  );
}