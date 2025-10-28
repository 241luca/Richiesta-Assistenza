import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  InformationCircleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface Profession {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

export function ProfessionsTab() {
  const queryClient = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);

  // Fetch professioni
  const { data: professionsData, isLoading } = useQuery({
    queryKey: ['admin-professions', showInactive],
    queryFn: async () => {
      const params: any = {};
      if (!showInactive) {
        params.isActive = 'true';
      }
      const response = await api.get('/professions', { params });
      return response.data.data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/professions/${id}`);
    },
    onSuccess: () => {
      toast.success('Professione eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/professions/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    },
  });

  const professions = professionsData || [];

  const handleDelete = (profession: Profession) => {
    if (profession._count && profession._count.users > 0) {
      toast.error(`Impossibile eliminare: ci sono ${profession._count.users} professionisti associati`);
      return;
    }

    if (window.confirm(`Sei sicuro di voler eliminare "${profession.name}"?`)) {
      deleteMutation.mutate(profession.id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Professioni</h2>
        <p className="text-gray-600 mt-1">
          Configura le professioni disponibili nel sistema
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Gestione Professioni</h3>
            <p className="text-sm text-blue-700 mt-1">
              Qui puoi gestire le professioni disponibili per i professionisti. 
              Ogni professionista può essere associato a una di queste professioni per una migliore categorizzazione.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showInactive" className="text-sm text-gray-700">
              Mostra inattive
            </label>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuova Professione
          </button>
        </div>
      </div>

      {/* Professions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : professions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nessuna professione trovata
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Professione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Professionisti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Ordine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {professions.map((profession: Profession) => (
                  <tr key={profession.id} className={cn(!profession.isActive && 'bg-gray-50 opacity-60')}>
                    <td className="px-6 py-4 flex-1">
                      <div className="flex items-start gap-3">
                        <div
                          className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 mt-1"
                          style={{ backgroundColor: '#DDD6FE' }}
                        >
                          <BriefcaseIcon className="h-5 w-5" style={{ color: '#6366F1' }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {profession.name}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {profession.slug}
                            </span>
                          </div>
                          {profession.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {profession.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 flex-1 text-sm text-gray-900">
                      {profession._count?.users || 0}
                    </td>
                    <td className="px-6 py-4 flex-1 text-sm text-gray-900">
                      {profession.displayOrder}
                    </td>
                    <td className="px-6 py-4 flex-1">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: profession.id, 
                          isActive: !profession.isActive 
                        })}
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          profession.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {profession.isActive ? (
                          <>
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Attiva
                          </>
                        ) : (
                          <>
                            <EyeSlashIcon className="h-3 w-3 mr-1" />
                            Inattiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingProfession(profession)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(profession)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingProfession) && (
        <ProfessionFormModal
          profession={editingProfession}
          onClose={() => {
            setIsCreating(false);
            setEditingProfession(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingProfession(null);
            queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
          }}
        />
      )}
    </div>
  );
}

// Form Modal Component
function ProfessionFormModal({ 
  profession, 
  onClose, 
  onSuccess 
}: {
  profession: Profession | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: profession?.name || '',
    slug: profession?.slug || '',
    description: profession?.description || '',
    displayOrder: profession?.displayOrder || 0,
    isActive: profession?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (profession) {
        return await api.put(`/professions/${profession.id}`, data);
      } else {
        return await api.post('/professions', data);
      }
    },
    onSuccess: () => {
      toast.success(profession ? 'Professione aggiornata' : 'Professione creata');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {profession ? 'Modifica Professione' : 'Nuova Professione'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generato se vuoto"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ordine Visualizzazione
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Professione attiva
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvataggio...' : (profession ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
