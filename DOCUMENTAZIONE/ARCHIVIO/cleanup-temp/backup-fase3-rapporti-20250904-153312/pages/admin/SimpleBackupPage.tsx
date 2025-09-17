// 🚀 SISTEMA BACKUP COMPLETO CON TAB INFO E PULIZIA
// src/pages/admin/SimpleBackupPage.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowDownTrayIcon, 
  TrashIcon, 
  ServerIcon,
  CodeBracketIcon,
  PaperClipIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  FolderIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { apiClient } from '../../services/api';

interface Backup {
  id: string;
  type: 'DATABASE' | 'CODE' | 'UPLOADS';
  filename: string;
  filepath: string;
  fileSize: string;
  createdAt: string;
}

interface BackupStats {
  total: number;
  valid: number;
  byType: {
    database: number;
    code: number;
    uploads: number;
  };
  totalSize: string;
}

const SimpleBackupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [creatingBackup, setCreatingBackup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backup' | 'info'>('backup');
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  // Query per lista backup
  const { data: backups = [], isLoading, refetch } = useQuery<Backup[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await apiClient.get('/backup');
      return response.data.data || [];
    },
    refetchInterval: 5000, // Refresh ogni 5 secondi
  });

  // Query per statistiche
  const { data: stats } = useQuery<BackupStats>({
    queryKey: ['backup-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/backup/stats');
      return response.data.data;
    },
  });

  // Mutation per creare backup
  const createBackupMutation = useMutation({
    mutationFn: async (type: 'database' | 'code' | 'uploads' | 'all') => {
      setCreatingBackup(type);
      const response = await apiClient.post(`/backup/${type}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Backup ${variables} completato!`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
      setCreatingBackup(null);
    },
    onError: (error: any, variables) => {
      const message = error.response?.data?.message || error.message || 'Backup fallito';
      toast.error(`Errore backup ${variables}: ${message}`);
      setCreatingBackup(null);
    },
  });

  // Mutation per eliminare backup
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await apiClient.delete(`/backup/${backupId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Backup eliminato!');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Errore eliminazione';
      toast.error(`Errore eliminazione: ${message}`);
    },
  });

  // Mutation per pulizia backup sviluppo
  const cleanupDevBackupsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/backup/cleanup-dev');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Pulizia completata! ${data.data.deletedCount} file eliminati`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
      setShowCleanupModal(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la pulizia';
      toast.error(message);
    },
  });

  // Funzione per download
  const downloadBackup = (backupId: string, filename: string) => {
    // Costruisci URL completo per il download con token
    const token = localStorage.getItem('accessToken');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3200';
    window.open(`${baseUrl}/api/backup/${backupId}/download?token=${token}`, '_blank');
    toast.success(`Download ${filename} avviato`);
  };

  // Formatta dimensione file
  const formatFileSize = (bytes: string): string => {
    const size = parseInt(bytes);
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + ' MB';
    return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  // Icona per tipo backup
  const getBackupIcon = (type: string) => {
    switch (type) {
      case 'DATABASE':
        return <ServerIcon className="h-5 w-5 text-blue-500" />;
      case 'CODE':
        return <CodeBracketIcon className="h-5 w-5 text-green-500" />;
      case 'UPLOADS':
        return <PaperClipIcon className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  // Raggruppa backup per tipo
  const backupsByType = {
    DATABASE: backups.filter(b => b.type === 'DATABASE'),
    CODE: backups.filter(b => b.type === 'CODE'),
    UPLOADS: backups.filter(b => b.type === 'UPLOADS'),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sistema Backup</h1>
        <p className="text-gray-600 mt-2">
          Gestione backup semplice e affidabile per database, codice e allegati
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('backup')}
              className={`${
                activeTab === 'backup'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <ServerIcon className="h-5 w-5" />
              Gestione Backup
            </button>
            
            <button
              onClick={() => setActiveTab('info')}
              className={`${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <InformationCircleIcon className="h-5 w-5" />
              Informazioni Sistema
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'backup' ? (
        <>
          {/* Statistiche */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Backup Totali</p>
                    <p className="text-2xl font-bold">{stats.valid}</p>
                  </div>
                  <CheckCircleIcon className="h-10 w-10 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="text-2xl font-bold">{stats.byType.database}</p>
                  </div>
                  <ServerIcon className="h-10 w-10 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Codice</p>
                    <p className="text-2xl font-bold">{stats.byType.code}</p>
                  </div>
                  <CodeBracketIcon className="h-10 w-10 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Spazio Totale</p>
                    <p className="text-2xl font-bold">{stats.totalSize}</p>
                  </div>
                  <PaperClipIcon className="h-10 w-10 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Bottoni Azione */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Crea Nuovo Backup</h2>
              
              {/* Bottone Pulizia Sviluppo */}
              <button
                onClick={() => setShowCleanupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExclamationTriangleIcon className="h-5 w-5" />
                Pulizia File Sviluppo
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => createBackupMutation.mutate('database')}
                disabled={creatingBackup !== null}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  creatingBackup === 'database'
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {creatingBackup === 'database' ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ServerIcon className="h-5 w-5" />
                )}
                Backup Database
              </button>

              <button
                onClick={() => createBackupMutation.mutate('code')}
                disabled={creatingBackup !== null}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  creatingBackup === 'code'
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {creatingBackup === 'code' ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <CodeBracketIcon className="h-5 w-5" />
                )}
                Backup Codice
              </button>

              <button
                onClick={() => createBackupMutation.mutate('uploads')}
                disabled={creatingBackup !== null}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  creatingBackup === 'uploads'
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {creatingBackup === 'uploads' ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <PaperClipIcon className="h-5 w-5" />
                )}
                Backup Allegati
              </button>

              <button
                onClick={() => createBackupMutation.mutate('all')}
                disabled={creatingBackup !== null}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  creatingBackup === 'all'
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {creatingBackup === 'all' ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-5 w-5" />
                )}
                Backup Completo
              </button>
            </div>
          </div>

          {/* Lista Backup per Tipo */}
          <div className="space-y-6">
            {Object.entries(backupsByType).map(([type, typeBackups]) => (
              <div key={type} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {getBackupIcon(type)}
                    <h3 className="text-lg font-semibold">
                      {type === 'DATABASE' && 'Database'}
                      {type === 'CODE' && 'Codice Sorgente'}
                      {type === 'UPLOADS' && 'File Allegati'}
                    </h3>
                    <span className="ml-auto bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {typeBackups.length} backup
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {typeBackups.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      Nessun backup di tipo {type}
                    </div>
                  ) : (
                    typeBackups.slice(0, 5).map((backup) => (
                      <div key={backup.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {backup.filename}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatFileSize(backup.fileSize)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Creato {format(new Date(backup.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadBackup(backup.id, backup.filename)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Scarica backup"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => {
                                if (confirm(`Eliminare ${backup.filename}?`)) {
                                  deleteBackupMutation.mutate(backup.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina backup"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Tab Info */
        <div className="space-y-6">
          {/* Info Generali */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
              Informazioni Sistema Backup
            </h2>
            <div className="prose max-w-none text-gray-600">
              <p>
                Il sistema di backup è progettato per proteggere tutti i dati critici dell'applicazione.
                Ogni tipo di backup salva informazioni specifiche in formati ottimizzati per garantire
                sicurezza e facilità di ripristino.
              </p>
            </div>
          </div>

          {/* Dettagli per tipo di backup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Backup */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <ServerIcon className="h-8 w-8 text-blue-500" />
                <h3 className="text-lg font-semibold">Backup Database</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Cosa include:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• Tutti i dati utenti</li>
                    <li>• Richieste di assistenza</li>
                    <li>• Preventivi e pagamenti</li>
                    <li>• Configurazioni sistema</li>
                    <li>• Notifiche e messaggi</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Formato:</h4>
                  <p className="text-sm text-gray-600">SQL compresso (.sql.gz)</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Ubicazione:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    backend/backups/database/
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Comando ripristino:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                    gunzip -c backup.sql.gz | psql DB_NAME
                  </code>
                </div>
              </div>
            </div>

            {/* Code Backup */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <CodeBracketIcon className="h-8 w-8 text-green-500" />
                <h3 className="text-lg font-semibold">Backup Codice</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Cosa include:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• Codice sorgente completo</li>
                    <li>• Configurazioni applicazione</li>
                    <li>• Script e utilità</li>
                    <li>• File di migrazione</li>
                    <li>• Documentazione</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Cosa esclude:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• node_modules</li>
                    <li>• .git</li>
                    <li>• File .env</li>
                    <li>• Build e dist</li>
                    <li>• File di backup</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Formato:</h4>
                  <p className="text-sm text-gray-600">TAR compresso (.tar.gz)</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Ubicazione:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    backend/backups/code/
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Comando estrazione:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                    tar -xzf backup.tar.gz
                  </code>
                </div>
              </div>
            </div>

            {/* Uploads Backup */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <PaperClipIcon className="h-8 w-8 text-purple-500" />
                <h3 className="text-lg font-semibold">Backup Allegati</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Cosa include:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• Foto e immagini caricate</li>
                    <li>• Documenti PDF</li>
                    <li>• File Excel/Word</li>
                    <li>• Avatar utenti</li>
                    <li>• Allegati richieste</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Formato:</h4>
                  <p className="text-sm text-gray-600">TAR compresso (.tar.gz)</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Ubicazione:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    backend/backups/uploads/
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Directory originale:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    uploads/
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Comando ripristino:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                    tar -xzf backup.tar.gz -C /
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Info Tecniche */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderIcon className="h-6 w-6 text-indigo-500" />
              Struttura Directory Backup
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-700">
                richiesta-assistenza/
                <br />
                └── backend/
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;└── backups/
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── database/
                <span className="text-gray-500"> # Backup database PostgreSQL</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── db-2025-09-03-10-30-00.sql.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── db-2025-09-03-14-00-00.sql.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── code/
                <span className="text-gray-500"> # Backup codice sorgente</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── code-2025-09-03-10-30-00.tar.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── code-2025-09-03-14-00-00.tar.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── uploads/
                <span className="text-gray-500"> # Backup file allegati</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── uploads-2025-09-03-10-30-00.tar.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── uploads-2025-09-03-14-00-00.tar.gz
              </div>
            </div>
          </div>

          {/* Info Pulizia File Sviluppo */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-900">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              Pulizia File di Sviluppo
            </h3>
            
            <div className="space-y-4 text-sm text-orange-800">
              <div>
                <h4 className="font-medium text-orange-900">Cosa fa la pulizia:</h4>
                <p className="mt-1">
                  Durante lo sviluppo del progetto vengono creati automaticamente molti file temporanei
                  di backup per sicurezza. Questi file occupano spazio e non sono necessari una volta
                  completate le modifiche.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-900">File che verranno eliminati:</h4>
                <ul className="mt-2 space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <div>
                      <code className="bg-orange-100 px-1 rounded">*.backup-*</code>
                      <span className="text-orange-700 ml-2">File di backup automatici creati prima delle modifiche</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <div>
                      <code className="bg-orange-100 px-1 rounded">fix-*.sh</code>
                      <span className="text-orange-700 ml-2">Script di correzione temporanei</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <div>
                      <code className="bg-orange-100 px-1 rounded">test-*.sh</code>
                      <span className="text-orange-700 ml-2">Script di test temporanei</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <div>
                      <code className="bg-orange-100 px-1 rounded">*.fixed.ts</code>
                      <span className="text-orange-700 ml-2">File TypeScript corretti temporaneamente</span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-900">File che NON verranno toccati:</h4>
                <ul className="mt-2 space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Backup ufficiali in <code className="bg-green-100 px-1 rounded">backend/backups/</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Codice sorgente del progetto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>File di configurazione (.env, package.json, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Database e dati utente</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-900">Quando usare la pulizia:</h4>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Dopo una sessione intensa di sviluppo</li>
                  <li>• Quando il progetto diventa lento</li>
                  <li>• Prima di fare un commit su Git</li>
                  <li>• Per liberare spazio su disco</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                <p className="font-medium text-green-900 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Operazione Sicura:
                </p>
                <p className="mt-1 text-green-800">
                  La pulizia è completamente sicura e non elimina mai file importanti.
                  Elimina solo file temporanei che vengono ricreati automaticamente se necessario.
                </p>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-orange-900">Esempio di file che verranno eliminati:</h4>
                <div className="mt-2 bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                  <div className="text-green-400"># File temporanei trovati:</div>
                  <div>src/routes.tsx.backup-20250903-103045</div>
                  <div>backend/src/server.ts.backup-fix-20250903-104512</div>
                  <div>fix-routes-backup.sh</div>
                  <div>test-backup-endpoint.sh</div>
                  <div>backend/src/services/simple-backup.service.fixed.ts</div>
                  <div className="text-yellow-400 mt-2"># Totale: 5 file (2.3 MB)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Consigli Best Practice */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              Best Practices e Consigli
            </h3>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h4 className="font-medium">Frequenza consigliata:</h4>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• Database: Giornaliero (automatico in produzione)</li>
                  <li>• Codice: Prima di ogni deploy o modifica importante</li>
                  <li>• Allegati: Settimanale o dopo upload massivi</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Storage e Retention:</h4>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• Mantieni almeno 7 giorni di backup giornalieri</li>
                  <li>• Conserva backup settimanali per 1 mese</li>
                  <li>• Archivia backup mensili per 1 anno</li>
                  <li>• Scarica backup importanti su storage esterno</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Sicurezza:</h4>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• I backup contengono dati sensibili - conservali in modo sicuro</li>
                  <li>• Cripta i backup prima di trasferirli su cloud pubblici</li>
                  <li>• Testa periodicamente il ripristino dei backup</li>
                  <li>• Documenta le procedure di ripristino</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
                <p className="font-medium text-yellow-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Nota Sviluppo:
                </p>
                <p className="mt-1 text-yellow-800">
                  Durante lo sviluppo vengono creati molti file temporanei con estensione .backup-*, 
                  usa il bottone "Pulizia File Sviluppo" per rimuoverli periodicamente e liberare spazio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && activeTab === 'backup' && (
        <div className="flex justify-center items-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}

      {/* Modal Conferma Pulizia */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <h3 className="text-lg font-semibold">Conferma Pulizia File Sviluppo</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Questa operazione eliminerà TUTTI i file temporanei di backup creati durante lo sviluppo:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• File con estensione .backup-*</li>
              <li>• File temporanei nelle directory di progetto</li>
              <li>• Script temporanei di fix</li>
              <li>• NON elimina i backup ufficiali nel sistema</li>
            </ul>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={() => cleanupDevBackupsMutation.mutate()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Procedi con la Pulizia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBackupPage;
