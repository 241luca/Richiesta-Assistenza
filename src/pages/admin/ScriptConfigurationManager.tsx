import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CommandLineIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CogIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface ScriptConfig {
  id: string;
  scriptName: string;
  displayName: string;
  description: string;
  category: string;
  risk: string;
  filePath: string;
  timeout: number;
  requiresConfirmation: boolean;
  allowedRoles: string[];
  icon?: string;
  color?: string;
  order: number;
  purpose?: string;
  whenToUse?: string;
  whatItChecks?: string[];
  interpreteOutput?: Record<string, string>;
  commonIssues?: string[];
  sections?: any[];
  hasQuickMode: boolean;
  isComplexScript: boolean;
  isEnabled: boolean;
  isVisible: boolean;
  isDangerous: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ScriptConfigurationManager() {
  const [selectedScript, setSelectedScript] = useState<ScriptConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'documentation' | 'advanced'>('basic');
  const queryClient = useQueryClient();

  // Stati per i campi di documentazione
  const [whatItChecksInput, setWhatItChecksInput] = useState('');
  const [interpreteOutputKey, setInterpreteOutputKey] = useState('');
  const [interpreteOutputValue, setInterpreteOutputValue] = useState('');
  const [commonIssuesInput, setCommonIssuesInput] = useState('');

  // Form state con tutti i campi
  const [formData, setFormData] = useState<Partial<ScriptConfig>>({
    scriptName: '',
    displayName: '',
    description: '',
    category: 'UTILITY',
    risk: 'LOW',
    filePath: '',
    timeout: 60000,
    requiresConfirmation: false,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    icon: '',
    color: 'blue',
    order: 0,
    purpose: '',
    whenToUse: '',
    whatItChecks: [],
    interpreteOutput: {},
    commonIssues: [],
    sections: [],
    hasQuickMode: false,
    isComplexScript: false,
    isEnabled: true,
    isVisible: true,
    isDangerous: false
  });

  // Fetch scripts
  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['script-configurations'],
    queryFn: async () => {
      const response = await api.get('/admin/script-configs');
      return response.data?.data || [];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ScriptConfig>) => {
      if (data.id) {
        return api.put(`/admin/script-configs/${data.id}`, data);
      } else {
        return api.post('/admin/script-configs', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-configurations'] });
      toast.success('Script salvato con successo!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/script-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-configurations'] });
      toast.success('Script eliminato con successo!');
      setIsDeleteModalOpen(false);
      setSelectedScript(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  // Toggle enabled mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      return api.patch(`/admin/script-configs/${id}/toggle`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-configurations'] });
      toast.success('Stato aggiornato!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  const resetForm = () => {
    setFormData({
      scriptName: '',
      displayName: '',
      description: '',
      category: 'UTILITY',
      risk: 'LOW',
      filePath: '',
      timeout: 60000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: '',
      color: 'blue',
      order: 0,
      purpose: '',
      whenToUse: '',
      whatItChecks: [],
      interpreteOutput: {},
      commonIssues: [],
      sections: [],
      hasQuickMode: false,
      isComplexScript: false,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    });
    setWhatItChecksInput('');
    setInterpreteOutputKey('');
    setInterpreteOutputValue('');
    setCommonIssuesInput('');
  };

  const handleEdit = (script: ScriptConfig) => {
    setFormData(script);
    setIsModalOpen(true);
  };

  const handleDelete = (script: ScriptConfig) => {
    setSelectedScript(script);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Funzioni per gestire array e oggetti nella documentazione
  const addWhatItChecks = () => {
    if (whatItChecksInput.trim()) {
      setFormData({
        ...formData,
        whatItChecks: [...(formData.whatItChecks || []), whatItChecksInput.trim()]
      });
      setWhatItChecksInput('');
    }
  };

  const removeWhatItChecks = (index: number) => {
    const newChecks = [...(formData.whatItChecks || [])];
    newChecks.splice(index, 1);
    setFormData({ ...formData, whatItChecks: newChecks });
  };

  const addInterpreteOutput = () => {
    if (interpreteOutputKey.trim() && interpreteOutputValue.trim()) {
      setFormData({
        ...formData,
        interpreteOutput: {
          ...(formData.interpreteOutput || {}),
          [interpreteOutputKey.trim()]: interpreteOutputValue.trim()
        }
      });
      setInterpreteOutputKey('');
      setInterpreteOutputValue('');
    }
  };

  const removeInterpreteOutput = (key: string) => {
    const newOutput = { ...(formData.interpreteOutput || {}) };
    delete newOutput[key];
    setFormData({ ...formData, interpreteOutput: newOutput });
  };

  const addCommonIssue = () => {
    if (commonIssuesInput.trim()) {
      setFormData({
        ...formData,
        commonIssues: [...(formData.commonIssues || []), commonIssuesInput.trim()]
      });
      setCommonIssuesInput('');
    }
  };

  const removeCommonIssue = (index: number) => {
    const newIssues = [...(formData.commonIssues || [])];
    newIssues.splice(index, 1);
    setFormData({ ...formData, commonIssues: newIssues });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      DATABASE: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-green-100 text-green-800',
      REPORT: 'bg-purple-100 text-purple-800',
      SECURITY: 'bg-red-100 text-red-800',
      UTILITY: 'bg-gray-100 text-gray-800',
      ANALYSIS: 'bg-yellow-100 text-yellow-800',
      TESTING: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800';
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
              <CogIcon className="w-8 h-8 text-blue-500" />
              Gestione Configurazione Script
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestisci le configurazioni e la documentazione degli script
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuovo Script
          </button>
        </div>
      </div>

      {/* Scripts Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Script
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rischio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documentazione
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scripts.map((script: ScriptConfig) => (
              <tr key={script.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {script.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {script.scriptName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(script.category)}`}>
                    {script.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(script.risk)}`}>
                    {script.risk}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleMutation.mutate({ id: script.id, isEnabled: !script.isEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      script.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        script.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-xs">
                    {script.whatItChecks && script.whatItChecks.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {script.whatItChecks.length} controlli
                      </span>
                    )}
                    {script.commonIssues && script.commonIssues.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        {script.commonIssues.length} issues
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(script)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(script)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
          </div>

        {scripts.length === 0 && (
          <div className="text-center py-12">
            <CommandLineIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuno script configurato</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando un nuovo script di configurazione.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal con Tabs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {formData.id ? 'Modifica Script' : 'Nuovo Script'}
              </h2>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'basic'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <CogIcon className="w-5 h-5 inline-block mr-2" />
                    Configurazione Base
                  </button>
                  <button
                    type="button"
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('advanced')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'advanced'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5 inline-block mr-2" />
                    Opzioni Avanzate
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Script Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome Script
                    </label>
                    <input
                      type="text"
                      value={formData.scriptName}
                      onChange={(e) => setFormData({ ...formData, scriptName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome Visualizzato
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Descrizione
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="DATABASE">Database</option>
                      <option value="MAINTENANCE">Manutenzione</option>
                      <option value="REPORT">Report</option>
                      <option value="SECURITY">Sicurezza</option>
                      <option value="UTILITY">Utility</option>
                      <option value="ANALYSIS">Analisi</option>
                      <option value="TESTING">Testing</option>
                    </select>
                  </div>

                  {/* Risk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Livello di Rischio
                    </label>
                    <select
                      value={formData.risk}
                      onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="LOW">Basso</option>
                      <option value="MEDIUM">Medio</option>
                      <option value="HIGH">Alto</option>
                      <option value="CRITICAL">Critico</option>
                    </select>
                  </div>

                  {/* File Path */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Percorso File
                    </label>
                    <input
                      type="text"
                      value={formData.filePath}
                      onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="/scripts/nome-script.sh"
                      required
                    />
                  </div>

                  {/* Timeout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1000"
                      step="1000"
                    />
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ordine
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'documentation' && (
                <div className="space-y-6">
                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scopo dello Script
                    </label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Descrivi lo scopo principale di questo script..."
                    />
                  </div>

                  {/* When to Use */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quando Usarlo
                    </label>
                    <textarea
                      value={formData.whenToUse}
                      onChange={(e) => setFormData({ ...formData, whenToUse: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Spiega quando e in quali situazioni usare questo script..."
                    />
                  </div>

                  {/* What It Checks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cosa Controlla
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={whatItChecksInput}
                          onChange={(e) => setWhatItChecksInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWhatItChecks())}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Aggiungi un controllo..."
                        />
                        <button
                          type="button"
                          onClick={addWhatItChecks}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {formData.whatItChecks?.map((check, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{check}</span>
                            <button
                              type="button"
                              onClick={() => removeWhatItChecks(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interprete Output */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Come Interpretare l'Output
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={interpreteOutputKey}
                          onChange={(e) => setInterpreteOutputKey(e.target.value)}
                          className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Simbolo/Codice..."
                        />
                        <input
                          type="text"
                          value={interpreteOutputValue}
                          onChange={(e) => setInterpreteOutputValue(e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Significato..."
                        />
                        <button
                          type="button"
                          onClick={addInterpreteOutput}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(formData.interpreteOutput || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">
                              <strong>{key}:</strong> {value}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeInterpreteOutput(key)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Common Issues */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problemi Comuni e Soluzioni
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commonIssuesInput}
                          onChange={(e) => setCommonIssuesInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCommonIssue())}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Problema: Soluzione..."
                        />
                        <button
                          type="button"
                          onClick={addCommonIssue}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {formData.commonIssues?.map((issue, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{issue}</span>
                            <button
                              type="button"
                              onClick={() => removeCommonIssue(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requiresConfirmation}
                        onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Richiede conferma prima dell'esecuzione</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hasQuickMode}
                        onChange={(e) => setFormData({ ...formData, hasQuickMode: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Supporta modalità veloce</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isComplexScript}
                        onChange={(e) => setFormData({ ...formData, isComplexScript: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Script complesso (17 sezioni)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Abilitato</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isVisible}
                        onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Visibile nell'interfaccia</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isDangerous}
                        onChange={(e) => setFormData({ ...formData, isDangerous: e.target.checked })}
                        className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-500 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Script pericoloso</span>
                    </label>
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Icona (Heroicons)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="ArrowPathIcon"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Colore Tema
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="blue">Blu</option>
                      <option value="green">Verde</option>
                      <option value="yellow">Giallo</option>
                      <option value="red">Rosso</option>
                      <option value="purple">Viola</option>
                      <option value="gray">Grigio</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedScript && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Elimina Script
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Sei sicuro di voler eliminare lo script "{selectedScript.displayName}"?
                    Questa azione non può essere annullata.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedScript.id)}
                disabled={deleteMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
