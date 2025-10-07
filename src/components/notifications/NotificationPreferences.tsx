import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface NotificationType {
  code: string;
  name: string;
  description: string;
  channels: {
    database: boolean;
    websocket: boolean;
    email: boolean;
    sms: boolean;
  };
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  notificationTypes: Record<string, NotificationType>;
}

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Carica preferenze utente
  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/user/notification-preferences');
      return response.data;
    },
    onSuccess: (data) => {
      setPreferences(data);
    }
  });

  // Salva preferenze
  const saveMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      return api.put('/user/notification-preferences', prefs);
    },
    onSuccess: () => {
      toast.success('Preferenze notifiche salvate!');
      setHasChanges(false);
      queryClient.invalidateQueries(['notification-preferences']);
    },
    onError: () => {
      toast.error('Errore nel salvataggio preferenze');
    }
  });

  // Lista notifiche per gli interventi
  const interventionNotifications = [
    {
      code: 'INTERVENTIONS_PROPOSED',
      name: '📅 Nuovi Interventi Proposti',
      description: 'Quando un professionista propone date per gli interventi',
      icon: <CalendarDaysIcon className="h-5 w-5" />,
      color: 'text-yellow-600'
    },
    {
      code: 'INTERVENTION_ACCEPTED',
      name: '✅ Intervento Accettato',
      description: 'Quando il cliente accetta una data proposta',
      icon: <CheckCircleIcon className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      code: 'INTERVENTION_REJECTED',
      name: '❌ Intervento Rifiutato',
      description: 'Quando il cliente rifiuta una data proposta',
      icon: <XCircleIcon className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      code: 'INTERVENTION_REMINDER',
      name: '⏰ Promemoria Intervento',
      description: '24 ore prima di un intervento programmato',
      icon: <ClockIcon className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      code: 'ALL_INTERVENTIONS_CONFIRMED',
      name: '🎯 Tutti Confermati',
      description: 'Quando tutti gli interventi sono stati confermati',
      icon: <CheckIcon className="h-5 w-5" />,
      color: 'text-indigo-600'
    }
  ];

  // Toggle canale per tipo notifica
  const toggleChannel = (notificationType: string, channel: string) => {
    if (!preferences) return;

    const updated = { ...preferences };
    if (!updated.notificationTypes[notificationType]) {
      updated.notificationTypes[notificationType] = {
        code: notificationType,
        name: '',
        description: '',
        channels: {
          database: true,
          websocket: true,
          email: false,
          sms: false
        }
      };
    }

    updated.notificationTypes[notificationType].channels[channel] = 
      !updated.notificationTypes[notificationType].channels[channel];

    setPreferences(updated);
    setHasChanges(true);
  };

  // Toggle globale per canale
  const toggleGlobalChannel = (channel: 'emailNotifications' | 'pushNotifications' | 'smsNotifications') => {
    if (!preferences) return;
    
    const updated = { ...preferences };
    updated[channel] = !updated[channel];
    setPreferences(updated);
    setHasChanges(true);
  };

  // Imposta orari "non disturbare"
  const setQuietHours = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    if (!preferences) return;
    
    const updated = { ...preferences };
    updated[field] = value;
    setPreferences(updated);
    setHasChanges(true);
  };

  if (isLoading || !preferences) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Preferenze Notifiche
        </h2>
        <p className="text-sm text-gray-600">
          Personalizza come e quando ricevere le notifiche
        </p>
      </div>

      {/* Impostazioni Globali */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Impostazioni Generali
        </h3>
        
        <div className="space-y-4">
          {/* Email globali */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Notifiche Email</p>
                <p className="text-sm text-gray-600">Ricevi notifiche via email</p>
              </div>
            </div>
            <button
              onClick={() => toggleGlobalChannel('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailNotifications ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <BellIcon className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Notifiche Push</p>
                <p className="text-sm text-gray-600">Notifiche real-time nel browser</p>
              </div>
            </div>
            <button
              onClick={() => toggleGlobalChannel('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.pushNotifications ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Notifiche SMS</p>
                <p className="text-sm text-gray-600">Ricevi SMS per notifiche importanti</p>
              </div>
            </div>
            <button
              onClick={() => toggleGlobalChannel('smsNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.smsNotifications ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Orari Non Disturbare */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-3">
              <ClockIcon className="h-5 w-5 text-gray-600 mr-3" />
              <p className="font-medium text-gray-900">Orari "Non Disturbare"</p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm text-gray-600">Dalle</label>
                <input
                  type="time"
                  value={preferences.quietHoursStart || ''}
                  onChange={(e) => setQuietHours('quietHoursStart', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Alle</label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd || ''}
                  onChange={(e) => setQuietHours('quietHoursEnd', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifiche Interventi */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notifiche Interventi Programmati
        </h3>
        
        <div className="space-y-3">
          {interventionNotifications.map((notification) => {
            const prefs = preferences.notificationTypes[notification.code] || {
              channels: { database: true, websocket: true, email: false, sms: false }
            };

            return (
              <div key={notification.code} className="border rounded-lg p-4">
                <div className="mb-3">
                  <div className="flex items-center">
                    <span className={`${notification.color} mr-2`}>
                      {notification.icon}
                    </span>
                    <h4 className="font-medium text-gray-900">
                      {notification.name}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.description}
                  </p>
                </div>

                <div className="flex space-x-4">
                  {/* Campanella (sempre attiva) */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-500">🔔 Sistema</span>
                  </label>

                  {/* Email */}
                  {preferences.emailNotifications && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={prefs.channels.email}
                        onChange={() => toggleChannel(notification.code, 'email')}
                        className="rounded text-blue-600 mr-2"
                      />
                      <span className="text-sm">📧 Email</span>
                    </label>
                  )}

                  {/* Push */}
                  {preferences.pushNotifications && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={prefs.channels.websocket}
                        onChange={() => toggleChannel(notification.code, 'websocket')}
                        className="rounded text-blue-600 mr-2"
                      />
                      <span className="text-sm">💬 Push</span>
                    </label>
                  )}

                  {/* SMS */}
                  {preferences.smsNotifications && notification.code === 'INTERVENTION_REMINDER' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={prefs.channels.sms}
                        onChange={() => toggleChannel(notification.code, 'sms')}
                        className="rounded text-blue-600 mr-2"
                      />
                      <span className="text-sm">📱 SMS</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pulsante Salva */}
      {hasChanges && (
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={() => saveMutation.mutate(preferences)}
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva Preferenze'}
          </button>
        </div>
      )}
    </div>
  );
}
