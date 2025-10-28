import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentDuplicateIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { customFormsAPI } from '../../services/customForms.api';

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
  displayType: 'MODAL' | 'INLINE' | 'SIDEBAR';
  createdBy: string;
  usageCount: number;
  layout: any;
  settings: any;
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

const CustomFormsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  // Handler functions
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

  const handleEdit = (form: CustomForm) => {
    navigate(`/professional/custom-forms/${form.id}`);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">
          📋 Lista Moduli
        </h1>
        <p className="text-gray-600 mt-1">
          Visualizza e gestisci tutti i tuoi moduli personalizzati
        </p>
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
              Non hai ancora creato nessun modulo personalizzato.
            </p>
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
                      onClick={() => handleEdit(form)}
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
                <p className="text-gray-600">
                  🔧 <strong>Test Performance:</strong> CustomFormRenderer temporaneamente disabilitato
                </p>
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
    </div>
  );
};

export default CustomFormsList;