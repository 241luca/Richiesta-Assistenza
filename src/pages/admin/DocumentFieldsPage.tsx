import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  HashtagIcon,
  AtSymbolIcon,
  LinkIcon,
  PhotoIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

interface CustomField {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  documentType: string;
  isRequired: boolean;
  isSearchable: boolean;
  order: number;
  defaultValue?: any;
  options?: string[];
  validationRules?: any;
}

export default function DocumentFieldsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    fieldType: 'text',
    documentType: '',
    isRequired: false,
    isSearchable: false,
    order: 1,
    defaultValue: '',
    options: [] as string[],
    validationRules: {}
  });

  const fieldTypes = [
    { value: 'text', label: 'Testo', icon: DocumentTextIcon },
    { value: 'number', label: 'Numero', icon: HashtagIcon },
    { value: 'date', label: 'Data', icon: CalendarIcon },
    { value: 'email', label: 'Email', icon: AtSymbolIcon },
    { value: 'url', label: 'URL', icon: LinkIcon },
    { value: 'textarea', label: 'Testo Lungo', icon: Bars3Icon },
    { value: 'select', label: 'Selezione', icon: ListBulletIcon },
    { value: 'multiselect', label: 'Selezione Multipla', icon: ListBulletIcon },
    { value: 'checkbox', label: 'Checkbox', icon: CheckIcon },
    { value: 'file', label: 'File', icon: PhotoIcon }
  ];

  // Placeholder data
  const fields: CustomField[] = [];

  // Carica statistiche
  const { data: stats } = useQuery({
    queryKey: ['fields-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/document-fields/stats');
      return response.data?.data || { fields: { total: 0 } };
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Campo salvato con successo');
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      fieldType: 'text',
      documentType: '',
      isRequired: false,
      isSearchable: false,
      order: 1,
      defaultValue: '',
      options: [],
      validationRules: {}
    });
    setSelectedField(null);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campi Personalizzati</h1>
            <p className="mt-1 text-sm text-gray-600">
              Definisci campi aggiuntivi per i tipi di documento
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Campo
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Campi Totali</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.fields?.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Obbligatori</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ListBulletIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tipi Campo</p>
                <p className="text-2xl font-semibold text-gray-900">{fieldTypes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <HashtagIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Ricercabili</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Campi */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Campi Configurati</h2>
        </div>
        
        {fields.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun campo personalizzato</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia definendo campi personalizzati per i tuoi documenti.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crea Campo
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Field items here */}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedField ? 'Modifica Campo' : 'Nuovo Campo Personalizzato'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Campo (ID)</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="es. codice_fiscale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etichetta</label>
                    <input
                      type="text"
                      required
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="es. Codice Fiscale"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Campo</label>
                  <div className="grid grid-cols-3 gap-4">
                    {fieldTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, fieldType: type.value })}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.fieldType === type.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
                  <input
                    type="text"
                    required
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Es. CONTRACT, INVOICE..."
                  />
                </div>

                {(formData.fieldType === 'select' || formData.fieldType === 'multiselect') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Opzioni</label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        + Aggiungi Opzione
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={`Opzione ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valore Predefinito</label>
                    <input
                      type="text"
                      value={formData.defaultValue}
                      onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ordine</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Campo Obbligatorio
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSearchable}
                      onChange={(e) => setFormData({ ...formData, isSearchable: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Ricercabile
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Salva Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
