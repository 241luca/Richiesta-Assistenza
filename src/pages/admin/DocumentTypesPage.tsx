import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function DocumentTypesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch document types
  const { data: types, isLoading } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const response = await api.get('/admin/document-types');
      return response.data?.data || [];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingType) {
        return api.put(`/admin/document-types/${editingType.id}`, data);
      }
      return api.post('/admin/document-types', data);
    },
    onSuccess: () => {
      toast.success(editingType ? 'Tipo documento aggiornato' : 'Tipo documento creato');
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      setShowForm(false);
      setEditingType(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/document-types/${id}`);
    },
    onSuccess: () => {
      toast.success('Tipo documento eliminato');
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  const handleEdit = (type: any) => {
    setEditingType(type);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo tipo di documento?')) {
      deleteMutation.mutate(id);
    }
  };

  if (showForm) {
    return (
      <DocumentTypeForm
        type={editingType}
        onSave={(data) => saveMutation.mutate(data)}
        onCancel={() => {
          setShowForm(false);
          setEditingType(null);
        }}
        isLoading={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/document-management')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tipi Documento
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configura i tipi di documento disponibili nel sistema
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    await api.post('/admin/document-types/initialize-defaults');
                    toast.success('Tipi di default inizializzati');
                    queryClient.invalidateQueries({ queryKey: ['document-types'] });
                  } catch (error) {
                    toast.error('Errore nell\'inizializzazione');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                Inizializza Default
              </button>
              <button
                onClick={() => {
                  setEditingType(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuovo Tipo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Codice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Configurazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Caricamento...
                  </td>
                </tr>
              ) : types?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nessun tipo documento configurato
                  </td>
                </tr>
              ) : (
                types?.map((type: any) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {type.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{type.displayName}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {type.category || 'Generale'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-xs">
                        {type.isRequired && (
                          <span className="text-red-600">• Obbligatorio</span>
                        )}
                        {type.requiresApproval && (
                          <span className="text-blue-600">• Richiede approvazione</span>
                        )}
                        {type.requiresSignature && (
                          <span className="text-purple-600">• Richiede firma</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.isActive ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {!type.isSystem && (
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Form Component
function DocumentTypeForm({ type, onSave, onCancel, isLoading }: any) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: type?.code || '',
    name: type?.name || '',
    displayName: type?.displayName || '',
    description: type?.description || '',
    icon: type?.icon || '',
    color: type?.color || 'blue',
    category: type?.category || '',
    sortOrder: type?.sortOrder || 0,
    isSystem: type?.isSystem || false,
    isActive: type?.isActive ?? true,
    isRequired: type?.isRequired || false,
    requiresApproval: type?.requiresApproval ?? true,
    requiresSignature: type?.requiresSignature || false,
    notifyOnCreate: type?.notifyOnCreate ?? true,
    notifyOnUpdate: type?.notifyOnUpdate ?? true,
    notifyOnExpiry: type?.notifyOnExpiry ?? true,
    expiryDays: type?.expiryDays || 30,
    approverRoles: type?.approverRoles || ['SUPER_ADMIN'],
    publisherRoles: type?.publisherRoles || ['SUPER_ADMIN', 'ADMIN']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={onCancel}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {type ? 'Modifica Tipo Documento' : 'Nuovo Tipo Documento'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configura le proprietà del tipo di documento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Colonna sinistra */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Informazioni Base</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Codice *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={type?.isSystem}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Interno *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Visualizzato *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ordine
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Configurazione</h3>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Attivo</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Obbligatorio per tutti</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Richiede approvazione</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requiresSignature}
                      onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Richiede firma digitale</span>
                  </label>
                </div>

                <h4 className="font-medium text-gray-900 mt-6">Notifiche</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnCreate}
                      onChange={(e) => setFormData({ ...formData, notifyOnCreate: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notifica alla creazione</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnUpdate}
                      onChange={(e) => setFormData({ ...formData, notifyOnUpdate: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notifica agli aggiornamenti</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnExpiry}
                      onChange={(e) => setFormData({ ...formData, notifyOnExpiry: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notifica alla scadenza</span>
                  </label>

                  {formData.notifyOnExpiry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Giorni prima della scadenza
                      </label>
                      <input
                        type="number"
                        value={formData.expiryDays}
                        onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : (type ? 'Aggiorna' : 'Crea')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
