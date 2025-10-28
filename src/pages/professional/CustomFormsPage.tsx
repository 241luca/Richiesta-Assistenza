import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentDuplicateIcon,
  StarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { customFormsAPI, CustomForm as APICustomForm } from '../../services/customForms.api';
import { CustomFormRenderer } from '../../components/custom-forms/CustomFormRenderer';

interface CustomForm {
  id: string;
  name: string;
  description?: string;
  version: number;
  subcategoryId: string;
  subcategoryName: string;
  isDefault: boolean;
  isPublished: boolean;
  status: string;
  displayType: 'SIMPLE' | 'STANDARD' | 'ADVANCED';
  createdBy: string;
  usageCount: number;
  layout: any;
  settings: any;
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryName: string;
}

const CustomFormsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    subcategoryId: '',
    displayType: 'SIMPLE' as 'SIMPLE' | 'STANDARD' | 'ADVANCED'
  });

  // Query per ottenere i custom forms del professionista
  const { data: customForms, isLoading, error } = useQuery({
    queryKey: ['professional-custom-forms', user?.id, 'list'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      // Usa il servizio API che funziona con filtri
      const response = await customFormsAPI.getAllCustomForms({ professionalId: user.id });
      return response.data.data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000
  });

  // Query per ottenere le sottocategorie del professionista
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['professional-subcategories', user?.id, 'list'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      const response = await api.get(`/user/subcategories/${user.id}`);
      const rawData = response.data.data;
      
      return rawData
        .filter((item: any) => item?.Subcategory?.id && item?.Subcategory?.name)
        .map((item: any) => ({
          id: item.Subcategory.id,
          name: item.Subcategory.name,
          categoryName: item.Subcategory.Category?.name || 'Categoria non specificata'
        }));
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000
  });

  // Mutazioni
  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      await api.delete(`/custom-forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['professional-custom-forms', user?.id, 'list'] 
      });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async ({ formId, subcategoryId }: { formId: string; subcategoryId: string }) => {
      await customFormsAPI.setDefaultCustomForm(formId, subcategoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['professional-custom-forms', user?.id, 'list'] 
      });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ formId, isPublished }: { formId: string; isPublished: boolean }) => {
      await api.patch(`/custom-forms/${formId}/toggle-publish`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['professional-custom-forms', user?.id, 'list'] 
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof createFormData) => {
      if (!user?.id) throw new Error('User ID is required');
      
      const formData = {
        name: data.name,
        description: data.description || undefined,
        subcategoryId: data.subcategoryId,
        professionalId: user.id,
        displayType: data.displayType,
        fields: []
      };
      
      return await customFormsAPI.createCustomForm(formData);
    },
    onSuccess: (createdForm) => {
      queryClient.invalidateQueries({ 
        queryKey: ['professional-custom-forms', user?.id, 'list'] 
      });
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        description: '',
        subcategoryId: '',
        displayType: 'SIMPLE'
      });
      // Naviga al form appena creato per configurare i campi
      navigate(`/professional/custom-forms/${createdForm.data.id}`);
    }
  });

  // Handler functions
  const handleCreateFormChange = useCallback((field: string, value: string) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCreateFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.name.trim()) {
      alert('Il nome del form è obbligatorio');
      return;
    }
    
    if (!createFormData.subcategoryId) {
      alert('Seleziona una sottocategoria');
      return;
    }
    
    createMutation.mutate(createFormData);
  }, [createFormData, createMutation.mutate]);

  const handleDelete = async (form: CustomForm) => {
    if (window.confirm(`Sei sicuro di voler eliminare il form "${form.name}"?`)) {
      deleteMutation.mutate(form.id);
    }
  };

  const handleSetDefault = (form: CustomForm) => {
    setDefaultMutation.mutate({ 
      formId: form.id, 
      subcategoryId: form.subcategoryId 
    });
  };

  const handleTogglePublish = (form: CustomForm) => {
    togglePublishMutation.mutate({ 
      formId: form.id, 
      isPublished: !form.isPublished 
    });
  };

  const handlePreview = (form: CustomForm) => {
    setSelectedForm(form);
    setShowPreview(true);
  };

  // Memoized values
  const memoizedSubcategories = useMemo(() => {
    return subcategories || [];
  }, [subcategories]);

  const statistics = useMemo(() => {
    if (!customForms) return { total: 0, defaults: 0, published: 0, totalUsage: 0 };
    
    return {
      total: customForms.length,
      defaults: customForms.filter((f: CustomForm) => f.isDefault).length,
      published: customForms.filter((f: CustomForm) => f.isPublished).length,
      totalUsage: customForms.reduce((sum: number, f: CustomForm) => sum + f.usageCount, 0)
    };
  }, [customForms]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">
          Errore nel caricamento dei custom forms: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📋 I Miei Moduli
            </h1>
            <p className="text-gray-600 mt-1">
              Gestisci i tuoi moduli personalizzati per raccogliere informazioni dai clienti
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nuovo Form
          </button>
        </div>
      </div>

      {/* Statistiche rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Totale Forms</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Predefiniti</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.defaults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <EyeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pubblicati</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Utilizzi Totali</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.totalUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Moduli */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">I Tuoi Moduli</h2>
        </div>

        {!customForms || customForms.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun custom form</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando il tuo primo modulo personalizzato.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="h-5 w-5" />
                Crea il primo form
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customForms.map((form: CustomForm) => (
              <div key={form.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {form.name}
                      </h3>
                      {form.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <StarSolidIcon className="h-3 w-3" />
                          Predefinito
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        form.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isPublished ? 'Pubblicato' : 'Bozza'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Sottocategoria: {form.subcategoryName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Utilizzi: {form.usageCount}</span>
                      <span>Creato: {new Date(form.createdAt).toLocaleDateString('it-IT')}</span>
                      <span>Aggiornato: {new Date(form.updatedAt).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(form)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Anteprima"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleSetDefault(form)}
                      className={`p-2 ${form.isDefault ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                      title={form.isDefault ? 'Rimuovi come predefinito' : 'Imposta come predefinito'}
                    >
                      {form.isDefault ? <StarSolidIcon className="h-5 w-5" /> : <StarIcon className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePublish(form)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        form.isPublished
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {form.isPublished ? 'Nascondi' : 'Pubblica'}
                    </button>

                    <button
                      onClick={() => navigate(`/professional/custom-forms/${form.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Modifica"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(form)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Elimina"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Anteprima */}
      {showPreview && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Anteprima: {selectedForm.name}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <CustomFormRenderer 
                  form={selectedForm}
                  mode="preview"
                  onSubmit={() => {}}
                />
                <div className="mt-4 space-y-2">
                  <p><strong>Form:</strong> {selectedForm.name}</p>
                  <p><strong>Descrizione:</strong> {selectedForm.description}</p>
                  <p><strong>Sottocategoria:</strong> {selectedForm.subcategoryName}</p>
                  <p><strong>Campi:</strong> {selectedForm.fields?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Creazione Custom Form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateFormSubmit} className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Nuovo Custom Form
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome del Form *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Es. Richiesta Idraulico Emergenza"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descrizione opzionale del form..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sottocategoria *
                </label>
                <select
                  value={createFormData.subcategoryId}
                  onChange={(e) => handleCreateFormChange('subcategoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleziona una sottocategoria</option>
                  {memoizedSubcategories.map((sub: Subcategory) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.categoryName} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo di Visualizzazione
                </label>
                <select
                  value={createFormData.displayType}
                  onChange={(e) => handleCreateFormChange('displayType', e.target.value as 'SIMPLE' | 'STANDARD' | 'ADVANCED')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SIMPLE">Semplice</option>
                  <option value="STANDARD">Standard</option>
                  <option value="ADVANCED">Avanzato</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={createMutation.isPending}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creazione...' : 'Crea Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFormsPage;