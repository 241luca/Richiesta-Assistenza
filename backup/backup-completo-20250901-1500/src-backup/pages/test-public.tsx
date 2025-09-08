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
  CpuChipIcon,
  ServerIcon,
  ShieldCheckIcon,
  TrashIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Test categories
const TEST_CATEGORIES = [
  {
    id: 'backend',
    name: 'Backend Completo',
    icon: BeakerIcon,
    description: 'Esegui tutti i test del backend',
    color: 'blue',
    endpoint: 'backend'
  },
  {
    id: 'auth',
    name: 'Autenticazione',
    icon: ShieldCheckIcon,
    description: 'Test di login, registrazione e sicurezza',
    color: 'purple',
    endpoint: 'auth'
  },
  {
    id: 'api',
    name: 'API Endpoints',
    icon: ServerIcon,
    description: 'Test delle API REST',
    color: 'green',
    endpoint: 'api'
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    icon: CpuChipIcon,
    description: 'Test delle connessioni WebSocket',
    color: 'orange',
    endpoint: 'websocket'
  },
  {
    id: 'integration',
    name: 'Integration',
    icon: ChartBarIcon,
    description: 'Test di integrazione completi',
    color: 'indigo',
    endpoint: 'integration'
  }
];

// Interface per i risultati
interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  timestamp: string;
}

interface TestReport {
  results: TestResult[];
  coverage: number;
  lastRun: string | null;
}

export default function PublicTestDashboard() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('backend');
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [streamingResults, setStreamingResults] = useState<TestResult[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Fetch dei risultati esistenti - SENZA autenticazione
  const { data: testReport, isLoading: loadingResults } = useQuery<TestReport>({
    queryKey: ['test-results'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3200/api/admin/tests/results');
      if (!response.ok) throw new Error('Errore caricamento risultati');
      return response.json();
    },
    refetchInterval: isRunning ? 2000 : false
  });

  // Mutation per eseguire i test
  const runTestsMutation = useMutation({
    mutationFn: async (category: string) => {
      setIsRunning(true);
      setTestOutput([]);
      setStreamingResults([]);
      
      const categoryConfig = TEST_CATEGORIES.find(c => c.id === category);
      if (!categoryConfig) throw new Error('Categoria non trovata');
      
      // Chiamata all'endpoint per eseguire i test
      const response = await fetch(`http://localhost:3200/api/admin/tests/run/${categoryConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Errore esecuzione test');
      }

      // Leggi lo streaming dei risultati
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let lineNumber = 1;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const result = JSON.parse(line) as TestResult;
              
              // Aggiungi risultato allo streaming
              setStreamingResults(prev => [...prev, result]);
              
              // Aggiungi all'output della console
              const outputLine = formatTestOutput(result, lineNumber);
              setTestOutput(prev => [...prev, outputLine]);
              lineNumber++;
              
            } catch (e) {
              // Se non è JSON, mostra come testo normale
              setTestOutput(prev => [...prev, `[${String(lineNumber).padStart(3, '0')}] ${line}`]);
              lineNumber++;
            }
          }
        }
      }

      // Ricarica i risultati finali
      await queryClient.invalidateQueries({ queryKey: ['test-results'] });
      setIsRunning(false);
      
      return true;
    },
    onSuccess: () => {
      toast.success('Test completati con successo!');
    },
    onError: (error: any) => {
      setIsRunning(false);
      toast.error(`Errore durante l'esecuzione dei test: ${error.message}`);
    }
  });

  // Mutation per pulire i risultati
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:3200/api/admin/tests/cleanup', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Errore pulizia risultati');
      return response.json();
    },
    onSuccess: () => {
      setTestOutput([]);
      setStreamingResults([]);
      queryClient.invalidateQueries({ queryKey: ['test-results'] });
      toast.success('Risultati puliti con successo');
    },
    onError: () => {
      toast.error('Errore durante la pulizia dei risultati');
    }
  });

  // Helper per formattare l'output dei test
  const formatTestOutput = (result: TestResult, lineNumber: number): string => {
    const lineNo = `[${String(lineNumber).padStart(3, '0')}]`;
    
    let icon = '';
    let message = '';
    
    switch (result.status) {
      case 'running':
        icon = '⏳';
        message = `${result.name}`;
        break;
      case 'passed':
        icon = '✅';
        message = `${result.name} ${result.duration ? `(${result.duration}ms)` : ''}`;
        break;
      case 'failed':
        icon = '❌';
        message = `${result.name} - ${result.error || 'Fallito'}`;
        break;
      case 'skipped':
        icon = '⏭️';
        message = `${result.name} - Saltato`;
        break;
      default:
        icon = '📋';
        message = result.name;
    }
    
    return `${lineNo} ${icon} ${message}`;
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'skipped': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'running': return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return null;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [testOutput]);

  // Calcola statistiche dai risultati
  const calculateStats = () => {
    const results = streamingResults.length > 0 ? streamingResults : (testReport?.results || []);
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const total = results.length;
    
    return {
      total,
      passed,
      failed,
      skipped,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  };

  const stats = calculateStats();

  // Raggruppa risultati per categoria
  const groupedResults = () => {
    const results = streamingResults.length > 0 ? streamingResults : (testReport?.results || []);
    return results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, TestResult[]>);
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
                  <h1 className="text-2xl font-bold text-gray-900">Test Sistema (Pubblico)</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Dashboard test accessibile senza autenticazione
                  </p>
                </div>
              </div>
              
              {/* Ultima esecuzione */}
              {testReport?.lastRun && (
                <div className="text-sm text-gray-500">
                  Ultima esecuzione: {new Date(testReport.lastRun).toLocaleString('it-IT')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie Test</h2>
                <div className="space-y-2">
                  {TEST_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={isRunning}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="w-5 h-5 mt-0.5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{category.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="border-t px-6 py-4 space-y-2">
                <button
                  onClick={() => runTestsMutation.mutate(selectedCategory)}
                  disabled={isRunning}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    isRunning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Test in esecuzione...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Esegui Test</span>
                    </>
                  )}
                </button>
                
                {(testReport?.results?.length || streamingResults.length > 0) && (
                  <button
                    onClick={() => cleanupMutation.mutate()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Pulisci Risultati</span>
                  </button>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Totali</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Passati</span>
                  <span className="font-semibold text-green-600">{stats.passed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Falliti</span>
                  <span className="font-semibold text-red-600">{stats.failed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saltati</span>
                  <span className="font-semibold text-yellow-600">{stats.skipped}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Successo</span>
                    <span className="font-semibold">{stats.successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Console Output */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CommandLineIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Output Console</h3>
                </div>
                <button
                  onClick={() => setTestOutput([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Pulisci
                </button>
              </div>
              <div 
                ref={outputRef}
                className="p-4 bg-gray-900 text-green-400 font-mono text-sm h-96 overflow-y-auto"
              >
                {testOutput.length === 0 ? (
                  <div className="text-gray-500">
                    [001] 🚀 Sistema Test Pronto
                    <br />
                    [002] 📊 Seleziona una categoria e clicca "Esegui Test"
                    <br />
                    [003] ✨ I risultati appariranno qui in tempo reale
                  </div>
                ) : (
                  testOutput.map((line, index) => (
                    <div key={index} className="mb-1">{line}</div>
                  ))
                )}
              </div>
            </div>

            {/* Test Results */}
            {(streamingResults.length > 0 || testReport?.results?.length) && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Risultati Test</h2>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {Object.entries(groupedResults()).map(([category, results]) => (
                    <div key={category} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                          <p className="text-sm text-gray-500 mt-1">{results.length} test</p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600">
                            ✓ {results.filter(r => r.status === 'passed').length}
                          </span>
                          <span className="text-red-600">
                            ✗ {results.filter(r => r.status === 'failed').length}
                          </span>
                          <span className="text-yellow-600">
                            ○ {results.filter(r => r.status === 'skipped').length}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {results.map((test) => (
                          <div key={test.id} className="border rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(test.status)}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{test.name}</div>
                                {test.duration && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Durata: {formatDuration(test.duration)}
                                  </div>
                                )}
                                {test.error && (
                                  <div className="text-sm text-red-600 mt-1">
                                    Errore: {test.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Pagina Test Pubblica</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• Questa pagina è accessibile senza autenticazione</p>
                    <p>• Perfetta per testare il sistema rapidamente</p>
                    <p>• I test sono reali e modificano il database di test</p>
                    <p>• URL diretto: <code className="bg-blue-100 px-1">http://localhost:5193/test-public</code></p>
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
