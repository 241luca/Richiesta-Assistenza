/**
 * Auto-Remediation Component
 * Gestisce le regole di auto-remediation per risolvere problemi automaticamente
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface RemediationRule {
  id: string;
  module: string;
  condition: {
    scoreBelow?: number;
    errorContains?: string;
    warningContains?: string;
    checkFailed?: string;
  };
  actions: RemediationAction[];
  enabled: boolean;
  maxAttempts: number;
  cooldownMinutes: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

interface RemediationAction {
  type: 'restart_service' | 'clear_cache' | 'run_script' | 'database_cleanup' | 'notify_only';
  target?: string;
  script?: string;
  description: string;
}

export default function AutoRemediation() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<RemediationRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch remediation rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['remediation-rules'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/remediation');
      return response.data.data;
    }
  });

  // Add/Update rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (rule: RemediationRule) => {
      const response = await api.post('/admin/health-check/remediation', rule);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Regola salvata con successo');
      queryClient.invalidateQueries({ queryKey: ['remediation-rules'] });
      setEditingRule(null);
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nel salvataggio della regola');
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await api.delete(`/admin/health-check/remediation/${ruleId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Regola eliminata');
      queryClient.invalidateQueries({ queryKey: ['remediation-rules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'eliminazione');
    }
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      const response = await api.patch(`/admin/health-check/remediation/${ruleId}/toggle`, { enabled });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stato regola aggiornato');
      queryClient.invalidateQueries({ queryKey: ['remediation-rules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'aggiornamento');
    }
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'restart_service':
        return <ArrowPathIcon className="h-4 w-4" />;
      case 'clear_cache':
        return <TrashIcon className="h-4 w-4" />;
      case 'run_script':
        return <PlayIcon className="h-4 w-4" />;
      case 'database_cleanup':
        return <WrenchScrewdriverIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'restart_service':
        return 'bg-blue-100 text-blue-700';
      case 'clear_cache':
        return 'bg-yellow-100 text-yellow-700';
      case 'run_script':
        return 'bg-purple-100 text-purple-700';
      case 'database_cleanup':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Auto-Remediation
          </h3>
          <p className="text-gray-600 mt-1">
            Configura azioni automatiche per risolvere problemi comuni
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 inline mr-2" />
          Aggiungi Regola
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule: RemediationRule) => (
          <div
            key={rule.id}
            className={`bg-white border rounded-lg ${
              rule.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg mr-4 ${
                    rule.enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <WrenchScrewdriverIcon className={`h-6 w-6 ${
                      rule.enabled ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rule.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Modulo: <span className="font-medium">{rule.module}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Toggle Enable/Disable */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => toggleRuleMutation.mutate({
                        ruleId: rule.id,
                        enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  
                  {/* Edit button */}
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      if (confirm('Sei sicuro di voler eliminare questa regola?')) {
                        deleteRuleMutation.mutate(rule.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Conditions */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Condizioni di Attivazione:</h5>
                <div className="flex flex-wrap gap-2">
                  {rule.condition.scoreBelow && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      Score &lt; {rule.condition.scoreBelow}
                    </span>
                  )}
                  {rule.condition.errorContains && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      Errore contiene: "{rule.condition.errorContains}"
                    </span>
                  )}
                  {rule.condition.warningContains && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      Warning contiene: "{rule.condition.warningContains}"
                    </span>
                  )}
                  {rule.condition.checkFailed && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      Check fallito: {rule.condition.checkFailed}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Azioni:</h5>
                <div className="space-y-2">
                  {rule.actions.map((action, index) => (
                    <div key={index} className="flex items-center">
                      <span className={`px-3 py-1 rounded-lg text-sm flex items-center ${getActionColor(action.type)}`}>
                        {getActionIcon(action.type)}
                        <span className="ml-2">{action.description}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Max tentativi:</span>
                  <span className="ml-2 font-medium">{rule.maxAttempts}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cooldown:</span>
                  <span className="ml-2 font-medium">{rule.cooldownMinutes} min</span>
                </div>
                <div>
                  <span className="text-gray-500">Notifica successo:</span>
                  <span className="ml-2">
                    {rule.notifyOnSuccess ? (
                      <CheckIcon className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-gray-400 inline" />
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Notifica fallimento:</span>
                  <span className="ml-2">
                    {rule.notifyOnFailure ? (
                      <CheckIcon className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-gray-400 inline" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna regola di auto-remediation configurata</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aggiungi la prima regola
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <strong>Attenzione:</strong> Le regole di auto-remediation possono eseguire azioni critiche sul sistema.
            Assicurati di testare ogni regola in ambiente di sviluppo prima di attivarla in produzione.
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal - Simplified for now */}
      {(showAddForm || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingRule ? 'Modifica Regola' : 'Nuova Regola'}
            </h3>
            <p className="text-gray-500 mb-4">
              La configurazione avanzata delle regole sarà disponibile nella prossima versione.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRule(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}