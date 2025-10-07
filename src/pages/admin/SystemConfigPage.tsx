import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  Cog6ToothIcon,
  ServerIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentIcon,
  FolderIcon,
  BellIcon,
  EnvelopeIcon,
  KeyIcon,
  CloudArrowUpIcon,
  CircleStackIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SystemSetting {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  isSecret?: boolean;
  isEditable?: boolean;
  validationRules?: any;
}

export default function SystemConfigPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('general');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState(false);

  // Categorie di configurazione
  const categories = [
    { id: 'general', name: 'Generale', icon: Cog6ToothIcon, color: 'gray' },
    { id: 'documents', name: 'Documenti', icon: DocumentIcon, color: 'blue' },
    { id: 'storage', name: 'Storage', icon: FolderIcon, color: 'green' },
    { id: 'notifications', name: 'Notifiche', icon: BellIcon, color: 'yellow' },
    { id: 'security', name: 'Sicurezza', icon: ShieldCheckIcon, color: 'red' },
    { id: 'performance', name: 'Performance', icon: ChartBarIcon, color: 'purple' },
    { id: 'integration', name: 'Integrazioni', icon: CloudArrowUpIcon, color: 'indigo' },
    { id: 'database', name: 'Database', icon: CircleStackIcon, color: 'pink' }
  ];

  // Configurazioni di default (simulazione)
  const defaultSettings: SystemSetting[] = [
    // Generale
    {
      key: 'app.name',
      value: 'Sistema Richiesta Assistenza',
      type: 'string',
      category: 'general',
      description: 'Nome dell\'applicazione',
      isEditable: true
    },
    {
      key: 'app.version',
      value: '4.0.0',
      type: 'string',
      category: 'general',
      description: 'Versione corrente del sistema',
      isEditable: false
    },
    {
      key: 'app.maintenance_mode',
      value: false,
      type: 'boolean',
      category: 'general',
      description: 'Attiva modalità manutenzione',
      isEditable: true
    },
    {
      key: 'app.timezone',
      value: 'Europe/Rome',
      type: 'string',
      category: 'general',
      description: 'Fuso orario del sistema',
      isEditable: true
    },
    {
      key: 'app.language',
      value: 'it',
      type: 'string',
      category: 'general',
      description: 'Lingua predefinita',
      isEditable: true
    },

    // Documenti
    {
      key: 'documents.max_file_size',
      value: 10485760,
      type: 'number',
      category: 'documents',
      description: 'Dimensione massima file (bytes)',
      isEditable: true
    },
    {
      key: 'documents.allowed_extensions',
      value: 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
      type: 'string',
      category: 'documents',
      description: 'Estensioni file consentite',
      isEditable: true
    },
    {
      key: 'documents.auto_versioning',
      value: true,
      type: 'boolean',
      category: 'documents',
      description: 'Versioning automatico documenti',
      isEditable: true
    },
    {
      key: 'documents.retention_days',
      value: 365,
      type: 'number',
      category: 'documents',
      description: 'Giorni di conservazione documenti',
      isEditable: true
    },

    // Storage
    {
      key: 'storage.provider',
      value: 'local',
      type: 'string',
      category: 'storage',
      description: 'Provider storage (local/s3/azure)',
      isEditable: true
    },
    {
      key: 'storage.path',
      value: '/uploads',
      type: 'string',
      category: 'storage',
      description: 'Percorso storage locale',
      isEditable: true
    },
    {
      key: 'storage.s3_bucket',
      value: '',
      type: 'string',
      category: 'storage',
      description: 'Nome bucket S3',
      isEditable: true,
      isSecret: false
    },
    {
      key: 'storage.s3_key',
      value: '',
      type: 'string',
      category: 'storage',
      description: 'Chiave accesso S3',
      isEditable: true,
      isSecret: true
    },

    // Notifiche
    {
      key: 'notifications.email_enabled',
      value: true,
      type: 'boolean',
      category: 'notifications',
      description: 'Abilita notifiche email',
      isEditable: true
    },
    {
      key: 'notifications.sms_enabled',
      value: false,
      type: 'boolean',
      category: 'notifications',
      description: 'Abilita notifiche SMS',
      isEditable: true
    },
    {
      key: 'notifications.push_enabled',
      value: true,
      type: 'boolean',
      category: 'notifications',
      description: 'Abilita notifiche push',
      isEditable: true
    },
    {
      key: 'notifications.smtp_host',
      value: 'smtp.gmail.com',
      type: 'string',
      category: 'notifications',
      description: 'Server SMTP',
      isEditable: true
    },
    {
      key: 'notifications.smtp_port',
      value: 587,
      type: 'number',
      category: 'notifications',
      description: 'Porta SMTP',
      isEditable: true
    },

    // Sicurezza
    {
      key: 'security.jwt_expiration',
      value: 86400,
      type: 'number',
      category: 'security',
      description: 'Durata token JWT (secondi)',
      isEditable: true
    },
    {
      key: 'security.2fa_enabled',
      value: true,
      type: 'boolean',
      category: 'security',
      description: 'Abilita autenticazione 2FA',
      isEditable: true
    },
    {
      key: 'security.max_login_attempts',
      value: 5,
      type: 'number',
      category: 'security',
      description: 'Tentativi massimi di login',
      isEditable: true
    },
    {
      key: 'security.password_min_length',
      value: 8,
      type: 'number',
      category: 'security',
      description: 'Lunghezza minima password',
      isEditable: true
    },
    {
      key: 'security.session_timeout',
      value: 1800,
      type: 'number',
      category: 'security',
      description: 'Timeout sessione (secondi)',
      isEditable: true
    },

    // Performance
    {
      key: 'performance.cache_enabled',
      value: true,
      type: 'boolean',
      category: 'performance',
      description: 'Abilita cache Redis',
      isEditable: true
    },
    {
      key: 'performance.cache_ttl',
      value: 3600,
      type: 'number',
      category: 'performance',
      description: 'TTL cache (secondi)',
      isEditable: true
    },
    {
      key: 'performance.rate_limit_requests',
      value: 100,
      type: 'number',
      category: 'performance',
      description: 'Limite richieste per minuto',
      isEditable: true
    },
    {
      key: 'performance.queue_workers',
      value: 3,
      type: 'number',
      category: 'performance',
      description: 'Numero worker code',
      isEditable: true
    },

    // Database
    {
      key: 'database.pool_min',
      value: 2,
      type: 'number',
      category: 'database',
      description: 'Connessioni minime pool',
      isEditable: true
    },
    {
      key: 'database.pool_max',
      value: 20,
      type: 'number',
      category: 'database',
      description: 'Connessioni massime pool',
      isEditable: true
    },
    {
      key: 'database.query_timeout',
      value: 30000,
      type: 'number',
      category: 'database',
      description: 'Timeout query (ms)',
      isEditable: true
    },
    {
      key: 'database.backup_enabled',
      value: true,
      type: 'boolean',
      category: 'database',
      description: 'Backup automatico abilitato',
      isEditable: true
    },

    // Integrazioni
    {
      key: 'integration.google_maps_enabled',
      value: true,
      type: 'boolean',
      category: 'integration',
      description: 'Google Maps abilitato',
      isEditable: true
    },
    {
      key: 'integration.stripe_enabled',
      value: false,
      type: 'boolean',
      category: 'integration',
      description: 'Stripe pagamenti abilitato',
      isEditable: true
    },
    {
      key: 'integration.openai_enabled',
      value: true,
      type: 'boolean',
      category: 'integration',
      description: 'OpenAI assistente abilitato',
      isEditable: true
    },
    {
      key: 'integration.openai_model',
      value: 'gpt-4',
      type: 'string',
      category: 'integration',
      description: 'Modello OpenAI da utilizzare',
      isEditable: true
    }
  ];

  // Carica impostazioni
  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/system-settings');
        return response.data?.data || defaultSettings;
      } catch (error) {
        return defaultSettings;
      }
    }
  });

  // Mutation per aggiornare impostazione
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: any) => {
      const response = await api.put(`/admin/system-settings/${key}`, { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione aggiornata con successo');
      setEditingKey(null);
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento dell\'impostazione');
    }
  });

  // Test configurazione
  const testConfiguration = async (category: string) => {
    try {
      const response = await api.post(`/admin/system-settings/test/${category}`);
      if (response.data?.success) {
        toast.success(`Test ${category} completato con successo`);
      } else {
        toast.error(`Test ${category} fallito`);
      }
    } catch (error) {
      toast.error(`Errore nel test ${category}`);
    }
  };

  // Esporta configurazione
  const exportConfiguration = async () => {
    try {
      const response = await api.get('/admin/system-settings/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-config-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Configurazione esportata con successo');
    } catch (error) {
      toast.error('Errore nell\'esportazione della configurazione');
    }
  };

  const handleEdit = (key: string, value: any) => {
    setEditingKey(key);
    setFormValues({ ...formValues, [key]: value });
  };

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: formValues[key] });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setFormValues({});
  };

  const filteredSettings = settings.filter((s: SystemSetting) => s.category === activeCategory);

  const renderSettingValue = (setting: SystemSetting) => {
    const isEditing = editingKey === setting.key;

    if (isEditing) {
      switch (setting.type) {
        case 'boolean':
          return (
            <select
              value={formValues[setting.key]?.toString() || setting.value.toString()}
              onChange={(e) => setFormValues({ ...formValues, [setting.key]: e.target.value === 'true' })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="true">Abilitato</option>
              <option value="false">Disabilitato</option>
            </select>
          );
        case 'number':
          return (
            <input
              type="number"
              value={formValues[setting.key] || setting.value}
              onChange={(e) => setFormValues({ ...formValues, [setting.key]: parseInt(e.target.value) })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          );
        default:
          return (
            <input
              type={setting.isSecret && !showSecrets ? 'password' : 'text'}
              value={formValues[setting.key] || setting.value}
              onChange={(e) => setFormValues({ ...formValues, [setting.key]: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          );
      }
    }

    if (setting.type === 'boolean') {
      return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          setting.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {setting.value ? 'Abilitato' : 'Disabilitato'}
        </span>
      );
    }

    if (setting.isSecret && !showSecrets) {
      return <span className="text-gray-500">••••••••</span>;
    }

    return <span className="text-gray-900">{setting.value?.toString()}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurazione Sistema</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestisci le impostazioni globali del sistema documenti
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportConfiguration}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Esporta Config
            </button>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {showSecrets ? <EyeSlashIcon className="h-5 w-5 mr-2" /> : <EyeIcon className="h-5 w-5 mr-2" />}
              {showSecrets ? 'Nascondi Segreti' : 'Mostra Segreti'}
            </button>
          </div>
        </div>

        {/* Stato Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Stato Sistema</p>
                <p className="text-lg font-semibold text-gray-900">Operativo</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ServerIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Versione</p>
                <p className="text-lg font-semibold text-gray-900">4.0.0</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Impostazioni</p>
                <p className="text-lg font-semibold text-gray-900">{settings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Avvisi</p>
                <p className="text-lg font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurazioni */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="flex">
          {/* Sidebar Categorie */}
          <div className="w-64 border-r border-gray-200">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categorie</h3>
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeCategory === category.id
                          ? `bg-${category.color}-100 text-${category.color}-900`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${
                        activeCategory === category.id ? `text-${category.color}-600` : 'text-gray-400'
                      }`} />
                      {category.name}
                      <span className="ml-auto text-xs text-gray-500">
                        {settings.filter((s: SystemSetting) => s.category === category.id).length}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <button
                onClick={() => testConfiguration(activeCategory)}
                className="flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Test Configurazione
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {filteredSettings.map((setting: SystemSetting) => (
                  <div key={setting.key} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {setting.key}
                          </h4>
                          {setting.isSecret && (
                            <LockClosedIcon className="ml-2 h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-sm text-gray-500 mb-3">{setting.description}</p>
                        )}
                        <div className="flex items-center space-x-3">
                          {renderSettingValue(setting)}
                          {setting.isEditable && editingKey === setting.key && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSave(setting.key)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                          {setting.isEditable && editingKey !== setting.key && (
                            <button
                              onClick={() => handleEdit(setting.key, setting.value)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
