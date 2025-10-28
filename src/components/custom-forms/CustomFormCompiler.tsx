import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { customFormsAPI, CustomFormField } from '../../services/customForms.api';
import toast from 'react-hot-toast';
import { FormRichTextEditor } from './fields/FormRichTextEditor';
import { FormFileUpload } from './fields/FormFileUpload';

interface CustomFormCompilerProps {
  requestFormId: string;
  requestId: string;
  form: {
    id: string;
    name: string;
    description?: string;
    fields: CustomFormField[];
  };
  existingResponses?: Array<{
    fieldId: string;
    fieldName: string;
    fieldType: string;
    value: string | null;
    valueJson: any;
  }>;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CustomFormCompiler: React.FC<CustomFormCompilerProps> = ({
  requestFormId,
  requestId,
  form,
  existingResponses,
  onClose,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  
  // Inizializza lo state con le risposte esistenti (se presenti)
  const [responses, setResponses] = useState<Record<string, any>>(() => {
    if (!existingResponses || existingResponses.length === 0) return {};
    
    const initialResponses: Record<string, any> = {};
    existingResponses.forEach(response => {
      // Se è un campo multiplo, usa valueJson, altrimenti value
      if (['CHECKBOX', 'MULTISELECT', 'TAGS'].includes(response.fieldType) && response.valueJson) {
        initialResponses[response.fieldId] = response.valueJson;
      } else {
        initialResponses[response.fieldId] = response.value;
      }
    });
    
    console.log('📦 Risposte esistenti caricate:', initialResponses);
    return initialResponses;
  });

  // Mutation per inviare le risposte
  const submitMutation = useMutation({
    mutationFn: () => {
      // Converte le risposte in array di oggetti
      const responseArray = form.fields.map(field => ({
        fieldId: field.id,
        fieldName: field.label,
        fieldType: field.fieldType,
        value: responses[field.id] || null,
        valueJson: ['CHECKBOX', 'MULTISELECT', 'TAGS'].includes(field.fieldType) 
          ? responses[field.id] 
          : null
      }));

      return customFormsAPI.submitForm(requestFormId, responseArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-forms', requestId] });
      toast.success('Form inviato con successo!');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'invio del form');
    }
  });

  // Mutation per salvare la bozza
  const saveDraftMutation = useMutation({
    mutationFn: () => {
      const responseArray = form.fields.map(field => ({
        fieldId: field.id,
        fieldName: field.label,
        fieldType: field.fieldType,
        value: responses[field.id] || null,
        valueJson: ['CHECKBOX', 'MULTISELECT', 'TAGS'].includes(field.fieldType) 
          ? responses[field.id] 
          : null
      }));

      return customFormsAPI.saveDraft(requestFormId, responseArray);
    },
    onSuccess: () => {
      toast.success('Bozza salvata');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante il salvataggio');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione campi obbligatori
    const missingFields = form.fields
      .filter(field => field.isRequired && !responses[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Campi obbligatori mancanti: ${missingFields.join(', ')}`);
      return;
    }

    submitMutation.mutate();
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const renderField = (field: CustomFormField) => {
    const value = responses[field.id] || '';

    const handleChange = (newValue: any) => {
      setResponses(prev => ({ ...prev, [field.id]: newValue }));
    };

    const commonClasses = "w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white";

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            placeholder={field.defaultValue || ''}
            readOnly={field.isReadonly}
          />
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            placeholder={field.defaultValue || 'esempio@email.it'}
            readOnly={field.isReadonly}
            required={field.isRequired}
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            title="Inserisci un indirizzo email valido"
          />
        );

      case 'PHONE':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            placeholder={field.defaultValue || '+39 123 456 7890'}
            readOnly={field.isReadonly}
            required={field.isRequired}
            pattern="[+]?[0-9\s]{10,20}"
            title="Inserisci un numero di telefono valido (10-20 cifre, + opzionale)"
          />
        );

      case 'ADDRESS':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            className={`${commonClasses} min-h-[100px]`}
            placeholder={field.defaultValue || 'Via, numero civico\nCittà, CAP'}
            readOnly={field.isReadonly}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={6}
            className={`${commonClasses} min-h-[150px]`}
            placeholder={field.defaultValue || ''}
            readOnly={field.isReadonly}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            placeholder={field.defaultValue || ''}
            readOnly={field.isReadonly}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            readOnly={field.isReadonly}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            readOnly={field.isReadonly}
          />
        );

      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            disabled={field.isReadonly}
          >
            <option value="">Seleziona...</option>
            {field.possibleValues?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'MULTISELECT':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleChange(selected);
            }}
            className={`${commonClasses} h-32`}
            disabled={field.isReadonly}
          >
            {field.possibleValues?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'RADIO':
        return (
          <div className="space-y-2">
            {field.possibleValues?.map((option, i) => (
              <label key={i} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  className="mr-2"
                  disabled={field.isReadonly}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.possibleValues?.map((option, i) => (
              <label key={i} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-2"
                  disabled={field.isReadonly}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'RICH_TEXT':
        return (
          <FormRichTextEditor
            value={value}
            onChange={handleChange}
            isReadonly={field.isReadonly}
            isRequired={field.isRequired}
            placeholder={field.defaultValue || 'Inserisci il testo formattato...'}
            height={250}
          />
        );

      case 'FILE':
        return (
          <FormFileUpload
            value={value}
            onChange={(fileUrl, fileName) => {
              handleChange(fileUrl);
            }}
            isReadonly={field.isReadonly}
            isRequired={field.isRequired}
            acceptImages={false}
          />
        );

      case 'FILE_IMAGE':
        return (
          <FormFileUpload
            value={value}
            onChange={(fileUrl, fileName) => {
              handleChange(fileUrl);
            }}
            isReadonly={field.isReadonly}
            isRequired={field.isRequired}
            acceptImages={true}
          />
        );

      case 'LABEL':
        return (
          <div className="text-base text-gray-700 py-2" dangerouslySetInnerHTML={{ __html: field.label }} />
        );

      case 'DIVIDER':
        return (
          <div className="border-t-2 border-gray-300 my-4">
            {field.label && <span className="text-xs text-gray-400 italic">{field.label}</span>}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
            placeholder={field.defaultValue || ''}
            readOnly={field.isReadonly}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{form.name}</h2>
              {form.description && (
                <p className="text-sm text-gray-600 mt-1">{form.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {form.fields
              .filter(field => !field.isHidden && !field.visibleOnlyToProfessional)
              .map((field, index) => (
                <div key={field.id || index}>
                  {field.fieldType !== 'DIVIDER' && field.fieldType !== 'LABEL' && (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.helpText && (
                        <p className="text-xs text-gray-500 mb-2 flex items-start">
                          <span className="mr-1">ℹ️</span>
                          <span>{field.helpText}</span>
                        </p>
                      )}
                    </>
                  )}
                  {renderField(field)}
                </div>
              ))}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {saveDraftMutation.isPending ? 'Salvataggio...' : 'Salva Bozza'}
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Invio...' : 'Invia Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
