import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  role: string;
  approverType: 'ROLE' | 'USER' | 'DEPARTMENT';
  autoApproveAfterDays?: number;
  isOptional: boolean;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  documentType: string;
  isActive: boolean;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export default function ApprovalWorkflowsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: '',
    steps: [] as Partial<WorkflowStep>[]
  });

  // Carica lista workflow
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      const response = await api.get('/admin/approval-workflows');
      return response.data?.data || [];
    }
  });

  // Carica statistiche
  const { data: stats } = useQuery({
    queryKey: ['approval-workflows-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/approval-workflows/stats');
      return response.data?.data || {};
    }
  });

  // Mutation per creare workflow
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/approval-workflows', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast.success('Workflow creato con successo');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Errore nella creazione del workflow');
    }
  });

  // Mutation per aggiornare workflow
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await api.put(`/admin/approval-workflows/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast.success('Workflow aggiornato con successo');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento del workflow');
    }
  });

  // Mutation per eliminare workflow
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/approval-workflows/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast.success('Workflow eliminato con successo');
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione del workflow');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkflow) {
      updateMutation.mutate({ id: selectedWorkflow.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      documentType: workflow.documentType,
      steps: workflow.steps || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sicuro di voler eliminare questo workflow?')) {
      deleteMutation.mutate(id);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          order: formData.steps.length + 1,
          name: '',
          role: 'ADMIN',
          approverType: 'ROLE',
          isOptional: false
        }
      ]
    });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      documentType: '',
      steps: []
    });
    setSelectedWorkflow(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow di Approvazione</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestisci i flussi di approvazione per i documenti
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Workflow
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <AdjustmentsHorizontalIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Workflow Totali</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.workflows?.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.workflows?.active || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Approvazioni Pendenti</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.approvals?.pending || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentCheckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completate (30gg)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.approvals?.recentCompleted || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Workflow */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Workflow Configurati</h2>
        </div>
        
        {workflows.length === 0 ? (
          <div className="p-12 text-center">
            <AdjustmentsHorizontalIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun workflow</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando il tuo primo workflow di approvazione.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crea Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome Workflow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Steps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ultima Modifica
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map((workflow: any) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {workflow.name}
                        </div>
                        {workflow.description && (
                          <div className="text-sm text-gray-500">
                            {workflow.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {workflow.documentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.steps?.length || 0} step
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        workflow.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.isActive ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workflow.updatedAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(workflow)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Creazione/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedWorkflow ? 'Modifica Workflow' : 'Nuovo Workflow'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Informazioni Base */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Informazioni Workflow</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome Workflow *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo Documento *
                      </label>
                      <select
                        required
                        value={formData.documentType}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="">Seleziona tipo</option>
                        <option value="CONTRACT">Contratto</option>
                        <option value="INVOICE">Fattura</option>
                        <option value="QUOTE">Preventivo</option>
                        <option value="REPORT">Report</option>
                        <option value="REQUEST">Richiesta</option>
                        <option value="OTHER">Altro</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Descrizione
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Steps di Approvazione */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Step di Approvazione</h4>
                    <button
                      type="button"
                      onClick={addStep}
                      className="inline-flex items-center px-3 py-1 border border-purple-300 text-sm font-medium rounded text-purple-700 bg-white hover:bg-purple-50"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Aggiungi Step
                    </button>
                  </div>

                  {formData.steps.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Nessuno step configurato. Aggiungi almeno uno step di approvazione.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.steps.map((step, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              Step {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Nome Step
                              </label>
                              <input
                                type="text"
                                required
                                value={step.name || ''}
                                onChange={(e) => updateStep(index, 'name', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="es. Approvazione Manager"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Tipo Approvatore
                              </label>
                              <select
                                value={step.approverType || 'ROLE'}
                                onChange={(e) => updateStep(index, 'approverType', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              >
                                <option value="ROLE">Ruolo</option>
                                <option value="USER">Utente Specifico</option>
                                <option value="DEPARTMENT">Dipartimento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Ruolo/Utente
                              </label>
                              <input
                                type="text"
                                required
                                value={step.role || ''}
                                onChange={(e) => updateStep(index, 'role', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="es. ADMIN"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Auto-approva dopo (giorni)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={step.autoApproveAfterDays || ''}
                                onChange={(e) => updateStep(index, 'autoApproveAfterDays', parseInt(e.target.value) || null)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="Lascia vuoto per disabilitare"
                              />
                            </div>
                            <div className="flex items-center mt-6">
                              <input
                                type="checkbox"
                                checked={step.isOptional || false}
                                onChange={(e) => updateStep(index, 'isOptional', e.target.checked)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm text-gray-900">
                                Step Opzionale
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
