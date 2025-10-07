import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export function WhatsAppPollingControl() {
  const [customInterval, setCustomInterval] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  
  // Recupera stato polling
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-polling-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/polling/status');
      return response.data;
    },
    refetchInterval: 5000 // Aggiorna ogni 5 secondi
  });
  
  // Mutation per avviare polling
  const startMutation = useMutation({
    mutationFn: (interval: number) => 
      api.post('/whatsapp/polling/start', { interval }),
    onSuccess: () => {
      toast.success('Polling avviato!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore avvio polling');
    }
  });
  
  // Mutation per fermare polling
  const stopMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/polling/stop'),
    onSuccess: () => {
      toast.success('Polling fermato');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore stop polling');
    }
  });
  
  // Mutation per controllo manuale
  const checkMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/polling/check'),
    onSuccess: (response) => {
      const data = response.data;
      if (data.newMessages > 0) {
        toast.success(`Trovati ${data.newMessages} nuovi messaggi!`);
      } else {
        toast.success('Nessun nuovo messaggio');
      }
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore controllo messaggi');
    }
  });
  
  useEffect(() => {
    if (status?.data?.intervalSeconds) {
      setCustomInterval(status.data.intervalSeconds);
    }
  }, [status?.data?.intervalSeconds]);
  
  const isRunning = status?.data?.isRunning || false;
  const isEnabled = status?.data?.enabled || false;
  
  // Formatta ultima verifica
  const formatLastCheck = () => {
    if (!status?.data?.lastCheck) return 'Mai';
    const date = new Date(status.data.lastCheck);
    return date.toLocaleString('it-IT');
  };
  
  // Calcola prossima verifica
  const getNextCheck = () => {
    if (!isRunning || !status?.data?.lastCheck) return null;
    const lastCheck = new Date(status.data.lastCheck);
    const nextCheck = new Date(lastCheck.getTime() + ((status?.data?.intervalSeconds || 30) * 1000));
    const now = new Date();
    const secondsRemaining = Math.max(0, Math.floor((nextCheck.getTime() - now.getTime()) / 1000));
    return secondsRemaining;
  };
  
  const nextCheckSeconds = getNextCheck();
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center">
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Controllo Automatico Messaggi
            {isRunning && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
                ATTIVO
              </span>
            )}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
          >
            <CogIcon className="h-5 w-5" />
          </button>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Sistema sicuro che controlla i messaggi sul TUO server (nessun webhook esterno)
        </p>
      </div>
      
      {/* Stato attuale */}
      <div className={`mb-6 p-4 rounded-lg ${isRunning ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Stato</p>
            <p className="font-semibold flex items-center">
              {isRunning ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">Attivo</span>
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-600">Inattivo</span>
                </>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Intervallo</p>
            <p className="font-semibold">{status?.data?.intervalSeconds || 30} secondi</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Ultima verifica</p>
            <p className="font-semibold text-sm">{formatLastCheck()}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Messaggi trovati</p>
            <p className="font-semibold">{status?.data?.messagesFound || 0}</p>
          </div>
        </div>
        
        {isRunning && nextCheckSeconds !== null && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Prossima verifica in:</span>
              <span className="font-semibold text-blue-600">
                {nextCheckSeconds > 0 ? `${nextCheckSeconds} secondi` : 'In corso...'}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.max(0, 100 - (nextCheckSeconds / (status?.data?.intervalSeconds || 30) * 100))}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Impostazioni (visibili solo se espanse) */}
      {showSettings && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-3">Impostazioni</h4>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">
              Controlla ogni:
            </label>
            <select
              value={customInterval}
              onChange={(e) => setCustomInterval(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              <option value="10">10 secondi (frequente)</option>
              <option value="30">30 secondi (consigliato)</option>
              <option value="60">1 minuto</option>
              <option value="120">2 minuti</option>
              <option value="300">5 minuti</option>
              <option value="600">10 minuti</option>
              <option value="1800">30 minuti</option>
              <option value="3600">1 ora (risparmio)</option>
            </select>
            {isRunning && (
              <span className="text-sm text-orange-600">
                ⚠️ Ferma il polling per cambiare l'intervallo
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Intervalli brevi = messaggi più veloci ma più carico sul server
          </p>
        </div>
      )}
      
      {/* Controlli */}
      <div className="flex flex-wrap gap-3">
        {!isRunning ? (
          <button
            onClick={() => startMutation.mutate(customInterval)}
            disabled={startMutation.isPending || isLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {startMutation.isPending ? 'Avvio in corso...' : 'Avvia Controllo Automatico'}
          </button>
        ) : (
          <button
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <PauseIcon className="h-4 w-4 mr-2" />
            {stopMutation.isPending ? 'Arresto in corso...' : 'Ferma Controllo Automatico'}
          </button>
        )}
        
        <button
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
          {checkMutation.isPending ? 'Controllo...' : 'Controlla Ora'}
        </button>
        
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Aggiorna Stato
        </button>
      </div>
      
      {/* Info sicurezza */}
      <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          🔒 <strong>Sistema Sicuro:</strong> I messaggi vengono controllati direttamente dal TUO server. 
          Nessun dato viene esposto all'esterno, nessun webhook pubblico necessario.
        </p>
      </div>
      
      {/* Statistiche errori */}
      {status?.data?.errors > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Ci sono stati {status.data.errors} errori durante i controlli. 
            Verifica la connessione WhatsApp e le credenziali.
          </p>
        </div>
      )}
    </div>
  );
}
