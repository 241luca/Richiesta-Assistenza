/**
 * Health Check Automation Component
 * Gestione completa di Scheduler, Report, Auto-Remediation e Performance
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BellIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import toast from 'react-hot-toast';

// Sub-components
import SchedulerConfig from './automation/SchedulerConfig';
import ReportGenerator from './automation/ReportGenerator';
import AutoRemediation from './automation/AutoRemediation';
import PerformanceMonitor from './automation/PerformanceMonitor';
import GuideTab from './automation/GuideTab';

export default function HealthCheckAutomation() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'scheduler' | 'reports' | 'remediation' | 'performance' | 'guide'>('overview');

  // Fetch automation status
  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['health-automation-status'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/status');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh ogni 30 secondi
  });

  // Start/Stop mutations
  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/health-check/start');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sistema di automazione avviato con successo');
      queryClient.invalidateQueries({ queryKey: ['health-automation-status'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'avvio del sistema');
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/health-check/stop');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sistema di automazione fermato');
      queryClient.invalidateQueries({ queryKey: ['health-automation-status'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nel fermare il sistema');
    }
  });

  // Manual check mutation
  const manualCheckMutation = useMutation({
    mutationFn: async (module?: string) => {
      const response = await api.post('/admin/health-check/run', { module });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Check manuale eseguito con successo');
      queryClient.invalidateQueries({ queryKey: ['health-check-summary'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'esecuzione del check');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Errore nel caricamento dello stato di automazione</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  const isRunning = status?.orchestratorRunning || false;
  const systemStats = status?.systemStats || {};
  const schedulerConfig = status?.schedulerConfig || {};

  return (
    <div className="space-y-6">
      {/* Status Overview Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sistema di Automazione Health Check</h2>
            <p className="text-gray-600 mt-1">
              Gestione automatica di controlli, report e risoluzione problemi
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Status indicator */}
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {isRunning ? 'Sistema Attivo' : 'Sistema Inattivo'}
              </span>
            </div>

            {/* Control buttons */}
            {isRunning ? (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Ferma Sistema
              </button>
            ) : (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Avvia Sistema
              </button>
            )}

            <button
              onClick={() => manualCheckMutation.mutate()}
              disabled={manualCheckMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${manualCheckMutation.isPending ? 'animate-spin' : ''}`} />
              Check Manuale
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {isRunning && systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Health Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemStats.overallScore || 0}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  systemStats.overallScore >= 80 ? 'bg-green-100' :
                  systemStats.overallScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <ChartBarIcon className={`h-6 w-6 ${
                    systemStats.overallScore >= 80 ? 'text-green-600' :
                    systemStats.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Moduli Attivi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemStats.totalModules || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {systemStats.healthyModules || 0} healthy
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Regole Remediation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {status?.remediationRules || 0}
                  </p>
                  <p className="text-xs text-gray-500">attive</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prossimo Report</p>
                  <p className="text-sm font-bold text-gray-900">
                    {status?.nextWeeklyReport || 'Non schedulato'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-indigo-100">
                  <CalendarIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="border-t pt-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection('scheduler')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'scheduler'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Scheduler
            </button>
            <button
              onClick={() => setActiveSection('reports')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'reports'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
              Report
            </button>
            <button
              onClick={() => setActiveSection('remediation')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'remediation'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <WrenchScrewdriverIcon className="h-5 w-5 inline mr-2" />
              Auto-Remediation
            </button>
            <button
              onClick={() => setActiveSection('performance')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'performance'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Performance
            </button>
            <button
              onClick={() => setActiveSection('guide')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'guide'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <QuestionMarkCircleIcon className="h-5 w-5 inline mr-2" />
              Guida ai Test
            </button>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Sistema di Automazione - Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features List */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Funzionalità Attive</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Scheduler automatico configurabile</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Report PDF settimanali</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Auto-remediation intelligente</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Notifiche Email e WebSocket</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Monitoraggio performance real-time</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Attività Recenti</h4>
                {systemStats.modules && systemStats.modules.length > 0 ? (
                  <div className="space-y-2">
                    {systemStats.modules.slice(0, 5).map((module: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600">{module.name}</span>
                        <div className="flex items-center">
                          <span className={`text-sm font-medium mr-2 ${
                            module.status === 'healthy' ? 'text-green-600' :
                            module.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {module.score}/100
                          </span>
                          {module.status === 'healthy' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : module.status === 'warning' ? (
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nessuna attività recente</p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <BellIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <strong>Sistema di Automazione Completo</strong>
                  <p className="mt-1">
                    Questo sistema gestisce automaticamente i controlli di salute, genera report periodici,
                    risolve problemi comuni automaticamente e monitora le performance in tempo reale.
                    Usa i tab sopra per configurare ogni componente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'scheduler' && <SchedulerConfig />}
        {activeSection === 'reports' && <ReportGenerator />}
        {activeSection === 'remediation' && <AutoRemediation />}
        {activeSection === 'performance' && <PerformanceMonitor />}
        {activeSection === 'guide' && <GuideTab />}
      </div>
    </div>
  );
}