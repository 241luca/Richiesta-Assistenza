import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  PlusCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { templatesApi } from '../../../services/professional/reports-api';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  usageCount: number;
  lastUsed: string;
  sections: string[];
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  sections: string[];
}

export default function ProfessionalTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'generale',
    sections: ['Descrizione Intervento']
  });

  // Mock data
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Rapporto Standard Idraulica',
      description: 'Template completo per interventi idraulici standard',
      category: 'idraulica',
      isDefault: true,
      usageCount: 89,
      lastUsed: '2025-01-05',
      sections: ['Problema', 'Diagnosi', 'Intervento', 'Materiali', 'Raccomandazioni']
    },
    {
      id: '2',
      name: 'Rapporto Veloce',
      description: 'Template semplificato per interventi rapidi',
      category: 'generale',
      isDefault: false,
      usageCount: 45,
      lastUsed: '2025-01-06',
      sections: ['Intervento', 'Materiali', 'Note']
    },
    {
      id: '3',
      name: 'Rapporto Elettrico Completo',
      description: 'Template dettagliato per impianti elettrici',
      category: 'elettrico',
      isDefault: false,
      usageCount: 67,
      lastUsed: '2025-01-04',
      sections: ['Verifica Sicurezza', 'Problema', 'Intervento', 'Test', 'Certificazione', 'Materiali']
    }
  ];

  // Query per recuperare i template
  const { data: templates = mockTemplates, isLoading, refetch } = useQuery({
    queryKey: ['professional-templates'],
    queryFn: async () => {
      try {
        const response = await templatesApi.getAll();
        return response.data?.data || mockTemplates;
      } catch (error) {
        console.warn('Using mock data for templates');
        return mockTemplates;
      }
    }
  });

  // Mutation per creare template
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const newTemplate = {
        id: Date.now().toString(),
        ...data,
        isDefault: false,
        usageCount: 0,
        lastUsed: new Date().toISOString()
      };
      
      // Quando l'API sarà pronta:
      // return await templatesApi.create(data);
      
      return { data: newTemplate };
    },
    onSuccess: () => {
      toast.success('Template creato con successo!');
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nella creazione del template');
    }
  });

  // Mutation per aggiornare template
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      console.log('Updating template:', id, data);
      
      // Quando l'API sarà pronta:
      // return await templatesApi.update(id, data);
      
      return { data: { id, ...data } };
    },
    onSuccess: () => {
      toast.success('Template aggiornato con successo!');
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento del template');
    }
  });

  // Mutation per eliminare template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting template:', id);
      
      // Quando l'API sarà pronta:
      // return await templatesApi.delete(id);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Template eliminato con successo!');
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione del template');
    }
  });

  // Mutation per impostare come predefinito
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Setting default template:', id);
      
      // Quando l'API sarà pronta:
      // return await templatesApi.setDefault(id);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Template impostato come predefinito!');
      refetch();
    }
  });

  // Mutation per clonare template
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      const template = templates.find((t: Template) => t.id === id);
      if (!template) return;
      
      const clonedTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copia)`,
        isDefault: false,
        usageCount: 0
      };
      
      // Quando l'API sarà pronta:
      // return await templatesApi.clone(id);
      
      return { data: clonedTemplate };
    },
    onSuccess: () => {
      toast.success('Template clonato con successo!');
      refetch();
    },
    onError: () => {
      toast.error('Errore nella clonazione del template');
    }
  });

  const categories = {
    all: 'Tutti',
    generale: '📄 Generale',
    idraulica: '💧 Idraulica',
    elettrico: '⚡ Elettrico',
    climatizzazione: '❄️ Climatizzazione',
    muratura: '🧱 Muratura'
  };

  // Sezioni disponibili
  const availableSections = [
    'Problema Riscontrato',
    'Diagnosi',
    'Descrizione Intervento',
    'Materiali Utilizzati',
    'Verifiche Effettuate',
    'Test e Collaudo',
    'Raccomandazioni',
    'Garanzia',
    'Note Tecniche',
    'Certificazioni',
    'Foto Prima',
    'Foto Dopo',
    'Firma Cliente',
    'Firma Tecnico'
  ];

  // Filtra template
  const filteredTemplates = templates.filter((template: Template) => {
    return selectedCategory === 'all' || template.category === selectedCategory;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'generale',
      sections: ['Descrizione Intervento']
    });
  };

  // Open modal for edit
  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      sections: [...template.sections]
    });
    setShowModal(true);
  };

  // Open modal for new
  const openNewModal = () => {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Il nome è obbligatorio');
      return;
    }
    
    if (formData.sections.length === 0) {
      toast.error('Aggiungi almeno una sezione');
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo template?')) {
      deleteMutation.mutate(id);
    }
  };

  // Gestione sezioni
  const addSection = (section: string) => {
    if (!formData.sections.includes(section)) {
      setFormData({
        ...formData,
        sections: [...formData.sections, section]
      });
    }
  };

  const removeSection = (index: number) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index)
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...formData.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newSections.length) {
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      setFormData({ ...formData, sections: newSections });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/professional/reports')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Torna ai Rapporti
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Template Rapporti
              </h1>
              <p className="mt-2 text-gray-600">
                Gestisci i tuoi modelli di rapporto personalizzati
              </p>
            </div>
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo Template
            </button>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Template Totali</p>
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Utilizzi Totali</p>
            <p className="text-2xl font-bold text-gray-900">
              {templates.reduce((sum: number, t: Template) => sum + t.usageCount, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Template Predefinito</p>
            <p className="text-sm font-bold text-gray-900">
              {templates.find((t: Template) => t.isDefault)?.name || 'Nessuno'}
            </p>
          </div>
        </div>

        {/* Filtri Categoria */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === key 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid Template */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                {/* Header Card */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <button
                      onClick={() => setDefaultMutation.mutate(template.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title="Imposta come predefinito"
                    >
                      {template.isDefault ? (
                        <StarSolidIcon className="h-5 w-5" />
                      ) : (
                        <StarIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>

                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <span className="mr-4">
                      {categories[template.category as keyof typeof categories]}
                    </span>
                    <span>
                      📊 {template.usageCount} utilizzi
                    </span>
                  </div>

                  {/* Sezioni */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Sezioni ({template.sections.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {template.sections.slice(0, 5).map(section => (
                        <span key={section} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                          {section}
                        </span>
                      ))}
                      {template.sections.length > 5 && (
                        <span className="px-2 py-1 bg-gray-200 text-xs text-gray-700 rounded">
                          +{template.sections.length - 5} altre
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Ultimo utilizzo: {new Date(template.lastUsed).toLocaleDateString('it-IT')}
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/professional/reports/new?templateId=${template.id}`)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Usa
                    </button>
                    <button
                      onClick={() => cloneMutation.mutate(template.id)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      title="Clona template"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(template)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun template trovato</p>
            <button
              onClick={openNewModal}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Crea il tuo primo template
            </button>
          </div>
        )}

        {/* Modal Aggiungi/Modifica */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colonna sinistra */}
                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Template *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Es. Rapporto Standard Idraulica"
                        required
                      />
                    </div>

                    {/* Descrizione */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrizione
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Breve descrizione del template..."
                        rows={3}
                      />
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {Object.entries(categories).filter(([key]) => key !== 'all').map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sezioni disponibili */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aggiungi Sezioni
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                        {availableSections.map(section => (
                          <button
                            key={section}
                            type="button"
                            onClick={() => addSection(section)}
                            disabled={formData.sections.includes(section)}
                            className={`block w-full text-left px-3 py-2 text-sm rounded mb-1 ${
                              formData.sections.includes(section)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-blue-50 text-gray-700'
                            }`}
                          >
                            <PlusCircleIcon className="h-4 w-4 inline mr-2" />
                            {section}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colonna destra - Sezioni selezionate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sezioni Template ({formData.sections.length})
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 min-h-[400px]">
                      {formData.sections.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          Aggiungi sezioni dalla lista a sinistra
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {formData.sections.map((section, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <span className="text-sm">
                                {index + 1}. {section}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSection(index, 'up')}
                                  disabled={index === 0}
                                  className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSection(index, 'down')}
                                  disabled={index === formData.sections.length - 1}
                                  className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSection(index)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  <MinusCircleIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Usa le frecce per riordinare le sezioni
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}