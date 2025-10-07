import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  CloudArrowUpIcon, 
  CloudArrowDownIcon, 
  TrashIcon, 
  ClockIcon,
  CalendarIcon,
  ServerIcon,
  DocumentIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  PlayIcon,
  PlusIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  FolderMinusIcon
} from '@heroicons/react/24/outline';

// Tipi per il sistema di backup
interface SystemBackup {
  id: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  fileSize?: bigint;
  filePath?: string;
  downloadUrl?: string;
  compression: boolean;
  encrypted: boolean;
  checksum?: string;
  includeUploads: boolean;
  includeDatabase: boolean;
  includeCode: boolean;
  databaseTables?: any;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retentionDays: number;
  expiresAt?: Date;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  _count?: {
    logs: number;
  };
}

interface BackupSchedule {
  id: string;
  name: string;
  description?: string;
  type: BackupType;
  frequency: BackupFrequency;
  cronExpression?: string;
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
  isActive: boolean;
  includeUploads: boolean;
  includeDatabase: boolean;
  includeCode: boolean;
  compression: boolean;
  encrypted: boolean;
  retentionDays: number;
  maxBackups: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyEmails?: string[];
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  _count?: {
    backups: number;
    executions: number;
  };
}

enum BackupType {
  FULL = 'FULL',
  DATABASE = 'DATABASE',
  FILES = 'FILES',
  CODE = 'CODE',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL'
}

enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED'
}

enum BackupFrequency {
  MANUAL = 'MANUAL',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

const BackupManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'backups' | 'schedules'>('backups');
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<SystemBackup | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Query per ottenere i backup
  const { data: backupsData, isLoading: loadingBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: () => apiClient.get('/backup').then(res => res.data),
  });

  // Query per ottenere le programmazioni
  const { data: schedulesData, isLoading: loadingSchedules } = useQuery({
    queryKey: ['backup-schedules'],
    queryFn: () => apiClient.get('/backup/schedule').then(res => res.data),
  });

  // Mutation per creare un backup
  const createBackupMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/backup', data).then(res => res.data),
    onSuccess: () => {
      toast.success('Backup creato con successo');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setShowCreateBackup(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione del backup');
    },
  });

  // Mutation per eliminare un backup
  const deleteBackupMutation = useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
      apiClient.delete(`/backup/${id}?permanent=${permanent}`).then(res => res.data),
    onSuccess: () => {
      toast.success('Backup eliminato con successo');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione del backup');
    },
  });

  // Mutation per verificare un backup
  const verifyBackupMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/backup/${id}/verify`).then(res => res.data),
    onSuccess: (data) => {
      if (data.data.isValid) {
        toast.success('Integrità del backup verificata con successo');
      } else {
        toast.error('Verifica integrità fallita - il backup potrebbe essere corrotto');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella verifica del backup');
    },
  });

  // Mutation per eseguire il cleanup
  const cleanupMutation = useMutation({
    mutationFn: () => apiClient.post('/backup/cleanup-dev').then(res => res.data),
    onMutate: () => {
      setCleanupLoading(true);
    },
    onSuccess: (data) => {
      toast.success(`Cleanup completato! ${data.data?.movedCount || 0} file spostati in ${data.data?.cleanupDir || 'CLEANUP'}`);
      setCleanupLoading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante il cleanup');
      setCleanupLoading(false);
    },
  });

  // Funzione per formattare la dimensione dei file
  const formatFileSize = (bytes: number | bigint | string | null | undefined): string => {
    if (!bytes) return '0 Bytes';
    
    // Converti in numero se è una stringa o BigInt
    const size = typeof bytes === 'string' ? parseInt(bytes, 10) : Number(bytes);
    
    if (size === 0 || isNaN(size)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Funzione per formattare le date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Funzione per ottenere l'icona del tipo di backup
  const getBackupTypeIcon = (type: BackupType) => {
    switch (type) {
      case BackupType.FULL:
        return <ServerIcon style={{ width: '20px', height: '20px' }} />;
      case BackupType.DATABASE:
        return <ServerIcon style={{ width: '20px', height: '20px' }} />;
      case BackupType.FILES:
        return <FolderIcon style={{ width: '20px', height: '20px' }} />;
      case BackupType.CODE:
        return <DocumentIcon style={{ width: '20px', height: '20px' }} />;
      default:
        return <ServerIcon style={{ width: '20px', height: '20px' }} />;
    }
  };

  // Funzione per ottenere l'icona dello stato
  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case BackupStatus.COMPLETED:
        return <CheckCircleIcon style={{ width: '20px', height: '20px' }} className="text-green-500" />;
      case BackupStatus.FAILED:
        return <XCircleIcon style={{ width: '20px', height: '20px' }} className="text-red-500" />;
      case BackupStatus.IN_PROGRESS:
        return <ArrowPathIcon style={{ width: '20px', height: '20px' }} className="text-blue-500 animate-spin" />;
      default:
        return <ExclamationCircleIcon style={{ width: '20px', height: '20px' }} className="text-yellow-500" />;
    }
  };

  // Funzione per scaricare un backup
  const downloadBackup = (backupId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/backup/${backupId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download del backup avviato');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema di Backup</h1>
        <p className="text-gray-600">
          Gestisci i backup del sistema e le programmazioni automatiche
        </p>
      </div>

      {/* Statistiche */}
      {(backupsData?.data?.stats || backupsData?.stats) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Backup Totali</p>
                <p className="text-2xl font-bold text-gray-900">
                  {backupsData?.data?.stats?.totalCount || backupsData?.stats?.totalCount || 0}
                </p>
              </div>
              <ServerIcon style={{ width: '32px', height: '32px' }} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spazio Utilizzato</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(backupsData?.data?.stats?.totalSize || backupsData?.stats?.totalSize || 0)}
                </p>
              </div>
              <FolderIcon style={{ width: '32px', height: '32px' }} className="text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completati</p>
                <p className="text-2xl font-bold text-green-600">
                  {backupsData?.data?.stats?.completedCount || backupsData?.stats?.completedCount || 0}
                </p>
              </div>
              <CheckCircleIcon style={{ width: '32px', height: '32px' }} className="text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Falliti</p>
                <p className="text-2xl font-bold text-red-600">
                  {backupsData?.data?.stats?.failedCount || backupsData?.stats?.failedCount || 0}
                </p>
              </div>
              <XCircleIcon style={{ width: '32px', height: '32px' }} className="text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Sezione Cleanup File Temporanei */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pulizia File Temporanei</h2>
                <p className="text-sm text-gray-600">Sposta i file temporanei di sviluppo in una cartella datata</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Vuoi eseguire il cleanup dei file temporanei?\n\nQuesto sposterà tutti i file .backup-*, .sh, .fixed.ts e altri file temporanei in una cartella CLEANUP datata.')) {
                  cleanupMutation.mutate();
                }
              }}
              disabled={cleanupLoading}
              className={`flex items-center px-4 py-2 rounded-lg text-white font-medium ${
                cleanupLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {cleanupLoading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Cleanup in corso...
                </>
              ) : (
                <>
                  <FolderMinusIcon className="h-5 w-5 mr-2" />
                  Avvia Cleanup
                </>
              )}
            </button>
          </div>
          
          {/* Info box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Il cleanup sposterà automaticamente:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>File .backup-* (backup automatici)</li>
                  <li>Script shell di test e fix (fix-*.sh, test-*.sh)</li>
                  <li>File TypeScript temporanei (*.fixed.ts, *.fixed.tsx)</li>
                  <li>File SQL di backup temporanei</li>
                  <li>Altri file temporanei di sviluppo</li>
                </ul>
                <p className="mt-2">
                  <strong>Nota:</strong> I file verranno spostati in una cartella CLEANUP-[timestamp], non eliminati.
                  Puoi recuperarli se necessario.
                </p>
                <p className="mt-2">
                  Per configurare quali file includere/escludere, vai su 
                  <a href="/admin/system-enums" className="text-blue-600 hover:text-blue-800 underline ml-1">
                    Tabelle Sistema → Servizio
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'backups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Backup Esistenti
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Programmazioni
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Tab Backup */}
          {activeTab === 'backups' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lista Backup</h2>
                <button
                  onClick={() => setShowCreateBackup(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} className="mr-2" />
                  Crea Backup
                </button>
              </div>

              {loadingBackups ? (
                <div className="text-center py-8">
                  <ArrowPathIcon style={{ width: '32px', height: '32px' }} className="animate-spin mx-auto text-blue-500" />
                  <p className="mt-2 text-gray-600">Caricamento backup...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dimensione
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(backupsData?.data?.backups || backupsData?.backups || []).map((backup: SystemBackup) => (
                        <tr key={backup.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getBackupTypeIcon(backup.type)}
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{backup.name}</p>
                                {backup.description && (
                                  <p className="text-sm text-gray-500">{backup.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {backup.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(backup.status)}
                              <span className="ml-2 text-sm text-gray-900">{backup.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {backup.fileSize ? formatFileSize(backup.fileSize) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(backup.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {backup.status === BackupStatus.COMPLETED && (
                                <>
                                  <button
                                    onClick={() => downloadBackup(backup.id, backup.name)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Download"
                                  >
                                    <CloudArrowDownIcon style={{ width: '20px', height: '20px' }} />
                                  </button>
                                  <button
                                    onClick={() => verifyBackupMutation.mutate(backup.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Verifica Integrità"
                                  >
                                    <ShieldCheckIcon style={{ width: '20px', height: '20px' }} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Vuoi eliminare questo backup?')) {
                                    deleteBackupMutation.mutate({ id: backup.id, permanent: false });
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Elimina"
                              >
                                <TrashIcon style={{ width: '20px', height: '20px' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab Programmazioni */}
          {activeTab === 'schedules' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Programmazioni Backup</h2>
                <button
                  onClick={() => setShowCreateSchedule(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} className="mr-2" />
                  Crea Programmazione
                </button>
              </div>

              {loadingSchedules ? (
                <div className="text-center py-8">
                  <ArrowPathIcon style={{ width: '32px', height: '32px' }} className="animate-spin mx-auto text-blue-500" />
                  <p className="mt-2 text-gray-600">Caricamento programmazioni...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(schedulesData?.data || schedulesData || []).map((schedule: BackupSchedule) => (
                    <div key={schedule.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                          {schedule.description && (
                            <p className="text-sm text-gray-600">{schedule.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {schedule.isActive ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Attivo
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              Inattivo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <CalendarIcon style={{ width: '16px', height: '16px' }} className="mr-2" />
                          <span>Frequenza: {schedule.frequency}</span>
                        </div>
                        {schedule.timeOfDay && (
                          <div className="flex items-center text-gray-600">
                            <ClockIcon style={{ width: '16px', height: '16px' }} className="mr-2" />
                            <span>Orario: {schedule.timeOfDay}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <ServerIcon style={{ width: '16px', height: '16px' }} className="mr-2" />
                          <span>Tipo: {schedule.type}</span>
                        </div>
                        {schedule.lastRunAt && (
                          <div className="flex items-center text-gray-600">
                            <CheckCircleIcon style={{ width: '16px', height: '16px' }} className="mr-2" />
                            <span>Ultima esecuzione: {formatDate(schedule.lastRunAt)}</span>
                          </div>
                        )}
                        {schedule.nextRunAt && (
                          <div className="flex items-center text-gray-600">
                            <ArrowPathIcon style={{ width: '16px', height: '16px' }} className="mr-2" />
                            <span>Prossima esecuzione: {formatDate(schedule.nextRunAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end space-x-2">
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          <PlayIcon style={{ width: '16px', height: '16px' }} className="inline mr-1" />
                          Esegui Ora
                        </button>
                        <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                          <Cog6ToothIcon style={{ width: '16px', height: '16px' }} className="inline mr-1" />
                          Modifica
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crea Backup */}
      {showCreateBackup && (
        <CreateBackupModal
          onClose={() => setShowCreateBackup(false)}
          onCreate={createBackupMutation.mutate}
        />
      )}
    </div>
  );
};

// Modal per creare un nuovo backup
const CreateBackupModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    type: BackupType.FULL,
    description: '',
    includeUploads: true,
    includeDatabase: true,
    includeCode: false,
    compression: true,
    encrypted: false,
    retentionDays: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Il nome viene generato automaticamente dal backend
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Crea Nuovo Backup</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo di Backup
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BackupType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={BackupType.FULL}>Completo</option>
                <option value={BackupType.DATABASE}>Solo Database</option>
                <option value={BackupType.FILES}>Solo Files</option>
                <option value={BackupType.CODE}>Solo Codice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione (opzionale)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descrizione del backup..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeDatabase}
                  onChange={(e) => setFormData({ ...formData, includeDatabase: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Includi Database</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeUploads}
                  onChange={(e) => setFormData({ ...formData, includeUploads: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Includi File Caricati</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeCode}
                  onChange={(e) => setFormData({ ...formData, includeCode: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Includi Codice Sorgente</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.compression}
                  onChange={(e) => setFormData({ ...formData, compression: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Comprimi Backup</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.encrypted}
                  onChange={(e) => setFormData({ ...formData, encrypted: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Cripta Backup</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giorni di Conservazione
              </label>
              <input
                type="number"
                value={formData.retentionDays}
                onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crea Backup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BackupManagement;
