import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CustomForm, CustomFormField } from '../../services/customForms.api';
import toast from 'react-hot-toast';

interface CustomFormRendererProps {
  form: CustomForm;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  mode?: 'form' | 'preview' | 'readonly';
  className?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export const CustomFormRenderer: React.FC<CustomFormRendererProps> = ({
  form,
  initialData = {},
  onSubmit,
  onCancel,
  mode = 'form',
  className = ''
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  // Memoizza i valori predefiniti per evitare loop infiniti
  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {};
    
    form.fields?.forEach(field => {
      if (field.defaultValue) {
        defaults[field.code] = field.defaultValue;
      }
    });

    return defaults;
  }, [form.fields]);

  // TEMPORANEAMENTE DISABILITATO PER DEBUG - Inizializza i valori predefiniti solo una volta
  // useEffect(() => {
  //   if (Object.keys(defaultValues).length > 0) {
  //     setFormData(prev => {
  //       const newData = { ...defaultValues, ...prev };
  //       // Evita aggiornamenti inutili se i dati sono già uguali
  //       if (JSON.stringify(newData) === JSON.stringify(prev)) {
  //         return prev;
  //       }
  //       return newData;
  //     });
  //   }
  // }, [defaultValues]);

  const validateField = (field: CustomFormField, value: any): string | null => {
    // Campo obbligatorio
    if (field.isRequired && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} è obbligatorio`;
    }

    // Validazioni specifiche per tipo
    if (value && typeof value === 'string' && value.trim()) {
      switch (field.fieldType) {
        case 'EMAIL':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Inserisci un indirizzo email valido';
          }
          break;

        case 'PHONE':
          const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
          if (!phoneRegex.test(value)) {
            return 'Inserisci un numero di telefono valido';
          }
          break;

        case 'URL':
          try {
            new URL(value);
          } catch {
            return 'Inserisci un URL valido';
          }
          break;

        case 'NUMBER':
          if (isNaN(Number(value))) {
            return 'Inserisci un numero valido';
          }
          break;
      }
    }

    // Validazioni personalizzate dalle regole
    if (field.validationRules) {
      const rules = field.validationRules as any;
      
      if (rules.minLength && value && value.length < rules.minLength) {
        return `Minimo ${rules.minLength} caratteri`;
      }
      
      if (rules.maxLength && value && value.length > rules.maxLength) {
        return `Massimo ${rules.maxLength} caratteri`;
      }
      
      if (rules.min && Number(value) < rules.min) {
        return `Valore minimo: ${rules.min}`;
      }
      
      if (rules.max && Number(value) > rules.max) {
        return `Valore massimo: ${rules.max}`;
      }
      
      if (rules.pattern && value && !new RegExp(rules.pattern).test(value)) {
        return rules.patternMessage || 'Formato non valido';
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    form.fields?.forEach(field => {
      const value = formData[field.code];
      const error = validateField(field, value);
      
      if (error) {
        newErrors.push({ field: field.code, message: error });
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleFieldChange = (fieldCode: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldCode]: value }));
    
    // Rimuovi errori per questo campo
    setErrors(prev => prev.filter(error => error.field !== fieldCode));
  };

  const handleFileUpload = (fieldCode: string, files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setUploadedFiles(prev => ({ ...prev, [fieldCode]: fileArray }));
    setFormData(prev => ({ ...prev, [fieldCode]: fileArray.map(f => f.name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'preview' || mode === 'readonly') {
      return;
    }

    if (!validateForm()) {
      toast.error('Correggi gli errori nel form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepara i dati includendo i file
      const submitData = { ...formData };
      
      // Aggiungi informazioni sui file
      Object.keys(uploadedFiles).forEach(fieldCode => {
        submitData[`${fieldCode}_files`] = uploadedFiles[fieldCode];
      });

      await onSubmit(submitData);
    } catch (error) {
      toast.error('Errore durante l\'invio del form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldCode: string): string | undefined => {
    return errors.find(error => error.field === fieldCode)?.message;
  };

  const renderField = (field: CustomFormField) => {
    const value = formData[field.code] || '';
    const error = getFieldError(field.code);
    const isReadonly = mode === 'readonly' || field.isReadonly;
    const isHidden = field.isHidden;

    if (isHidden) return null;

    const baseInputClasses = `block w-full rounded-md shadow-sm sm:text-sm ${
      error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`;

    const renderInput = () => {
      switch (field.fieldType) {
        case 'TEXT':
        case 'EMAIL':
        case 'PHONE':
        case 'URL':
        case 'PASSWORD':
          return (
            <input
              type={field.fieldType === 'PASSWORD' ? 'password' : field.fieldType.toLowerCase()}
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              placeholder={field.defaultValue || `Inserisci ${field.label.toLowerCase()}...`}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );

        case 'TEXTAREA':
          return (
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              placeholder={field.defaultValue || `Inserisci ${field.label.toLowerCase()}...`}
              readOnly={isReadonly}
              rows={3}
              className={baseInputClasses}
            />
          );

        case 'NUMBER':
          return (
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              placeholder={field.defaultValue || '0'}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );

        case 'DATE':
          return (
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );

        case 'TIME':
          return (
            <input
              type="time"
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );

        case 'DATETIME':
          return (
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );

        case 'SELECT':
          return (
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              disabled={isReadonly}
              className={baseInputClasses}
            >
              <option value="">Seleziona...</option>
              {field.possibleValues?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        case 'MULTISELECT':
          return (
            <select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                handleFieldChange(field.code, selectedValues);
              }}
              disabled={isReadonly}
              className={`${baseInputClasses} min-h-[80px]`}
              size={Math.min(field.possibleValues?.length || 3, 5)}
            >
              {field.possibleValues?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        case 'RADIO':
          return (
            <div className="space-y-2">
              {field.possibleValues?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.code}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.code, e.target.value)}
                    disabled={isReadonly}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );

        case 'CHECKBOX':
          return (
            <div className="space-y-2">
              {field.possibleValues?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      handleFieldChange(field.code, newValues);
                    }}
                    disabled={isReadonly}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );

        case 'BOOLEAN':
          return (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.code, e.target.checked)}
                disabled={isReadonly}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {field.label}
              </span>
            </label>
          );

        case 'FILE':
        case 'IMAGE':
          return (
            <div>
              <input
                type="file"
                onChange={(e) => handleFileUpload(field.code, e.target.files)}
                accept={field.fieldType === 'IMAGE' ? 'image/*' : undefined}
                multiple={field.config?.multiple}
                disabled={isReadonly}
                className={baseInputClasses}
              />
              {uploadedFiles[field.code] && uploadedFiles[field.code].length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles[field.code].map((file, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        default:
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              readOnly={isReadonly}
              className={baseInputClasses}
            />
          );
      }
    };

    return (
      <div key={field.code} className="space-y-2">
        {field.fieldType !== 'BOOLEAN' && (
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {renderInput()}
        
        {error && (
          <div className="flex items-center text-sm text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  };

  const sortedFields = useMemo(() => (
    form.fields ? [...form.fields].sort((a, b) => a.displayOrder - b.displayOrder) : []
  ), [form.fields]);

  return (
    <div className={`custom-form-renderer ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campi del form */}
        <div className="space-y-6">
          {sortedFields.map(field => renderField(field))}
        </div>

        {/* Errori generali */}
        {errors.length > 0 && mode !== 'preview' && mode !== 'readonly' && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Correggi i seguenti errori:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pulsanti azione */}
        {mode !== 'readonly' && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Annulla
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || mode === 'preview'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Invio...' : mode === 'preview' ? 'Anteprima' : 'Invia'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};