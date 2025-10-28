import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  content: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tags?: string[];
    category?: string;
    isPublic?: boolean;
    sourceDocumentName?: string;
  };
}

export default function LegalTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Debug log
  useEffect(() => {
    console.log('📄 LegalTemplatesPage montata');
  }, []);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['legal-templates'],
    queryFn: async () => {
      const response = await api.get('/admin/document-templates');
      return response.data?.data || [];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/document-templates/${id}`);
    },
    onSuccess: () => {
      toast.success('Template eliminato con successo');
      queryClient.invalidateQueries({ queryKey: ['legal-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  // Filtered templates
  const filteredTemplates = React.useMemo(() => {
    if (!templates) return [];
    
    return templates.filter((t: Template) => {
      const matchesSearch = searchTerm === '' || 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'ALL' || t.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [templates, searchTerm, selectedType]);

  const handleDelete = (template: Template) => {
    if (confirm(`Sei sicuro di voler eliminare il template "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const documentTypes = [
    { value: 'ALL', label: 'Tutti i tipi' },
    { value: 'PRIVACY_POLICY', label: 'Privacy Policy' },
    { value: 'TERMS_SERVICE', label: 'Termini di Servizio' },
    { value: 'COOKIE_POLICY', label: 'Cookie Policy' },
    { value: 'DPA', label: 'Data Processing Agreement' },
    { value: 'CUSTOM', label: 'Personalizzato' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/legal-documents')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <DocumentDuplicateIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Template Documenti
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gestisci i template per i documenti legali
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo Template
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento template...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nessun template trovato</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Crea il primo template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: Template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {template.name}
                    </h3>
                    {template.metadata?.isPublic ? (
                      <GlobeAltIcon className="h-5 w-5 text-green-600" title="Pubblico" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-gray-400" title="Privato" />
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Type Badge */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {template.type.replace(/_/g, ' ')}
                    </span>
                    {template.metadata?.sourceDocumentName && (
                      <span className="text-xs text-gray-500">
                        da: {template.metadata.sourceDocumentName}
                      </span>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Creato da: {template.createdBy?.fullName || 'Sconosciuto'}</div>
                    <div>
                      {new Date(template.createdAt).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <button
                    onClick={() => handlePreview(template)}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Anteprima
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      title="Modifica"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-2 text-gray-600 hover:text-red-600"
                      title="Elimina"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <TemplateFormModal
          template={selectedTemplate}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedTemplate(null);
            queryClient.invalidateQueries({ queryKey: ['legal-templates'] });
          }}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}

// Template Form Modal Component
function TemplateFormModal({ 
  template, 
  onClose, 
  onSuccess 
}: { 
  template: Template | null; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'PRIVACY_POLICY',
    content: template?.content || '',
    isPublic: template?.metadata?.isPublic || false,
    tags: template?.metadata?.tags?.join(', ') || ''
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        content: data.content,
        metadata: {
          isPublic: data.isPublic,
          tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        }
      };

      if (template) {
        return api.put(`/admin/document-templates/${template.id}`, payload);
      }
      return api.post('/admin/document-templates', payload);
    },
    onSuccess: () => {
      toast.success(template ? 'Template aggiornato' : 'Template creato');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {template ? 'Modifica Template' : 'Nuovo Template'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Template *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Documento *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRIVACY_POLICY">Privacy Policy</option>
                  <option value="TERMS_SERVICE">Termini di Servizio</option>
                  <option value="COOKIE_POLICY">Cookie Policy</option>
                  <option value="DPA">Data Processing Agreement</option>
                  <option value="CUSTOM">Personalizzato</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenuto HTML *
              </label>
              <textarea
                rows={12}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="<h1>Titolo</h1>..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separati da virgola)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="gdpr, privacy, legale"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Template pubblico (visibile a tutti)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Anteprima: {template.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
