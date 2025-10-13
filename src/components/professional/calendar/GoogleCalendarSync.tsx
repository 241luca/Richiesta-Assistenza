import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../../services/api';

interface GoogleCalendarSyncProps {
  onClose: () => void;
}

export default function GoogleCalendarSync({ onClose }: GoogleCalendarSyncProps) {
  const queryClient = useQueryClient();
  const [syncDirection, setSyncDirection] = useState<'import' | 'export' | 'both'>('both');
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 giorni
  });

  // Verifica stato connessione Google
  const { data: connectionStatus, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      try {
        const response = await api.get('/calendar/google/status');
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Error fetching Google Calendar status:', error);
        return { connected: false };
      }
    }
  });

  // Fetch calendari disponibili (se connesso)
  const { data: calendars, isLoading: loadingCalendars } = useQuery({
    queryKey: ['google-calendars'],
    queryFn: async () => {
      const response = await api.get('/calendar/google/calendars');
      return response.data?.data || response.data || [];
    },
    enabled: connectionStatus?.connected === true
  });

  // Mutation per connettere Google Calendar
  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      console.log('Avvio connessione Google Calendar...');
      const response = await api.post('/calendar/google/connect');
      console.log('Risposta dal backend:', response);
      
      // Il ResponseFormatter wrappa i dati in response.data.data
      const authUrl = response.data?.data?.authUrl || response.data?.authUrl;
      console.log('authUrl estratto:', authUrl);
      
      if (authUrl) {
        // Apri l'URL di autorizzazione Google
        window.open(authUrl, '_blank', 'width=600,height=700');
      } else {
        console.error('Nessun authUrl ricevuto dal backend');
        throw new Error('URL di autorizzazione non ricevuto');
      }
      
      return { authUrl };
    },
    onSuccess: (data) => {
      if (data?.authUrl) {
        toast.success('Segui le istruzioni nella nuova finestra per autorizzare Google Calendar');
        
        // Controlla periodicamente se l'autorizzazione è stata completata
        const checkInterval = setInterval(() => {
          refetchStatus();
        }, 2000);
        
        // Ferma il controllo dopo 60 secondi
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 60000);
      } else {
        toast.error('URL di autorizzazione non ricevuto');
      }
    },
    onError: (error: any) => {
      console.error('Errore connessione Google:', error);
      const message = error.response?.data?.message || error.message || 'Errore nella connessione a Google Calendar';
      toast.error(message);
    }
  });

  // Mutation per disconnettere Google Calendar
  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/calendar/google/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      toast.success('Google Calendar disconnesso');
    },
    onError: () => {
      toast.error('Errore nella disconnessione');
    }
  });

  // Mutation per sincronizzare
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/calendar/google/sync', {
        direction: syncDirection,
        calendarId: selectedCalendar,
        dateRange
      });
    },
    onSuccess: (response) => {
      const data = response.data?.data || response.data;
      queryClient.invalidateQueries({ queryKey: ['professional-interventions'] });
      toast.success(`Sincronizzazione completata! ${data?.synced || 0} eventi sincronizzati`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la sincronizzazione');
    }
  });

  const handleConnect = () => {
    connectGoogleMutation.mutate();
  };

  const handleDisconnect = () => {
    if (window.confirm('Vuoi davvero disconnettere Google Calendar?')) {
      disconnectGoogleMutation.mutate();
    }
  };

  const handleSync = () => {
    if (!selectedCalendar && connectionStatus?.connected) {
      toast.error('Seleziona un calendario');
      return;
    }
    syncMutation.mutate();
  };

  if (loadingStatus) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1" />
            </svg>
            Sincronizzazione Google Calendar
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stato Connessione */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stato Connessione</h3>
            
            {connectionStatus?.connected ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">Google Calendar Connesso</p>
                      <p className="text-sm text-green-700 mt-1">
                        Account: {connectionStatus.email || 'Account Google'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Disconnetti
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mr-3" />
                    <div>
                      <p className="font-medium text-amber-900">Google Calendar Non Connesso</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Connetti il tuo account Google per sincronizzare gli eventi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={connectGoogleMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {connectGoogleMutation.isPending ? 'Connessione...' : 'Connetti Google'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {connectionStatus?.connected && (
            <>
              {/* Impostazioni Sincronizzazione */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Impostazioni Sincronizzazione</h3>
                
                <div className="space-y-4">
                  {/* Selezione Calendario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calendario Google
                    </label>
                    {loadingCalendars ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <select
                        value={selectedCalendar}
                        onChange={(e) => setSelectedCalendar(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleziona un calendario...</option>
                        {Array.isArray(calendars) && calendars.map((cal: any) => (
                          <option key={cal.id} value={cal.id}>
                            {cal.summary || cal.name || 'Calendario principale'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Direzione Sincronizzazione */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direzione Sincronizzazione
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="import"
                          checked={syncDirection === 'import'}
                          onChange={(e) => setSyncDirection(e.target.value as any)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Importa da Google Calendar → Sistema
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="export"
                          checked={syncDirection === 'export'}
                          onChange={(e) => setSyncDirection(e.target.value as any)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Esporta dal Sistema → Google Calendar
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="both"
                          checked={syncDirection === 'both'}
                          onChange={(e) => setSyncDirection(e.target.value as any)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Sincronizzazione bidirezionale ↔️
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Intervallo Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Inizio
                      </label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Fine
                      </label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Come funziona la sincronizzazione:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Importa</strong>: Gli eventi di Google Calendar verranno aggiunti come interventi nel sistema</li>
                  <li>• <strong>Esporta</strong>: Gli interventi del sistema verranno creati come eventi in Google Calendar</li>
                  <li>• <strong>Bidirezionale</strong>: Mantiene sincronizzati entrambi i calendari</li>
                </ul>
              </div>

              {/* Pulsante Sincronizza */}
              <button
                onClick={handleSync}
                disabled={!selectedCalendar || syncMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {syncMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Sincronizzazione in corso...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Avvia Sincronizzazione
                  </>
                )}
              </button>
            </>
          )}

          {!connectionStatus?.connected && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vantaggi della Sincronizzazione</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Visualizza tutti i tuoi impegni in un unico calendario</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Ricevi promemoria automatici sul tuo telefono</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Condividi il calendario con il tuo team</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Evita sovrapposizioni di appuntamenti</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
