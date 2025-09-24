import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  CloudArrowUpIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppHealthDashboard() {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Query per stato sistema
  const { data: systemInfo, refetch: refetchSystem } = useQuery({
    queryKey: ['whatsapp-system-info'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/info');
      return response.data.data;
    },
    refetchInterval: 10000 // Aggiorna ogni 10 secondi
  });
  
  // Query per statistiche
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/stats');
      return response.data.data;
    },
    refetchInterval: 30000 // Aggiorna ogni 30 secondi
  });
  
  // Query per stato connessione
  const { data: connectionStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data;
    },
    refetchInterval: 5000 // Aggiorna ogni 5 secondi
  });
  
  const handleBackupNow = async () => {
    try {
      await api.post('/whatsapp/session/backup');
      alert('✅ Backup sessione creato con successo!');
    } catch (error) {
      alert('❌ Errore durante il backup');
    }
  };
  
  const handleRestoreSession = async () => {
    if (!confirm('Vuoi davvero ripristinare una sessione salvata? WhatsApp verrà riavviato.')) {
      return;
    }
    
    try {
      await api.post('/whatsapp/session/restore');
      alert('✅ Sessione ripristinata! Riavvio in corso...');
      refetchSystem();
    } catch (error) {
      alert('❌ Errore durante il ripristino');
    }
  };
  
  const handleToggleAutoSave = async () => {
    try {
      const newState = !autoSaveEnabled;
      await api.post('/whatsapp/session/autosave', { enabled: newState });
      setAutoSaveEnabled(newState);
      alert(newState ? '✅ Auto-save attivato' : '⚠️ Auto-save disattivato');
    } catch (error) {
      alert('❌ Errore cambio stato auto-save');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <HeartIcon className="h-8 w-8 mr-2 text-red-500" />
        WhatsApp Health Monitor & Session Manager
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card Stato Connessione */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Connessione</h3>
            {connectionStatus?.connected ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-bold">
            {connectionStatus?.connected ? 'CONNESSO' : 'DISCONNESSO'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Health Check attivo
          </p>
        </div>
        
        {/* Card Session Manager */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Session Manager</h3>
            <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-lg font-semibold">
            {systemInfo?.sessionManager?.hasStoredSession ? 
              'Sessione Salvata' : 'Nessuna Sessione'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Auto-save: {systemInfo?.sessionManager?.autoSave ? 'ON' : 'OFF'}
          </p>
        </div>
        
        {/* Card Health Monitor */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Health Monitor</h3>
            <ClockIcon className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-lg font-semibold">
            {systemInfo?.healthMonitor?.enabled ? 'ATTIVO' : 'INATTIVO'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Check ogni {(systemInfo?.healthMonitor?.checkInterval || 30000) / 1000}s
          </p>
        </div>
      </div>
      
      {/* Statistiche Messaggi */}
      {stats && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">📊 Statistiche</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {stats.messages?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Totale Messaggi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {stats.messages?.sent || 0}
              </p>
              <p className="text-sm text-gray-600">Inviati</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {stats.messages?.received || 0}
              </p>
              <p className="text-sm text-gray-600">Ricevuti</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {stats.contacts?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Contatti</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Azioni Session Manager */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🛠️ Gestione Sessione</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBackupNow}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Backup Ora
          </button>
          
          <button
            onClick={handleRestoreSession}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Ripristina Sessione
          </button>
          
          <button
            onClick={handleToggleAutoSave}
            className={`flex items-center px-4 py-2 rounded-lg ${
              autoSaveEnabled 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            {autoSaveEnabled ? 'Disattiva' : 'Attiva'} Auto-Save
          </button>
        </div>
      </div>
      
      {/* Info Tecniche */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">ℹ️ Come funziona:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Session Manager</strong>: Salva la sessione su 3 livelli (File, Database, Redis)</li>
          <li>• <strong>Auto-Save</strong>: Salva automaticamente ogni 5 minuti quando connesso</li>
          <li>• <strong>Health Monitor</strong>: Controlla lo stato ogni 30 secondi e riconnette se necessario</li>
          <li>• <strong>Backup</strong>: Crea copie di sicurezza della sessione per emergenze</li>
          <li>• <strong>Crittografia</strong>: Tutte le sessioni sono criptate con AES-256-GCM</li>
        </ul>
      </div>
    </div>
  );
}
