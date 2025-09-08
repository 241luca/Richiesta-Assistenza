import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BeakerIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ServerIcon,
  ShieldCheckIcon,
  TrashIcon,
  InformationCircleIcon,
  CircleStackIcon,
  CloudIcon,
  MapIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Mappa icone per categorie
const CATEGORY_ICONS: Record<string, any> = {
  backend: ServerIcon,
  e2e: CloudIcon,
  database: CircleStackIcon,
  api: ServerIcon,
  integration: MapIcon
};

// Colori per severità
const SEVERITY_COLORS = {
  critical: 'bg-red-100 border-red-500 text-red-900',
  error: 'bg-orange-100 border-orange-500 text-orange-900',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-900',
  info: 'bg-blue-100 border-blue-500 text-blue-900',
  success: 'bg-green-100 border-green-500 text-green-900'
};

interface TestCategory {
  name: string;
  description: string;
  tests?: string[];
  scripts?: Array<{ file: string; name: string }>;
}

interface TestResult {
  type: string;
  name?: string;
  status?: string;
  duration?: number;
  error?: string;
  message?: string;
  problem?: string;
  solution?: string;
  severity?: string;
  summary?: any;
  timestamp?: string;
}

export default function AdminTestDashboard() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('backend');
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<TestResult[]>([]);
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [categories, setCategories] = useState<Record<string, TestCategory>>({});
  const outputRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Carica categorie di test
  useEffect(() => {
    fetch('/api/admin/tests/categories', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => {
        toast.error('Errore caricamento categorie test');
        console.error(err);
      });
  }, []);

  // Esegui test
  const runTests = async (category: string) => {
    setIsRunning(true);
    setTestOutput([]);
    setCurrentSummary(null);

    // Usa EventSource per streaming risultati
    const eventSource = new EventSource(`/api/admin/tests/run/${category}`, {
      withCredentials: true
    });

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Aggiungi all'output
        setTestOutput(prev => [...prev, data]);
        
        // Se è un summary, salvalo
        if (data.type === 'complete' && data.summary) {
          setCurrentSummary(data.summary);
          setIsRunning(false);
          eventSource.close();
          
          // Mostra toast in base al risultato
          if (data.summary.status === 'success') {
            toast.success(data.summary.message);
          } else if (data.summary.status === 'error') {
            toast.error(data.summary.message);
          } else if (data.summary.status === 'warning') {
            toast(data.summary.message, { icon: '⚠️' });
          }
        }
        
        // Se è un errore fatale
        if (data.type === 'fatal') {
          toast.error('Errore fatale durante i test');
          setIsRunning(false);
          eventSource.close();
        }
      } catch (err) {
        console.error('Errore parsing risultato:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsRunning(false);
      eventSource.close();
      toast.error('Connessione persa con il server');
    };
  };

  // Ferma test
  const stopTests = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsRunning(false);
    toast('Test interrotti');
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [testOutput]);

  // Helper per formattare output
  const renderOutputLine = (item: TestResult, index: number) => {
    switch (item.type) {
      case 'start':
        return (
          <div key={index} className="flex items-center space-x-2 text-blue-600 font-semibold">
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            <span>{item.message}</span>
          </div>
        );
        
      case 'info':
        return (
          <div key={index} className="flex items-start space-x-2 text-gray-600">
            <InformationCircleIcon className="w-5 h-5 mt-0.5" />
            <span>{item.message}</span>
          </div>
        );
        
      case 'result':
        const Icon = item.status === 'passed' ? CheckCircleIcon :
                    item.status === 'failed' ? XCircleIcon :
                    item.status === 'warning' ? ExclamationTriangleIcon :
                    item.status === 'skipped' ? ArrowPathIcon : null;
        
        const colorClass = item.status === 'passed' ? 'text-green-600' :
                          item.status === 'failed' ? 'text-red-600' :
                          item.status === 'warning' ? 'text-yellow-600' :
                          item.status === 'skipped' ? 'text-gray-400' : '';
        
        return (
          <div key={index} className={`flex items-start space-x-2 ${colorClass}`}>
            {Icon && <Icon className="w-5 h-5 mt-0.5" />}
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              {item.duration && (
                <span className="text-sm text-gray-500 ml-2">({item.duration}ms)</span>
              )}
              {item.error && (
                <div className="text-sm mt-1 text-red-600 bg-red-50 p-2 rounded">
                  {item.error}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'suggestion':
        return (
          <div key={index} className={`border-l-4 p-4 mt-2 ${SEVERITY_COLORS[item.severity || 'info']}`}>
            <div className="flex items-start space-x-2">
              <LightBulbIcon className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">💡 Suggerimento</div>
                <div className="text-sm mt-1">
                  <strong>Problema:</strong> {item.problem}
                </div>
                <div className="text-sm mt-1">
                  <strong>Soluzione:</strong> {item.solution}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div key={index} className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="text-lg font-semibold">{item.summary?.message}</div>
            <div className="text-sm text-gray-600 mt-2">
              Completato alle {new Date(item.timestamp!).toLocaleTimeString('it-IT')}
            </div>
          </div>
        );
        
      default:
        return (
          <div key={index} className="text-gray-600">
            {JSON.stringify(item)}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BeakerIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Sistema Test Amministrativo</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Esegui test completi del sistema con analisi e suggerimenti
                  </p>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center space-x-2">
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-600">Test in esecuzione...</span>
                  </>
                ) : (
                  <span className="text-gray-500">Pronto per test</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categorie */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie Test</h2>
                <div className="space-y-2">
                  {Object.entries(categories).map(([id, category]) => {
                    const Icon = CATEGORY_ICONS[id] || BeakerIcon;
                    const testCount = category.tests?.length || category.scripts?.length || 0;
                    
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedCategory(id)}
                        disabled={isRunning}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          selectedCategory === id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="w-5 h-5 mt-0.5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{category.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                            <div className="text-xs text-gray-400 mt-1">{testCount} test disponibili</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Pulsanti azione */}
              <div className="border-t px-6 py-4 space-y-2">
                {isRunning ? (
                  <button
                    onClick={stopTests}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    <span>Ferma Test</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => runTests(selectedCategory)}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <PlayIcon className="w-5 h-5" />
                      <span>Esegui Test</span>
                    </button>
                    
                    <button
                      onClick={() => runTests('all')}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <BeakerIcon className="w-5 h-5" />
                      <span>Esegui Tutti</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Riepilogo risultati */}
            {currentSummary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totali:</span>
                    <span className="font-semibold">{currentSummary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passati:</span>
                    <span className="font-semibold text-green-600">{currentSummary.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Falliti:</span>
                    <span className="font-semibold text-red-600">{currentSummary.failed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saltati:</span>
                    <span className="font-semibold text-yellow-600">{currentSummary.skipped}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Successo:</span>
                      <span className="font-semibold">{currentSummary.successRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          currentSummary.successRate >= 80 ? 'bg-green-600' :
                          currentSummary.successRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${currentSummary.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Output */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CommandLineIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Output Test</h3>
                </div>
                <button
                  onClick={() => {
                    setTestOutput([]);
                    setCurrentSummary(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Pulisci
                </button>
              </div>
              
              <div 
                ref={outputRef}
                className="p-6 max-h-[600px] overflow-y-auto"
              >
                {testOutput.length === 0 ? (
                  <div className="text-gray-500">
                    <div className="mb-4">
                      <p className="text-lg font-medium">Sistema Test Pronto ✅</p>
                      <p className="text-sm mt-2">Seleziona una categoria e clicca "Esegui Test"</p>
                    </div>
                    
                    {selectedCategory && categories[selectedCategory] && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          {categories[selectedCategory].name}
                        </h4>
                        <p className="text-sm text-blue-700 mb-3">
                          {categories[selectedCategory].description}
                        </p>
                        
                        {categories[selectedCategory].tests && (
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 mb-1">Test inclusi:</p>
                            <ul className="list-disc list-inside text-blue-700 space-y-1">
                              {categories[selectedCategory].tests!.map((test, i) => (
                                <li key={i}>{test}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {categories[selectedCategory].scripts && (
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 mb-1">Script inclusi:</p>
                            <ul className="list-disc list-inside text-blue-700 space-y-1">
                              {categories[selectedCategory].scripts!.map((script, i) => (
                                <li key={i}>{script.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testOutput.map((item, index) => renderOutputLine(item, index))}
                  </div>
                )}
              </div>
            </div>

            {/* Guida */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Come Usare il Sistema Test</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• <strong>Backend:</strong> Test unitari del server (health, auth, API, websocket)</p>
                    <p>• <strong>E2E:</strong> Test completi con browser automatizzato (Playwright)</p>
                    <p>• <strong>Database:</strong> Verifica integrità e pulizia database</p>
                    <p>• <strong>API:</strong> Test endpoint con curl</p>
                    <p>• <strong>Integration:</strong> Test workflow completi del sistema</p>
                    <p className="mt-3 font-medium">
                      💡 Ogni errore mostra un suggerimento su come risolverlo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
