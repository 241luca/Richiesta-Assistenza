import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { customFormsAPI, CustomForm, CustomFormField, CreateCustomFormData } from '../../services/customForms.api';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CustomFormBuilderProps {
  formId?: string;
  subcategoryId?: string;
  initialData?: CustomForm;
  onSave?: (form: CustomForm) => void;
  onCancel?: () => void;
}

interface FieldTemplate {
  type: CustomFormField['fieldType'];
  label: string;
  icon: string;
  description: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryName: string;
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const FIELD_TEMPLATES: FieldTemplate[] = [
  // Testo e Input Base
  { type: 'TEXT', label: 'Testo', icon: '📝', description: 'Campo di testo semplice' },
  { type: 'TEXTAREA', label: 'Testo Lungo', icon: '📄', description: 'Area di testo multiriga' },
  { type: 'RICH_TEXT', label: 'Testo Formattato', icon: '📰', description: 'Editor con formattazione (grassetto, corsivo, ecc.)' },
  { type: 'EMAIL', label: 'Email', icon: '📧', description: 'Campo email con validazione' },
  { type: 'PHONE', label: 'Telefono', icon: '📱', description: 'Campo numero di telefono' },
  { type: 'NUMBER', label: 'Numero', icon: '🔢', description: 'Campo numerico' },
  
  // Indirizzi e Luoghi
  { type: 'ADDRESS', label: 'Indirizzo', icon: '🏠', description: 'Campo indirizzo completo' },
  { type: 'LOCATION', label: 'Posizione GPS', icon: '📍', description: 'Coordinate geografiche' },
  
  // Date e Tempo
  { type: 'DATE', label: 'Data', icon: '📅', description: 'Selettore data' },
  { type: 'DATETIME', label: 'Data e Ora', icon: '📅🕐', description: 'Data e ora insieme' },
  
  // Selezione
  { type: 'SELECT', label: 'Selezione', icon: '📋', description: 'Menu a tendina' },
  { type: 'MULTISELECT', label: 'Selezione Multipla', icon: '☑️', description: 'Selezione multipla' },
  { type: 'RADIO', label: 'Opzione Singola', icon: '🔘', description: 'Pulsanti radio' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: '☑️', description: 'Caselle di controllo' },
  { type: 'AUTOCOMPLETE', label: 'Autocompletamento', icon: '🔍', description: 'Campo con autocompletamento' },
  
  // File e Media
  { type: 'FILE', label: 'File', icon: '📎', description: 'Upload file' },
  { type: 'FILE_IMAGE', label: 'Immagine', icon: '🖼️', description: 'Upload immagine' },
  { type: 'SIGNATURE', label: 'Firma', icon: '✍️', description: 'Campo firma digitale' },
  
  // Interattivi
  { type: 'SLIDER', label: 'Slider', icon: '🎚️', description: 'Selezione con slider' },
  { type: 'RATING', label: 'Valutazione', icon: '⭐', description: 'Valutazione con stelle' },
  { type: 'TAGS', label: 'Tag', icon: '🏷️', description: 'Tag multipli' },
  
  // Layout e Struttura
  { type: 'LABEL', label: 'Etichetta/Titolo', icon: '🏷️', description: 'Testo descrittivo con formattazione' },
  { type: 'DIVIDER', label: 'Separatore', icon: '➖', description: 'Linea di separazione visuale' },
  { type: 'HIDDEN', label: 'Campo Nascosto', icon: '🔒', description: 'Campo nascosto' },
];

export const CustomFormBuilder: React.FC<CustomFormBuilderProps> = ({
  formId,
  subcategoryId,
  initialData,
  onSave,
  onCancel
}) => {
  console.log('🛠️ [CustomFormBuilder] Component mounted with props:', {
    formId,
    subcategoryId,
    hasInitialData: !!initialData,
    initialData: initialData ? {
      id: initialData.id,
      name: initialData.name,
      description: initialData.description,
      professionalId: initialData.professionalId,
      subcategoryId: initialData.subcategoryId,
      displayType: initialData.displayType,
      fieldsCount: (initialData.fields || initialData.Fields || []).length,
      allKeys: Object.keys(initialData)
    } : null
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<CreateCustomFormData>>({
    name: '',
    description: '',
    subcategoryId: subcategoryId || undefined,
    displayType: 'STANDARD', // Default opzionale (compatibile con DB)
    fields: []
  });
  
  const [selectedField, setSelectedField] = useState<CustomFormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // Determina se l'utente è admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Query per i professionisti (solo per admin)
  const { data: professionals } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: async () => {
      const response = await api.get('/users/professionals');
      const rawData = response.data.data;
      return rawData.map((item: any) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email
      }));
    },
    enabled: isAdmin,
    staleTime: 30 * 60 * 1000,
  });

  // Query per le sottocategorie
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories-for-form', selectedProfessionalId, user?.id, isAdmin],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      
      // Se admin ha selezionato un professional specifico
      if (isAdmin && selectedProfessionalId && selectedProfessionalId !== 'template') {
        const response = await api.get(`/user/subcategories/${selectedProfessionalId}`);
        const rawData = response.data.data;
        
        return rawData
          .filter((item: any) => item?.Subcategory?.id && item?.Subcategory?.name)
          .map((item: any) => ({
            id: item.Subcategory.id,
            name: item.Subcategory.name,
            categoryName: item.Subcategory.Category?.name || 'Categoria non specificata'
          }));
      }
      
      // Se admin ha selezionato "Template Repository" o non ha scelto
      if (isAdmin) {
        const response = await api.get('/subcategories');
        const rawData = response.data.data;
        
        return rawData
          .filter((item: any) => item?.id && item?.name)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            categoryName: item.category?.name || item.Category?.name || item.categoryName || 'Categoria non specificata'
          }));
      }
      
      // Per professionisti, carica le loro sottocategorie
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
  });

  // Query per caricare il form esistente se in modalità modifica
  const { data: existingForm } = useQuery({
    queryKey: ['custom-form', formId],
    queryFn: () => formId ? customFormsAPI.getCustomFormById(formId) : null,
    enabled: !!formId,
    staleTime: 5 * 60 * 1000,
  });

  // Carica i dati del form esistente
  useEffect(() => {
    // Usa initialData se disponibile, altrimenti usa existingForm dalla query
    const form = initialData || existingForm?.data?.data || existingForm?.data;
    
    if (form) {
      console.log('🔍 [CustomFormBuilder] Caricamento dati form esistente:', {
        formId: form.id,
        name: form.name,
        professionalId: form.professionalId,
        subcategoryId: form.subcategoryId,
        displayType: form.displayType,
        fieldsCount: (form.Fields || form.fields || []).length
      });
      
      // Usa Fields (PascalCase da Prisma) o fields (lowercase) come fallback
      const formFields = form.Fields || form.fields || [];
      
      setFormData({
        name: form.name,
        description: form.description,
        subcategoryId: form.subcategoryId,
        displayType: form.displayType,
        fields: formFields.map((field: any) => ({
          code: field.code,
          label: field.label,
          fieldType: field.fieldType,
          displayOrder: field.displayOrder,
          isRequired: field.isRequired,
          isReadonly: field.isReadonly,
          isHidden: field.isHidden,
          columnSpan: field.columnSpan,
          rowNumber: field.rowNumber,
          groupName: field.groupName,
          sectionCode: field.sectionCode,
          config: field.config,
          validationRules: field.validationRules,
          defaultValue: field.defaultValue,
          possibleValues: field.possibleValues,
          dependencies: field.dependencies,
          showIf: field.showIf,
          requiredIf: field.requiredIf
        }))
      });
      
      // Se è un form esistente, imposta il professional selezionato
      if (isAdmin) {
        if (form.professionalId) {
          console.log('✅ [CustomFormBuilder] Form specifico per professional:', form.professionalId);
          setSelectedProfessionalId(form.professionalId);
        } else {
          console.log('📚 [CustomFormBuilder] Form template (nessun professional)');
          setSelectedProfessionalId('template');
        }
      }
    }
  }, [initialData, existingForm, isAdmin]);

  // Mutation per salvare il form
  const saveMutation = useMutation({
    mutationFn: (data: CreateCustomFormData) => {
      // Determina il professionalId corretto
      let professionalIdToUse;
      if (isAdmin) {
        // Se admin ha selezionato "Template Repository", professionalId = null
        professionalIdToUse = selectedProfessionalId === 'template' ? null : selectedProfessionalId;
      } else {
        // Se è un professional, usa il suo ID
        professionalIdToUse = user?.id;
      }
      
      const formDataWithProfessional = {
        ...data,
        professionalId: professionalIdToUse
      };
      
      console.log('📤 [CustomFormBuilder] Invio al backend:', formDataWithProfessional);
      
      if (formId) {
        return customFormsAPI.updateCustomForm(formId, formDataWithProfessional);
      } else {
        return customFormsAPI.createCustomForm(formDataWithProfessional);
      }
    },
    onSuccess: (response) => {
      console.log('✅ [CustomFormBuilder] Risposta dal backend:', response);
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast.success(formId ? 'Form aggiornato con successo' : 'Form creato con successo');
      
      // Il backend usa ResponseFormatter, i dati sono in response.data.data
      const savedForm = response.data?.data || response.data;
      onSave?.(savedForm);
    },
    onError: (error: any) => {
      console.error('❌ [CustomFormBuilder] Errore salvataggio:', error);
      console.error('❌ [CustomFormBuilder] Dettagli errore:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors
      });
      
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.map((e: any) => e.msg).join(', ')
        : error.response?.data?.message || 'Errore durante il salvataggio';
      
      toast.error(errorMessage);
    }
  });

  const handleAddField = (template: FieldTemplate) => {
    const newField: Omit<CustomFormField, 'id'> = {
      code: `field_${Date.now()}`,
      label: template.label,
      fieldType: template.type,
      displayOrder: (formData.fields?.length || 0) + 1,
      isRequired: false,
      isReadonly: false,
      isHidden: false,
      columnSpan: 1,
      rowNumber: Math.floor((formData.fields?.length || 0) / 2) + 1,
      config: {},
      validationRules: {},
      possibleValues: template.type === 'SELECT' || template.type === 'MULTISELECT' || template.type === 'RADIO' ? ['Opzione 1', 'Opzione 2'] : undefined
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleRemoveField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index) || []
    }));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const fields = [...(formData.fields || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      
      // Aggiorna displayOrder
      fields.forEach((field, i) => {
        field.displayOrder = i + 1;
      });
      
      setFormData(prev => ({ ...prev, fields }));
    }
  };

  const handleEditField = (field: CustomFormField, index: number) => {
    setSelectedField({ ...field, id: index.toString() });
    setShowFieldEditor(true);
  };

  const handleSaveField = (updatedField: CustomFormField) => {
    const index = parseInt(updatedField.id);
    const fields = [...(formData.fields || [])];
    const { id, ...fieldWithoutId } = updatedField;
    fields[index] = fieldWithoutId;
    
    setFormData(prev => ({ ...prev, fields }));
    setShowFieldEditor(false);
    setSelectedField(null);
  };

  const handleSaveForm = () => {
    console.log('🔍 [CustomFormBuilder] formData COMPLETO prima della validazione:', {
      formData,
      name: formData.name,
      subcategoryId: formData.subcategoryId,
      description: formData.description,
      displayType: formData.displayType,
      fields: formData.fields,
      selectedProfessionalId,
      isAdmin
    });
    
    if (!formData.name?.trim()) {
      toast.error('Il nome del form è obbligatorio');
      return;
    }

    if (!formData.subcategoryId) {
      toast.error('La sottocategoria è obbligatoria');
      console.error('❌ subcategoryId mancante! formData:', formData);
      return;
    }

    if (!formData.fields?.length) {
      toast.error('Aggiungi almeno un campo al form');
      return;
    }

    // Debug: Log dei dati che stiamo per salvare
    console.log('💾 [CustomFormBuilder] Salvataggio form:', {
      formId,
      name: formData.name,
      subcategoryId: formData.subcategoryId,
      displayType: formData.displayType,
      fieldsCount: formData.fields?.length,
      fields: formData.fields
    });

    saveMutation.mutate(formData as CreateCustomFormData);
  };

  const renderFieldPreview = (field: Omit<CustomFormField, 'id'>, index: number) => {
    const commonProps = {
      className: "w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white",
      placeholder: field.defaultValue || `Inserisci ${field.label.toLowerCase()}...`,
      disabled: previewMode
    };

    switch (field.fieldType) {
      case 'TEXT':
        return <input type="text" {...commonProps} />;
      
      case 'EMAIL':
        return <input type="email" {...commonProps} placeholder="esempio@email.it" />;
      
      case 'PHONE':
        return <input type="tel" {...commonProps} placeholder="+39 123 456 7890" />;
      
      case 'ADDRESS':
        return (
          <div className="space-y-2">
            <input type="text" {...commonProps} placeholder="Via, numero civico" className="w-full rounded-md border-2 border-gray-400 shadow-sm bg-white" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Città" className="rounded-md border-2 border-gray-400 shadow-sm bg-white" disabled={previewMode} />
              <input type="text" placeholder="CAP" className="rounded-md border-2 border-gray-400 shadow-sm bg-white" disabled={previewMode} />
            </div>
          </div>
        );
      
      case 'TEXTAREA':
        return <textarea rows={6} {...commonProps} className="w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white min-h-[150px]" />;
      
      case 'RICH_TEXT':
        return (
          <div className="border-2 border-gray-400 rounded-lg p-3 min-h-[180px] bg-white">
            <div className="flex space-x-2 mb-2 pb-2 border-b border-gray-300">
              <button className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100" disabled={previewMode}>
                <b>B</b>
              </button>
              <button className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100" disabled={previewMode}>
                <i>I</i>
              </button>
              <button className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100" disabled={previewMode}>
                <u>U</u>
              </button>
              <button className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100" disabled={previewMode}>
                📝
              </button>
            </div>
            <div className="text-sm text-gray-600 min-h-[120px]">
              Editor di testo con formattazione (TinyMCE)
            </div>
          </div>
        );
      
      case 'NUMBER':
        return <input type="number" {...commonProps} />;
      
      case 'DATE':
        return <input type="date" {...commonProps} />;
      
      case 'DATETIME':
        return <input type="datetime-local" {...commonProps} />;
      
      case 'SELECT':
        return (
          <select {...commonProps}>
            <option value="">Seleziona...</option>
            {field.possibleValues?.map((value, i) => (
              <option key={i} value={value}>{value}</option>
            ))}
          </select>
        );
      
      case 'MULTISELECT':
        return (
          <select multiple {...commonProps} size={3}>
            {field.possibleValues?.map((value, i) => (
              <option key={i} value={value}>{value}</option>
            ))}
          </select>
        );
      
      case 'RADIO':
        return (
          <div className="space-y-2">
            {field.possibleValues?.map((value, i) => (
              <label key={i} className="flex items-center">
                <input type="radio" name={`field_${index}`} value={value} className="mr-2" disabled={previewMode} />
                {value}
              </label>
            ))}
          </div>
        );
      
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.possibleValues?.map((value, i) => (
              <label key={i} className="flex items-center">
                <input type="checkbox" value={value} className="mr-2" disabled={previewMode} />
                {value}
              </label>
            ))}
          </div>
        );
      
      case 'FILE':
        return (
          <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center bg-white">
            <div className="text-gray-500">
              📄 Area upload file<br />
              <span className="text-xs">PDF, DOC, DOCX, Immagini (max 10MB)</span>
            </div>
          </div>
        );
      
      case 'FILE_IMAGE':
        return (
          <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center bg-white">
            <div className="text-gray-500">
              🖼️ Area upload immagine<br />
              <span className="text-xs">JPG, PNG, GIF, WebP (max 10MB)</span>
            </div>
          </div>
        );
      
      case 'SIGNATURE':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
            ✍️ Area firma (componente da implementare)
          </div>
        );
      
      case 'SLIDER':
        return <input type="range" {...commonProps} />;
      
      case 'RATING':
        return (
          <div className="flex space-x-1">
            <span>⭐⭐⭐⭐⭐</span>
          </div>
        );
      
      case 'TAGS':
        return <input type="text" {...commonProps} placeholder="Inserisci tag separati da virgola..." />;
      
      case 'AUTOCOMPLETE':
        return <input type="text" {...commonProps} list={`datalist_${index}`} />;
      
      case 'LOCATION':
        return <input type="text" {...commonProps} placeholder="Latitudine, Longitudine" />;
      
      case 'DIVIDER':
        return (
          <div className="border-t-2 border-gray-300 my-4">
            <span className="text-xs text-gray-400 italic">{field.label || 'Separatore'}</span>
          </div>
        );
      
      case 'LABEL':
        return (
          <div className="text-base text-gray-700">
            <div dangerouslySetInnerHTML={{ __html: field.label }} />
            {field.helpText && <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      
      case 'HIDDEN':
        return <input type="hidden" value={field.defaultValue || ''} />;
      
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
            {formData.description && (
              <p className="text-gray-600 mt-1">{formData.description}</p>
            )}
          </div>
          <button
            onClick={() => setPreviewMode(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Chiudi Anteprima
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {formData.fields?.map((field, index) => (
              <div key={index}>
                {field.fieldType !== 'DIVIDER' && field.fieldType !== 'LABEL' && (
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {field.helpText && field.fieldType !== 'LABEL' && (
                  <p className="text-xs text-gray-500 mb-2">ℹ️ {field.helpText}</p>
                )}
                {renderFieldPreview(field, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formId ? 'Modifica Modulo' : 'Nuovo Modulo'}
          </h1>
          <p className="text-gray-600 mt-1">
            Crea e personalizza moduli personalizzati per le richieste di assistenza
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(true)}
            disabled={!formData.fields?.length}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Anteprima
          </button>
          
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Annulla
          </button>
          
          <button
            onClick={handleSaveForm}
            disabled={saveMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva Form'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pannello Configurazione Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurazione</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Form *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Nome del form..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Descrizione del form..."
                />
              </div>

              {/* Campo Professional - Solo per Admin */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Form *
                  </label>
                  <select
                    value={selectedProfessionalId || ''}
                    onChange={(e) => {
                      setSelectedProfessionalId(e.target.value);
                      // Reset sottocategoria quando cambia il professional
                      setFormData(prev => ({ ...prev, subcategoryId: undefined }));
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    <option value="template">📚 Template Repository (Condiviso)</option>
                    <optgroup label="Professionisti">
                      {professionals?.map((prof: Professional) => (
                        <option key={prof.id} value={prof.id}>
                          👤 {prof.firstName} {prof.lastName} - {prof.email}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedProfessionalId === 'template' 
                      ? '📚 Form condiviso disponibile per tutti i professionisti'
                      : selectedProfessionalId
                      ? '👤 Form specifico per questo professionista'
                      : 'Scegli se creare un template o un form per un professionista'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sottocategoria *
                </label>
                <select
                  value={formData.subcategoryId || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      subcategoryId: value || undefined 
                    }));
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                  disabled={isAdmin && !selectedProfessionalId}
                >
                  <option value="">
                    {isAdmin && !selectedProfessionalId 
                      ? 'Prima seleziona il tipo di form...'
                      : 'Seleziona sottocategoria...'}
                  </option>
                  {subcategories?.map((sub: Subcategory) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.categoryName} - {sub.name}
                    </option>
                  ))}
                </select>
                {isAdmin && selectedProfessionalId === 'template' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Tutte le sottocategorie disponibili nel sistema
                  </p>
                )}
                {isAdmin && selectedProfessionalId && selectedProfessionalId !== 'template' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Solo sottocategorie abilitate per questo professionista
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Palette Campi */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campi Disponibili</h3>
            
            <div className="space-y-2">
              {FIELD_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => handleAddField(template)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{template.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{template.label}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Area Costruzione Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Struttura Form</h3>
              <span className="text-sm text-gray-500">
                {formData.fields?.length || 0} campi
              </span>
            </div>

            {formData.fields?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nessun campo aggiunto
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Inizia aggiungendo campi dalla palette a sinistra
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(formData.fields || []).map((field, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {field.label || '(Nessun titolo)'}
                          </span>
                          {field.isRequired && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Obbligatorio
                            </span>
                          )}
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {field.fieldType}
                          </span>
                          {field.visibleOnlyToProfessional && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              🔒 Solo professionista
                            </span>
                          )}
                        </div>
                        {field.helpText && (
                          <p className="text-xs text-gray-500 mt-1">ℹ️ {field.helpText}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === (formData.fields?.length || 0) - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEditField(field as CustomFormField, index)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveField(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {renderFieldPreview(field, index)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Editor Modal */}
      {showFieldEditor && selectedField && (
        <FieldEditor
          field={selectedField}
          onSave={handleSaveField}
          onCancel={() => {
            setShowFieldEditor(false);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
};

// Componente per l'editor dei campi
interface FieldEditorProps {
  field: CustomFormField;
  onSave: (field: CustomFormField) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onCancel }) => {
  const [editedField, setEditedField] = useState<CustomFormField>(field);
  const [showFormattingHelper, setShowFormattingHelper] = useState(false);

  const handleSave = () => {
    // Label è opzionale solo per DIVIDER
    if (!editedField.label?.trim() && editedField.fieldType !== 'DIVIDER') {
      toast.error('Il label del campo è obbligatorio');
      return;
    }
    onSave(editedField);
  };

  // Funzioni per applicare formattazione al testo del label (solo per LABEL)
  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('label-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedField.label.substring(start, end);
    
    if (!selectedText) {
      toast.error('Seleziona del testo prima di applicare la formattazione');
      return;
    }

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newLabel = 
      editedField.label.substring(0, start) + 
      formattedText + 
      editedField.label.substring(end);
    
    setEditedField(prev => ({ ...prev, label: newLabel }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Modifica Campo
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label {editedField.fieldType !== 'DIVIDER' && '*'}
              </label>
              {editedField.fieldType === 'LABEL' ? (
                <div>
                  <div className="flex space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="px-3 py-1 text-xs bg-gray-100 border rounded hover:bg-gray-200"
                      title="Grassetto"
                    >
                      <b>B</b>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="px-3 py-1 text-xs bg-gray-100 border rounded hover:bg-gray-200"
                      title="Corsivo"
                    >
                      <i>I</i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('underline')}
                      className="px-3 py-1 text-xs bg-gray-100 border rounded hover:bg-gray-200"
                      title="Sottolineato"
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFormattingHelper(!showFormattingHelper)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 border rounded hover:bg-blue-200"
                    >
                      🚀 Emoji
                    </button>
                  </div>
                  {showFormattingHelper && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p className="font-medium mb-1">Emoji popolari:</p>
                      <div className="flex flex-wrap gap-1">
                        {['✅', '❌', '⚠️', '📍', '📞', '📧', '🏠', '📅', '⭐', '👍', '👎', 'ℹ️'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              const textarea = document.getElementById('label-input') as HTMLTextAreaElement;
                              if (textarea) {
                                const pos = textarea.selectionStart;
                                const newLabel = 
                                  editedField.label.substring(0, pos) + 
                                  emoji + 
                                  editedField.label.substring(pos);
                                setEditedField(prev => ({ ...prev, label: newLabel }));
                              }
                            }}
                            className="px-2 py-1 bg-white border rounded hover:bg-gray-100"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    id="label-input"
                    value={editedField.label}
                    onChange={(e) => setEditedField(prev => ({ ...prev, label: e.target.value }))}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    placeholder="Inserisci testo con HTML: <strong>grassetto</strong>, <em>corsivo</em>, <u>sottolineato</u>"
                  />
                  <p className="mt-1 text-xs text-gray-500">Anteprima:</p>
                  <div 
                    className="mt-1 p-2 bg-gray-50 border rounded text-sm"
                    dangerouslySetInnerHTML={{ __html: editedField.label || 'Anteprima vuota' }}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={editedField.label}
                  onChange={(e) => setEditedField(prev => ({ ...prev, label: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={editedField.fieldType === 'DIVIDER' ? 'Opzionale - testo del separatore' : 'Inserisci il label del campo'}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testo di aiuto (guida compilazione)
              </label>
              <textarea
                value={editedField.helpText || ''}
                onChange={(e) => setEditedField(prev => ({ ...prev, helpText: e.target.value }))}
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Testo che apparirà sotto il campo per guidare l'utente..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Campo
              </label>
              <input
                type="text"
                value={editedField.code}
                onChange={(e) => setEditedField(prev => ({ ...prev, code: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedField.isRequired || false}
                  onChange={(e) => setEditedField(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Obbligatorio</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedField.isReadonly || false}
                  onChange={(e) => setEditedField(prev => ({ ...prev, isReadonly: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Solo lettura</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedField.visibleOnlyToProfessional || false}
                  onChange={(e) => setEditedField(prev => ({ ...prev, visibleOnlyToProfessional: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">🔒 Visibile solo al professionista</span>
              </label>
              <span className="ml-2 text-xs text-gray-500">(il cliente non vedrà questo campo)</span>
            </div>

            {(editedField.fieldType === 'SELECT' || editedField.fieldType === 'MULTISELECT' || editedField.fieldType === 'RADIO' || editedField.fieldType === 'CHECKBOX') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opzioni (una per riga)
                </label>
                <textarea
                  value={editedField.possibleValues?.join('\n') || ''}
                  onChange={(e) => setEditedField(prev => ({ 
                    ...prev, 
                    possibleValues: e.target.value.split('\n').filter(v => v.trim()) 
                  }))}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Opzione 1&#10;Opzione 2&#10;Opzione 3"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valore Predefinito
              </label>
              <textarea
                value={editedField.defaultValue || ''}
                onChange={(e) => setEditedField(prev => ({ ...prev, defaultValue: e.target.value }))}
                rows={6}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[140px]"
                placeholder="Inserisci il valore predefinito del campo..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};