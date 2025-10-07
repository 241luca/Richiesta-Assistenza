import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function DocumentCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories tree
  const { data: categories, isLoading } = useQuery({
    queryKey: ['document-categories-tree'],
    queryFn: async () => {
      const response = await api.get('/admin/document-categories/tree');
      return response.data?.data || [];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCategory) {
        return api.put(`/admin/document-categories/${editingCategory.id}`, data);
      }
      return api.post('/admin/document-categories', data);
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Categoria aggiornata' : 'Categoria creata');
      queryClient.invalidateQueries({ queryKey: ['document-categories-tree'] });
      setShowForm(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/document-categories/${id}`);
    },
    onSuccess: () => {
      toast.success('Categoria eliminata');
      queryClient.invalidateQueries({ queryKey: ['document-categories-tree'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: any, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-200 ${
            level > 0 ? 'ml-' + (level * 8) : ''
          }`}
          style={{ paddingLeft: `${(level * 2) + 1}rem` }}
        >
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-7" />}
            
            {isExpanded || !hasChildren ? (
              <FolderOpenIcon className="h-5 w-5 text-blue-500 mr-3" />
            ) : (
              <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
            )}
            
            <div>
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className="ml-2 text-xs text-gray-500">({category.code})</span>
                {category.isActive ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-gray-400 ml-2" />
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-red-600 hover:text-red-900"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child: any) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (showForm) {
    return (
      <CategoryForm
        category={editingCategory}
        categories={categories}
        onSave={(data) => saveMutation.mutate(data)}
        onCancel={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        isLoading={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/document-management')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Categorie Documenti
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Organizza i documenti in categorie gerarchiche
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    await api.post('/admin/document-categories/initialize-defaults');
                    toast.success('Categorie di default inizializzate');
                    queryClient.invalidateQueries({ queryKey: ['document-categories-tree'] });
                  } catch (error) {
                    toast.error('Errore nell\'inizializzazione');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                Inizializza Default
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuova Categoria
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Caricamento...
            </div>
          ) : categories?.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nessuna categoria configurata
            </div>
          ) : (
            <div>
              {categories?.map((category: any) => renderCategory(category))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Form Component
function CategoryForm({ category, categories, onSave, onCancel, isLoading }: any) {
  const [formData, setFormData] = useState({
    code: category?.code || '',
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    color: category?.color || 'blue',
    parentId: category?.parentId || null,
    sortOrder: category?.sortOrder || 0,
    isActive: category?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Flatten categories for parent selection
  const flattenCategories = (cats: any[], level = 0): any[] => {
    let result: any[] = [];
    cats?.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories || []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={onCancel}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {category ? 'Modifica Categoria' : 'Nuova Categoria'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configura le proprietà della categoria
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Codice *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoria Padre
              </label>
              <select
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={category && flatCategories.some(c => c.parentId === category.id)}
              >
                <option value="">Nessuna (categoria root)</option>
                {flatCategories
                  .filter(c => c.id !== category?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.level) + cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Icona
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="FolderIcon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Colore
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="blue">Blu</option>
                  <option value="green">Verde</option>
                  <option value="red">Rosso</option>
                  <option value="yellow">Giallo</option>
                  <option value="purple">Viola</option>
                  <option value="gray">Grigio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ordine
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Categoria attiva</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : (category ? 'Aggiorna' : 'Crea')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
