/**
 * Health Check Dashboard - VERSIONE CORRETTA
 * Dashboard principale per visualizzare lo stato di salute del sistema
 * FIX: Mostra correttamente solo i test del modulo singolo quando viene eseguito
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  BellAlertIcon,
  PlayIcon,
  StopIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import HealthCheckCard from '../../components/admin/health-check/HealthCheckCard';
import HealthScoreChart from '../../components/admin/health-check/HealthScoreChart';
import ModuleStatus from '../../components/admin/health-check/ModuleStatus';
import AlertsPanel from '../../components/admin/health-check/AlertsPanel';
import ModuleDescriptions from '../../components/admin/health-check/ModuleDescriptions';
import HealthCheckAutomation from '../../components/admin/health-check/HealthCheckAutomation';
import CheckSummarySection from '../../components/admin/health-check/CheckSummarySection';

export default function HealthCheckDashboard() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide' | 'automation'>('dashboard');
  const [lastSingleTestModule, setLastSingleTestModule] = useState<string | null>(null);

  // Fetch health summary
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['health-check-summary'],
    queryFn: async () => {
      const response = await api.health.getSummary();
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 0,
    gcTime: 1000,
  });

  // Fetch modules list
  const { data: modules } = useQuery({
    queryKey: ['health-check-modules'],
    queryFn: async () => {
      const response = await api.health.getModules();
      return response.data.data;
    },
  });

  // Run all checks mutation
  const runAllChecksMutation = useMutation({
    mutationFn: () => api.health.runAllChecks(),
    onSuccess: () => {
      // Reset il modulo singolo quando si eseguono tutti i test
      setLastSingleTestModule(null);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['health-check-summary'] });
      }, 5000);
    },
  });

  // Run single check mutation - FIX: mostra solo i risultati del modulo testato
  const runSingleCheckMutation = useMutation({
    mutationFn: async (module: string) => {
      const response = await api.health.runSingleCheck(module);
      return response;
    },
    onSuccess: async (data, module) => {
      console.log(`[Frontend] Check singolo completato per: ${module}`);
      
      // Imposta il modulo appena testato
      setLastSingleTestModule(module);
      
      // Aggiorna il summary
      queryClient.removeQueries({ queryKey: ['health-check-summary'] });
      
      await queryClient.fetchQuery({
        queryKey: ['health-check-summary'],
        queryFn: async () => {
          const response = await api.health.getSummary();
          const summaryData = response.data.data;
          
          // Se c'è un flag singleModuleTest dal backend, usalo
          if (summaryData?.singleModuleTest) {
            setLastSingleTestModule(summaryData.singleModuleTest.module);
          }
          
          return summaryData;
        },
        staleTime: 0,
        gcTime: 0
      });
      
      queryClient.invalidateQueries({ queryKey: ['health-check-summary'] });
      
      console.log(`[Frontend] Pannello aggiornato per modulo: ${module}`);
    },
  });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  // Calculate stats - FIX: mostra solo i test del modulo singolo quando appropriato
  const stats = React.useMemo(() => {
    if (!summary?.modules) {
      return {
        healthy: 0,
        warning: 0,
        critical: 0,
        total: 0,
        totalIssues: 0,
        totalChecks: 0,
        passedChecks: 0,
        warningChecks: 0,
        failedChecks: 0,
        checksDetails: [],
        singleModuleTested: null
      };
    }

    // Statistiche generali dei moduli (sempre tutte)
    const generalStats = {
      healthy: summary.modules.filter((m: any) => m.status === 'healthy').length,
      warning: summary.modules.filter((m: any) => m.status === 'warning').length,
      critical: summary.modules.filter((m: any) => m.status === 'critical').length,
      total: summary.modules.length,
      totalIssues: 0
    };

    // Per il riepilogo test, usa solo il modulo singolo se è stato appena testato
    let modulesToCount = summary.modules;
    let singleModuleTested = null;
    
    // Controlla se c'è un test singolo dal backend o dallo stato locale
    if (summary.singleModuleTest?.module || lastSingleTestModule) {
      const moduleToFind = summary.singleModuleTest?.module || lastSingleTestModule;
      const singleModule = summary.modules.find((m: any) => m.module === moduleToFind);
      
      if (singleModule) {
        modulesToCount = [singleModule];
        singleModuleTested = singleModule.displayName || singleModule.module;
      }
    }

    // Calcola statistiche dei check (basate sui moduli da contare)
    let totalChecks = 0;
    let passedChecks = 0;
    let warningChecks = 0;
    let failedChecks = 0;
    const checksDetails: any[] = [];
    let modulesWithIssues = 0;

    modulesToCount.forEach((m: any) => {
      if (m.checks && Array.isArray(m.checks)) {
        totalChecks += m.checks.length;
        
        m.checks.forEach((check: any) => {
          checksDetails.push({
            module: m.module,
            moduleName: m.displayName,
            description: check.description,
            status: check.status,
            message: check.message,
            severity: check.severity
          });
          
          if (check.status === 'pass' || check.status === 'healthy') {
            passedChecks++;
          } else if (check.status === 'warn' || check.status === 'warning') {
            warningChecks++;
          } else if (check.status === 'fail' || check.status === 'error' || check.status === 'critical') {
            failedChecks++;
          }
        });
      }
      
      const hasWarnings = (m.warnings && m.warnings.length > 0) || 
                         (m.checks && m.checks.some((c: any) => c.status === 'warn' || c.status === 'warning'));
      const hasErrors = (m.errors && m.errors.length > 0) || 
                       (m.checks && m.checks.some((c: any) => c.status === 'fail' || c.status === 'error' || c.status === 'critical'));
      
      if (hasWarnings || hasErrors) {
        modulesWithIssues++;
      }
    });

    return {
      ...generalStats,
      totalIssues: modulesWithIssues,
      totalChecks,
      passedChecks,
      warningChecks,
      failedChecks,
      checksDetails,
      singleModuleTested
    };
  }, [summary, lastSingleTestModule]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading health check data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load health check data</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Controllo Sistema
              </h1>
              <p className="mt-2 text-gray-600">
                Monitora lo stato di salute di tutti i moduli del sistema
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle - solo per dashboard tab */}
              {activeTab === 'dashboard' && (
                <>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Aggiornamento automatico</span>
                  </label>

                  {/* Run all checks button */}
                  <button
                    onClick={() => runAllChecksMutation.mutate()}
                    disabled={runAllChecksMutation.isPending}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {runAllChecksMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Esecuzione...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Esegui Tutti i Test
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
                Pannello Controllo
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'automation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BellAlertIcon className="w-5 h-5 inline-block mr-2" />
                Automazione e Avvisi
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'guide'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpenIcon className="w-5 h-5 inline-block mr-2" />
                Guida ai Test
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Overall Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Stato Generale del Sistema</h2>
                {summary?.lastCheck && (
                  <p className="text-sm text-gray-500">
                    Ultimo controllo: {new Date(summary.lastCheck).toLocaleString('it-IT')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-gray-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="50"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className={summary?.overallScore >= 80 ? 'text-green-500' : 
                                  summary?.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}
                        strokeWidth="10"
                        strokeDasharray={`${(summary?.overallScore || 0) * 3.14} 314`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="50"
                        cx="64"
                        cy="64"
                        transform="rotate(-90 64 64)"
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold">
                      {summary?.overallScore || 0}%
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-medium text-gray-900">Punteggio Salute</p>
                  <p className={`text-sm ${getStatusColor(summary?.overall || 'unknown')}`}>
                    {summary?.overall === 'healthy' ? 'OTTIMO' : 
                     summary?.overall === 'warning' ? 'ATTENZIONE' :
                     summary?.overall === 'critical' ? 'CRITICO' : 'SCONOSCIUTO'}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-col justify-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Moduli Sistema</div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Funzionanti</span>
                    <span className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-semibold">{stats.healthy}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Attenzione</span>
                    <span className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-semibold">{stats.warning}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Critici</span>
                    <span className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-semibold">{stats.critical}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="col-span-2 flex flex-col justify-center space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Moduli Disponibili</span>
                      <span className="font-medium">
                        {stats.healthy} su {stats.total} moduli ({stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: stats.total > 0 ? `${(stats.healthy / stats.total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        Test Superati
                        {stats.singleModuleTested && (
                          <span className="text-blue-600 font-medium ml-1">
                            ({stats.singleModuleTested})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {stats.passedChecks} su {stats.totalChecks} test ({stats.totalChecks > 0 ? Math.round((stats.passedChecks / stats.totalChecks) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.totalChecks === 0 ? 'bg-gray-400' :
                          (stats.passedChecks / stats.totalChecks) >= 0.8 ? 'bg-green-500' :
                          (stats.passedChecks / stats.totalChecks) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: stats.totalChecks > 0 ? `${(stats.passedChecks / stats.totalChecks) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione Dettaglio Check Totali con box cliccabili */}
            <CheckSummarySection stats={stats} />

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <strong>Suggerimento:</strong> Clicca sull'icona <QuestionMarkCircleIcon className="h-4 w-4 inline" /> 
                  su ogni card per vedere i dettagli di cosa controlla ogni modulo, oppure vai nella tab "Guida ai Test" per una panoramica completa.
                </div>
              </div>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {summary?.modules?.map((module: any) => (
                <HealthCheckCard
                  key={module.module}
                  module={module}
                  onRefresh={() => runSingleCheckMutation.mutate(module.module)}
                  onClick={() => setSelectedModule(module.module)}
                  isRefreshing={runSingleCheckMutation.isPending}
                />
              ))}
            </div>

            {/* Alerts Panel */}
            {summary?.alerts && summary.alerts.length > 0 && (
              <AlertsPanel alerts={summary.alerts} />
            )}

            {/* Module Detail Modal */}
            {selectedModule && (
              <ModuleStatus
                module={summary?.modules?.find((m: any) => m.module === selectedModule)}
                onClose={() => setSelectedModule(null)}
              />
            )}
          </>
        ) : activeTab === 'automation' ? (
          /* Automation & Alerts Tab */
          <div className="mt-6">
            <HealthCheckAutomation />
          </div>
        ) : (
          /* Guide Tab */
          <div className="mt-6">
            <ModuleDescriptions />
          </div>
        )}
      </div>
    </div>
  );
}
