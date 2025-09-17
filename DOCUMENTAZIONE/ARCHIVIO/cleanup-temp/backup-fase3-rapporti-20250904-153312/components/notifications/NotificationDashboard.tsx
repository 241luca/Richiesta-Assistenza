import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import TemplateEditor from './TemplateEditor';
import EventManager from './EventManager';
import NotificationStats from './NotificationStats';

// Tipi TypeScript
interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  channels: string[];
  priority: string;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface NotificationEvent {
  id: string;
  code: string;
  name: string;
  description?: string;
  eventType: string;
  entityType?: string;
  templateId: string;
  isActive: boolean;
  delay: number;
  NotificationTemplate?: NotificationTemplate;
}

interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  byChannel: { channel: string; count: number }[];
  byTemplate: { templateId: string; _count: number }[];
}

// Lista template disponibili per riferimento rapido
const AVAILABLE_TEMPLATES = [
  { category: 'auth', templates: [
    'welcome_user - Benvenuto nuovo utente',
    'user_deleted - Cancellazione utente',
    'password_reset - Reset password',
    'email_verification - Verifica email'
  ]},
  { category: 'request', templates: [
    'request_created_client - Nuova richiesta (cliente)',
    'request_modified_client - Modifica richiesta (cliente)',
    'request_modified_professional - Modifica richiesta (professionista)',
    'request_closed_client - Chiusura richiesta (cliente)',
    'request_closed_professional - Chiusura richiesta (professionista)',
    'request_assigned_client - Assegnazione professionista',
    'request_assigned_professional - Nuova richiesta assegnata',
    'request_status_changed - Cambio stato richiesta'
  ]},
  { category: 'quote', templates: [
    'quote_received - Nuovo preventivo ricevuto',
    'quote_modified - Preventivo modificato',
    'quote_accepted_professional - Preventivo accettato',
    'quote_rejected_professional - Preventivo rifiutato'
  ]},
  { category: 'chat', templates: [
    'chat_message_client - Nuovo messaggio (cliente)',
    'chat_message_professional - Nuovo messaggio (professionista)'
  ]},
  { category: 'professional', templates: [
    'skill_added - Nuova competenza aggiunta',
    'skill_revoked - Competenza revocata'
  ]},
  { category: 'payment', templates: [
    'payment_success - Pagamento completato',
    'payment_failed - Pagamento fallito',
    'deposit_required - Richiesta deposito'
  ]}
];

const NotificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'events' | 'stats' | 'logs'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showTemplateList, setShowTemplateList] = useState(false);
  const queryClient = useQueryClient();

  // Query per recuperare i template - FIX: Rimuovi /api dall'URL
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ['notification-templates', filterCategory, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchTerm) params.search = searchTerm;
      
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      const response = await api.get('/notification-templates/templates', { params });
      return response.data;
    }
  });

  // Query per recuperare gli eventi - FIX: Rimuovi /api dall'URL
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['notification-events'],
    queryFn: async () => {
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      const response = await api.get('/notification-templates/events');
      return response.data;
    }
  });

  // Query per le statistiche - FIX: Rimuovi /api dall'URL
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      const response = await api.get('/notification-templates/statistics');
      return response.data;
    },
    enabled: activeTab === 'stats'
  });

  // Mutation per processare la coda - FIX: Rimuovi /api dall'URL
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      return await api.post('/notification-templates/queue/process', { limit: 100 });
    },
    onSuccess: () => {
      toast.success('Coda processata con successo');
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast.error('Errore nel processare la coda');
    }
  });

  // Mutation per eliminare template - FIX: Rimuovi /api dall'URL
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      return await api.delete(`/notification-templates/templates/${id}`);
    },
    onSuccess: () => {
      toast.success('Template eliminato con successo');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione del template');
    }
  });

  // Mutation per attivare/disattivare template - FIX: Rimuovi /api dall'URL
  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // FIX: Cambiato da /api/notification-templates a /notification-templates
      return await api.patch(`/notification-templates/templates/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Template aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    }
  });

  // Funzione per copiare il codice template negli appunti
  const copyTemplateCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Codice "${code}" copiato negli appunti!`);
  };

  // Icona per canale
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'websocket':
        return <BellIcon className="h-4 w-4" />;
      case 'whatsapp':
        return <ChatBubbleLeftIcon className="h-4 w-4" />;
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  // Colore per priorità
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Colore per categoria
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth':
        return 'bg-purple-100 text-purple-800';
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'quote':
        return 'bg-green-100 text-green-800';
      case 'payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'marketing':
        return 'bg-pink-100 text-pink-800';
      case 'chat':
        return 'bg-cyan-100 text-cyan-800';
      case 'professional':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mostra errore se c'è un problema
  if (templatesError) {
    console.error('Errore caricamento template:', templatesError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellIconSolid className="h-8 w-8 text-indigo-600 mr-3" />
                Sistema Notifiche Professionale
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestisci template, eventi e monitora le notifiche inviate
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => processQueueMutation.mutate()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Processa Coda
              </button>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuovo Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`${
                activeTab === 'templates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Template
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Eventi
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`${
                activeTab === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Statistiche
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Log
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {/* Filtri e Ricerca */}
            <div className="mb-6 space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cerca template per nome o codice..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Tutte le categorie</option>
                  <option value="auth">Autenticazione</option>
                  <option value="request">Richieste</option>
                  <option value="quote">Preventivi</option>
                  <option value="payment">Pagamenti</option>
                  <option value="chat">Chat</option>
                  <option value="professional">Professionisti</option>
                  <option value="system">Sistema</option>
                  <option value="marketing">Marketing</option>
                </select>
                <button
                  onClick={() => setShowTemplateList(!showTemplateList)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Mostra lista template disponibili"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  {showTemplateList ? 'Nascondi' : 'Mostra'} Lista
                </button>
              </div>

              {/* Lista Template Disponibili */}
              {showTemplateList && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    📋 Lista Template Disponibili (clicca per copiare il codice)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_TEMPLATES.map((cat) => (
                      <div key={cat.category} className="space-y-2">
                        <h4 className={`text-xs font-semibold px-2 py-1 rounded inline-block ${getCategoryColor(cat.category)}`}>
                          {cat.category.toUpperCase()}
                        </h4>
                        <ul className="space-y-1">
                          {cat.templates.map((template) => {
                            const [code, name] = template.split(' - ');
                            return (
                              <li key={code} className="text-xs">
                                <button
                                  onClick={() => copyTemplateCode(code)}
                                  className="text-left hover:bg-blue-100 rounded px-2 py-1 w-full transition-colors group"
                                >
                                  <code className="font-mono text-blue-700 group-hover:text-blue-900">{code}</code>
                                  <span className="text-gray-600 ml-1">- {name}</span>
                                  <DocumentDuplicateIcon className="h-3 w-3 inline ml-1 opacity-0 group-hover:opacity-100 text-blue-600" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lista Template */}
            {templatesLoading ? (
              <div className="flex justify-center py-12">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : templates?.data?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun template trovato</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Inizia creando il tuo primo template di notifica.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setIsEditorOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crea Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {templates?.data?.map((template: NotificationTemplate) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          {template.isSystem && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              Sistema
                            </span>
                          )}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(template.priority)}`}>
                            {template.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Codice: <code className="bg-gray-100 px-1 rounded cursor-pointer hover:bg-gray-200" 
                                        onClick={() => copyTemplateCode(template.code)}>
                            {template.code}
                          </code>
                        </p>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                        )}
                        
                        {/* Canali */}
                        <div className="flex items-center mt-3 space-x-3">
                          <span className="text-sm text-gray-500">Canali:</span>
                          <div className="flex space-x-2">
                            {template.channels.map((channel) => (
                              <span
                                key={channel}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {getChannelIcon(channel)}
                                <span className="ml-1">{channel}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Azioni */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditorOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Modifica"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            // Preview template
                            window.open(`/admin/notifications/preview/${template.code}`, '_blank');
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Anteprima"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleTemplateMutation.mutate({ 
                            id: template.id, 
                            isActive: !template.isActive 
                          })}
                          className={`p-2 ${template.isActive ? 'text-green-500' : 'text-gray-400'} hover:text-gray-600`}
                          title={template.isActive ? 'Attivo' : 'Disattivato'}
                        >
                          {template.isActive ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        {!template.isSystem && (
                          <button
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo template?')) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Elimina"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                      <span>Versione: {template.version}</span>
                      <span>Aggiornato: {new Date(template.updatedAt).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && <EventManager events={events?.data || []} />}

        {/* Stats Tab */}
        {activeTab === 'stats' && <NotificationStats stats={stats?.data} loading={statsLoading} />}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Log Notifiche</h2>
            <p className="text-gray-500">Funzionalità in sviluppo...</p>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {isEditorOpen && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedTemplate(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
            setIsEditorOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationDashboard;
