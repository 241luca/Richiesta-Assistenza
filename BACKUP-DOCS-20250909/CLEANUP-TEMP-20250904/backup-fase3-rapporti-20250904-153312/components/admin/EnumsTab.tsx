// Tab Enums - Stati e Valori Sistema COMPLETAMENTE RISCRITTA
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyEuroIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  UserCircleIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Configurazione completa degli enum di sistema
const SYSTEM_ENUMS_CONFIG = {
  requestStatuses: {
    name: 'Stati Richieste',
    description: 'Stati possibili per le richieste di assistenza',
    icon: ClockIcon,
    category: 'richieste',
    color: 'blue',
    values: [
      { value: 'PENDING', label: 'In Attesa', color: 'yellow', description: 'Richiesta in attesa di assegnazione' },
      { value: 'ASSIGNED', label: 'Assegnata', color: 'blue', description: 'Assegnata a un professionista' },
      { value: 'IN_PROGRESS', label: 'In Corso', color: 'indigo', description: 'Lavoro in corso' },
      { value: 'COMPLETED', label: 'Completata', color: 'green', description: 'Lavoro completato' },
      { value: 'CANCELLED', label: 'Annullata', color: 'red', description: 'Richiesta annullata' }
    ]
  },
  priorities: {
    name: 'Livelli di Priorità',
    description: 'Livelli di urgenza per le richieste',
    icon: ExclamationTriangleIcon,
    category: 'richieste',
    color: 'orange',
    values: [
      { value: 'LOW', label: 'Bassa', color: 'gray', description: 'Non urgente' },
      { value: 'MEDIUM', label: 'Media', color: 'yellow', description: 'Normale' },
      { value: 'HIGH', label: 'Alta', color: 'orange', description: 'Urgente' },
      { value: 'URGENT', label: 'Urgente', color: 'red', description: 'Molto urgente' }
    ]
  },
  quoteStatuses: {
    name: 'Stati Preventivi',
    description: 'Stati del ciclo di vita dei preventivi',
    icon: DocumentTextIcon,
    category: 'preventivi',
    color: 'green',
    values: [
      { value: 'DRAFT', label: 'Bozza', color: 'gray', description: 'Preventivo in preparazione' },
      { value: 'SENT', label: 'Inviato', color: 'blue', description: 'Inviato al cliente' },
      { value: 'VIEWED', label: 'Visualizzato', color: 'indigo', description: 'Visto dal cliente' },
      { value: 'ACCEPTED', label: 'Accettato', color: 'green', description: 'Accettato dal cliente' },
      { value: 'REJECTED', label: 'Rifiutato', color: 'red', description: 'Rifiutato dal cliente' },
      { value: 'EXPIRED', label: 'Scaduto', color: 'gray', description: 'Preventivo scaduto' }
    ]
  },
  paymentMethods: {
    name: 'Metodi di Pagamento',
    description: 'Modalità di pagamento accettate',
    icon: CreditCardIcon,
    category: 'pagamenti',
    color: 'purple',
    values: [
      { value: 'CASH', label: 'Contanti', color: 'green', description: 'Pagamento in contanti' },
      { value: 'CARD', label: 'Carta', color: 'blue', description: 'Carta di credito/debito' },
      { value: 'BANK_TRANSFER', label: 'Bonifico', color: 'indigo', description: 'Bonifico bancario' },
      { value: 'STRIPE', label: 'Stripe', color: 'purple', description: 'Pagamento online Stripe' },
      { value: 'PAYPAL', label: 'PayPal', color: 'yellow', description: 'Pagamento PayPal' }
    ]
  },
  paymentStatuses: {
    name: 'Stati Pagamenti',
    description: 'Stati delle transazioni di pagamento',
    icon: CurrencyEuroIcon,
    category: 'pagamenti',
    color: 'indigo',
    values: [
      { value: 'PENDING', label: 'In Attesa', color: 'yellow', description: 'Pagamento in attesa' },
      { value: 'PROCESSING', label: 'In Elaborazione', color: 'blue', description: 'Pagamento in elaborazione' },
      { value: 'COMPLETED', label: 'Completato', color: 'green', description: 'Pagamento completato' },
      { value: 'FAILED', label: 'Fallito', color: 'red', description: 'Pagamento fallito' },
      { value: 'REFUNDED', label: 'Rimborsato', color: 'gray', description: 'Pagamento rimborsato' }
    ]
  },
  notificationTypes: {
    name: 'Tipi di Notifica',
    description: 'Categorie di notifiche del sistema',
    icon: BellIcon,
    category: 'notifiche',
    color: 'pink',
    values: [
      { value: 'SYSTEM', label: 'Sistema', color: 'gray', description: 'Notifiche di sistema' },
      { value: 'REQUEST', label: 'Richiesta', color: 'blue', description: 'Notifiche richieste' },
      { value: 'QUOTE', label: 'Preventivo', color: 'green', description: 'Notifiche preventivi' },
      { value: 'PAYMENT', label: 'Pagamento', color: 'purple', description: 'Notifiche pagamenti' },
      { value: 'CHAT', label: 'Messaggio', color: 'indigo', description: 'Notifiche chat' }
    ]
  },
  notificationChannels: {
    name: 'Canali di Notifica',
    description: 'Metodi di invio delle notifiche',
    icon: ChatBubbleLeftRightIcon,
    category: 'notifiche',
    color: 'cyan',
    values: [
      { value: 'EMAIL', label: 'Email', color: 'blue', description: 'Invio via email' },
      { value: 'SMS', label: 'SMS', color: 'green', description: 'Invio via SMS' },
      { value: 'PUSH', label: 'Push', color: 'purple', description: 'Notifiche push' },
      { value: 'WEBSOCKET', label: 'WebSocket', color: 'indigo', description: 'Real-time in app' }
    ]
  },
  userRoles: {
    name: 'Ruoli Utente',
    description: 'Tipologie di utenti nel sistema',
    icon: UsersIcon,
    category: 'utenti',
    color: 'gray',
    values: [
      { value: 'CLIENT', label: 'Cliente', color: 'blue', description: 'Utente cliente' },
      { value: 'PROFESSIONAL', label: 'Professionista', color: 'green', description: 'Professionista/tecnico' },
      { value: 'ADMIN', label: 'Amministratore', color: 'purple', description: 'Amministratore sistema' },
      { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'red', description: 'Super amministratore' },
      { value: 'STAFF', label: 'Staff', color: 'indigo', description: 'Staff interno' }
    ]
  },
  userStatuses: {
    name: 'Stati Utente',
    description: 'Stati degli account utente',
    icon: UserCircleIcon,
    category: 'utenti',
    color: 'red',
    values: [
      { value: 'ACTIVE', label: 'Attivo', color: 'green', description: 'Account attivo' },
      { value: 'INACTIVE', label: 'Inattivo', color: 'gray', description: 'Account inattivo' },
      { value: 'SUSPENDED', label: 'Sospeso', color: 'orange', description: 'Account sospeso' },
      { value: 'BANNED', label: 'Bannato', color: 'red', description: 'Account bannato' },
      { value: 'PENDING', label: 'In Attesa', color: 'yellow', description: 'In attesa di verifica' }
    ]
  },
  aiResponseStyles: {
    name: 'Stili Risposta AI',
    description: 'Modalità di risposta dell\'assistente AI',
    icon: SparklesIcon,
    category: 'ai',
    color: 'violet',
    values: [
      { value: 'FORMAL', label: 'Formale', color: 'purple', description: 'Risposta professionale' },
      { value: 'INFORMAL', label: 'Informale', color: 'blue', description: 'Risposta colloquiale' },
      { value: 'TECHNICAL', label: 'Tecnico', color: 'indigo', description: 'Linguaggio tecnico' },
      { value: 'EDUCATIONAL', label: 'Educativo', color: 'green', description: 'Stile didattico' }
    ]
  },
  aiDetailLevels: {
    name: 'Livelli Dettaglio AI',
    description: 'Profondità delle risposte AI',
    icon: AdjustmentsHorizontalIcon,
    category: 'ai',
    color: 'teal',
    values: [
      { value: 'BASIC', label: 'Base', color: 'gray', description: 'Risposta essenziale' },
      { value: 'INTERMEDIATE', label: 'Intermedio', color: 'blue', description: 'Dettaglio medio' },
      { value: 'ADVANCED', label: 'Avanzato', color: 'purple', description: 'Molto dettagliato' },
      { value: 'EXPERT', label: 'Esperto', color: 'red', description: 'Massimo dettaglio tecnico' }
    ]
  }
};

function EnumsTab() {
  const [expandedEnums, setExpandedEnums] = useState<Set<string>>(new Set());
  const [editingValue, setEditingValue] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const toggleExpanded = (enumId: string) => {
    const newExpanded = new Set(expandedEnums);
    if (newExpanded.has(enumId)) {
      newExpanded.delete(enumId);
    } else {
      newExpanded.add(enumId);
    }
    setExpandedEnums(newExpanded);
  };

  // Group enums by category
  const groupedEnums = Object.entries(SYSTEM_ENUMS_CONFIG).reduce((acc, [key, config]) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push({ key, ...config });
    return acc;
  }, {} as any);

  const categoryNames = {
    richieste: 'Gestione Richieste',
    preventivi: 'Gestione Preventivi',
    pagamenti: 'Sistema Pagamenti',
    notifiche: 'Sistema Notifiche',
    utenti: 'Gestione Utenti',
    ai: 'Intelligenza Artificiale'
  };

  const categoryColors = {
    richieste: 'blue',
    preventivi: 'green',
    pagamenti: 'purple',
    notifiche: 'pink',
    utenti: 'gray',
    ai: 'violet'
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Stati e Valori di Sistema</h3>
            <p className="text-sm text-blue-700 mt-1">
              Questi valori sono utilizzati in tutto il sistema per categorizzare e gestire i vari elementi.
              Le modifiche sono attualmente in sola lettura per garantire la stabilità del sistema.
              Per modifiche contattare lo sviluppatore.
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Enums */}
      {Object.entries(groupedEnums).map(([category, enums]: [string, any[]]) => (
        <div key={category} className="bg-white rounded-lg shadow">
          {/* Category Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-${categoryColors[category]}-100 rounded-lg`}>
                  <TableCellsIcon className={`h-5 w-5 text-${categoryColors[category]}-600`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {categoryNames[category]}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {enums.length} tabelle di configurazione
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enum List */}
          <div className="divide-y divide-gray-200">
            {enums.map((enumConfig: any) => {
              const Icon = enumConfig.icon;
              const isExpanded = expandedEnums.has(enumConfig.key);

              return (
                <div key={enumConfig.key} className="p-4">
                  {/* Enum Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpanded(enumConfig.key)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      <Icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {enumConfig.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {enumConfig.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-100 text-gray-700">
                        {enumConfig.values.length} valori
                      </Badge>
                      {/* Pulsante aggiungi disabilitato per ora */}
                      <button
                        onClick={() => toast.info('Funzionalità in sviluppo')}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Aggiungi valore"
                        disabled
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enum Values */}
                  {isExpanded && (
                    <div className="mt-4 ml-8">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wider">
                              <th className="text-left pb-2">Valore</th>
                              <th className="text-left pb-2">Etichetta</th>
                              <th className="text-left pb-2">Descrizione</th>
                              <th className="text-left pb-2">Colore</th>
                              <th className="text-right pb-2">Azioni</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {enumConfig.values.map((value: any, index: number) => (
                              <tr key={value.value} className="text-sm">
                                <td className="py-2">
                                  <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {value.value}
                                  </code>
                                </td>
                                <td className="py-2">
                                  <span className="font-medium">{value.label}</span>
                                </td>
                                <td className="py-2">
                                  <span className="text-gray-600 text-xs">
                                    {value.description}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <Badge className={`bg-${value.color}-100 text-${value.color}-800`}>
                                    {value.color}
                                  </Badge>
                                </td>
                                <td className="py-2 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={() => toast.info('Modifica in sviluppo')}
                                      className="text-gray-400 hover:text-gray-600 p-1"
                                      title="Modifica"
                                      disabled
                                    >
                                      <PencilIcon className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => toast.info('Eliminazione in sviluppo')}
                                      className="text-gray-400 hover:text-gray-600 p-1"
                                      title="Elimina"
                                      disabled
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EnumsTab;
