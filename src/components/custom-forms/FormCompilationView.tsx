/**
 * Form Compilation View
 * Interfaccia completa per la compilazione dei form da parte del cliente
 * Supporta tutti i 18 tipi di campo con validazione e conditional logic
 * 
 * @module components/custom-forms/FormCompilationView
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignatureField from './fields/SignatureField';
import FileUploadField from './fields/FileUploadField';
import ImageUploadField from './fields/ImageUploadField';
import {
  getVisibleFields,
  getRequiredFields,
  validateRequiredFields
} from '@/utils/customForms/conditionalFields';

export interface CustomFormField {
  id: string;
  code: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isReadonly: boolean;
  isHidden: boolean;
  displayOrder: number;
  columnSpan?: number;
  rowNumber?: number;
  groupName?: string;
  sectionCode?: string;
  config?: any;
  validationRules?: any;
  defaultValue?: string;
  possibleValues?: string | string[];
  showIf?: any;
  requiredIf?: any;
}

export interface FormCompilationViewProps {
  formId: string;
  formName: string;
  formDescription?: string;
  fields: CustomFormField[];
  initialValues?: Record<string, any>;
  isReadonly?: boolean;
  onSaveDraft?: (values: Record<string, any>) => Promise<void>;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
  className?: string;
}

export const FormCompilationView: React.FC<FormCompilationViewProps> = ({
  formId,
  formName,
  formDescription,
  fields,
  initialValues = {},
  isReadonly = false,
  onSaveDraft,
  onSubmit,
  className
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save ogni 30 secondi (draft mode)
  useEffect(() => {
    if (isReadonly || !onSaveDraft) return;

    const interval = setInterval(() => {
      handleSaveDraft();
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
  }, [formValues, isReadonly, onSaveDraft]);

  const handleFieldChange = (fieldCode: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldCode]: value
    }));

    // Rimuovi errore se presente
    if (errors[fieldCode]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldCode];
        return newErrors;
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveDraft(formValues);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Errore nel salvataggio della bozza:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onSubmit) return;

    // Validazione campi obbligatori
    const validationErrors = validateRequiredFields(fields, formValues);
    
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(err => {
        errorMap[err.code] = err.message;
      });
      setErrors(errorMap);
      
      // Scroll al primo errore
      const firstErrorField = document.querySelector(`[data-field-code="${validationErrors[0].code}"]`);
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
    } catch (error) {
      console.error('Errore nella compilazione del form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: CustomFormField) => {
    const value = formValues[field.code];
    const error = errors[field.code];
    const isFieldRequired = getRequiredFields(fields, formValues).has(field.code) || field.isRequired;
    
    const commonProps = {
      label: field.label,
      value,
      onChange: (val: any) => handleFieldChange(field.code, val),
      isRequired: isFieldRequired,
      isReadonly: isReadonly || field.isReadonly,
      error,
      config: field.config
    };

    const fieldWrapper = (content: React.ReactNode) => (
      <div
        key={field.id}
        data-field-code={field.code}
        className={cn(
          'transition-opacity',
          field.columnSpan && `col-span-${field.columnSpan > 12 ? 12 : field.columnSpan}`
        )}
      >
        {content}
      </div>
    );

    switch (field.fieldType) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return fieldWrapper(
          <div className="space-y-2">
            <Label htmlFor={field.code}>
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <input
              id={field.code}
              type={field.fieldType.toLowerCase()}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              disabled={isReadonly || field.isReadonly}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                error && 'border-red-500'
              )}
              placeholder={field.config?.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'TEXTAREA':
        return fieldWrapper(
          <div className="space-y-2">
            <Label htmlFor={field.code}>
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              id={field.code}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              disabled={isReadonly || field.isReadonly}
              rows={field.config?.rows || 4}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                error && 'border-red-500'
              )}
              placeholder={field.config?.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'NUMBER':
        return fieldWrapper(
          <div className="space-y-2">
            <Label htmlFor={field.code}>
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <input
              id={field.code}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              disabled={isReadonly || field.isReadonly}
              min={field.config?.min}
              max={field.config?.max}
              step={field.config?.step}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                error && 'border-red-500'
              )}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'DATE':
      case 'DATETIME':
      case 'TIME':
        return fieldWrapper(
          <div className="space-y-2">
            <Label htmlFor={field.code}>
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <input
              id={field.code}
              type={field.fieldType === 'DATETIME' ? 'datetime-local' : field.fieldType.toLowerCase()}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.code, e.target.value)}
              disabled={isReadonly || field.isReadonly}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                error && 'border-red-500'
              )}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'CHECKBOX':
        return fieldWrapper(
          <div className="flex items-center space-x-2">
            <input
              id={field.code}
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.code, e.target.checked)}
              disabled={isReadonly || field.isReadonly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor={field.code} className="cursor-pointer">
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-red-500 ml-6">{error}</p>}
          </div>
        );

      case 'RADIO':
      case 'SELECT':
        const options = Array.isArray(field.possibleValues) 
          ? field.possibleValues 
          : typeof field.possibleValues === 'string' 
            ? JSON.parse(field.possibleValues) 
            : [];

        if (field.fieldType === 'RADIO') {
          return fieldWrapper(
            <div className="space-y-2">
              <Label>{field.label}
                {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                {options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      id={`${field.code}-${index}`}
                      type="radio"
                      name={field.code}
                      value={option}
                      checked={value === option}
                      onChange={(e) => handleFieldChange(field.code, e.target.value)}
                      disabled={isReadonly || field.isReadonly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`${field.code}-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          );
        } else {
          return fieldWrapper(
            <div className="space-y-2">
              <Label htmlFor={field.code}>
                {field.label}
                {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <select
                id={field.code}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.code, e.target.value)}
                disabled={isReadonly || field.isReadonly}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  error && 'border-red-500'
                )}
              >
                <option value="">Seleziona...</option>
                {options.map((option: string, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          );
        }

      case 'MULTISELECT':
        const multiOptions = Array.isArray(field.possibleValues) 
          ? field.possibleValues 
          : typeof field.possibleValues === 'string' 
            ? JSON.parse(field.possibleValues) 
            : [];

        return fieldWrapper(
          <div className="space-y-2">
            <Label>{field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {multiOptions.map((option: string, index: number) => {
                const selectedValues = value || [];
                const isChecked = selectedValues.includes(option);

                return (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      id={`${field.code}-${index}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option]
                          : selectedValues.filter((v: string) => v !== option);
                        handleFieldChange(field.code, newValues);
                      }}
                      disabled={isReadonly || field.isReadonly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor={`${field.code}-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'SIGNATURE':
        return fieldWrapper(
          <SignatureField {...commonProps} />
        );

      case 'FILE':
        return fieldWrapper(
          <FileUploadField 
            {...commonProps}
            multiple={field.config?.multiple}
          />
        );

      case 'FILE_IMAGE':
        return fieldWrapper(
          <ImageUploadField 
            {...commonProps}
            multiple={field.config?.multiple}
          />
        );

      case 'SLIDER':
        return fieldWrapper(
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={field.code}>
                {field.label}
                {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <span className="text-sm text-gray-600">{value || field.config?.min || 0}</span>
            </div>
            <input
              id={field.code}
              type="range"
              min={field.config?.min || 0}
              max={field.config?.max || 100}
              step={field.config?.step || 1}
              value={value || field.config?.min || 0}
              onChange={(e) => handleFieldChange(field.code, parseInt(e.target.value))}
              disabled={isReadonly || field.isReadonly}
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'RATING':
        const maxRating = field.config?.max || 5;
        return fieldWrapper(
          <div className="space-y-2">
            <Label>
              {field.label}
              {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex gap-1">
              {Array.from({ length: maxRating }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFieldChange(field.code, index + 1)}
                  disabled={isReadonly || field.isReadonly}
                  className={cn(
                    'text-2xl transition-colors',
                    value >= index + 1 ? 'text-yellow-400' : 'text-gray-300',
                    !isReadonly && !field.isReadonly && 'hover:text-yellow-400'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'HIDDEN':
        return null;

      default:
        return fieldWrapper(
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Campo tipo "{field.fieldType}" non ancora implementato
            </p>
          </div>
        );
    }
  };

  // Filtra campi visibili
  const visibleFields = getVisibleFields(fields, formValues) as CustomFormField[];

  // Raggruppa per sezioni
  const groupedFields = visibleFields.reduce((groups, field) => {
    const section = field.sectionCode || 'default';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
    return groups;
  }, {} as Record<string, CustomFormField[]>);

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{formName}</h2>
        {formDescription && (
          <p className="text-gray-600 mt-2">{formDescription}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Fields */}
        {Object.entries(groupedFields).map(([sectionCode, sectionFields]) => (
          <Card key={sectionCode} className="p-6">
            {sectionCode !== 'default' && (
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {sectionCode}
              </h3>
            )}
            
            <div className="grid grid-cols-12 gap-4">
              {sectionFields
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map(renderField)}
            </div>
          </Card>
        ))}

        {/* Actions */}
        {!isReadonly && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Save Draft */}
              {onSaveDraft && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva Bozza
                      </>
                    )}
                  </Button>
                  
                  {lastSaved && (
                    <span className="text-xs text-gray-500">
                      Ultimo salvataggio: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}

              {/* Submit */}
              {onSubmit && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="sm:ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Invia Modulo
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Validation errors summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Completa tutti i campi obbligatori
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {Object.keys(errors).length} campo/i richiedono attenzione
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}
      </form>
    </div>
  );
};

export default FormCompilationView;
