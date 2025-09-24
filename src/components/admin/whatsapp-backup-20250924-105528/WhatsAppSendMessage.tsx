import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  PaperAirplaneIcon,
  PhoneIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppSendMessage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Mutation per inviare messaggio
  const sendMutation = useMutation({
    mutationFn: (data: { recipient: string; message: string }) => 
      api.post('/whatsapp/send', data),
    onSuccess: (response) => {
      toast.success('Messaggio inviato con successo!');
      setMessage(''); // Pulisci il messaggio ma mantieni il numero
      setSending(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio messaggio');
      setSending(false);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!phoneNumber || !message) {
      toast.error('Inserisci numero e messaggio');
      return;
    }
    
    // Formatta numero (rimuovi spazi e caratteri non numerici)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Aggiungi prefisso Italia se manca
    let formattedNumber = cleanNumber;
    if (!cleanNumber.startsWith('39') && cleanNumber.length === 10) {
      formattedNumber = '39' + cleanNumber;
    }
    
    setSending(true);
    sendMutation.mutate({
      recipient: formattedNumber,  // Cambiato da phoneNumber a recipient
      message: message.trim()
    });
  };
  
  // Numeri di esempio per test
  const testNumbers = [
    { label: 'Test Cliente 1', number: '3331234567' },
    { label: 'Test Cliente 2', number: '3339876543' },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Numero Telefono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <PhoneIcon className="inline h-4 w-4 mr-1" />
            Numero Destinatario
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Es: 3331234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: solo numeri, senza + o spazi. Es: 3331234567 (per Italia)
              </p>
            </div>
          </div>
          
          {/* Numeri Test Rapidi */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Test rapido:</span>
            {testNumbers.map((test) => (
              <button
                key={test.number}
                type="button"
                onClick={() => setPhoneNumber(test.number)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Messaggio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ChatBubbleLeftIcon className="inline h-4 w-4 mr-1" />
            Messaggio
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi il tuo messaggio..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={sending}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {message.length} caratteri
            </p>
            <p className="text-xs text-gray-500">
              Max 4096 caratteri
            </p>
          </div>
        </div>
        
        {/* Template Messaggi */}
        <div>
          <p className="text-sm text-gray-700 mb-2">Messaggi Rapidi:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMessage('Ciao! Grazie per averci contattato. Come possiamo aiutarti?')}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Benvenuto
            </button>
            <button
              type="button"
              onClick={() => setMessage('Il tuo preventivo è pronto. Puoi visualizzarlo accedendo al tuo account.')}
              className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Preventivo Pronto
            </button>
            <button
              type="button"
              onClick={() => setMessage('Confermiamo l\'appuntamento per domani. Ti contatteremo 30 minuti prima dell\'arrivo.')}
              className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Conferma Appuntamento
            </button>
          </div>
        </div>
        
        {/* Pulsante Invio */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || !phoneNumber || !message}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            {sending ? 'Invio in corso...' : 'Invia Messaggio'}
          </button>
        </div>
      </form>
      
      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informazioni</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• I messaggi vengono inviati tramite WhatsApp Business</li>
          <li>• Il destinatario deve avere WhatsApp attivo</li>
          <li>• Puoi inviare testo, emoji e link</li>
          <li>• I messaggi inviati vengono salvati nel database</li>
        </ul>
      </div>
    </div>
  );
}