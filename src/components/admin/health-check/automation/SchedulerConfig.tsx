/**
 * Scheduler Configuration Component
 * Configura gli intervalli di esecuzione automatica dei controlli
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface ScheduleConfig {
  enabled: boolean;
  interval: string;
  modules: {
    [key: string]: string;
  };
  alerts: {
    enabled: boolean;
    channels: string[];
    thresholds: {
      critical: number;
      warning: number;
    };
  };
  retention: {
    days: number;
    compress: boolean;
  };
}

export default function SchedulerConfig() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [config, setConfig] = useState<ScheduleConfig | null>(null);

  // Fetch current configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['scheduler-config'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/schedule');
      return response.data.data;
    },
    onSuccess: (data) => {
      setConfig(data);
    }
  });

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: async (newConfig: ScheduleConfig) => {
      const response = await api.put('/admin/health-check/schedule', newConfig);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configurazione scheduler aggiornata con successo');
      queryClient.invalidateQueries({ queryKey: ['scheduler-config'] });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'aggiornamento');
    }
  });

  const handleSave = () => {
    if (config) {
      updateMutation.mutate(config);
    }
  };

  const handleCancel = () => {
    setConfig(currentConfig);
    setEditMode(false);
  };

  // Helper per convertire cron expression in testo leggibile
  const cronToReadable = (cron: string): string => {
    // Semplificato - in produzione useresti una libreria come cronstrue
    if (cron === '*/5 * * * *') return 'Ogni 5 minuti';
    if (cron === '*/15 * * * *') return 'Ogni 15 minuti';
    if (cron === '*/30 * * * *') return 'Ogni 30 minuti';
    if (cron === '0 * * * *') return 'Ogni ora';
    if (cron === '0 */6 * * *') return 'Ogni 6 ore';
    if (cron === '0 0 * * *') return 'Ogni giorno a mezzanotte';
    return cron;
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Configurazione Scheduler
        </h3>
        <div className="flex space-x-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 inline mr-2" />
                Salva
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5 inline mr-2" />
                Annulla
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Modifica
            </button>
          )}
        </div>
      </div>

      {/* Main Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          {/* Enable/Disable Scheduler */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Scheduler Attivo</label>
              <p className="text-sm text-gray-500">Abilita l'esecuzione automatica dei controlli</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                disabled={!editMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Global Interval */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Intervallo Globale
            </label>
            <select
              value={config.interval}
              onChange={(e) => setConfig({ ...config, interval: e.target.value })}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="*/5 * * * *">Ogni 5 minuti</option>
              <option value="*/15 * * * *">Ogni 15 minuti</option>
              <option value="*/30 * * * *">Ogni 30 minuti</option>
              <option value="0 * * * *">Ogni ora</option>
              <option value="0 */6 * * *">Ogni 6 ore</option>
              <option value="0 0 * * *">Una volta al giorno</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module-specific Schedules */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Schedulazione per Modulo</h4>
          <p className="text-sm text-gray-500 mt-1">
            Configura intervalli specifici per ogni modulo
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(config.modules).map(([module, cron]) => (
            <div key={module} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {cronToReadable(cron)}
                </p>
              </div>
              {editMode && (
                <select
                  value={cron}
                  onChange={(e) => setConfig({
                    ...config,
                    modules: { ...config.modules, [module]: e.target.value }
                  })}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="*/5 * * * *">Ogni 5 minuti</option>
                  <option value="*/15 * * * *">Ogni 15 minuti</option>
                  <option value="*/20 * * * *">Ogni 20 minuti</option>
                  <option value="*/30 * * * *">Ogni 30 minuti</option>
                  <option value="0 * * * *">Ogni ora</option>
                  <option value="0 */2 * * *">Ogni 2 ore</option>
                  <option value="0 */6 * * *">Ogni 6 ore</option>
                  <option value="0 0 * * *">Una volta al giorno</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Configurazione Alert</h4>
        </div>
        <div className="p-6 space-y-4">
          {/* Alert Enabled */}
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">Alert Abilitati</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.alerts.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  alerts: { ...config.alerts, enabled: e.target.checked }
                })}
                disabled={!editMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Alert Channels */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">Canali di Notifica</label>
            <div className="space-y-2">
              {['email', 'websocket'].map(channel => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.alerts.channels.includes(channel)}
                    onChange={(e) => {
                      const channels = e.target.checked
                        ? [...config.alerts.channels, channel]
                        : config.alerts.channels.filter(c => c !== channel);
                      setConfig({
                        ...config,
                        alerts: { ...config.alerts, channels }
                      });
                    }}
                    disabled={!editMode}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Soglia Critica
              </label>
              <input
                type="number"
                value={config.alerts.thresholds.critical}
                onChange={(e) => setConfig({
                  ...config,
                  alerts: {
                    ...config.alerts,
                    thresholds: {
                      ...config.alerts.thresholds,
                      critical: parseInt(e.target.value)
                    }
                  }
                })}
                disabled={!editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Score &lt; {config.alerts.thresholds.critical}</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Soglia Warning
              </label>
              <input
                type="number"
                value={config.alerts.thresholds.warning}
                onChange={(e) => setConfig({
                  ...config,
                  alerts: {
                    ...config.alerts,
                    thresholds: {
                      ...config.alerts.thresholds,
                      warning: parseInt(e.target.value)
                    }
                  }
                })}
                disabled={!editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Score &lt; {config.alerts.thresholds.warning}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Retention Dati</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Giorni di Retention
            </label>
            <input
              type="number"
              value={config.retention.days}
              onChange={(e) => setConfig({
                ...config,
                retention: {
                  ...config.retention,
                  days: parseInt(e.target.value)
                }
              })}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.retention.compress}
                onChange={(e) => setConfig({
                  ...config,
                  retention: {
                    ...config.retention,
                    compress: e.target.checked
                  }
                })}
                disabled={!editMode}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Comprimi dati vecchi</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <strong>Nota:</strong> Le modifiche alla schedulazione saranno applicate immediatamente.
            Il sistema riavvierà automaticamente lo scheduler con la nuova configurazione.
          </div>
        </div>
      </div>
    </div>
  );
}