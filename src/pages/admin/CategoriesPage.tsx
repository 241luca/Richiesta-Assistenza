import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    subcategories: number;
    assistanceRequests: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      console.log('Categories API Response:', response.data);
      
      // CORRETTO: Gestisce il formato ResponseFormatter
      let categories = [];
      
      if (response.data.data) {
        // Nuovo formato ResponseFormatter
        categories = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
      } else if (response.data.categories) {
        // Formato intermedio
        categories = response.data.categories;
      } else if (Array.isArray(response.data)) {
        // Formato array diretto
        categories = response.data;
      }
      
      console.log('Parsed categories:', categories);
      return Array.isArray(categories) ? categories : [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      toast.success('Categoria eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['profession-categories'] });
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    },
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  
  // Debug: Controlliamo il tipo di dati ricevuti
  console.log('Categories data type:', typeof categoriesData, 'isArray:', Array.isArray(categoriesData));
  console.log('Final categories:', categories);

  const activeCount = categories.filter((c: Category) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;
  const shownCategories = activeTab === 'all'
    ? categories
    : activeTab === 'active'
      ? categories.filter((c: Category) => c.isActive)
      : categories.filter((c: Category) => !c.isActive);

  const handleDelete = (category: Category) => {
    if (category._count && category._count.subcategories > 0) {
      toast.error(`Impossibile eliminare: ci sono ${category._count.subcategories} sottocategorie associate`);
      return;
    }

    if (category._count && category._count.assistanceRequests > 0) {
      toast.error(`Impossibile eliminare: ci sono ${category._count.assistanceRequests} richieste attive`);
      return;
    }

    if (window.confirm(`Sei sicuro di voler eliminare "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Categorie</h1>
        <p className="text-gray-600 mt-1">
          Configura le categorie principali dei servizi offerti
        </p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {categories.length} totali • {activeCount} attive • {inactiveCount} inattive
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" style={{ width: '16px', height: '16px' }} />
            Nuova Categoria
          </button>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Tutte
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Attive ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'inactive' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Inattive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nessuna categoria trovata
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {shownCategories.map((category: Category) => (
              <div
                key={category.id}
                className={cn(
                  "relative rounded-lg border-2 p-6 transition-all",
                  category.isActive
                    ? "border-gray-200 hover:shadow-lg"
                    : "border-gray-100 bg-gray-50 opacity-60"
                )}
              >
                {/* Color Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                  style={{ backgroundColor: category.color }}
                />

                {/* Content */}
                <div className="mt-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <TagIcon className="h-3 w-3 mr-1" style={{ width: '12px', height: '12px' }} />
                          {category._count?.subcategories || 0} sottocategorie
                        </div>
                        <div>
                          {category._count?.assistanceRequests || 0} richieste
                        </div>
                      </div>

                      {/* Order */}
                      <div className="mt-2 text-xs text-gray-400">
                        Ordine: {category.displayOrder}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => toggleActiveMutation.mutate({ 
                        id: category.id, 
                        isActive: !category.isActive 
                      })}
                      className={cn(
                        'ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors',
                        category.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      )}
                    >
                      {category.isActive ? (
                        <>
                          <EyeIcon className="h-3 w-3 mr-1" style={{ width: '12px', height: '12px' }} />
                          Attiva
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="h-3 w-3 mr-1" style={{ width: '12px', height: '12px' }} />
                          Inattiva
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifica"
                    >
                      <PencilIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Elimina"
                    >
                      <TrashIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setIsCreating(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingCategory(null);
            // Aggiorna anche la pagina di associazioni professioni-categorie
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            queryClient.invalidateQueries({ queryKey: ['profession-categories'] });
          }}
        />
      )}
    </div>
  );
}

// Form Modal Component
function CategoryFormModal({ 
  category, 
  onClose, 
  onSuccess 
}: {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    color: category?.color || '#3B82F6',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (category) {
        return await api.put(`/categories/${category.id}`, data);
      } else {
        return await api.post('/categories', data);
      }
    },
    onSuccess: () => {
      toast.success(category ? 'Categoria aggiornata' : 'Categoria creata');
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante il salvataggio';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate slug if empty
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    };
    
    createMutation.mutate(dataToSubmit);
  };

  // Predefined colors
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6B7280', // Gray
    '#059669', // Emerald
  ];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {category ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="es. Idraulica"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug URL
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Auto-generato se vuoto"
              />
              <p className="mt-1 text-xs text-gray-500">
                Utilizzato negli URL (es. /categorie/idraulica)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Breve descrizione della categoria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Colore Categoria
              </label>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
                
                {/* Color Presets */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-md border-2 transition-all",
                        formData.color === color
                          ? "border-gray-900 scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ordine Visualizzazione
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Categorie con numero più basso appaiono prima
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Categoria attiva
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvataggio...' : (category ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoriesPage;