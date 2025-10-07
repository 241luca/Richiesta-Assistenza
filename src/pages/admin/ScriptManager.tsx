import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PlayIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  ClockIcon,
  InformationCircleIcon,
  BookOpenIcon,
  CogIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ScaleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { api } from '@/services/api';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ScriptManager Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-700 font-bold mb-2">Si è verificato un errore</h2>
            <p className="text-red-600">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Ricarica la pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

function ScriptManagerInner() {
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, ScriptOutput>>({});
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'execute' | 'documentation'>('execute');
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Usa React Router per la navigazione
  const navigate = useNavigate();
  
  // Nuovi stati per le funzionalità avanzate della console
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(800);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Fetch available scripts dal DATABASE
  const { data: scripts, isLoading, refetch } = useQuery({
    queryKey: ['admin-scripts-config'],
    queryFn: async () => {
      const response = await api.get('/admin/script-configs/enabled/list');
      const dbScripts = response.data?.data || [];
      
      // Trasforma i dati dal database nel formato atteso dal componente
      return dbScripts.map((script: any) => ({
        name: script.scriptName,
        displayName: script.displayName,
        available: script.isEnabled,
        description: script.description,
        // Aggiungi tutti i dati extra dalla configurazione
        ...script
      }));
    },
    staleTime: 5 * 60 * 1000
  });

  // Run script mutation
  const runScriptMutation = useMutation({
    mutationFn: async ({ scriptName, quickMode = false }: { scriptName: string; quickMode?: boolean }) => {
      console.log('Mutation running for:', scriptName);
      
      // Per script complessi, aumenta il timeout a 5 minuti
      const isComplexScript = scriptName === 'request-system-check-complete' || 
                             scriptName === 'audit-system-check' ||
                             scriptName === 'quote-system-check-complete' ||
                             scriptName === 'intervention-report-check-complete' ||
                             scriptName === 'run-all-checks';
      
      const timeout = isComplexScript ? 300000 : 60000; // 5 minuti per script complessi, 1 minuto per gli altri
      
      // Aggiungi flag --quick se richiesto
      const scriptToRun = quickMode && (scriptName === 'request-system-check-complete' || 
                                        scriptName === 'quote-system-check-complete' ||
                                        scriptName === 'intervention-report-check-complete' ||
                                        scriptName === 'audit-system-check')
        ? scriptName + ' --quick' 
        : scriptName;
      
      console.log('Calling API with:', scriptToRun, 'timeout:', timeout);
      
      const response = await api.post('/admin/scripts/run', { scriptName: scriptToRun }, { timeout });
      const result = response.data?.data || response.data;
      return { scriptName, result: result as ScriptOutput };
    },
    onMutate: ({ scriptName }) => {
      setRunningScripts(prev => new Set(prev).add(scriptName));
      setSelectedScript(scriptName);
      setOutputs(prev => ({
        ...prev,
        [scriptName]: { output: 'Esecuzione in corso...', errors: '', exitCode: -1, timestamp: new Date().toISOString() }
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
    onError: (error, { scriptName }) => {
      setOutputs(prev => ({
        ...prev,
        [scriptName]: {
          output: '',
          errors: `Errore: ${error.message}`,
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

  const runScript = (scriptName: string, quickMode: boolean = false) => {
    console.log('Running script:', scriptName, 'quickMode:', quickMode);
    try {
      runScriptMutation.mutate({ scriptName, quickMode });
    } catch (error) {
      console.error('Error running script:', error);
    }
  };

  // Gestione del drag per ridimensionare la console
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = Math.max(400, Math.min(window.innerHeight - 150, dragStartHeight.current + deltaY));
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Funzione per pulire l'output dello script selezionato
  const clearOutput = () => {
    if (selectedScript) {
      setOutputs(prev => ({
        ...prev,
        [selectedScript]: {
          output: '',
          errors: '',
          exitCode: 0,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  // Funzione per esportare l'output come file .txt
  const exportOutput = () => {
    if (!selectedScript || !outputs[selectedScript]) return;
    
    const output = outputs[selectedScript];
    const cleanOutput = stripHtmlTags(output.output + '\n' + output.errors);
    const content = `Script: ${selectedScript}\nTimestamp: ${output.timestamp}\nExit Code: ${output.exitCode}\n\n${cleanOutput}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScript}-output-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Funzione per stampare l'output
  const printOutput = () => {
    if (!selectedScript || !outputs[selectedScript]) return;
    
    const output = outputs[selectedScript];
    const cleanOutput = stripHtmlTags(output.output + '\n' + output.errors);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Script Output - ${selectedScript}</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
              h1 { font-size: 16px; margin-bottom: 10px; }
              .meta { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Script Output: ${selectedScript}</h1>
            <div class="meta">
              Timestamp: ${output.timestamp}<br>
              Exit Code: ${output.exitCode}
            </div>
            <pre>${cleanOutput}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Funzione helper per rimuovere i tag HTML
  const stripHtmlTags = (text: string) => {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\[0;31m/g, '')
      .replace(/\[0;32m/g, '')
      .replace(/\[1;33m/g, '')
      .replace(/\[0;34m/g, '')
      .replace(/\[0;36m/g, '')
      .replace(/\[0m/g, '');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getScriptIcon = (scriptName: string) => {
    const icons: Record<string, JSX.Element> = {
      'check-system': <ArrowPathIcon className="w-5 h-5" />,
      'pre-commit-check': <CheckCircleIcon className="w-5 h-5" />,
      'validate-work': <ExclamationTriangleIcon className="w-5 h-5" />,
      'claude-help': <CommandLineIcon className="w-5 h-5" />,
      'audit-system-check': <ScaleIcon className="w-5 h-5" />,
      'request-system-check-complete': <DocumentMagnifyingGlassIcon className="w-5 h-5" />,
      'quote-system-check-complete': <CurrencyDollarIcon className="w-5 h-5" />,
      'intervention-report-check-complete': <DocumentTextIcon className="w-5 h-5" />
    };
    return icons[scriptName] || <PlayIcon className="w-5 h-5" />;
  };

  const getScriptColor = (scriptName: string) => {
    const colors: Record<string, string> = {
      'check-system': 'blue',
      'pre-commit-check': 'green',
      'validate-work': 'yellow',
      'claude-help': 'purple',
      'audit-system-check': 'red',
      'request-system-check-complete': 'cyan',
      'quote-system-check-complete': 'emerald',
      'intervention-report-check-complete': 'amber'
    };
    return colors[scriptName] || 'gray';
  };

  // Traduzione nomi script
  const getScriptDisplayName = (script: Script) => {
    const translations: Record<string, string> = {
      'request-system-check-complete': 'Analisi Completa Modulo Richieste',
      'quote-system-check-complete': 'Analisi Completa Modulo Preventivi',
      'intervention-report-check-complete': 'Analisi Completa Modulo Rapporti',
      'audit-system-check': 'Analisi Completa Sistema Audit',
      'check-system': 'Controllo Sistema',
      'pre-commit-check': 'Controllo Pre-Commit',
      'validate-work': 'Valida Modifiche',
      'claude-help': 'Guida Sviluppatore'
    };
    return translations[script.name] || script.displayName;
  };

  // Traduzione descrizioni
  const getScriptDescription = (script: Script) => {
    const descriptions: Record<string, string> = {
      'request-system-check-complete': 'Analisi dettagliata e completa del modulo richieste con 17 sezioni di controlli',
      'quote-system-check-complete': 'Verifica dettagliata del modulo preventivi con 17 sezioni di controlli specifici',
      'intervention-report-check-complete': 'Analisi completa del modulo rapporti intervento con 17 sezioni di verifiche',
      'audit-system-check': 'Verifica completa del sistema di audit log e tracciamento con 17 sezioni',
      'check-system': 'Verifica completa dello stato del sistema',
      'pre-commit-check': 'Controlli da eseguire prima di salvare il codice',
      'validate-work': 'Controlla le modifiche fatte nella sessione corrente',
      'claude-help': 'Mostra la guida rapida con le regole del progetto'
    };
    return descriptions[script.name] || script.description;
  };

  const formatOutput = (text: string) => {
    // Convert ANSI color codes to HTML
    return text
      .replace(/\[0;31m/g, '<span class="text-red-500">')
      .replace(/\[0;32m/g, '<span class="text-green-500">')
      .replace(/\[1;33m/g, '<span class="text-yellow-500">')
      .replace(/\[0;34m/g, '<span class="text-blue-500">')
      .replace(/\[0;36m/g, '<span class="text-cyan-500">')
      .replace(/\[0m/g, '</span>')
      .replace(/✅/g, '<span class="text-green-500">✅</span>')
      .replace(/❌/g, '<span class="text-red-500">❌</span>')
      .replace(/⚠️/g, '<span class="text-yellow-500">⚠️</span>')
      .replace(/🔍/g, '🔍')
      .replace(/📝/g, '📝')
      .replace(/📊/g, '📊')
      .replace(/🚀/g, '🚀')
      .replace(/💼/g, '💼')
      .replace(/💰/g, '💰')
      .replace(/📋/g, '📋');
  };

  // Script documentation - Usa i dati dal database
  const getScriptDocumentation = (scriptName: string) => {
    const script = scripts?.find((s: any) => s.scriptName === scriptName || s.name === scriptName);
    if (!script) return null;
    
    return {
      title: script.displayName,
      purpose: script.purpose || script.description,
      icon: getScriptIcon(scriptName),
      whenToUse: script.whenToUse || '',
      whatItChecks: script.whatItChecks || [],
      interpreteOutput: script.interpreteOutput || {},
      commonIssues: script.commonIssues || [],
      sections: script.sections || null
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Controllo errori
  if (!scripts) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Errore nel caricamento degli script. Ricarica la pagina.</p>
        </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Navigating to /admin/scripts/config');
                navigate('/admin/scripts/config');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <CogIcon className="w-5 h-5" />
              Gestione Script
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
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
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">
                            {getScriptIcon(script.name)}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {getScriptDisplayName(script)}
                          </h3>
                          {!script.available && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Non disponibile
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {getScriptDescription(script)}
                        </p>
                        
                        {/* Avviso per script lunghi */}
                        {(script.name === 'request-system-check-complete' || 
                          script.name === 'quote-system-check-complete' ||
                          script.name === 'intervention-report-check-complete' ||
                          script.name === 'audit-system-check') && (
                          <p className="mt-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded inline-block">
                            ⏱️ Questo script può richiedere 1-2 minuti per completare tutti i controlli
                          </p>
                        )}
                        
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
                      
                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-1">
                        <button
                          onClick={() => runScript(script.name, false)}
                          disabled={!script.available || isRunning}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            isRunning
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : script.available
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isRunning ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <PlayIcon className="w-5 h-5" />
                              <span className="text-xs">Completo</span>
                            </>
                          )}
                        </button>
                        
                        {/* Pulsante modalità veloce per script complessi */}
                        {(script.name === 'request-system-check-complete' ||
                          script.name === 'quote-system-check-complete' ||
                          script.name === 'intervention-report-check-complete' ||
                          script.name === 'audit-system-check') && (
                          <button
                            onClick={() => runScript(script.name, true)}
                            disabled={!script.available || isRunning}
                            className={`px-4 py-1 rounded-lg font-medium transition-colors flex items-center gap-2 text-xs ${
                              isRunning
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : script.available
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ⚡ Veloce
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Output Panel con funzionalità avanzate */}
          <div className="bg-gray-900 rounded-lg shadow-sm overflow-hidden flex flex-col" style={{ height: `${consoleHeight}px` }}>
            {/* Header della console con i nuovi pulsanti */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CommandLineIcon className="w-4 h-4" />
                Console Output
                {selectedScript && (
                  <span className="ml-2 text-xs text-gray-400">
                    {selectedScript}
                  </span>
                )}
              </h2>
              
              {/* Nuovi pulsanti di controllo */}
              <div className="flex items-center gap-2">
                <button
                  onClick={clearOutput}
                  disabled={!selectedScript || !outputs[selectedScript]}
                  className="p-1.5 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Pulisci Output"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={exportOutput}
                  disabled={!selectedScript || !outputs[selectedScript]}
                  className="p-1.5 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Esporta come .txt"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={printOutput}
                  disabled={!selectedScript || !outputs[selectedScript]}
                  className="p-1.5 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Stampa Output"
                >
                  <PrinterIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
                  title="Modalità Fullscreen"
                >
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Barra di ridimensionamento */}
            <div
              className="h-1 bg-gray-700 hover:bg-gray-600 cursor-ns-resize transition-colors"
              onMouseDown={(e) => {
                setIsDragging(true);
                dragStartY.current = e.clientY;
                dragStartHeight.current = consoleHeight;
              }}
            />
            
            <div 
              ref={el => {
                if (selectedScript) {
                  outputRefs.current[selectedScript] = el;
                }
              }}
              className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300"
              style={{ 
                backgroundColor: '#1a1a1a'
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
          {scripts && scripts.map((script: any) => {
            const doc = getScriptDocumentation(script.scriptName || script.name);
            if (!doc) return null;
            
            return (
              <div key={script.scriptName || script.name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                      {doc.whatItChecks.map((check: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sections for complex scripts */}
                  {doc.sections && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-cyan-500" />
                        Le 17 Sezioni di Controllo
                      </h4>
                      <div className="bg-cyan-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {doc.sections.map((section: any) => (
                            <div key={section.number} className="flex items-start gap-2">
                              <span className="font-bold text-cyan-700">{section.number}.</span>
                              <div>
                                <span className="font-medium text-gray-800">{section.name}</span>
                                <span className="text-gray-600 text-sm block">{section.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* How to Interpret */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <InformationCircleIcon className="w-5 h-5 text-purple-500" />
                      Come Interpretare l'Output
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {Object.entries(doc.interpreteOutput).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3 mb-2 last:mb-0">
                          <span className="font-mono text-sm font-semibold text-gray-700 min-w-[180px]">
                            {key}:
                          </span>
                          <span className="text-gray-600">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Issues */}
                  {doc.commonIssues && doc.commonIssues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                        Problemi Comuni e Soluzioni
                      </h4>
                      <div className="space-y-2">
                        {doc.commonIssues.map((issue: string, idx: number) => (
                          <div key={idx} className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">{issue.split(':')[0]}:</span>
                              {issue.substring(issue.indexOf(':') + 1)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions (only in Execute tab) */}
      {activeTab === 'execute' && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Come usare Script Manager
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Analisi Complete (17 sezioni)</strong>: Verifica approfondita di Richieste, Preventivi, Rapporti e Audit</li>
            <li>• <strong>Modalità Veloce (⚡)</strong>: Disponibile per le analisi complete, salta i controlli TypeScript</li>
            <li>• <strong>Controllo Sistema</strong>: Verifica lo stato del sistema prima di iniziare</li>
            <li>• <strong>Controllo Pre-Commit</strong>: Esegui tutti i controlli prima di un commit</li>
            <li>• <strong>Valida Modifiche</strong>: Controlla le modifiche fatte al codice</li>
            <li>• <strong>Guida Sviluppatore</strong>: Visualizza la guida rapida per sviluppatori</li>
            <li>• <strong>Tab Documentazione</strong>: Informazioni dettagliate su ogni script</li>
            <li>• <strong>Console Output Avanzata</strong>: 
              <ul className="ml-4 mt-1 space-y-0.5">
                <li>◦ <strong>Ridimensionabile</strong>: Trascina la barra grigia per cambiare altezza</li>
                <li>◦ <strong>Fullscreen</strong>: Clicca sull'icona espandi (⛶) per modalità schermo intero</li>
                <li>◦ <strong>Stampa</strong>: Clicca sull'icona stampante (🖨️) per stampare l'output</li>
                <li>◦ <strong>Export .txt</strong>: Clicca sull'icona download (⬇) per salvare come file</li>
                <li>◦ <strong>Pulisci</strong>: Clicca sull'icona cestino (🗑️) per cancellare l'output</li>
              </ul>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Export wrapped component
export function ScriptManager() {
  return (
    <ErrorBoundary>
      <ScriptManagerInner />
    </ErrorBoundary>
  );
}
