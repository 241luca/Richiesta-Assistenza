/**
 * Form Send Dialog Component
 * Dialog per i professionisti per inviare form ai clienti
 * 
 * @module components/custom-forms/FormSendDialog
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  X, 
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { customFormsAPI } from '@/services/customForms.api';

interface FormSendDialogProps {
  requestId: string;
  requestTitle: string;
  clientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormOption {
  id: string;
  name: string;
  description: string | null;
  Fields: any[];
  isPublished: boolean;
}

interface SentForm {
  id: string;
  customFormId: string;
  isCompleted: boolean;
  submittedAt: string | null;
  createdAt: string;
  CustomForm: {
    id: string;
    name: string;
  };
}

export const FormSendDialog: React.FC<FormSendDialogProps> = ({
  requestId,
  requestTitle,
  clientName,
  onClose,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string>('');

  // Fetch available forms (user's forms + templates)
  const { data: formsData, isLoading: loadingForms } = useQuery({
    queryKey: ['available-forms', search],
    queryFn: async () => {
      const response = await customFormsAPI.getAllCustomForms({
        search,
        isPublished: true
      });
      return response.data?.data || [];
    }
  });

  // Fetch already sent forms for this request
  const { data: sentFormsData, isLoading: loadingSent } = useQuery({
    queryKey: ['request-forms', requestId],
    queryFn: async () => {
      const response = await customFormsAPI.getRequestForms(requestId);
      return response.data?.data || [];
    }
  });

  // Send form mutation
  const sendMutation = useMutation({
    mutationFn: async (formId: string) => {
      return await customFormsAPI.sendFormToRequest(formId, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-forms', requestId] });
      setSelectedFormId('');
      if (onSuccess) onSuccess();
    }
  });

  const availableForms: FormOption[] = formsData || [];
  const sentForms: SentForm[] = sentFormsData || [];

  // Filter out already sent forms
  const sentFormIds = new Set(sentForms.map(sf => sf.customFormId));
  const selectableForms = availableForms.filter(f => !sentFormIds.has(f.id));

  const handleSend = () => {
    if (!selectedFormId) return;
    
    const selectedForm = selectableForms.find(f => f.id === selectedFormId);
    if (!selectedForm) return;

    if (confirm(`Inviare il form "${selectedForm.name}" al cliente ${clientName}?`)) {
      sendMutation.mutate(selectedFormId);
    }
  };

  const getStatusBadge = (sentForm: SentForm) => {
    if (sentForm.isCompleted) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Completato
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <Clock className="h-3 w-3" />
          In attesa
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invia Form al Cliente</h2>
              <p className="text-sm text-gray-600 mt-1">
                Richiesta: {requestTitle}
              </p>
              <p className="text-sm text-gray-600">
                Cliente: {clientName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Forms già inviati */}
          {sentForms.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Form già inviati ({sentForms.length})
              </h3>
              <div className="space-y-2">
                {sentForms.map((sentForm) => (
                  <div
                    key={sentForm.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {sentForm.CustomForm.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Inviato il {new Date(sentForm.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(sentForm)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seleziona nuovo form */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Invia nuovo form
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca form..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Forms list */}
            {loadingForms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : selectableForms.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {availableForms.length === 0 
                    ? 'Nessun form disponibile'
                    : 'Tutti i form disponibili sono già stati inviati'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectableForms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => setSelectedFormId(form.id)}
                    className={cn(
                      'w-full text-left p-4 border rounded-lg transition-all',
                      selectedFormId === form.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{form.name}</p>
                        {form.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {form.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {form.Fields.length} campi
                        </p>
                      </div>
                      {selectedFormId === form.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Annulla
            </Button>

            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!selectedFormId || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Invia Form
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FormSendDialog;
