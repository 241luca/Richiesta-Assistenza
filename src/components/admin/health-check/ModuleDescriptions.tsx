/**
 * Module Descriptions Component
 * Descrizioni dettagliate di cosa controlla ogni modulo di Health Check
 */

import React from 'react';
import {
  ShieldCheckIcon,
  BellIcon,
  ChatBubbleBottomCenterTextIcon,
  CreditCardIcon,
  CpuChipIcon,
  ServerIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ModuleDescription {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  checks: string[];
  metrics: string[];
  criticalThresholds: { label: string; value: string }[];
}

const moduleDescriptions: ModuleDescription[] = [
  {
    id: 'authentication',
    name: 'Sistema Autenticazione',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    color: 'blue',
    description: 'Controlla il sistema di autenticazione JWT, 2FA e gestione sessioni per garantire sicurezza accessi.',
    checks: [
      'Validità dei token JWT e chiavi di firma',
      'Stato del sistema 2FA (Two-Factor Authentication)',
      'Sessioni attive e timeout configurati',
      'Rate limiting su tentativi di login',
      'Blacklist token e token scaduti',
      'Password policy e complessità'
    ],
    metrics: [
      'Numero utenti totali registrati',
      'Sessioni attive correnti',
      'Login falliti nelle ultime 24h',
      'Percentuale utenti con 2FA attivo',
      'Tempo medio di login'
    ],
    criticalThresholds: [
      { label: 'Max sessioni attive', value: '10000' },
      { label: 'Max login falliti/ora', value: '100' },
      { label: 'Min 2FA adoption', value: '50%' },
      { label: 'Session timeout', value: '30 min' }
    ]
  },
  {
    id: 'redis',
    name: 'Redis Cache',
    icon: <ServerIcon className="w-6 h-6" />,
    color: 'red',
    description: 'Monitora il sistema di cache Redis per sessioni, code di lavoro e dati temporanei.',
    checks: [
      'Connessione al server Redis',
      'Memoria disponibile e utilizzata',
      'Numero di chiavi memorizzate',
      'Performance lettura/scrittura',
      'Persistenza su disco attiva',
      'Configurazione master/slave'
    ],
    metrics: [
      'Memoria utilizzata (MB)',
      'Numero chiavi totali',
      'Hit rate cache (%)',
      'Operazioni al secondo',
      'Connessioni client attive',
      'Tempo uptime (ore)'
    ],
    criticalThresholds: [
      { label: 'Max memoria', value: '4GB' },
      { label: 'Min hit rate', value: '80%' },
      { label: 'Max connessioni', value: '1000' },
      { label: 'Max latency', value: '10ms' }
    ]
  },
  {
    id: 'websocket',
    name: 'WebSocket Server',
    icon: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />,
    color: 'purple',
    description: 'Verifica il server WebSocket (Socket.io) per comunicazioni real-time e chat.',
    checks: [
      'Server Socket.io attivo e in ascolto',
      'Connessioni client attive',
      'Latenza messaggi real-time',
      'Rooms e namespaces configurati',
      'Heartbeat e reconnection attivi',
      'Autenticazione socket funzionante'
    ],
    metrics: [
      'Client connessi',
      'Messaggi/secondo',
      'Latenza media (ms)',
      'Rooms attive',
      'Eventi emessi/minuto',
      'Disconnessioni/ora'
    ],
    criticalThresholds: [
      { label: 'Max clients', value: '10000' },
      { label: 'Max latency', value: '100ms' },
      { label: 'Max rooms', value: '5000' },
      { label: 'Max disconnect rate', value: '5%' }
    ]
  },
  {
    id: 'emailservice',
    name: 'Email Service (Brevo)',
    icon: <BellIcon className="w-6 h-6" />,
    color: 'green',
    description: 'Controlla il servizio email Brevo (ex SendinBlue) per invio notifiche e comunicazioni.',
    checks: [
      'Connessione API Brevo attiva',
      'Validità API key',
      'Quota email disponibile',
      'Template email configurati',
      'Domini verificati per invio',
      'Webhook configurati correttamente'
    ],
    metrics: [
      'Email inviate oggi',
      'Quota rimanente',
      'Delivery rate (%)',
      'Bounce rate (%)',
      'Open rate (%)',
      'Email in coda'
    ],
    criticalThresholds: [
      { label: 'Min delivery rate', value: '95%' },
      { label: 'Max bounce rate', value: '5%' },
      { label: 'Min quota', value: '1000' },
      { label: 'Max send time', value: '5 sec' }
    ]
  },
  {
    id: 'notification',
    name: 'Sistema Notifiche',
    icon: <BellIcon className="w-6 h-6" />,
    color: 'yellow',
    description: 'Monitora il sistema di notifiche multi-canale (Email, WebSocket, Push) e la coda di invio.',
    checks: [
      'Connessione server email (Brevo/SMTP)',
      'WebSocket server attivo e connessioni',
      'Queue Redis per notifiche asincrone',
      'Template notifiche disponibili',
      'Rate limiting invio email',
      'Delivery rate e bounce rate'
    ],
    metrics: [
      'Notifiche inviate oggi',
      'Notifiche in coda',
      'Tasso di consegna email',
      'WebSocket connections attive',
      'Tempo medio di invio',
      'Notifiche fallite'
    ],
    criticalThresholds: [
      { label: 'Max queue size', value: '5000' },
      { label: 'Min delivery rate', value: '95%' },
      { label: 'Max send time', value: '5 sec' },
      { label: 'Max failure rate', value: '5%' }
    ]
  },
  {
    id: 'database',
    name: 'Database PostgreSQL',
    icon: <ServerIcon className="w-6 h-6" />,
    color: 'green',
    description: 'Verifica connessione, performance e integrità del database PostgreSQL principale.',
    checks: [
      'Connessione al database attiva',
      'Connection pool disponibili',
      'Tempo di risposta query',
      'Dimensione database e tabelle',
      'Indici e loro utilizzo',
      'Lock e query bloccate',
      'Backup recenti disponibili'
    ],
    metrics: [
      'Connessioni attive/totali',
      'Query per secondo',
      'Tempo medio query (ms)',
      'Dimensione DB (GB)',
      'Tabelle più grandi',
      'Indici non utilizzati'
    ],
    criticalThresholds: [
      { label: 'Max connections', value: '100' },
      { label: 'Max query time', value: '1000ms' },
      { label: 'Max DB size', value: '50GB' },
      { label: 'Min free space', value: '10GB' }
    ]
  },
  {
    id: 'backup',
    name: 'Sistema Backup',
    icon: <ArchiveBoxIcon className="w-6 h-6" />,
    color: 'purple',
    description: 'Controlla lo stato dei backup automatici e la possibilità di ripristino.',
    checks: [
      'Ultimo backup completato',
      'Backup schedulati attivi',
      'Spazio disponibile per backup',
      'Integrità ultimo backup',
      'Test di restore automatico',
      'Backup offsite/cloud',
      'Retention policy attiva'
    ],
    metrics: [
      'Ultimo backup (ore fa)',
      'Dimensione backup (GB)',
      'Numero backup disponibili',
      'Tempo ultimo backup (min)',
      'Spazio utilizzato %',
      'Backup falliti settimana'
    ],
    criticalThresholds: [
      { label: 'Max ore da backup', value: '24h' },
      { label: 'Min backup retention', value: '30 giorni' },
      { label: 'Max backup time', value: '60 min' },
      { label: 'Min free space', value: '20%' }
    ]
  },
  {
    id: 'chat',
    name: 'Sistema Chat',
    icon: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />,
    color: 'indigo',
    description: 'Monitora il sistema di chat real-time con Socket.io e messaggistica.',
    checks: [
      'Socket.io server attivo',
      'Connessioni WebSocket attive',
      'Latenza messaggi real-time',
      'Room e namespace attivi',
      'Message delivery rate',
      'Presenza e typing indicators',
      'Storia messaggi disponibile'
    ],
    metrics: [
      'Utenti online',
      'Messaggi inviati oggi',
      'Latenza media (ms)',
      'Room attive',
      'Messaggi non letti',
      'Connessioni perse/ora'
    ],
    criticalThresholds: [
      { label: 'Max latency', value: '100ms' },
      { label: 'Max connections', value: '5000' },
      { label: 'Min delivery rate', value: '99%' },
      { label: 'Max reconnects/h', value: '50' }
    ]
  },
  {
    id: 'payment',
    name: 'Sistema Pagamenti',
    icon: <CreditCardIcon className="w-6 h-6" />,
    color: 'emerald',
    description: 'Verifica integrazione Stripe, transazioni e sicurezza pagamenti.',
    checks: [
      'Connessione API Stripe',
      'Webhook Stripe attivi',
      'Validità chiavi API',
      'PCI compliance status',
      'Rate limiting transazioni',
      'Fraud detection attivo',
      'Reconciliation automatica'
    ],
    metrics: [
      'Transazioni oggi',
      'Volume totale (€)',
      'Tasso successo %',
      'Tempo medio processo',
      'Pagamenti pending',
      'Chargeback rate'
    ],
    criticalThresholds: [
      { label: 'Min success rate', value: '98%' },
      { label: 'Max process time', value: '3 sec' },
      { label: 'Max chargeback', value: '1%' },
      { label: 'Max pending time', value: '1h' }
    ]
  },
  {
    id: 'ai',
    name: 'Sistema AI',
    icon: <CpuChipIcon className="w-6 h-6" />,
    color: 'violet',
    description: 'Monitora integrazione OpenAI, utilizzo token e performance AI.',
    checks: [
      'Connessione API OpenAI',
      'Validità API key',
      'Token disponibili/limite',
      'Rate limiting attivo',
      'Cache risposte attiva',
      'Modelli disponibili',
      'Fallback system attivo'
    ],
    metrics: [
      'Token utilizzati oggi',
      'Costo stimato (€)',
      'Richieste al minuto',
      'Tempo risposta medio',
      'Cache hit rate %',
      'Errori API oggi'
    ],
    criticalThresholds: [
      { label: 'Max token/day', value: '100000' },
      { label: 'Max cost/day', value: '€50' },
      { label: 'Max response time', value: '5 sec' },
      { label: 'Min cache hit', value: '60%' }
    ]
  },
  {
    id: 'request',
    name: 'Sistema Richieste',
    icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'orange',
    description: 'Controlla il workflow delle richieste di assistenza e assegnazioni.',
    checks: [
      'Workflow engine attivo',
      'Auto-assegnazione funzionante',
      'Notifiche richieste attive',
      'Status transitions corrette',
      'Assignment algorithm attivo',
      'Queue processing attiva',
      'SLA monitoring attivo'
    ],
    metrics: [
      'Richieste aperte',
      'Richieste oggi',
      'Tempo medio risposta',
      'Tasso completamento',
      'Richieste in ritardo',
      'Professionisti attivi'
    ],
    criticalThresholds: [
      { label: 'Max pending', value: '100' },
      { label: 'Max response time', value: '2h' },
      { label: 'Min completion', value: '90%' },
      { label: 'Max overdue', value: '5%' }
    ]
  }
];

interface ModuleDescriptionsProps {
  selectedModule?: string;
  onClose?: () => void;
}

export default function ModuleDescriptions({ selectedModule, onClose }: ModuleDescriptionsProps) {
  // Normalizza il nome del modulo per gestire diverse varianti
  const normalizedModule = selectedModule?.toLowerCase().replace('_', '').replace('-', '');
  
  const module = selectedModule 
    ? moduleDescriptions.find(m => {
        const mId = m.id.toLowerCase().replace('_', '').replace('-', '');
        return mId === normalizedModule || 
               m.id === selectedModule ||
               (normalizedModule === 'auth' && m.id === 'authentication');
      })
    : null;

  if (selectedModule && module) {
    // Modal view for single module
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className={`bg-${module.color}-50 border-b border-${module.color}-200 px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`text-${module.color}-500`}>{module.icon}</div>
                <h2 className="text-xl font-bold text-gray-900">{module.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Chiudi</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-gray-600">{module.description}</p>
          </div>

          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Checks */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cosa Controlla</h3>
              <ul className="space-y-2">
                {module.checks.map((check, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className={`text-${module.color}-500 mr-2`}>✓</span>
                    <span className="text-gray-700">{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Metrics */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Metriche Monitorate</h3>
              <div className="grid grid-cols-2 gap-3">
                {module.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Thresholds */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Soglie Critiche</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  {module.criticalThresholds.map((threshold, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm text-gray-700">{threshold.label}:</span>
                      <span className="text-sm font-semibold text-red-700">{threshold.value}</span>
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

  // List view of all modules
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <InformationCircleIcon className="w-6 h-6 text-blue-500" />
          Guida ai Moduli di Health Check
        </h2>
        <p className="mt-2 text-gray-600">
          Panoramica completa di tutti i controlli eseguiti dal sistema di monitoraggio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleDescriptions.map((module) => (
          <div 
            key={module.id}
            className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start space-x-3 mb-3">
              <div className={`text-${module.color}-500`}>{module.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{module.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Controlli Principali
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {module.checks.slice(0, 3).map((check, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      <span className="line-clamp-1">{check}</span>
                    </li>
                  ))}
                  {module.checks.length > 3 && (
                    <li className="text-gray-400 italic">
                      +{module.checks.length - 3} altri controlli
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Soglie Critiche
                </h4>
                <div className="flex flex-wrap gap-2">
                  {module.criticalThresholds.slice(0, 2).map((threshold, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {threshold.label}: <span className="font-semibold ml-1">{threshold.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
