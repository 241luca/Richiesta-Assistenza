import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DocumentTextIcon, 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { customFormsAPI, CustomForm } from '../../services/customForms.api';
import { CustomFormCompiler } from './CustomFormCompiler';
import { CustomFormViewer } from './CustomFormViewer';
import toast from 'react-hot-toast';

interface RequestCustomFormsProps {
  requestId: string;
  subcategoryId?: string;
  isProfessional: boolean;
  isClient: boolean;
  requestInfo?: {
    requestNumber?: number;
    category?: string;
    subcategory?: string;
  };
}

export const RequestCustomForms: React.FC<RequestCustomFormsProps> = ({
  requestId,
  subcategoryId,
  isProfessional,
  isClient,
  requestInfo
}) => {
  const queryClient = useQueryClient();
  const [showSelectFormModal, setShowSelectFormModal] = useState(false);
  const [compilingForm, setCompilingForm] = useState<any>(null);
  const [viewingForm, setViewingForm] = useState<any>(null);

  // Query per ottenere i form già inviati per questa richiesta
  const { data: requestForms, isLoading: loadingRequestForms } = useQuery({
    queryKey: ['request-forms', requestId],
    queryFn: () => customFormsAPI.getRequestForms(requestId),
    staleTime: 2 * 60 * 1000,
  });

  const sentForms = requestForms?.data?.data || requestForms?.data || [];

  // Query per ottenere i form disponibili (solo per professional)
  const { data: availableForms } = useQuery({
    queryKey: ['available-forms-for-request', subcategoryId],
    queryFn: () => customFormsAPI.getAllCustomForms({
      subcategoryId,
      isPublished: true
    }),
    enabled: isProfessional && showSelectFormModal && !!subcategoryId,
    staleTime: 5 * 60 * 1000,
  });

  const forms = availableForms?.data?.data || availableForms?.data || [];

  // Mutation per inviare un form
  const sendFormMutation = useMutation({
    mutationFn: (formId: string) => customFormsAPI.sendFormToRequest(formId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-forms', requestId] });
      toast.success('Form inviato al cliente con successo');
      setShowSelectFormModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'invio del form');
    }
  });

  // Mutation per verificare un form
  const verifyFormMutation = useMutation({
    mutationFn: ({ requestFormId, isVerified }: { requestFormId: string; isVerified: boolean }) => 
      customFormsAPI.verifyForm(requestFormId, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-forms', requestId] });
      toast.success('Stato verifica aggiornato');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  const handleSendForm = (formId: string) => {
    // Verifica se il form è già stato inviato
    const alreadySent = sentForms.some((sf: any) => {
      const customFormId = sf.customFormId || sf.CustomForm?.id;
      return customFormId === formId;
    });

    if (alreadySent) {
      // Warning se già inviato, ma permetti comunque
      if (window.confirm(
        '⚠️ ATTENZIONE: Questo form è già stato inviato al cliente.\n\n' +
        'Inviandolo nuovamente, il cliente riceverà una nuova richiesta di compilazione.\n\n' +
        'Vuoi continuare?'
      )) {
        sendFormMutation.mutate(formId);
      }
    } else {
      // Primo invio - conferma normale
      if (window.confirm('Sei sicuro di voler inviare questo form al cliente?')) {
        sendFormMutation.mutate(formId);
      }
    }
  };

  if (loadingRequestForms) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Caricamento form...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            📋 Moduli {sentForms.length > 0 && `(${sentForms.length})`}
          </h2>
          {isProfessional && (
            <button
              onClick={() => setShowSelectFormModal(true)}
              disabled={!subcategoryId}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              title={!subcategoryId ? 'Sottocategoria non disponibile' : 'Invia un form al cliente'}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Invia Form
            </button>
          )}
        </div>

        {sentForms.length > 0 ? (
          <div className="space-y-3">
            {sentForms.map((item: any) => {
              const form = item.customForm || item.CustomForm;
              const isCompleted = item.isCompleted;
              const completedAt = item.submittedAt;
              const sentAt = item.createdAt;
              const professional = item.Request?.professional || item.Request?.Professional;
              const requestNumber = item.Request?.requestNumber;
              const submittedByUser = item.SubmittedBy || item.submittedBy;

              console.log('📦 Form item:', { 
                id: item.id, 
                formName: form?.name, 
                isCompleted, 
                completedAt,
                sentAt,
                professional,
                requestNumber,
                requestInfoProp: requestInfo,
                isClient,
                isProfessional
              });

              return (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{form?.name}</h3>
                      {form?.description && (
                        <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      )}
                      
                      {/* Info Invio e Completamento - Formato Footer */}
                      <div className="mt-3 space-y-1 text-xs">
                        {professional && sentAt && (
                          <p className="text-gray-600">
                            <strong>📤 Inviato da:</strong> {professional.firstName} {professional.lastName} il {new Date(sentAt).toLocaleDateString('it-IT')} alle {new Date(sentAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {isCompleted && submittedByUser && completedAt && (
                          <p className="text-green-600 font-medium">
                            <strong>✅ Completato da:</strong> {submittedByUser.firstName} {submittedByUser.lastName} il {new Date(completedAt).toLocaleDateString('it-IT')} alle {new Date(completedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {isCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Completato
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          In Attesa
                        </span>
                      )}
                    </div>
                  </div>

                  {isCompleted && isProfessional && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <button
                        onClick={() => {
                          const professional = item.Request?.professional || item.Request?.Professional;
                          const submittedByUser = item.SubmittedBy || item.submittedBy;
                          const requestNumber = item.Request?.requestNumber;
                          
                          setViewingForm({
                            form: {
                              name: form?.name,
                              description: form?.description,
                              Fields: form?.Fields || form?.fields || []
                            },
                            responses: item.Responses || item.responses || [],
                            requestInfo: {
                              requestNumber: requestNumber !== undefined && requestNumber !== null ? requestNumber : (requestInfo?.requestNumber || undefined),
                              category: requestInfo?.category,
                              subcategory: requestInfo?.subcategory
                            },
                            sentBy: professional ? {
                              firstName: professional.firstName,
                              lastName: professional.lastName,
                              sentAt: sentAt
                            } : undefined,
                            completedBy: submittedByUser ? {
                              firstName: submittedByUser.firstName,
                              lastName: submittedByUser.lastName,
                              completedAt: completedAt
                            } : undefined,
                            userRole: 'PROFESSIONAL'
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Visualizza Risposte →
                      </button>
                      
                      {/* Checkbox Verifica Form */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`verify-${item.id}`}
                          checked={item.isVerifiedByProfessional || false}
                          onChange={(e) => {
                            verifyFormMutation.mutate({
                              requestFormId: item.id,
                              isVerified: e.target.checked
                            });
                          }}
                          disabled={verifyFormMutation.isPending}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                        />
                        <label 
                          htmlFor={`verify-${item.id}`}
                          className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                        >
                          ✅ Compilato correttamente
                        </label>
                      </div>
                    </div>
                  )}

                  {isCompleted && isClient && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          const professional = item.Request?.professional || item.Request?.Professional;
                          const submittedByUser = item.SubmittedBy || item.submittedBy;
                          const requestNumber = item.Request?.requestNumber;
                          
                          setViewingForm({
                            form: {
                              name: form?.name,
                              description: form?.description,
                              Fields: form?.Fields || form?.fields || []
                            },
                            responses: item.Responses || item.responses || [],
                            requestInfo: {
                              requestNumber: requestNumber !== undefined && requestNumber !== null ? requestNumber : (requestInfo?.requestNumber || undefined),
                              category: requestInfo?.category,
                              subcategory: requestInfo?.subcategory
                            },
                            sentBy: professional ? {
                              firstName: professional.firstName,
                              lastName: professional.lastName,
                              sentAt: sentAt
                            } : undefined,
                            completedBy: submittedByUser ? {
                              firstName: submittedByUser.firstName,
                              lastName: submittedByUser.lastName,
                              completedAt: completedAt
                            } : undefined,
                            userRole: 'CLIENT'
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Visualizza Form Inviato →
                      </button>
                    </div>
                  )}

                  {!isCompleted && isClient && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setCompilingForm({
                            requestFormId: item.id,
                            form: {
                              id: form?.id,
                              name: form?.name,
                              description: form?.description,
                              fields: form?.Fields || form?.fields || []
                            },
                            existingResponses: item.Responses || item.responses || []
                          });
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Compila Form
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Nessun form inviato</p>
            {isProfessional && (
              <p className="mt-1 text-xs text-gray-500">
                Clicca su "Invia Form" per inviare un modulo al cliente
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal Selezione Form */}
      {showSelectFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Seleziona Form da Inviare
                </h3>
                <button
                  onClick={() => setShowSelectFormModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Scegli uno dei tuoi form o un template per questa sottocategoria
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {forms.length > 0 ? (
                <div className="space-y-3">
                  {forms.map((form: CustomForm) => {
                    // Verifica se è già stato inviato
                    const alreadySent = sentForms.some((sf: any) => {
                      const customFormId = sf.customFormId || sf.CustomForm?.id;
                      return customFormId === form.id;
                    });

                    return (
                      <div
                        key={form.id}
                        className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleSendForm(form.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{form.name}</h4>
                              {alreadySent && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                                  ⚠️ Già inviato
                                </span>
                              )}
                            </div>
                            {form.description && (
                              <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {(form.Fields || form.fields || []).length} campi
                              </span>
                              {!form.professionalId && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                  📚 Template
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendForm(form.id);
                            }}
                            disabled={sendFormMutation.isPending}
                            className="ml-4 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                          >
                            {alreadySent ? 'Reinvia' : 'Invia'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Nessun form disponibile per questa sottocategoria
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Crea un nuovo form o clona un template
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSelectFormModal(false)}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compilazione Form */}
      {compilingForm && (
        <CustomFormCompiler
          requestFormId={compilingForm.requestFormId}
          requestId={requestId}
          form={compilingForm.form}
          existingResponses={compilingForm.existingResponses}
          onClose={() => setCompilingForm(null)}
          onSuccess={() => {
            setCompilingForm(null);
            queryClient.invalidateQueries({ queryKey: ['request-forms', requestId] });
          }}
        />
      )}

      {/* Modal Visualizzazione Risposte */}
      {viewingForm && (
        <CustomFormViewer
          form={viewingForm.form}
          responses={viewingForm.responses}
          requestInfo={viewingForm.requestInfo}
          sentBy={viewingForm.sentBy}
          completedBy={viewingForm.completedBy}
          userRole={viewingForm.userRole}
          onClose={() => setViewingForm(null)}
        />
      )}
    </>
  );
};
