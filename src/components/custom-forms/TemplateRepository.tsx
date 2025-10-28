/**
 * Template Repository Component
 * Interfaccia admin per gestire il repository di template condivisi
 * 
 * @module components/custom-forms/TemplateRepository
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Eye, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Filter,
  Star,
  StarOff,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { customFormsAPI } from '@/services/customForms.api';

interface Template {
  id: string;
  name: string;
  description: string | null;
  usageCount: number;
  isPublished: boolean;
  isTemplate: boolean;
  isDefaultTemplate: boolean;
  createdAt: string;
  Subcategory: {
    id: string;
    name: string;
  };
  CreatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  Fields: any[];
}

export const TemplateRepository: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', search, selectedCategory],
    queryFn: async () => {
      const response = await customFormsAPI.getTemplates({
        search,
        subcategoryId: selectedCategory || undefined
      });
      return response.data?.data || [];
    }
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const response = await fetch('/api/subcategories');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Publish/Unpublish mutation
  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (publish) {
        return await customFormsAPI.publishCustomForm(id);
      } else {
        // Unpublish - update form
        return await customFormsAPI.updateCustomForm(id, { isPublished: false } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  // Mark/Unmark as template mutation
  const templateMutation = useMutation({
    mutationFn: async ({ id, isTemplate }: { id: string; isTemplate: boolean }) => {
      return await customFormsAPI.markAsTemplate(id, isTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await customFormsAPI.deleteCustomForm(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelectedTemplate(null);
    }
  });

  // Clone mutation
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      return await customFormsAPI.cloneForm(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const templates = templatesData || [];
  const categories = categoriesData || [];

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handlePublish = (template: Template) => {
    publishMutation.mutate({ id: template.id, publish: !template.isPublished });
  };

  const handleToggleTemplate = (template: Template) => {
    templateMutation.mutate({ id: template.id, isTemplate: !template.isTemplate });
  };

  const handleClone = (template: Template) => {
    if (confirm(`Clonare il template "${template.name}"?`)) {
      cloneMutation.mutate(template.id);
    }
  };

  const handleDelete = (template: Template) => {
    if (confirm(`Eliminare definitivamente il template "${template.name}"? Questa azione non può essere annullata.`)) {
      deleteMutation.mutate(template.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Repository Template</h2>
          <p className="text-gray-600 mt-1">
            Gestisci i template condivisi disponibili per tutti i professionisti
          </p>
        </div>
        <Button variant="primary">
          + Crea Nuovo Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-500">Nessun template trovato</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: Template) => (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.Subcategory.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.isPublished ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    {template.isTemplate && (
                      <Star className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{template.Fields.length} campi</span>
                  <span>•</span>
                  <span>{template.usageCount} utilizzi</span>
                </div>

                {/* Creator */}
                <div className="text-xs text-gray-500">
                  Creato da: {template.CreatedBy.firstName} {template.CreatedBy.lastName}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePreview(template)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleClone(template)}
                    title="Clona"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <Button
                    variant={template.isTemplate ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleToggleTemplate(template)}
                    title={template.isTemplate ? "Rimuovi da template" : "Marca come template"}
                  >
                    {template.isTemplate ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                  </Button>

                  <Button
                    variant={template.isPublished ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handlePublish(template)}
                    title={template.isPublished ? "Nascondi" : "Pubblica"}
                  >
                    {template.isPublished ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    title="Elimina"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Campi del Form ({selectedTemplate.Fields.length})</h4>
                <div className="space-y-2">
                  {selectedTemplate.Fields.map((field: any, index: number) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-gray-500">
                          Tipo: {field.fieldType} {field.isRequired && '• Obbligatorio'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setShowPreview(false)} className="flex-1">
                  Chiudi
                </Button>
                <Button variant="primary" onClick={() => handleClone(selectedTemplate)} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Clona Template
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TemplateRepository;
