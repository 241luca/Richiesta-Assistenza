import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CustomFormBuilder } from '../components/custom-forms/CustomFormBuilder';
import { CustomFormRenderer } from '../components/custom-forms/CustomFormRenderer';
import { customFormsAPI, CustomForm } from '../services/customForms.api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

type ViewMode = 'edit' | 'preview' | 'settings';

export const CustomFormPage: React.FC = () => {
  // La route usa :formId (professional) o :id (admin) come parametro
  const params = useParams<{ formId?: string; id?: string }>();
  // Supporta entrambi i nomi per compatibilità
  const formId = params.formId || params.id;
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log('📋 [CustomFormPage] Page mounted:', {
    params,
    formId,
    hasFormId: !!formId,
    pathname: window.location.pathname
  });

  // Query per caricare il form esistente
  const { data: formData, isLoading, error } = useQuery({
    queryKey: ['custom-form', formId],
    queryFn: () => formId ? customFormsAPI.getCustomFormById(formId) : null,
    enabled: !!formId,
    staleTime: 5 * 60 * 1000,
  });

  // Debug: Log raw API response
  console.log('🔍 [CustomFormPage] Raw API response:', formData);

  // Il backend usa ResponseFormatter che ritorna { success: true, data: {...} }
  // Axios wrappa in response.data, quindi dobbiamo accedere a formData.data.data
  const rawForm = formData?.data?.data;
  
  // Normalizza i dati: Fields (Prisma) -> fields (camelCase)
  const form = rawForm ? {
    ...rawForm,
    fields: rawForm.fields || rawForm.Fields || [],
    subcategory: rawForm.subcategory || rawForm.Subcategory,
    professional: rawForm.professional || rawForm.Professional,
    createdByUser: rawForm.createdByUser || rawForm.CreatedBy
  } : null;

  // Debug logging
  console.log('📝 [CustomFormPage] Form data received:', {
    formId,
    hasFormData: !!formData,
    rawFieldsCount: (rawForm?.fields || rawForm?.Fields || []).length,
    normalizedFieldsCount: form?.fields?.length || 0,
    form: form ? {
      id: form.id,
      name: form.name,
      description: form.description,
      professionalId: form.professionalId,
      subcategoryId: form.subcategoryId,
      displayType: form.displayType,
      fieldsCount: form.fields?.length || 0
    } : null
  });

  const handleSave = (savedForm: CustomForm) => {
    toast.success('Form salvato con successo');
    if (!formId) {
      // Se è un nuovo form, naviga alla pagina di modifica con il percorso corretto
      navigate(`/admin/custom-forms/${savedForm.id}`);
    }
  };

  const handleCancel = () => {
    navigate('/admin/custom-forms');
  };

  const handleDelete = async () => {
    if (!formId) return;
    
    try {
      await customFormsAPI.deleteCustomForm(formId);
      toast.success('Form eliminato con successo');
      navigate('/admin/custom-forms');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore durante l\'eliminazione');
    }
  };

  const handlePublish = async () => {
    if (!formId) return;
    
    try {
      await customFormsAPI.publishCustomForm(formId);
      toast.success('Form pubblicato con successo');
      // Ricarica i dati
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore durante la pubblicazione');
    }
  };

  const handleShare = () => {
    if (!form) return;
    
    const shareUrl = `${window.location.origin}/forms/${form.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiato negli appunti');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Errore nel caricamento</h3>
          <p className="mt-1 text-sm text-gray-500">
            Non è stato possibile caricare il form richiesto
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/admin/custom-forms')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Torna ai Moduli
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumb e titolo */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/custom-forms')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <div>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <button
                        onClick={() => navigate('/admin/custom-forms')}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        Moduli
                      </button>
                    </li>
                    <li>
                      <span className="text-gray-400">/</span>
                    </li>
                    <li>
                      <span className="text-gray-900 text-sm font-medium">
                        {form?.name || 'Nuovo Form'}
                      </span>
                    </li>
                  </ol>
                </nav>
                
                <h1 className="text-xl font-semibold text-gray-900 mt-1">
                  {form?.name || 'Nuovo Modulo'}
                </h1>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex items-center space-x-3">
              {/* Tabs per modalità visualizzazione */}
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Cog6ToothIcon className="h-4 w-4 inline mr-1" />
                  Modifica
                </button>
                
                <button
                  onClick={() => setViewMode('preview')}
                  disabled={!form?.fields?.length}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                    viewMode === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <EyeIcon className="h-4 w-4 inline mr-1" />
                  Anteprima
                </button>
              </div>

              {/* Azioni form */}
              {form && (
                <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ShareIcon className="h-4 w-4 mr-1" />
                    Condividi
                  </button>

                  {!form.isPublished && (
                    <button
                      onClick={handlePublish}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Pubblica
                    </button>
                  )}

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Elimina
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="max-w-7xl mx-auto py-6">
        {viewMode === 'edit' && (
          <CustomFormBuilder
            formId={formId}
            initialData={form}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'preview' && form && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{form.name}</h2>
                {form.description && (
                  <p className="mt-2 text-gray-600">{form.description}</p>
                )}
                
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    Stato: {form.isPublished ? (
                      <span className="text-green-600 font-medium">Pubblicato</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">Bozza</span>
                    )}
                  </span>
                  <span>•</span>
                  <span>{form.fields?.length || 0} campi</span>
                  <span>•</span>
                  <span>Tipo: {form.displayType}</span>
                </div>
              </div>

              <CustomFormRenderer
                form={form}
                onSubmit={(data) => {
                  console.log('Form data:', data);
                  toast.success('Anteprima: dati form ricevuti (vedi console)');
                }}
                mode="preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal conferma eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <TrashIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Elimina Modulo
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Sei sicuro di voler eliminare questo form? Questa azione non può essere annullata.
              </p>
              
              {form && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">{form.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {form.fields?.length || 0} campi • {form.isPublished ? 'Pubblicato' : 'Bozza'}
                  </p>
                </div>
              )}

              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};