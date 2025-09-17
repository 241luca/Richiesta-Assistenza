import React, { useState } from 'react';
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
  MagnifyingGlassIcon,
  BeakerIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import TemplateEditor from './TemplateEditor';
import EventManager from './EventManager';
import NotificationStats from './NotificationStats';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Tipi di notifiche aggiornati
const NOTIFICATION_TYPES = {
  // Richieste
  NEW_REQUEST: { label: 'Nuova Richiesta', color: 'blue', icon: DocumentTextIcon },
  REQUEST_ASSIGNED: { label: 'Richiesta Assegnata', color: 'green', icon: UserGroupIcon },
  REQUEST_STATUS_CHANGED: { label: 'Stato Cambiato', color: 'yellow', icon: ArrowPathIcon },
  PROFESSIONAL_ASSIGNED: { label: 'Professionista Assegnato', color: 'indigo', icon: UserGroupIcon },
  
  // Interventi
  INTERVENTIONS_PROPOSED: { label: 'Interventi Proposti', color: 'purple', icon: ClockIcon },
  INTERVENTION_ACCEPTED: { label: 'Intervento Accettato', color: 'green', icon: CheckCircleIcon },
  INTERVENTION_REJECTED: { label: 'Intervento Rifiutato', color: 'red', icon: XCircleIcon },
  
  // Preventivi  
  NEW_QUOTE: { label: 'Nuovo Preventivo', color: 'indigo', icon: DocumentTextIcon },
  QUOTE_ACCEPTED: { label: 'Preventivo Accettato', color: 'green', icon: CheckCircleIcon },
  QUOTE_REJECTED: { label: 'Preventivo Rifiutato', color: 'red', icon: XCircleIcon },
  
  // Pagamenti
  PAYMENT_SUCCESS: { label: 'Pagamento Riuscito', color: 'green', icon: CheckCircleIcon },
  PAYMENT_FAILED: { label: 'Pagamento Fallito', color: 'red', icon: ExclamationTriangleIcon },
  
  // Utenti
  WELCOME: { label: 'Benvenuto', color: 'blue', icon: BellIcon },
  EMAIL_VERIFIED: { label: 'Email Verificata', color: 'green', icon: EnvelopeIcon },
  PASSWORD_RESET: { label: 'Reset Password', color: 'yellow', icon: ExclamationTriangleIcon },
  PASSWORD_CHANGED: { label: 'Password Cambiata', color: 'green', icon: CheckCircleIcon },
  
  // Chat
  NEW_MESSAGE: { label: 'Nuovo Messaggio', color: 'blue', icon: ChatBubbleLeftIcon }
};

// Priorità
const PRIORITIES = {
  low: { label: 'Bassa', color: 'gray', value: 1 },
  normal: { label: 'Normale', color: 'blue', value: 2 },
  high: { label: 'Alta', color: 'yellow', value: 3 },
  urgent: { label: 'Urgente', color: 'red', value: 4 }
};

// Canali
const CHANNELS = {
  websocket: { label: 'WebSocket', icon: BellIcon, color: 'green' },
  email: { label: 'Email', icon: EnvelopeIcon, color: 'blue' },
  sms: { label: 'SMS', icon: DevicePhoneMobileIcon, color: 'purple' },
  push: { label: 'Push', icon: BellIcon, color: 'indigo' }
};

const NotificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'email-templates' | 'events' | 'logs' | 'test'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [logFilters, setLogFilters] = useState({
    type: '',
    priority: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const queryClient = useQueryClient();

  // === QUERY: STATISTICHE ===
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/stats');
      return response.data?.data;
    },
    enabled: activeTab === 'overview'
  });

  // === QUERY: LOG NOTIFICHE ===  
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['notification-logs', logFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(logFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/notifications/logs?${params}`);
      return response.data?.data;
    },
    enabled: activeTab === 'logs'
  });

  // === QUERY: TEMPLATE ===
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['notification-templates', filterCategory, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/notification-templates/templates', { params });
      return response.data?.data;
    },
    enabled: activeTab === 'templates' || activeTab === 'email-templates'
  });

  // === QUERY: EVENTI ===
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['notification-events'],
    queryFn: async () => {
      const response = await api.get('/notification-templates/events');
      return response.data?.data;
    },
    enabled: activeTab === 'events'
  });

  // === MUTATION: INVIA TEST ===
  const sendTestMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/notifications/test', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notifica di test inviata!');
      setShowTestModal(false);
      refetchLogs();
    },
    onError: (error) => {
      toast.error('Errore invio notifica di test');
    }
  });

  // === MUTATION: BROADCAST ===
  const broadcastMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/notifications/broadcast', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Broadcast inviato! ${data.data.succeeded} riusciti, ${data.data.failed} falliti`);
      setShowBroadcastModal(false);
    },
    onError: () => {
      toast.error('Errore invio broadcast');
    }
  });

  // === MUTATION: REINVIA NOTIFICA ===
  const resendMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/notifications/${id}/resend`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notifica reinviata!');
      refetchLogs();
    },
    onError: () => {
      toast.error('Errore reinvio notifica');
    }
  });

  // === COMPONENTE: OVERVIEW TAB ===
  const OverviewTab = () => (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Cards Statistiche */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totale Inviate</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <PaperAirplaneIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Consegnate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.delivered || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.deliveryRate ? `${stats.deliveryRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lette</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.read || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.readRate ? `${stats.readRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <EyeIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fallite</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats?.failed || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.failureRate ? `${stats.failureRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <XCircleIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Grafici */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Per Tipo */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Notifiche per Tipo</h3>
              <div className="space-y-2">
                {stats?.byType?.map((item) => {
                  const type = NOTIFICATION_TYPES[item.type] || { label: item.type, color: 'gray' };
                  const percentage = stats.total ? (item.count / stats.total) * 100 : 0;
                  return (
                    <div key={item.type} className="flex items-center">
                      <div className="w-40 text-sm truncate">{type.label}</div>
                      <div className="flex-1 mx-2">
                        <div className="bg-gray-200 rounded-full h-4">
                          <div
                            className={`bg-${type.color}-500 h-4 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-20 text-right">
                        {item.count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per Canale */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Notifiche per Canale</h3>
              <div className="space-y-2">
                {stats?.byChannel?.map((item) => {
                  const channel = CHANNELS[item.channel] || { label: item.channel, color: 'gray' };
                  const percentage = stats.total ? (item.count / stats.total) * 100 : 0;
                  const ChannelIcon = channel.icon;
                  return (
                    <div key={item.channel} className="flex items-center">
                      <div className="w-32 text-sm flex items-center">
                        <ChannelIcon className="h-4 w-4 mr-2" />
                        {channel.label}
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="bg-gray-200 rounded-full h-4">
                          <div
                            className={`bg-${channel.color}-500 h-4 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-20 text-right">
                        {item.count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trend Ultimi 7 Giorni */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trend Ultimi 7 Giorni</h3>
            <div className="grid grid-cols-7 gap-2">
              {stats?.last7Days?.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {format(new Date(day.date), 'EEE', { locale: it })}
                  </div>
                  <div className="bg-blue-100 rounded p-2">
                    <div className="text-lg font-semibold">{day.count}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format(new Date(day.date), 'dd/MM')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // === COMPONENTE: LOGS TAB ===
  const LogsTab = () => (
    <div className="space-y-4">
      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cerca
            </label>
            <div className="relative">
              <input
                type="text"
                value={logFilters.search}
                onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Cerca..."
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={logFilters.type}
              onChange={(e) => setLogFilters({ ...logFilters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tutti</option>
              {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorità
            </label>
            <select
              value={logFilters.priority}
              onChange={(e) => setLogFilters({ ...logFilters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tutte</option>
              {Object.entries(PRIORITIES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={logFilters.status}
              onChange={(e) => setLogFilters({ ...logFilters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tutti</option>
              <option value="pending">In Attesa</option>
              <option value="sent">Inviata</option>
              <option value="delivered">Consegnata</option>
              <option value="read">Letta</option>
              <option value="failed">Fallita</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Da
            </label>
            <input
              type="date"
              value={logFilters.dateFrom}
              onChange={(e) => setLogFilters({ ...logFilters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              A
            </label>
            <input
              type="date"
              value={logFilters.dateTo}
              onChange={(e) => setLogFilters({ ...logFilters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setLogFilters({
              type: '',
              priority: '',
              status: '',
              search: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Reset Filtri
          </button>
          <button
            onClick={refetchLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-5 w-5 inline mr-2" />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Tabella Log */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data/Ora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destinatario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Titolo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Canali
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priorità
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logsLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : logs?.logs?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Nessuna notifica trovata
                  </td>
                </tr>
              ) : (
                logs?.logs?.map((log) => {
                  const type = NOTIFICATION_TYPES[log.type] || { label: log.type, color: 'gray', icon: BellIcon };
                  const priority = PRIORITIES[log.priority?.toLowerCase()] || { label: log.priority, color: 'gray' };
                  const TypeIcon = type.icon;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <TypeIcon className={`h-5 w-5 text-${type.color}-500 mr-2`} />
                          <span className="text-sm">{type.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{log.recipient?.fullName}</div>
                          <div className="text-gray-500 text-xs">{log.recipient?.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{log.title}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          {log.channels?.map((channel) => {
                            const ch = CHANNELS[channel];
                            if (!ch) return null;
                            const ChannelIcon = ch.icon;
                            return (
                              <ChannelIcon
                                key={channel}
                                className={`h-5 w-5 text-${ch.color}-500`}
                                title={ch.label}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'sent' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Inviata
                          </span>
                        )}
                        {log.status === 'delivered' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Consegnata
                          </span>
                        )}
                        {log.status === 'read' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            Letta
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Fallita
                          </span>
                        )}
                        {log.status === 'pending' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            In Attesa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full bg-${priority.color}-100 text-${priority.color}-800`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Dettagli"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {log.status === 'failed' && (
                            <button
                              onClick={() => resendMutation.mutate(log.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Reinvia"
                            >
                              <ArrowPathIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginazione */}
        {logs?.total > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Mostrando {logs?.logs?.length || 0} di {logs?.total} notifiche
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // === COMPONENTE: TEST TAB ===
  const TestTab = () => {
    const [testData, setTestData] = useState({
      email: '',
      type: 'TEST_NOTIFICATION',
      title: 'Notifica di Test',
      message: 'Questa è una notifica di test dal sistema amministrativo.',
      priority: 'normal',
      channels: ['websocket']
    });

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Invia Notifica di Test</h2>
        
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Destinatario
            </label>
            <input
              type="email"
              value={testData.email}
              onChange={(e) => setTestData({ ...testData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Notifica
            </label>
            <select
              value={testData.type}
              onChange={(e) => setTestData({ ...testData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="TEST_NOTIFICATION">Test Generico</option>
              {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo
            </label>
            <input
              type="text"
              value={testData.title}
              onChange={(e) => setTestData({ ...testData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Messaggio
            </label>
            <textarea
              value={testData.message}
              onChange={(e) => setTestData({ ...testData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorità
            </label>
            <select
              value={testData.priority}
              onChange={(e) => setTestData({ ...testData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Object.entries(PRIORITIES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Canali
            </label>
            <div className="space-y-2">
              {Object.entries(CHANNELS).map(([key, value]) => {
                const ChannelIcon = value.icon;
                return (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={testData.channels.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTestData({ ...testData, channels: [...testData.channels, key] });
                        } else {
                          setTestData({ ...testData, channels: testData.channels.filter(c => c !== key) });
                        }
                      }}
                      className="mr-2"
                    />
                    <ChannelIcon className="h-4 w-4 mr-1" />
                    <span>{value.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => sendTestMutation.mutate(testData)}
              disabled={!testData.email || testData.channels.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
              Invia Test
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Broadcast
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellIconSolid className="h-8 w-8 text-indigo-600 mr-3" />
                Sistema Notifiche
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestione completa notifiche, template e log
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refetchLogs}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Aggiorna
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
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Log Notifiche
            </button>
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
              onClick={() => setActiveTab('email-templates')}
              className={`${
                activeTab === 'email-templates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email Brevo
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
              onClick={() => setActiveTab('test')}
              className={`${
                activeTab === 'test'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              Test
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'templates' && (
          <div>
            {/* Qui andrà la gestione template esistente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Template Notifiche</h2>
              <p className="text-gray-500">Usa il sistema template esistente...</p>
            </div>
          </div>
        )}
        {activeTab === 'email-templates' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Template Email Brevo</h2>
                <p className="mt-1 text-gray-600">
                  Gestisci i template email che verranno inviati tramite Brevo
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplate({
                    code: '',
                    name: '',
                    description: '',
                    category: 'system',
                    subject: '',
                    htmlContent: '',
                    textContent: '',
                    variables: [],
                    channels: ['email'],
                    priority: 'NORMAL',
                    isActive: true
                  });
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuovo Template Email
              </button>
            </div>
            
            {/* Lista dei template email esistenti */}
            {templatesLoading ? (
              <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.filter((t: any) => t.channels?.includes('email') || t.channels?.includes('EMAIL')).map((template: any) => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.isActive && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Codice: {template.code}</span>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsEditorOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Modifica
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'events' && <EventManager events={events || []} />}
        {activeTab === 'test' && <TestTab />}
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

      {/* Modal Dettagli Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Dettagli Notifica</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">ID:</span> {selectedLog.id}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {selectedLog.type}
              </div>
              <div>
                <span className="font-medium">Titolo:</span> {selectedLog.title}
              </div>
              <div>
                <span className="font-medium">Contenuto:</span>
                <p className="mt-1 text-gray-600">{selectedLog.content}</p>
              </div>
              <div>
                <span className="font-medium">Metadata:</span>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Broadcast */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Invia Broadcast</h3>
            <p className="text-sm text-red-600 mb-4">
              ⚠️ Attenzione: Questo invierà una notifica a TUTTI gli utenti selezionati!
            </p>
            {/* Form broadcast qui */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  // Implementa broadcast
                  setShowBroadcastModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Invia Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDashboard;
