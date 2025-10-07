// 🚀 SISTEMA BACKUP COMPLETO CON TAB INFO, GESTIONE CLEANUP E DOCUMENTAZIONE
// src/pages/admin/SimpleBackupPage.tsx

import React, { useState } from 'react';
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
  ExclamationTriangleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { apiClient } from '../../services/api';
import CleanupDocumentationTab from '../../components/admin/CleanupDocumentationTab';

interface Backup {
  id: string;
  type: 'DATABASE' | 'CODE' | 'UPLOADS';
  filename: string;
  filepath: string;
  fileSize?: string;
  file_size?: string;
  createdAt?: string;
  created_at?: string;
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

interface CleanupDir {
  name: string;
  path: string;
  size: string;
  createdAt: string;
  fileCount: number;
}

const SimpleBackupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [creatingBackup, setCreatingBackup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backup' | 'info' | 'cleanup' | 'docs'>('backup');
  const [showDeleteCleanupModal, setShowDeleteCleanupModal] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Query per lista backup
  const { data: backups = [], isLoading } = useQuery<Backup[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await apiClient.get('/backup');
      return response.data.data || [];
    },
    refetchInterval: 30000,  // Ogni 30 secondi invece di 5
  });

  // Query per statistiche
  const { data: stats } = useQuery<BackupStats>({
    queryKey: ['backup-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/backup/stats');
      return response.data.data;
    },
  });

  // Query per cartelle cleanup
  const { data: cleanupDirs = [], isLoading: isLoadingCleanup, refetch: refetchCleanup } = useQuery<CleanupDir[]>({
    queryKey: ['cleanup-dirs'],
    queryFn: async () => {
      const response = await apiClient.get('/backup/cleanup-dirs');
      return response.data.data || [];
    },
    enabled: activeTab === 'cleanup',
  });

  // Mutation per creare backup
  const createBackupMutation = useMutation({
    mutationFn: async (type: 'database' | 'code' | 'uploads' | 'all') => {
      setCreatingBackup(type);
      const response = await apiClient.post(`/backup/${type}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (variables === 'all') {
        const successful = data.data?.successful?.length || 0;
        const failed = data.data?.failed?.length || 0;
        if (successful > 0) {
          toast.success(`Backup completo: ${successful} creati con successo${failed > 0 ? `, ${failed} falliti` : ''}`);
        } else {
          toast.error('Backup completo fallito');
        }
      } else {
        toast.success(`Backup ${variables} completato!`);
      }
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

  // Mutation per eseguire il cleanup
  const executeCleanupMutation = useMutation({
    mutationFn: async () => {
      setCleanupLoading(true);
      const response = await apiClient.post('/backup/cleanup-dev');
      return response.data;
    },
    onSuccess: (data) => {
      const movedCount = data.data?.movedCount || 0;
      const cleanupDir = data.data?.cleanupDir || 'CLEANUP';
      toast.success(`Cleanup completato! ${movedCount} file spostati in ${cleanupDir}`);
      setCleanupLoading(false);
      // Ricarica la lista delle cartelle cleanup
      queryClient.invalidateQueries({ queryKey: ['cleanup-dirs'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante il cleanup';
      toast.error(message);
      setCleanupLoading(false);
    },
  });

  // Mutation per eliminare cartelle cleanup
  const deleteCleanupDirMutation = useMutation({
    mutationFn: async (dirName: string) => {
      const response = await apiClient.delete(`/backup/cleanup-dirs/${dirName}`, {
        data: { confirm: true }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Cartella ${variables} eliminata definitivamente!`);
      queryClient.invalidateQueries({ queryKey: ['cleanup-dirs'] });
      setShowDeleteCleanupModal(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'eliminazione';
      toast.error(message);
    },
  });

  // Funzione per download con autenticazione
  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      toast.loading('Download in corso...');
      
      // Scarica il file usando axios con il token nell'header
      const response = await apiClient.get(`/backup/${backupId}/download`, {
        responseType: 'blob',  // Importante per scaricare file binari
      });
      
      // Crea un link temporaneo per scaricare il file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Pulizia
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success(`Download ${filename} completato!`);
    } catch (error: any) {
      toast.dismiss();
      const message = error.response?.data?.message || 'Errore durante il download';
      toast.error(message);
      console.error('Download error:', error);
    }
  };

  // Formatta dimensione file
  const formatFileSize = (bytes: string | undefined): string => {
    if (!bytes) return '0 B';
    const size = parseInt(bytes);
    if (isNaN(size)) return '0 B';
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
            
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`${
                activeTab === 'cleanup'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FolderIcon className="h-5 w-5" />
              Gestione Cleanup
              {cleanupDirs.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {cleanupDirs.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('docs')}
              className={`${
                activeTab === 'docs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <BookOpenIcon className="h-5 w-5" />
              Documentazione Cleanup
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content - Backup */}
      {activeTab === 'backup' && (
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

          {/* Bottoni Azione - SENZA Pulizia File Sviluppo */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Crea Nuovo Backup</h2>
            
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
                    typeBackups.slice(0, 5).map((backup) => {
                      const createdDate = new Date(backup.created_at || backup.createdAt || '');
                      const now = new Date();
                      const diffMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
                      const isNew = diffMinutes <= 5;
                      
                      return (
                      <div key={backup.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {backup.filename}
                              </span>
                              {isNew && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  NUOVO
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {formatFileSize(backup.fileSize || backup.file_size)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Creato {(backup.createdAt || backup.created_at) ? format(new Date((backup.createdAt || backup.created_at)!), 'dd MMM yyyy HH:mm', { locale: it }) : 'Data non disponibile'}
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
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab Content - Info */}
      {activeTab === 'info' && (
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
                  <h4 className="font-medium text-gray-900">Directory incluse:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1 font-mono bg-gray-50 p-2 rounded">
                    <li>✅ /src (Frontend React)</li>
                    <li>✅ /backend/src (Backend Express)</li>
                    <li>✅ /backend/prisma (Schema database)</li>
                    <li>✅ /public (Assets pubblici)</li>
                    <li>✅ /scripts (Script di automazione)</li>
                    <li>✅ /Docs (Documentazione completa)</li>
                    <li>✅ File configurazione (package.json, tsconfig, etc.)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Directory e file esclusi:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1 font-mono bg-red-50 p-2 rounded">
                    <li>❌ node_modules (dipendenze npm)</li>
                    <li>❌ .git (repository git)</li>
                    <li>❌ .next (build Next.js)</li>
                    <li>❌ dist, build (file compilati)</li>
                    <li>❌ uploads (allegati utenti)</li>
                    <li>❌ backend/backups (backup esistenti)</li>
                    <li>❌ *.backup* (file di backup temporanei)</li>
                    <li>❌ *.log (file di log)</li>
                    <li>❌ .env (variabili ambiente sensibili)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Comando di backup:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                    tar -czf backup.tar.gz --exclude=node_modules ...
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Formato:</h4>
                  <p className="text-sm text-gray-600">TAR compresso con GZIP (.tar.gz)</p>
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
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── db-backup-*.sql.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── code/
                <span className="text-gray-500"> # Backup codice sorgente</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── code-backup-*.tar.gz
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── uploads/
                <span className="text-gray-500"> # Backup file allegati</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── uploads-backup-*.tar.gz
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
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Cleanup */}
      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          {/* Header Cleanup */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FolderIcon className="h-6 w-6 text-orange-500" />
                  Cartelle di Cleanup
                </h2>
                <p className="text-gray-600 mt-1">
                  Cartelle contenenti file temporanei spostati durante le pulizie automatiche
                </p>
              </div>
              
              {/* Bottone Avvia Cleanup */}
              <button
                onClick={() => {
                  if (confirm('Vuoi eseguire il cleanup dei file temporanei?\n\nQuesto sposterà tutti i file .backup-*, .sh, .fixed.ts e altri file temporanei in una cartella CLEANUP datata.')) {
                    executeCleanupMutation.mutate();
                  }
                }}
                disabled={cleanupLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  cleanupLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {cleanupLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Cleanup in corso...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    Avvia Cleanup
                  </>
                )}
              </button>
            </div>
            
            {/* Info Box Cleanup */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-700">
                  <p className="font-medium mb-1">Il cleanup sposterà automaticamente:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>File .backup-* (backup automatici)</li>
                    <li>Script shell di test e fix (fix-*.sh, test-*.sh)</li>
                    <li>File TypeScript temporanei (*.fixed.ts, *.fixed.tsx)</li>
                    <li>Altri file temporanei di sviluppo</li>
                  </ul>
                  <p className="mt-2">
                    <span className="font-medium">Configurazione:</span> Vai su{' '}
                    <a href="/admin/system-enums" className="text-blue-600 hover:text-blue-800 underline">
                      Tabelle Sistema → Servizio
                    </a>{' '}
                    per personalizzare i pattern e le esclusioni.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Statistiche Cleanup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600">Cartelle Totali</div>
                <div className="text-2xl font-bold text-orange-900">{cleanupDirs.length}</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600">File Totali</div>
                <div className="text-2xl font-bold text-orange-900">
                  {cleanupDirs.reduce((sum, dir) => sum + dir.fileCount, 0)}
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600">Spazio Occupato</div>
                <div className="text-2xl font-bold text-orange-900">
                  {cleanupDirs.length > 0 ? 'Varie' : '0 B'}
                </div>
              </div>
            </div>
          </div>

          {/* Lista Cartelle Cleanup */}
          {isLoadingCleanup ? (
            <div className="flex justify-center items-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : cleanupDirs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nessuna cartella di cleanup presente</p>
              <p className="text-gray-400 mt-2">
                Le cartelle di cleanup vengono create automaticamente dal sistema
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Cartelle di Cleanup Disponibili</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cleanupDirs.map((dir) => {
                  const createdDate = new Date(dir.createdAt);
                  const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={dir.name} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <FolderIcon className="h-6 w-6 text-orange-500" />
                            <div>
                              <span className="font-medium text-gray-900">
                                {dir.name}
                              </span>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <DocumentTextIcon className="h-4 w-4" />
                                  {dir.fileCount} file
                                </span>
                                <span>{dir.size}</span>
                                <span>
                                  Creata {format(createdDate, 'dd MMM yyyy HH:mm', { locale: it })}
                                  {ageInDays > 0 && (
                                    <span className="text-orange-600 ml-1">
                                      ({ageInDays} {ageInDays === 1 ? 'giorno' : 'giorni'} fa)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Indicatore per cartelle vecchie */}
                          {ageInDays >= 7 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Vecchia
                            </span>
                          )}
                          
                          <button
                            onClick={() => setShowDeleteCleanupModal(dir.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Elimina definitivamente"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Path completo (opzionale, per debug) */}
                      <div className="mt-2 text-xs text-gray-400 font-mono">
                        {dir.path}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Footer con suggerimenti */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <ExclamationCircleIcon className="h-4 w-4 inline text-yellow-500 mr-1" />
                  Suggerimento: Puoi eliminare le cartelle più vecchie di 7 giorni per liberare spazio.
                  I file in queste cartelle sono solo temporanei di sviluppo.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content - Documentazione Cleanup */}
      {activeTab === 'docs' && (
        <CleanupDocumentationTab />
      )}

      {/* Loading State */}
      {isLoading && activeTab === 'backup' && (
        <div className="flex justify-center items-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}

      {/* Modal Conferma Eliminazione Cartella Cleanup */}
      {showDeleteCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Eliminazione Definitiva</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Stai per eliminare <strong>DEFINITIVAMENTE</strong> la cartella:
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <code className="text-red-800 font-mono text-sm">{showDeleteCleanupModal}</code>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm flex items-start gap-2">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Attenzione:</strong> Questa azione non può essere annullata.
                    Tutti i file nella cartella verranno eliminati permanentemente.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteCleanupModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (showDeleteCleanupModal) {
                    deleteCleanupDirMutation.mutate(showDeleteCleanupModal);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <TrashIcon className="h-5 w-5" />
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBackupPage;
