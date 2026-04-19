import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CustomFormRenderer } from '../../components/custom-forms/CustomFormRenderer';
import { clientCustomFormsAPI, ClientReceivedForm } from '../../services/clientCustomForms.api';
import toast from 'react-hot-toast';

// Types imported from API

export const CustomFormsPage: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<ClientReceivedForm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Query per ottenere i custom forms ricevuti dal cliente
  const { data: formsResponse, isLoading } = useQuery({
    queryKey: ['client-received-forms', filter],
    queryFn: async () => {
      if (filter === 'pending') {
        return clientCustomFormsAPI.getPendingForms();
      } else if (filter === 'completed') {
        return clientCustomFormsAPI.getCompletedForms();
      } else {
        return clientCustomFormsAPI.getAllForms();
      }
    },
    staleTime: 2 * 60 * 1000
  });

  // Extract forms from response
  const allForms = formsResponse?.data || [];

  // Filter by search term
  const receivedForms = allForms.filter((form: ClientReceivedForm) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      form.CustomForm.name.toLowerCase().includes(searchLower) ||
      form.Request?.title.toLowerCase().includes(searchLower)
    );
  });

  // Mutation per inviare il form compilato
  const submitFormMutation = useMutation({
    mutationFn: async ({ formId, responses }: { formId: string; responses: any[] }) => {
      return await clientCustomFormsAPI.submitForm(formId, responses);
    },
    onSuccess: () => {
      toast.success('Form inviato con successo!');
      setShowModal(false);
      setSelectedForm(null);
      queryClient.invalidateQueries({ queryKey: ['client-received-forms'] });
    },
    onError: () => {
      toast.error('Errore durante l\'invio del form');
    }
  });

  const handleViewForm = (form: ClientReceivedForm) => {
    setSelectedForm(form);
    setShowModal(true);
  };

  const handleSubmitForm = (responses: Record<string, any>) => {
    if (selectedForm) {
      // Convert responses object to array format expected by API
      const responsesArray = Object.entries(responses).map(([fieldId, value]) => {
        const field = selectedForm.CustomForm.Fields.find(f => f.id === fieldId);
        return {
          fieldId,
          fieldName: field?.label || '',
          fieldType: field?.fieldType || 'TEXT',
          value: typeof value === 'string' ? value : undefined,
          valueJson: typeof value !== 'string' ? value : undefined
        };
      });

      submitFormMutation.mutate({
        formId: selectedForm.id,
        responses: responsesArray
      });
    }
  };

  const getStatusIcon = (isCompleted: boolean) => {
    return isCompleted 
      ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
      : <ClockIcon className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = (isCompleted: boolean) => {
    return isCompleted ? 'Completato' : 'Da compilare';
  };

  const getStatusColor = (isCompleted: boolean) => {
    return isCompleted 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">I Miei Form</h1>
            <p className="text-gray-600 mt-1">
              Form personalizzati ricevuti dai professionisti
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {receivedForms.length} form totali
            </span>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro per stato */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i form</option>
              <option value="pending">Da compilare</option>
              <option value="completed">Completati</option>
            </select>
          </div>

          {/* Barra di ricerca */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per nome form, professionista o categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Lista Form */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {receivedForms.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun form trovato
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Non hai ancora ricevuto form personalizzati dai professionisti.'
                : filter === 'pending'
                ? 'Non ci sono form da compilare.'
                : 'Non ci sono form completati.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {receivedForms.map((form: any) => (
              <div key={form.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(form.isCompleted)}
                      <h3 className="text-lg font-medium text-gray-900">
                        {form.CustomForm.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.isCompleted)}`}>
                        {getStatusText(form.isCompleted)}
                      </span>
                    </div>
                    
                    {form.CustomForm.description && (
                      <p className="text-gray-600 mb-3">{form.CustomForm.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Richiesta:</span>{' '}
                        <Link to={`/requests/${form.requestId}`} className="text-blue-600 hover:underline">
                          {form.Request?.title || 'Vedi richiesta'}
                        </Link>
                      </div>
                      <div>
                        <span className="font-medium">Ricevuto:</span> {formatDate(form.createdAt)}
                      </div>
                    </div>
                    
                    {form.submittedAt && (
                      <div className="mt-2 text-sm text-green-600">
                        <span className="font-medium">
                          ✅ Completato il: {formatDate(form.submittedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewForm(form)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {form.isCompleted ? 'Visualizza' : 'Compila'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal per visualizzazione/compilazione form */}
      {showModal && selectedForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedForm.CustomForm.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Richiesta: {selectedForm.Request?.title}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Chiudi</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <CustomFormRenderer
                form={selectedForm.CustomForm as any}
                initialData={selectedForm.Responses?.reduce((acc, r) => ({ ...acc, [r.fieldId]: r.value || r.valueJson }), {}) || {}}
                onSubmit={handleSubmitForm}
                onCancel={() => setShowModal(false)}
                mode={selectedForm.isCompleted ? 'readonly' : 'form'}
              />
            </div>
            
            {selectedForm.isCompleted && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Form completato il {selectedForm.submittedAt && formatDate(selectedForm.submittedAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};