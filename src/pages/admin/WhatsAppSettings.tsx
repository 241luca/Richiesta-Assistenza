/**
 * Configurazione WhatsApp Settings
 * Gestisce tutte le impostazioni del sistema WhatsApp
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface WhatsAppSettings {
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  autoReplyDelay: number;
  pollingEnabled: boolean;
  pollingInterval: number;
  notifyAdminsNewNumber: boolean;
  notifyAdminsNewMessage: boolean;
  businessHours: {
    enabled: boolean;
    monday: { start: string; end: string; closed: boolean };
    tuesday: { start: string; end: string; closed: boolean };
    wednesday: { start: string; end: string; closed: boolean };
    thursday: { start: string; end: string; closed: boolean };
    friday: { start: string; end: string; closed: boolean };
    saturday: { start: string; end: string; closed: boolean };
    sunday: { start: string; end: string; closed: boolean };
  };
}

const defaultSettings: WhatsAppSettings = {
  autoReplyEnabled: false,
  autoReplyMessage: '',
  autoReplyDelay: 0,
  pollingEnabled: false,
  pollingInterval: 30,
  notifyAdminsNewNumber: true,
  notifyAdminsNewMessage: true,
  businessHours: {
    enabled: false,
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '09:00', end: '13:00', closed: false },
    sunday: { start: '09:00', end: '13:00', closed: true }
  }
};

export default function WhatsAppSettings() {
  const [settings, setSettings] = useState<WhatsAppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Carica impostazioni esistenti
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => {
      try {
        const response = await api.get('/whatsapp/settings');
        return response.data.data;
      } catch (error) {
        // Se non ci sono impostazioni, usa quelle di default
        return null;
      }
    }
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(existingSettings);
    }
  }, [existingSettings]);

  // Mutation per salvare le impostazioni
  const saveMutation = useMutation({
    mutationFn: async (data: WhatsAppSettings) => {
      // Salva ogni impostazione come record separato nel database
      const settingsToSave = [
        { key: 'whatsapp_auto_reply_enabled', value: data.autoReplyEnabled.toString() },
        { key: 'whatsapp_auto_reply_message', value: data.autoReplyMessage },
        { key: 'whatsapp_auto_reply_delay', value: data.autoReplyDelay.toString() },
        { key: 'whatsapp_polling_enabled', value: data.pollingEnabled.toString() },
        { key: 'whatsapp_polling_interval', value: data.pollingInterval.toString() },
        { key: 'whatsapp_notify_admins_new_number', value: data.notifyAdminsNewNumber.toString() },
        { key: 'whatsapp_notify_admins_new_message', value: data.notifyAdminsNewMessage.toString() },
        { key: 'whatsapp_business_hours', value: JSON.stringify(data.businessHours) }
      ];

      // Salva tutte le impostazioni
      const promises = settingsToSave.map(setting => 
        api.post('/whatsapp/settings', setting)
      );
      
      await Promise.all(promises);
      return data;
    },
    onSuccess: () => {
      toast.success('Impostazioni WhatsApp salvate con successo!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleTestAutoReply = async () => {
    if (!settings.autoReplyMessage) {
      toast.error('Inserisci prima un messaggio di risposta automatica');
      return;
    }
    
    toast.success('Test inviato! Il messaggio verrà visualizzato nella dashboard.');
  };

  const defaultMessages = [
    {
      title: 'Professionale',
      message: 'Grazie per averci contattato. Il tuo messaggio è stato ricevuto e un nostro operatore ti risponderà al più presto durante gli orari di ufficio.'
    },
    {
      title: 'Informale',
      message: 'Ciao! 👋 Abbiamo ricevuto il tuo messaggio. Ti rispondiamo appena possibile!'
    },
    {
      title: 'Con orari',
      message: 'Grazie per il messaggio!\n\nI nostri orari:\n• Lun-Ven: 9:00-18:00\n• Sab: 9:00-13:00\n\nTi risponderemo al più presto.'
    },
    {
      title: 'Multilingua',
      message: 'Thank you for your message. We will reply as soon as possible.\n\nGrazie per il messaggio. Ti risponderemo al più presto.'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Impostazioni WhatsApp</h1>
              <p className="text-green-100">Configura il comportamento del sistema WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Risposta Automatica */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-green-600" />
              Risposta Automatica
            </h2>
            
            <div className="space-y-4">
              {/* Toggle Attivazione */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Attiva risposta automatica</label>
                  <p className="text-sm text-gray-500">
                    Invia automaticamente una risposta ai nuovi numeri
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, autoReplyEnabled: !prev.autoReplyEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoReplyEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Messaggio di risposta */}
              {settings.autoReplyEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio di risposta automatica
                    </label>
                    <textarea
                      value={settings.autoReplyMessage}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoReplyMessage: e.target.value }))}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Inserisci il messaggio che verrà inviato automaticamente..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Questo messaggio verrà inviato solo una volta ogni 24 ore per numero
                    </p>
                  </div>

                  {/* Template predefiniti */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Usa un template:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {defaultMessages.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setSettings(prev => ({ ...prev, autoReplyMessage: template.message }))}
                          className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium text-sm">{template.title}</p>
                          <p className="text-xs text-gray-500 truncate">{template.message}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delay risposta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ritardo risposta (secondi)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={settings.autoReplyDelay}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoReplyDelay: parseInt(e.target.value) || 0 }))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Attendi prima di inviare la risposta (0 = immediato)
                    </p>
                  </div>

                  {/* Test Button */}
                  <button
                    onClick={handleTestAutoReply}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Testa messaggio
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifiche Admin */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Notifiche Amministratori
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Notifica per nuovi numeri</label>
                  <p className="text-sm text-gray-500">
                    Avvisa gli admin quando arriva un messaggio da un nuovo numero
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, notifyAdminsNewNumber: !prev.notifyAdminsNewNumber }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyAdminsNewNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyAdminsNewNumber ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Notifica per ogni messaggio</label>
                  <p className="text-sm text-gray-500">
                    Avvisa gli admin per ogni messaggio ricevuto
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, notifyAdminsNewMessage: !prev.notifyAdminsNewMessage }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyAdminsNewMessage ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyAdminsNewMessage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sistema Polling */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
              Sistema di Ricezione Messaggi
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Polling automatico</label>
                  <p className="text-sm text-gray-500">
                    Controlla automaticamente nuovi messaggi
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, pollingEnabled: !prev.pollingEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pollingEnabled ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pollingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.pollingEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervallo di controllo (secondi)
                  </label>
                  <select
                    value={settings.pollingInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, pollingInterval: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="10">10 secondi</option>
                    <option value="30">30 secondi</option>
                    <option value="60">1 minuto</option>
                    <option value="120">2 minuti</option>
                    <option value="300">5 minuti</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Informazioni importanti</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>La risposta automatica viene inviata solo ai numeri non registrati</li>
                    <li>Ogni numero riceve la risposta automatica massimo una volta ogni 24 ore</li>
                    <li>Le notifiche agli admin usano il sistema di notifiche centralizzato</li>
                    <li>Il polling controlla i messaggi direttamente da SendApp</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pulsanti azione */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSettings(defaultSettings)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ripristina default
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva impostazioni'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
