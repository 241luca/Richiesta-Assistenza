import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
  LightBulbIcon,
  ClockIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

interface TestResult {
  name: string;
  category: string;
  status: 'success' | 'failure' | 'warning' | 'error';
  message: string;
  details?: any;
  executionTime: number;
  timestamp: string;
  suggestion?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  executionTime: number;
  categories: {
    [key: string]: {
      tests: TestResult[];
      passed: number;
      failed: number;
      warnings: number;
    };
  };
  suggestions: string[];
  criticalIssues: string[];
}

const AdminTestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Verifica autenticazione e ruolo admin
  useEffect(() => {
    if (!user) {
      toast.error('Devi effettuare il login per accedere a questa pagina');
      navigate('/login');
      return;
    }

    // CORREZIONE: Accetta sia ADMIN che SUPER_ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      toast.error('Non hai i permessi per accedere a questa pagina');
      navigate('/');
      return;
    }

    // Carica health status iniziale
    fetchSystemHealth();
  }, [user, navigate]);

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3200/api/test/health', {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Errore nel recupero dello stato del sistema:', error);
    }
  };

  const runTests = async (category: string = 'all') => {
    setLoading(true);
    setSelectedCategory(category);
    
    try {
      const endpoint = category === 'all' 
        ? 'http://localhost:3200/api/test/run' 
        : `http://localhost:3200/api/test/run/${category}`;
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta. Effettua nuovamente il login.');
          navigate('/login');
          return;
        }
        throw new Error('Errore nell\'esecuzione dei test');
      }

      const data = await response.json();
      
      if (data.success) {
        setTestReport(data.report);
        
        // Mostra toast di riepilogo
        const { score, message } = data.summary;
        if (score === 100) {
          toast.success(message);
        } else if (score >= 70) {
          toast(message, { icon: '⚠️' });
        } else {
          toast.error(message);
        }
        
        // Espandi automaticamente le categorie con problemi
        if (data.report.categories) {
          const categoriesWithIssues = new Set<string>();
          Object.entries(data.report.categories).forEach(([cat, catData]: [string, any]) => {
            if (catData.failed > 0 || catData.warnings > 0) {
              categoriesWithIssues.add(cat);
            }
          });
          setExpandedCategories(categoriesWithIssues);
        }
      } else {
        toast.error(data.error || 'Errore durante l\'esecuzione dei test');
      }
    } catch (error: any) {
      console.error('Errore:', error);
      toast.error('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'failure':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const testCategories = [
    { id: 'all', name: 'Tutti i Test', icon: '🧪' },
    { id: 'database', name: 'Database', icon: '🗄️' },
    { id: 'auth', name: 'Autenticazione', icon: '🔐' },
    { id: 'api', name: 'API', icon: '🌐' },
    { id: 'quotes', name: 'Preventivi', icon: '💰' },
    { id: 'subcategories', name: 'Sottocategorie', icon: '📂' },
    { id: 'maps', name: 'Google Maps', icon: '🗺️' },
    { id: 'websocket', name: 'WebSocket', icon: '🔄' },
    { id: 'security', name: 'Sicurezza', icon: '🛡️' },
    { id: 'performance', name: 'Performance', icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🧪 Sistema di Test Completo
              </h1>
              <p className="text-gray-600 mt-2">
                Esegui test completi del sistema per verificare il corretto funzionamento
              </p>
            </div>
            
            {/* Health Status Badge */}
            {systemHealth && (
              <div className={`text-right ${getHealthColor(systemHealth.status)}`}>
                <div className="text-2xl font-bold">
                  {systemHealth.status === 'operational' ? '✅' : 
                   systemHealth.status === 'degraded' ? '⚠️' : '❌'}
                </div>
                <div className="text-sm font-semibold uppercase">
                  {systemHealth.status}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {testCategories.slice(0, 4).map((cat) => (
            <button
              key={cat.id}
              onClick={() => runTests(cat.id)}
              disabled={loading}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <PlayIcon className="h-5 w-5 text-blue-600" />
              </div>
            </button>
          ))}
        </div>

        {/* Main Test Panel */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Pannello di Controllo Test</h2>
              <button
                onClick={() => runTests('all')}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Esecuzione in corso...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Esegui Tutti i Test
                  </>
                )}
              </button>
            </div>
            {/* Category Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {testCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => runTests(cat.id)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Results Summary */}
            {testReport && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {testReport.totalTests}
                  </div>
                  <div className="text-sm text-gray-600">Test Totali</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {testReport.passed}
                  </div>
                  <div className="text-sm text-gray-600">Passati</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {testReport.warnings}
                  </div>
                  <div className="text-sm text-gray-600">Avvisi</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {testReport.failed}
                  </div>
                  <div className="text-sm text-gray-600">Falliti</div>
                </div>
              </div>
            )}

            {/* Execution Time */}
            {testReport && (
              <div className="mb-6 flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                Tempo di esecuzione: {(testReport.executionTime / 1000).toFixed(2)}s
              </div>
            )}
          </div>
        </Card>

        {/* Critical Issues Alert */}
        {testReport && testReport.criticalIssues.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-800 flex items-center mb-4">
                <XCircleIcon className="h-6 w-6 mr-2" />
                Problemi Critici Rilevati
              </h3>
              <ul className="space-y-2">
                {testReport.criticalIssues.map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span className="text-red-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* Suggestions */}
        {testReport && testReport.suggestions.length > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <LightBulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
                Suggerimenti per Migliorare
              </h3>
              <ul className="space-y-2">
                {testReport.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* Detailed Test Results by Category */}
        {testReport && testReport.categories && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Risultati Dettagliati per Categoria
            </h2>
            
            {Object.entries(testReport.categories).map(([category, data]: [string, any]) => (
              <Card key={category} className="overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 border-b"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedCategories.has(category) ? (
                        <ChevronDownIcon className="h-5 w-5 mr-2 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 mr-2 text-gray-500" />
                      )}
                      <span className="font-semibold text-lg">{category}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600 text-sm">
                        ✅ {data.passed}
                      </span>
                      {data.warnings > 0 && (
                        <span className="text-yellow-600 text-sm">
                          ⚠️ {data.warnings}
                        </span>
                      )}
                      {data.failed > 0 && (
                        <span className="text-red-600 text-sm">
                          ❌ {data.failed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedCategories.has(category) && (
                  <div className="p-6">
                    <div className="space-y-3">
                      {data.tests.map((test: TestResult, index: number) => (
                        <div 
                          key={index}
                          className={`border-l-4 pl-4 py-2 ${
                            test.status === 'success' ? 'border-green-500 bg-green-50' :
                            test.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                            'border-red-500 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                {getStatusIcon(test.status)}
                                <span className="ml-2 font-medium">
                                  {test.name}
                                </span>
                                {test.severity && (
                                  <span className="ml-2">
                                    {getSeverityBadge(test.severity)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {test.message}
                              </p>
                              {test.suggestion && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <span className="font-medium text-blue-700">
                                    💡 Suggerimento:
                                  </span>
                                  <span className="ml-2 text-blue-600">
                                    {test.suggestion}
                                  </span>
                                </div>
                              )}
                              {test.details && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-sm text-gray-500">
                                    Dettagli tecnici
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    {typeof test.details === 'string' 
                                      ? test.details 
                                      : JSON.stringify(test.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-4">
                              {test.executionTime}ms
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!testReport && !loading && (
          <div className="text-center py-12">
            <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nessun test eseguito
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Clicca su "Esegui Tutti i Test" per iniziare l'analisi completa del sistema
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTestPage;
