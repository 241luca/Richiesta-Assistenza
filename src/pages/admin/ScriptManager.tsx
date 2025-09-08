import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  ClockIcon,
  InformationCircleIcon,
  BookOpenIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { api } from '@/services/api';

interface Script {
  name: string;
  displayName: string;
  available: boolean;
  description: string;
}

interface ScriptOutput {
  output: string;
  errors: string;
  exitCode: number;
  timestamp: string;
}

export function ScriptManager() {
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, ScriptOutput>>({});
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'execute' | 'documentation'>('execute');
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch available scripts
  const { data: scripts, isLoading, refetch } = useQuery({
    queryKey: ['admin-scripts'],
    queryFn: async () => {
      const response = await api.get('/admin/scripts');
      // Gestisce il formato ResponseFormatter
      return response.data?.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  // Run script mutation
  const runScriptMutation = useMutation({
    mutationFn: async (scriptName: string) => {
      const response = await api.post('/admin/scripts/run', { scriptName });
      // Gestisce il formato ResponseFormatter
      const result = response.data?.data || response.data;
      return { scriptName, result: result as ScriptOutput };
    },
    onMutate: (scriptName) => {
      setRunningScripts(prev => new Set(prev).add(scriptName));
      setSelectedScript(scriptName);
      // Clear previous output
      setOutputs(prev => ({
        ...prev,
        [scriptName]: { output: 'Running...', errors: '', exitCode: -1, timestamp: new Date().toISOString() }
      }));
    },
    onSuccess: ({ scriptName, result }) => {
      setOutputs(prev => ({
        ...prev,
        [scriptName]: result
      }));
      setRunningScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(scriptName);
        return newSet;
      });
      
      // Auto-scroll to bottom of output
      setTimeout(() => {
        if (outputRefs.current[scriptName]) {
          outputRefs.current[scriptName]!.scrollTop = outputRefs.current[scriptName]!.scrollHeight;
        }
      }, 100);
    },
    onError: (error, scriptName) => {
      setOutputs(prev => ({
        ...prev,
        [scriptName]: {
          output: '',
          errors: `Error: ${error.message}`,
          exitCode: 1,
          timestamp: new Date().toISOString()
        }
      }));
      setRunningScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(scriptName);
        return newSet;
      });
    }
  });

  const runScript = (scriptName: string) => {
    runScriptMutation.mutate(scriptName);
  };

  const getScriptIcon = (scriptName: string) => {
    const icons: Record<string, JSX.Element> = {
      'check-system': <ArrowPathIcon className="w-5 h-5" />,
      'pre-commit-check': <CheckCircleIcon className="w-5 h-5" />,
      'validate-work': <ExclamationTriangleIcon className="w-5 h-5" />,
      'claude-help': <CommandLineIcon className="w-5 h-5" />,
      'audit-system-check': <BookOpenIcon className="w-5 h-5" />
    };
    return icons[scriptName] || <PlayIcon className="w-5 h-5" />;
  };

  const getScriptColor = (scriptName: string) => {
    const colors: Record<string, string> = {
      'check-system': 'blue',
      'pre-commit-check': 'green',
      'validate-work': 'yellow',
      'claude-help': 'purple',
      'audit-system-check': 'indigo'
    };
    return colors[scriptName] || 'gray';
  };

  const formatOutput = (text: string) => {
    // Convert ANSI color codes to HTML
    return text
      .replace(/\[0;31m/g, '<span class="text-red-500">')
      .replace(/\[0;32m/g, '<span class="text-green-500">')
      .replace(/\[1;33m/g, '<span class="text-yellow-500">')
      .replace(/\[0;34m/g, '<span class="text-blue-500">')
      .replace(/\[0m/g, '</span>')
      .replace(/✅/g, '<span class="text-green-500">✅</span>')
      .replace(/❌/g, '<span class="text-red-500">❌</span>')
      .replace(/⚠️/g, '<span class="text-yellow-500">⚠️</span>')
      .replace(/🔍/g, '🔍')
      .replace(/📝/g, '📝')
      .replace(/🚀/g, '🚀');
  };

  // Script documentation
  const scriptDocumentation = {
    'check-system': {
      title: 'System Check',
      purpose: 'Verifica completa dello stato del sistema di sviluppo',
      icon: <ArrowPathIcon className="w-8 h-8 text-blue-500" />,
      whenToUse: 'All\'inizio di ogni sessione di lavoro o quando qualcosa non funziona',
      whatItChecks: [
        'Node.js e NPM installati e versioni',
        'Database PostgreSQL connesso e tabelle presenti',
        'Redis server attivo e funzionante',
        'Porte 3200 (backend) e 5193 (frontend) libere o occupate',
        'Struttura directory del progetto completa',
        'File critici presenti (package.json, schema.prisma, etc.)',
        'Dipendenze installate (node_modules)',
        'Errori TypeScript nel codice',
        'Stato Git e file modificati'
      ],
      interpreteOutput: {
        '✅ Verde': 'Tutto funziona correttamente',
        '⚠️ Giallo': 'Attenzione, potrebbe esserci un problema non bloccante',
        '❌ Rosso': 'Errore che deve essere risolto'
      },
      commonIssues: [
        'Port already in use: Un servizio sta già usando quella porta',
        'Database not connected: Controlla DATABASE_URL nel file .env',
        'Redis not running: Avvia Redis con redis-server',
        'Missing directories: Alcune cartelle del progetto mancano'
      ]
    },
    'pre-commit-check': {
      title: 'Pre-Commit Check',
      purpose: 'Controlli completi prima di salvare il codice su Git',
      icon: <CheckCircleIcon className="w-8 h-8 text-green-500" />,
      whenToUse: 'SEMPRE prima di fare un commit su Git',
      whatItChecks: [
        'TypeScript: Nessun errore di compilazione',
        'ResponseFormatter: Usato in TUTTE le routes (obbligatorio)',
        'ResponseFormatter: NON usato nei services (vietato)',
        'Console.log: Rilevamento di statement di debug dimenticati',
        'File backup: Presenza di file .backup da non committare',
        'Prisma: Client generato e sincronizzato',
        'Tailwind CSS: Versione corretta (v3, non v4)',
        'Build: Il progetto compila correttamente'
      ],
      interpreteOutput: {
        '✅ All checks passed': 'Puoi procedere con il commit',
        '⚠️ Warnings': 'Puoi committare ma è meglio sistemare',
        '❌ Errors found': 'DEVI correggere prima di committare'
      },
      commonIssues: [
        'ResponseFormatter not found: Aggiungi ResponseFormatter.success() nelle routes',
        'TypeScript errors: Correggi gli errori di tipo nel codice',
        'Console.log found: Rimuovi i console.log dal codice',
        'Build failed: Il codice non compila, controlla gli errori'
      ]
    },
    'validate-work': {
      title: 'Validate Work',
      purpose: 'Controlla solo le modifiche fatte nella sessione corrente',
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />,
      whenToUse: 'Dopo aver scritto codice, per verificare velocemente le modifiche',
      whatItChecks: [
        'File modificati: Lista di tutti i file cambiati',
        'Routes modificate: Controllo ResponseFormatter nelle routes cambiate',
        'Services modificati: Verifica che NON usino ResponseFormatter',
        'Nuovi file: Controllo che non siano file backup',
        'Import corretti: React Query invece di fetch diretto',
        'Console.log: Nei nuovi codici aggiunti',
        'TypeScript: Errori solo nei file modificati'
      ],
      interpreteOutput: {
        'Modified files': 'Elenco dei file che hai modificato',
        '✅ OK': 'Il file rispetta le regole',
        '❌ Missing ResponseFormatter': 'Aggiungi ResponseFormatter nella route',
        '⚠️ Backup file': 'Non committare file di backup'
      },
      commonIssues: [
        'ResponseFormatter in services: Rimuovilo, va solo nelle routes',
        'Direct fetch usage: Usa React Query invece di fetch',
        'New console.log: Rimuovi i console.log aggiunti'
      ]
    },
    'claude-help': {
      title: 'Claude Help',
      purpose: 'Guida rapida per sviluppatori con le regole del progetto',
      icon: <CommandLineIcon className="w-8 h-8 text-purple-500" />,
      whenToUse: 'Quando non ricordi le regole o hai dubbi su come fare qualcosa',
      whatItChecks: [
        'Non esegue controlli, mostra solo informazioni'
      ],
      interpreteOutput: {
        'Le 5 Regole d\'Oro': 'Regole fondamentali da non dimenticare MAI',
        'Comandi Rapidi': 'Lista dei comandi più utili',
        'File Importanti': 'Documenti e file critici del progetto',
        'Troubleshooting': 'Soluzioni ai problemi comuni',
        'Errori da Evitare': 'Cosa NON fare mai'
      },
      commonIssues: [
        'È una guida di riferimento, non un controllo',
        'Consultala quando hai dubbi sulle best practices',
        'Contiene esempi di codice corretto vs sbagliato'
      ]
    },
    'auth-system-check': {
      title: 'Auth System Check',
      purpose: '🔐 Verifica completa del sistema di autenticazione e sicurezza accessi',
      icon: <ShieldCheckIcon className="w-8 h-8 text-blue-500" />,
      whenToUse: 'Per verificare che il sistema di login, JWT, 2FA e sessioni funzioni correttamente',
      whatItChecks: [
        'File di autenticazione (middleware, service, routes)',
        'Configurazione JWT e validità secret',
        'Sistema 2FA con Speakeasy',
        'Database utenti e conteggi',
        'Rate limiting contro brute force',
        'Gestione sessioni con Redis',
        'Endpoint di autenticazione',
        'Sicurezza password con bcrypt',
        'Configurazione CORS'
      ],
      interpreteOutput: {
        'Health Score': 'Punteggio totale di salute del modulo (0-100)',
        '✅ Passati': 'Controlli completati con successo',
        '⚠️ Warning': 'Problemi non bloccanti da migliorare',
        '❌ Errori': 'Problemi critici da risolvere subito'
      },
      commonIssues: [
        'JWT_SECRET troppo corto: Aumentare a minimo 32 caratteri',
        'Redis non attivo: Avviare Redis per gestione sessioni',
        '2FA non configurato: Installare speakeasy per maggiore sicurezza',
        'Rate limiting mancante: Installare express-rate-limit'
      ]
    },
    'run-all-health-checks': {
      title: 'Run All Health Checks',
      purpose: '🏥 Esegue TUTTI i controlli di sistema e genera un report completo dello stato di salute',
      icon: <ArrowPathIcon className="w-8 h-8 text-green-500" />,
      whenToUse: 'Per avere una panoramica completa dello stato del sistema, ideale per controlli periodici o prima di deploy',
      whatItChecks: [
        'TUTTI i moduli del sistema in sequenza',
        'Autenticazione e sicurezza',
        'Database e performance',
        'Sistema notifiche',
        'Sistema backup',
        'Chat e WebSocket',
        'Pagamenti e Stripe',
        'AI e OpenAI',
        'Workflow richieste'
      ],
      interpreteOutput: {
        'OVERALL HEALTH SCORE': 'Media dei punteggi di tutti i moduli',
        'Tabella riepilogativa': 'Stato e score di ogni modulo',
        'Statistiche globali': 'Totale controlli, passati, warning, errori',
        'Azioni richieste': 'Lista prioritizzata di interventi necessari'
      },
      commonIssues: [
        'Score < 60: Sistema critico, intervento immediato',
        'Score 60-79: Sistema con problemi minori',
        'Score 80+: Sistema in salute',
        'Moduli critici: Risolvere prima i moduli con stato CRITICAL'
      ]
    },
    'audit-system-check': {
      title: 'Audit System Check',
      purpose: '🔍 Verifica completa e analisi del sistema di Audit Log per monitoraggio e sicurezza',
      icon: <BookOpenIcon className="w-8 h-8 text-indigo-500" />,
      whenToUse: 'Per verificare lo stato del sistema di audit, controllare che tutti i log vengano registrati correttamente, o dopo aver fatto modifiche al sistema di logging',
      whatItChecks: [
        '1. DATABASE: Connessione e tabelle AuditLog, AuditLogRetention, AuditLogAlert',
        '2. STATISTICHE: Numero totale di log, distribuzione per categoria, ultimo log registrato',
        '3. CODICE BACKEND: Presenza dei file middleware, service e routes per audit',
        '4. INTEGRAZIONE: Verifica che il middleware sia attivo in server.ts',
        '5. FRONTEND: Presenza dei componenti dashboard (8 componenti React)',
        '6. DIPENDENZE: json2csv, lodash, helmet e altre librerie necessarie',
        '7. TEST CREAZIONE: Crea e cancella un log di test per verificare scrittura',
        '8. RETENTION POLICIES: Controlla le policy di pulizia automatica configurate',
        '9. ALERT SYSTEM: Verifica gli alert configurati per eventi critici',
        '10. PERFORMANCE: Statistiche ultimi 24h, 7 giorni, errori e log critici'
      ],
      interpreteOutput: {
        '✅ SISTEMA OPERATIVO': 'Il sistema di audit è completamente funzionante',
        '📊 Statistiche': 'Mostra il numero totale di log e la distribuzione',
        '⚠️ Warning': 'Qualcosa può essere migliorato ma non è bloccante',
        '❌ Errore': 'Problema critico che impedisce il logging',
        '📋 Raccomandazioni': 'Suggerimenti per ottimizzare il sistema'
      },
      commonIssues: [
        'Nessun log trovato: Il middleware potrebbe non essere integrato correttamente',
        'json2csv non installato: Eseguire npm install json2csv nel backend',
        'Tabelle mancanti: Eseguire npx prisma db push per creare le tabelle',
        'Nessuna retention policy: Configurare le policy per pulizia automatica dei log vecchi',
        'Alto numero di errori: Investigare i log di errore per trovare problemi nel sistema'
      ]
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CommandLineIcon className="w-8 h-8 text-blue-500" />
              Script Manager
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Esegui e monitora gli script di sistema direttamente dal browser
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('execute')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'execute'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CogIcon className="w-5 h-5 inline-block mr-2" />
              Esecuzione Script
            </button>
            <button
              onClick={() => setActiveTab('documentation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documentation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpenIcon className="w-5 h-5 inline-block mr-2" />
              Documentazione
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'execute' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scripts List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Script Disponibili</h2>
            
            {!scripts || scripts.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  Nessuno script disponibile. Verifica che gli script siano presenti nella cartella /scripts
                </p>
              </div>
            ) : (
            scripts && Array.isArray(scripts) && scripts.map((script) => {
              const isRunning = runningScripts.has(script.name);
              const output = outputs[script.name];
              const color = getScriptColor(script.name);
              
              return (
                <div
                  key={script.name}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                    selectedScript === script.name 
                      ? `border-${color}-500 ring-2 ring-${color}-200` 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-${color}-500`}>
                            {getScriptIcon(script.name)}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {script.displayName}
                          </h3>
                          {!script.available && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Non disponibile
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {script.description}
                        </p>
                        
                        {/* Status */}
                        {output && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            {output.exitCode === 0 ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            ) : output.exitCode === -1 ? (
                              <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-gray-500">
                              {new Date(output.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => runScript(script.name)}
                        disabled={!script.available || isRunning}
                        className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isRunning
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : script.available
                            ? `bg-${color}-500 text-white hover:bg-${color}-600`
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isRunning ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Output Panel */}
          <div className="bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CommandLineIcon className="w-4 h-4" />
                Output Console
                {selectedScript && (
                  <span className="ml-auto text-xs text-gray-400">
                    {selectedScript}
                  </span>
                )}
              </h2>
            </div>
            
            <div 
              ref={el => {
                if (selectedScript) {
                  outputRefs.current[selectedScript] = el;
                }
              }}
              className="p-4 overflow-y-auto font-mono text-xs text-gray-300"
              style={{ 
                backgroundColor: '#1a1a1a',
                minHeight: '500px',
                maxHeight: '700px',
                height: 'calc(100vh - 450px)'
              }}
            >
              {selectedScript && outputs[selectedScript] ? (
                <>
                  {/* Output */}
                  {outputs[selectedScript].output && (
                    <pre 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: formatOutput(outputs[selectedScript].output) 
                      }}
                    />
                  )}
                  
                  {/* Errors */}
                  {outputs[selectedScript].errors && (
                    <pre className="whitespace-pre-wrap text-red-400 mt-4">
                      {outputs[selectedScript].errors}
                    </pre>
                  )}
                  
                  {/* Exit Code */}
                  {outputs[selectedScript].exitCode !== -1 && (
                    <div className="mt-4 pt-4 border-t border-gray-700 text-gray-400">
                      Exit code: {outputs[selectedScript].exitCode}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500">
                  Seleziona uno script e clicca su Play per vedere l'output
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Documentation Tab */
        <div className="space-y-6">
          {Object.entries(scriptDocumentation).map(([scriptName, doc]) => (
            <div key={scriptName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  {doc.icon}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{doc.title}</h3>
                    <p className="mt-1 text-gray-600">{doc.purpose}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* When to Use */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    Quando Usarlo
                  </h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                    {doc.whenToUse}
                  </p>
                </div>

                {/* What it Checks */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    Cosa Controlla
                  </h4>
                  <ul className="space-y-1">
                    {doc.whatItChecks.map((check, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to Interpret */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-purple-500" />
                    Come Interpretare l'Output
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {Object.entries(doc.interpreteOutput).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-3 mb-2 last:mb-0">
                        <span className="font-mono text-sm font-semibold text-gray-700 min-w-[120px]">
                          {key}:
                        </span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Issues */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    Problemi Comuni e Soluzioni
                  </h4>
                  <div className="space-y-2">
                    {doc.commonIssues.map((issue, idx) => (
                      <div key={idx} className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{issue.split(':')[0]}:</span>
                          {issue.substring(issue.indexOf(':') + 1)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions (only in Execute tab) */}
      {activeTab === 'execute' && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Come usare Script Manager
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Check System</strong>: Verifica lo stato del sistema prima di iniziare</li>
            <li>• <strong>Pre Commit Check</strong>: Esegui tutti i controlli prima di un commit</li>
            <li>• <strong>Validate Work</strong>: Controlla le modifiche fatte al codice</li>
            <li>• <strong>Claude Help</strong>: Visualizza la guida rapida per sviluppatori</li>
            <li>• <strong>Audit System Check</strong>: 🔍 Verifica completa del sistema di logging e audit trail</li>
          </ul>
        </div>
      )}
    </div>
  );
}